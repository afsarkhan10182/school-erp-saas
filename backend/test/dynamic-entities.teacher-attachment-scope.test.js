require('module-alias/register');
const mockOp = require('sequelize').Op;

jest.mock('../src/utils/academic/academicYearUtils', () => ({
  getCurrentAcademicYearForSchool: jest.fn().mockResolvedValue({ code: '2026-2027' })
}));
jest.mock('../src/utils/academic/teacherStudentScope', () => ({
  getTeacherStudentWhere: jest.fn().mockResolvedValue({
    [mockOp.or]: [{ class_id: 'assigned-class', branch_id: 'assigned-branch' }]
  })
}));

const { Branch, DynamicEntityRecord } = require('../src/models');
const { Op } = require('sequelize');
const controller = require('../src/controllers/shared/dynamic-entities.controller');

describe('teacher attachment assigned-class scope', () => {
  const originals = {};

  beforeEach(() => {
    originals.branchFindOne = Branch.findOne;
    originals.recordFindAndCountAll = DynamicEntityRecord.findAndCountAll;
    originals.recordCreate = DynamicEntityRecord.create;
    originals.recordBulkCreate = DynamicEntityRecord.bulkCreate;
    originals.recordFindOne = DynamicEntityRecord.findOne;
    Branch.findOne = jest.fn().mockImplementation(({ where }) => ({ id: where.id }));
  });

  afterEach(() => {
    Branch.findOne = originals.branchFindOne;
    DynamicEntityRecord.findAndCountAll = originals.recordFindAndCountAll;
    DynamicEntityRecord.create = originals.recordCreate;
    DynamicEntityRecord.bulkCreate = originals.recordBulkCreate;
    DynamicEntityRecord.findOne = originals.recordFindOne;
  });

  const req = overrides => ({
    user: { id: 'teacher-1', role: 'teacher', school_id: 'school-1', branch_id: 'assigned-branch' },
    schoolId: 'school-1',
    params: { entity: 'attachment', id: 'record-1' },
    query: {},
    body: {},
    ...overrides
  });

  it('limits list results to current-year assigned classes and branches', async () => {
    DynamicEntityRecord.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    await controller.list(req(), { json: jest.fn() });

    const where = DynamicEntityRecord.findAndCountAll.mock.calls[0][0].where;
    expect(where[Op.and]).toEqual([
      {
        [Op.or]: [{ class_id: 'assigned-class', branch_id: 'assigned-branch' }]
      }
    ]);
  });

  it('rejects uploads to classes the teacher is not assigned to', async () => {
    DynamicEntityRecord.create = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.create(
      req({ body: { class_id: 'other-class', branch_id: 'assigned-branch' } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(DynamicEntityRecord.create).not.toHaveBeenCalled();
  });

  it('allows an upload to an assigned class in its assigned branch', async () => {
    DynamicEntityRecord.create = jest
      .fn()
      .mockResolvedValue({ toJSON: () => ({ id: 'record-1' }) });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.create(
      req({
        body: {
          class_id: 'assigned-class',
          branch_id: 'assigned-branch',
          title: 'Revision notes'
        }
      }),
      res
    );

    expect(DynamicEntityRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        class_id: 'assigned-class',
        branch_id: 'assigned-branch',
        school_id: 'school-1'
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects bulk uploads when any item is outside the teacher assignment', async () => {
    DynamicEntityRecord.bulkCreate = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.bulkCreate(
      req({
        body: {
          branch_id: 'assigned-branch',
          items: [{ class_id: 'assigned-class' }, { class_id: 'other-class' }]
        }
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(DynamicEntityRecord.bulkCreate).not.toHaveBeenCalled();
  });

  it.each(['update', 'remove'])(
    '%s rejects records outside the teacher assignment',
    async action => {
      DynamicEntityRecord.findOne = jest.fn().mockResolvedValue({
        class_id: 'other-class',
        branch_id: 'assigned-branch',
        update: jest.fn(),
        destroy: jest.fn()
      });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller[action](req(), res);

      expect(res.status).toHaveBeenCalledWith(403);
    }
  );

  it('rejects generic status actions on records outside the teacher assignment', async () => {
    const record = { class_id: 'other-class', branch_id: 'assigned-branch', update: jest.fn() };
    DynamicEntityRecord.findOne = jest.fn().mockResolvedValue(record);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.runAction(
      req({ params: { entity: 'attachment', id: 'record-1', action: 'archived' } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(record.update).not.toHaveBeenCalled();
  });

  it('pins live-class lists and creates to the teacher branch despite forged overrides', async () => {
    DynamicEntityRecord.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    await controller.list(
      req({ params: { entity: 'live_class' }, query: { branch_id: 'other-branch' } }),
      { json: jest.fn() }
    );
    expect(DynamicEntityRecord.findAndCountAll.mock.calls[0][0].where.branch_id).toBe(
      'assigned-branch'
    );

    DynamicEntityRecord.create = jest
      .fn()
      .mockResolvedValue({ toJSON: () => ({ id: 'live-1' }) });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.create(
      req({
        params: { entity: 'live_class' },
        body: { branch_id: 'other-branch', title: 'Lesson' }
      }),
      res
    );
    expect(DynamicEntityRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({ branch_id: 'assigned-branch' })
    );
  });

  it.each(['update', 'remove'])(
    '%s looks up live classes only in the teacher branch',
    async action => {
      DynamicEntityRecord.findOne = jest
        .fn()
        .mockResolvedValue({ update: jest.fn(), destroy: jest.fn() });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller[action](
        req({
          params: { entity: 'live_class', id: 'live-1' },
          query: { branch_id: 'other-branch' }
        }),
        res
      );
      expect(DynamicEntityRecord.findOne.mock.calls[0][0].where.branch_id).toBe(
        'assigned-branch'
      );
    }
  );

  it('denies live-class access when a teacher has no assigned branch', async () => {
    DynamicEntityRecord.findAndCountAll = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.list(
      req({
        params: { entity: 'live_class' },
        user: { id: 'teacher-1', role: 'teacher', school_id: 'school-1' }
      }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(DynamicEntityRecord.findAndCountAll).not.toHaveBeenCalled();
  });
});
