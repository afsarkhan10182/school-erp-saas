require('module-alias/register');

const { Branch, DynamicEntityRecord } = require('../src/models');
const controller = require('../src/controllers/shared/dynamic-entities.controller');

describe('reception enquiry and visitor required names', () => {
  const originals = {};

  beforeEach(() => {
    originals.branchFindOne = Branch.findOne;
    originals.recordCreate = DynamicEntityRecord.create;
    originals.recordFindOne = DynamicEntityRecord.findOne;
    originals.recordBulkCreate = DynamicEntityRecord.bulkCreate;
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1' });
  });

  afterEach(() => {
    Branch.findOne = originals.branchFindOne;
    DynamicEntityRecord.create = originals.recordCreate;
    DynamicEntityRecord.findOne = originals.recordFindOne;
    DynamicEntityRecord.bulkCreate = originals.recordBulkCreate;
  });

  const request = (body, entity = 'enquiry', method = 'create') => ({
    user: { id: 'receptionist-1', role: 'receptionist', school_id: 'school-1', branch_id: 'branch-1' },
    params: { entity, ...(method === 'update' && { id: `${entity}-1` }) },
    body
  });

  const response = () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    return res;
  };

  it.each([{}, { title: '' }, { title: '   ' }])('rejects a missing/blank name before creating a record', async body => {
    DynamicEntityRecord.create = jest.fn();
    const res = response();
    await controller.create(request(body), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Student name is required' });
    expect(DynamicEntityRecord.create).not.toHaveBeenCalled();
  });

  it('creates an enquiry when the required name is supplied', async () => {
    DynamicEntityRecord.create = jest.fn().mockResolvedValue({ toJSON: () => ({ payload: {} }) });
    const res = response();
    await controller.create(request({ title: 'Jordan Lee' }), res);
    expect(DynamicEntityRecord.create).toHaveBeenCalledWith(expect.objectContaining({
      entity_type: 'enquiry', title: 'Jordan Lee', school_id: 'school-1', branch_id: 'branch-1'
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('does not allow edits to clear an existing enquiry name', async () => {
    const record = { title: 'Jordan Lee', update: jest.fn() };
    DynamicEntityRecord.findOne = jest.fn().mockResolvedValue(record);
    const res = response();
    await controller.update(request({ title: '  ' }, 'enquiry', 'update'), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(record.update).not.toHaveBeenCalled();
  });

  it('requires a visitor name on create and update', async () => {
    DynamicEntityRecord.create = jest.fn();
    const createRes = response();
    await controller.create(request({ title: ' ' }, 'visitor'), createRes);
    expect(createRes.status).toHaveBeenCalledWith(400);
    expect(createRes.json).toHaveBeenCalledWith({ success: false, message: 'Visitor name is required' });
    expect(DynamicEntityRecord.create).not.toHaveBeenCalled();

    const record = { title: 'Avery Morgan', update: jest.fn() };
    DynamicEntityRecord.findOne = jest.fn().mockResolvedValue(record);
    const updateRes = response();
    await controller.update(request({ title: '   ' }, 'visitor', 'update'), updateRes);
    expect(updateRes.status).toHaveBeenCalledWith(400);
    expect(record.update).not.toHaveBeenCalled();
  });

  it.each([
    ['enquiry', [{ title: 'Jordan Lee' }, {}], 'Student name is required'],
    ['visitor', [{ title: 'Avery Morgan' }, { title: ' ' }], 'Visitor name is required'],
    ['visitor', [{ title: 'Avery Morgan' }, null], 'Visitor name is required']
  ])('rejects an invalid %s bulk item before any records are written', async (entity, items, message) => {
    DynamicEntityRecord.bulkCreate = jest.fn();
    const res = response();
    await controller.bulkCreate(request({ items }, entity), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: `Item 2: ${message}` });
    expect(DynamicEntityRecord.bulkCreate).not.toHaveBeenCalled();
  });
});
