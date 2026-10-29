require('module-alias/register');

const { Branch, StudentImportBatch } = require('../src/models');
const Controller = require('../src/controllers/academic/student.controller');

describe('student import history scope', () => {
  const originalBranchFindOne = Branch.findOne;
  const originalBatchFindAll = StudentImportBatch.findAll;

  beforeEach(() => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-a' });
    StudentImportBatch.findAll = jest.fn().mockResolvedValue([{ id: 'batch-a' }]);
  });

  afterAll(() => {
    Branch.findOne = originalBranchFindOne;
    StudentImportBatch.findAll = originalBatchFindAll;
  });

  const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

  it('forces Branch Admin history to the assigned branch', async () => {
    const res = response();
    const next = jest.fn();
    await Controller.getStudentImportHistory(
      {
        schoolId: 'school-a',
        query: {},
        user: { role: 'branch_admin', school_id: 'school-a', branch_id: 'branch-second' }
      },
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(StudentImportBatch.findAll.mock.calls[0][0].where).toEqual({
      school_id: 'school-a',
      branch_id: 'branch-second'
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'batch-a' }] });
  });

  it('rejects a Branch Admin attempt to query another branch', async () => {
    const next = jest.fn();
    await Controller.getStudentImportHistory(
      {
        schoolId: 'school-a',
        query: { branch_id: 'branch-a' },
        user: { role: 'branch_admin', school_id: 'school-a', branch_id: 'branch-second' }
      },
      response(),
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(StudentImportBatch.findAll).not.toHaveBeenCalled();
  });

  it('validates a School Admin branch filter against its school', async () => {
    const res = response();
    const next = jest.fn();
    await Controller.getStudentImportHistory(
      {
        schoolId: 'school-a',
        query: { branch_id: 'branch-a' },
        user: { role: 'admin', school_id: 'school-a' }
      },
      res,
      next
    );

    expect(Branch.findOne).toHaveBeenCalledWith({
      where: { id: 'branch-a', school_id: 'school-a', status: 'active' }
    });
    expect(StudentImportBatch.findAll.mock.calls[0][0].where).toEqual({
      school_id: 'school-a',
      branch_id: 'branch-a'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('requires a school context for Platform Owner history', async () => {
    const next = jest.fn();
    await Controller.getStudentImportHistory(
      { query: {}, user: { role: 'super_admin' } },
      response(),
      next
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(StudentImportBatch.findAll).not.toHaveBeenCalled();
  });
});
