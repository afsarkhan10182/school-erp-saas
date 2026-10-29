require('module-alias/register');

const { Branch, DynamicEntityRecord } = require('../src/models');
const controller = require('../src/controllers/shared/dynamic-entities.controller');

describe('accountant dynamic entity branch scope', () => {
  const originals = {};

  beforeEach(() => {
    originals.branchFindOne = Branch.findOne;
    originals.recordFindAndCountAll = DynamicEntityRecord.findAndCountAll;
    originals.recordCreate = DynamicEntityRecord.create;
    originals.recordFindOne = DynamicEntityRecord.findOne;
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'assigned-branch' });
  });

  afterEach(() => {
    Branch.findOne = originals.branchFindOne;
    DynamicEntityRecord.findAndCountAll = originals.recordFindAndCountAll;
    DynamicEntityRecord.create = originals.recordCreate;
    DynamicEntityRecord.findOne = originals.recordFindOne;
  });

  const req = (overrides = {}) => ({
    user: { id: 'accountant-1', role: 'accountant', school_id: 'school-1', branch_id: 'assigned-branch' },
    params: { entity: 'account' },
    query: { branch_id: 'forged-branch' },
    body: { branch_id: 'forged-branch' },
    ...overrides
  });

  it('locks list and create to the assigned branch despite forged selectors', async () => {
    DynamicEntityRecord.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    await controller.list(req(), { json: jest.fn() });
    expect(DynamicEntityRecord.findAndCountAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', entity_type: 'account', branch_id: 'assigned-branch'
    });

    DynamicEntityRecord.create = jest.fn().mockResolvedValue({ toJSON: () => ({ payload: {} }) });
    await controller.create(req(), { status: jest.fn().mockReturnThis(), json: jest.fn() });
    expect(Branch.findOne).toHaveBeenLastCalledWith({
      where: { id: 'assigned-branch', school_id: 'school-1', status: 'active' }
    });
    expect(DynamicEntityRecord.create.mock.calls[0][0]).toMatchObject({
      school_id: 'school-1', branch_id: 'assigned-branch'
    });
  });

  it.each(['update', 'remove', 'runAction'])('%s cannot find another branch record', async action => {
    DynamicEntityRecord.findOne = jest.fn().mockResolvedValue(null);
    const status = jest.fn().mockReturnThis();
    const response = { status, json: jest.fn() };
    const request = req({ params: { entity: 'account', id: 'foreign-record', action: 'edit' } });
    await controller[action](request, response);
    expect(DynamicEntityRecord.findOne).toHaveBeenCalledWith({
      where: {
        id: 'foreign-record', school_id: 'school-1', branch_id: 'assigned-branch', entity_type: 'account'
      }
    });
    expect(status).toHaveBeenCalledWith(404);
  });
});
