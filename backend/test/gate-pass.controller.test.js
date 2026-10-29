require('module-alias/register');

const { sequelize, Branch, Student, GatePass } = require('../src/models');
const { Op } = require('sequelize');
const controller = require('../src/controllers/shared/gate-pass.controller');

const makeRequest = overrides => ({
  user: { id: 'reception-1', role: 'receptionist', school_id: 'school-1', branch_id: 'branch-1' },
  schoolId: 'school-1', branchId: 'branch-1', params: { id: 'pass-1' }, query: {}, body: {}, ...overrides
});
const call = async (method, req) => {
  let body;
  let statusCode = 200;
  const res = { status(code) { statusCode = code; return this; }, json(value) { body = value; return this; } };
  await controller[method](req, res);
  return { body, statusCode };
};

describe('student gate passes', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fails closed for a Branch Admin without an assigned branch', async () => {
    const branchLookup = jest.spyOn(Branch, 'findOne');
    const result = await call('list', makeRequest({ user: { id: 'branch-admin', role: 'branch_admin', school_id: 'school-1', branch_id: null } }));
    expect(result.statusCode).toBe(403);
    expect(branchLookup).not.toHaveBeenCalled();
  });

  it('requires an explicitly selected school for a Platform Owner', async () => {
    const result = await call('list', makeRequest({ user: { id: 'owner', role: 'super_admin' }, schoolId: null }));
    expect(result.statusCode).toBe(400);
  });

  it('lists every branch for a School Admin when All Branches is selected', async () => {
    const findPasses = jest.spyOn(GatePass, 'findAndCountAll').mockResolvedValue({ rows: [], count: 0 });
    const result = await call('list', makeRequest({
      user: { id: 'admin', role: 'admin', school_id: 'school-1', branch_id: 'branch-1' }, branchId: null
    }));
    expect(result.statusCode).toBe(200);
    expect(findPasses).toHaveBeenCalledWith(expect.objectContaining({
      where: { school_id: 'school-1' }, limit: 25, offset: 0
    }));
  });

  it('searches student identity fields and returns server-side pagination within receptionist branch scope', async () => {
    jest.spyOn(Branch, 'findOne').mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    const findPasses = jest.spyOn(GatePass, 'findAndCountAll').mockResolvedValue({ rows: [], count: 31 });
    const result = await call('list', makeRequest({ query: { branch_id: 'other', search: 'Sarah', page: '2', limit: '10' } }));
    expect(findPasses).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ school_id: 'school-1', branch_id: 'branch-1' }),
      limit: 10, offset: 10
    }));
    expect(findPasses.mock.calls[0][0].where[Op.or]).toEqual(expect.arrayContaining([
      expect.objectContaining({ '$student.first_name$': expect.anything() }),
      expect.objectContaining({ '$student.admission_number$': expect.anything() })
    ]));
    expect(result.body.pagination).toEqual({ page: 2, limit: 10, total: 31, totalPages: 4 });
  });

  it('requires a specific branch before a manager can issue a pass or load students', async () => {
    const findStudents = jest.spyOn(Student, 'findAll');
    const result = await call('studentChoices', makeRequest({
      user: { id: 'admin', role: 'admin', school_id: 'school-1', branch_id: 'branch-1' }, branchId: null
    }));
    expect(result.statusCode).toBe(400);
    expect(result.body.message).toBe('Select a branch first.');
    expect(findStudents).not.toHaveBeenCalled();
  });

  it('provides only active branch-local student choices needed to issue a pass', async () => {
    jest.spyOn(Branch, 'findOne').mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    const findStudents = jest.spyOn(Student, 'findAll').mockResolvedValue([{
      id: 'student-1', first_name: 'Sarah', last_name: 'Demo', admission_number: 'DEMO-001',
      phone: 'should not be selected', class: { id: 'class-1', name: 'Class 1' }
    }]);
    const result = await call('studentChoices', makeRequest({ query: { search: 'DEMO', branch_id: 'other-branch' } }));
    expect(result.statusCode).toBe(200);
    expect(findStudents).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ school_id: 'school-1', branch_id: 'branch-1', status: 'active' }),
      attributes: ['id', 'first_name', 'last_name', 'admission_number', 'class_id']
    }));
    expect(result.body.data[0]).toMatchObject({ id: 'student-1', admission_number: 'DEMO-001' });
    expect(result.body.data[0]).not.toHaveProperty('phone');
  });

  it('validates active student branch and stores only the last four ID digits for receptionist-issued passes', async () => {
    jest.spyOn(Branch, 'findOne').mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    jest.spyOn(Student, 'findOne').mockResolvedValue({ id: 'student-1' });
    const create = jest.spyOn(GatePass, 'create').mockResolvedValue({ id: 'pass-1' });
    jest.spyOn(GatePass, 'findByPk').mockResolvedValue({ id: 'pass-1', status: 'pending' });
    const result = await call('create', makeRequest({
      body: {
        branch_id: 'branch-1', student_id: 'student-1', reason: 'parent_pickup',
        leaving_at: '2026-10-27T11:00:00.000Z', collector_name: 'Demo Parent',
        collector_relation: 'Parent', collector_phone: '+91 90000 00002',
        collector_id_type: 'school_id', collector_id_last4: '4321', collector_photo: 'ignored'
      }
    }));

    expect(result.statusCode).toBe(201);
    expect(Student.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'student-1', school_id: 'school-1', branch_id: 'branch-1', status: 'active' }
    }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pending', collector_id_last4: '4321', branch_id: 'branch-1'
    }));
    expect(create.mock.calls[0][0]).not.toHaveProperty('collector_photo');
    expect(create.mock.calls[0][0]).not.toHaveProperty('collector_id_number');
  });

  it('does not allow an unapproved pass to be marked out', async () => {
    jest.spyOn(sequelize, 'transaction').mockImplementation(async callback => callback({}));
    jest.spyOn(Branch, 'findOne').mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    const update = jest.fn();
    jest.spyOn(GatePass, 'findOne').mockResolvedValue({ id: 'pass-1', status: 'pending', update });
    const result = await call('markOut', makeRequest({
      user: { id: 'reception-1', role: 'receptionist', school_id: 'school-1', branch_id: 'branch-1' }
    }));
    expect(result.statusCode).toBe(409);
    expect(update).not.toHaveBeenCalled();
  });

  it('requires approval before marking out and allows one check-in transition afterward', async () => {
    jest.spyOn(sequelize, 'transaction').mockImplementation(async callback => callback({}));
    jest.spyOn(Branch, 'findOne').mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    const pass = { id: 'pass-1', status: 'approved', update: jest.fn(async values => Object.assign(pass, values)) };
    jest.spyOn(GatePass, 'findOne').mockResolvedValue(pass);

    const out = await call('markOut', makeRequest());
    expect(out.statusCode).toBe(200);
    expect(pass.status).toBe('out');
    expect(pass.actual_out_at).toBeInstanceOf(Date);

    const returned = await call('markReturned', makeRequest());
    expect(returned.statusCode).toBe(200);
    expect(pass.status).toBe('returned');
    expect(pass.returned_at).toBeInstanceOf(Date);
  });

  it('does not let a different receptionist cancel another issuer’s pass', async () => {
    jest.spyOn(sequelize, 'transaction').mockImplementation(async callback => callback({}));
    jest.spyOn(Branch, 'findOne').mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    const update = jest.fn();
    jest.spyOn(GatePass, 'findOne').mockResolvedValue({ id: 'pass-1', status: 'pending', created_by: 'other-receptionist', update });
    const result = await call('cancel', makeRequest());
    expect(result.statusCode).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it('exposes only gate-safe fields to terminal lookup', async () => {
    jest.spyOn(Branch, 'findOne').mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    jest.spyOn(GatePass, 'findOne').mockResolvedValue({
      id: 'pass-1', pass_no: 'GP-2026-ABCD1234', status: 'approved', reason: 'parent_pickup',
      gate_name: 'Main Gate', leaving_at: new Date(), expected_return_at: null,
      collector_name: 'Demo Parent', collector_relation: 'Parent', collector_phone: '+91 90000 00002',
      collector_id_last4: '4321', student: {
        id: 'student-1', first_name: 'Sarah', last_name: 'Demo', admission_number: 'DEMO-001',
        class: { name: 'Class 1' }
      }
    });
    const result = await call('terminalLookup', makeRequest({ params: { code: 'GP-2026-ABCD1234' } }));
    expect(result.statusCode).toBe(200);
    expect(result.body.data.student).toMatchObject({ name: 'Sarah Demo', class_name: 'Class 1' });
    expect(result.body.data).not.toHaveProperty('collector_phone');
    expect(result.body.data).not.toHaveProperty('collector_id_last4');
  });
});
