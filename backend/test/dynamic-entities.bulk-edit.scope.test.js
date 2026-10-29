require('module-alias/register');
jest.mock('../src/utils/communication/email', () => ({ sendEmail: jest.fn() }));
const { Student } = require('../src/models');
const { bulkEditStudents } = require('../src/controllers/shared/dynamic-entities.controller');

describe('bulk student edit branch scope', () => {
  const originalFindOne = Student.findOne;
  const originalTransaction = Student.sequelize.transaction;
  let row;
  let transaction;

  beforeEach(() => {
    row = { update: jest.fn().mockResolvedValue(undefined) };
    transaction = { commit: jest.fn(), rollback: jest.fn() };
    Student.findOne = jest.fn().mockResolvedValue(row);
    Student.sequelize.transaction = jest.fn().mockResolvedValue(transaction);
  });

  afterEach(() => {
    Student.findOne = originalFindOne;
    Student.sequelize.transaction = originalTransaction;
    jest.clearAllMocks();
  });

  const run = async req => {
    const res = { json: jest.fn(body => (res.body = body)) };
    await bulkEditStudents(req, res);
    return res.body;
  };

  const request = (user, body = {}) => ({
    user,
    schoolId: 'school-1',
    query: {},
    body: { students: [{ id: 'student-1', updates: { phone: '555-0100' } }], ...body }
  });

  it('allows school admins to edit selected students across the school in All Branches', async () => {
    const result = await run(
      request({ id: 'admin-1', role: 'admin', school_id: 'school-1', branch_id: 'main' })
    );

    expect(Student.findOne).toHaveBeenCalledWith({
      where: { id: 'student-1', school_id: 'school-1' },
      transaction
    });
    expect(result.success).toBe(true);
    expect(row.update).toHaveBeenCalledWith(
      { phone: '555-0100', updated_by: 'admin-1' },
      { transaction }
    );
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  it('honors an explicitly selected school branch', async () => {
    await run(
      request(
        { id: 'admin-1', role: 'admin', school_id: 'school-1', branch_id: 'main' },
        { branch_id: 'second' }
      )
    );

    expect(Student.findOne.mock.calls[0][0].where).toEqual({
      id: 'student-1', school_id: 'school-1', branch_id: 'second'
    });
  });

  it('keeps Branch Admin edits fixed to their assigned branch', async () => {
    await run(
      request(
        { id: 'branch-admin-1', role: 'branch_admin', school_id: 'school-1', branch_id: 'main' },
        { branch_id: 'second' }
      )
    );

    expect(Student.findOne.mock.calls[0][0].where).toEqual({
      id: 'student-1', school_id: 'school-1', branch_id: 'main'
    });
  });
});
