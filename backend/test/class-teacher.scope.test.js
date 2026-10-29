require('module-alias/register');

const { ClassTeacher } = require('../src/models');
const ClassTeacherController = require('../src/controllers/academic/class-teacher.controller');

const runController = async (user, query = {}) => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  const next = jest.fn();
  await ClassTeacherController.getAllClassTeachers({ user, query }, res, next);
  return { next, queryOptions: ClassTeacher.findAndCountAll.mock.calls[0]?.[0] };
};

describe('class-teacher listing branch scope', () => {
  beforeEach(() => {
    jest.spyOn(ClassTeacher, 'findAndCountAll').mockResolvedValue({ count: 0, rows: [] });
  });

  afterEach(() => jest.restoreAllMocks());

  it.each(['branch_admin', 'teacher'])('ignores a forged branch for %s', async role => {
    const { next, queryOptions } = await runController(
      { id: 'user-1', role, school_id: 'school-1', branch_id: 'branch-1' },
      { branch_id: 'branch-other', school_id: 'school-other' }
    );

    expect(next).not.toHaveBeenCalled();
    expect(queryOptions.where).toMatchObject({ school_id: 'school-1', branch_id: 'branch-1' });
  });

  it('fails closed for branch-bound users without an assigned branch', async () => {
    const { next, queryOptions } = await runController(
      { id: 'teacher-1', role: 'teacher', school_id: 'school-1' },
      { branch_id: 'branch-other' }
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(queryOptions).toBeUndefined();
  });

  it('honors the selected branch for a School Admin', async () => {
    const { next, queryOptions } = await runController(
      { id: 'admin-1', role: 'admin', school_id: 'school-1', branch_id: 'branch-1' },
      { branch_id: 'branch-2' }
    );

    expect(next).not.toHaveBeenCalled();
    expect(queryOptions.where).toMatchObject({ school_id: 'school-1', branch_id: 'branch-2' });
  });
});
