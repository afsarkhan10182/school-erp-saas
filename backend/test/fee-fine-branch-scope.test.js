require('module-alias/register');

const { FeeFine } = require('../src/models');
const Branch = require('../src/models/administration/branch.model');
const { list, update, remove } = require('../src/controllers/financial/fee-fine.controller');

describe('fee fine branch scope', () => {
  const originals = {
    branchFindOne: Branch.findOne,
    branchFindAll: Branch.findAll,
    fineFindAll: FeeFine.findAll,
    fineFindOne: FeeFine.findOne
  };

  beforeEach(() => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1' });
    Branch.findAll = jest.fn();
    FeeFine.findAll = jest.fn().mockResolvedValue([]);
    FeeFine.findOne = jest.fn();
  });

  afterEach(() => {
    Branch.findOne = originals.branchFindOne;
    Branch.findAll = originals.branchFindAll;
    FeeFine.findAll = originals.fineFindAll;
    FeeFine.findOne = originals.fineFindOne;
    jest.clearAllMocks();
  });

  const branchAdmin = {
    schoolId: 'school-1',
    user: { id: 'branch-admin-1', role: 'branch_admin', branch_id: 'branch-1' }
  };

  it('lists only fines for the assigned branch', async () => {
    const res = { json: jest.fn() };

    await list(branchAdmin, res, jest.fn());

    expect(FeeFine.findAll).toHaveBeenCalledWith({
      where: { school_id: 'school-1', branch_id: 'branch-1' },
      order: [['name', 'ASC']]
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { fines: [] } });
  });

  it('updates a fine only within the assigned branch', async () => {
    const fine = { update: jest.fn().mockResolvedValue(undefined) };
    FeeFine.findOne = jest.fn().mockResolvedValue(fine);
    const res = { json: jest.fn() };

    await update({ ...branchAdmin, params: { id: 'fine-1' }, body: { amount: 50, branch_id: 'other' } }, res, jest.fn());

    expect(FeeFine.findOne).toHaveBeenCalledWith({
      where: { id: 'fine-1', school_id: 'school-1', branch_id: 'branch-1' }
    });
    expect(fine.update).toHaveBeenCalledWith({ amount: 50, updated_by: 'branch-admin-1' });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { fine } });
  });

  it('does not delete a fine from another branch', async () => {
    FeeFine.findOne = jest.fn().mockResolvedValue(null);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await remove({ ...branchAdmin, params: { id: 'fine-foreign' } }, res, jest.fn());

    expect(FeeFine.findOne).toHaveBeenCalledWith({
      where: { id: 'fine-foreign', school_id: 'school-1', branch_id: 'branch-1' }
    });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('fails closed when a Branch Admin has no branch assignment', async () => {
    const next = jest.fn();

    await list({ schoolId: 'school-1', user: { role: 'branch_admin' } }, {}, next);

    expect(FeeFine.findAll).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      message: 'Branch access is not configured for this account'
    }));
  });
});
