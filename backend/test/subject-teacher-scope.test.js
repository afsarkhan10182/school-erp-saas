require('module-alias/register');

const SubjectTeacherController = require('../src/controllers/academic/subjects/subject-teacher.controller');
const { SubjectTeacher } = require('../src/models');

const runController = async (user, query) => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  const next = jest.fn();
  await SubjectTeacherController.getAllSubjectTeachers({ user, query }, res, next);
  return { res, next, queryOptions: SubjectTeacher.findAndCountAll.mock.calls[0]?.[0] };
};

describe('subject-teacher listing tenant scope', () => {
  beforeEach(() => {
    jest.spyOn(SubjectTeacher, 'findAndCountAll').mockResolvedValue({ count: 0, rows: [] });
  });

  afterEach(() => jest.restoreAllMocks());

  it('keeps a teacher on their own school, branch, and assignments despite forged filters', async () => {
    const { next, queryOptions } = await runController(
      { id: 'teacher-1', role: 'teacher', school_id: 'school-1', branch_id: 'branch-1' },
      {
        page: '1', limit: '1000', school_id: 'school-other', branch_id: 'branch-other',
        teacher_id: 'teacher-other', class_id: 'class-1'
      }
    );

    expect(next).not.toHaveBeenCalled();
    expect(queryOptions.where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-1', teacher_id: 'teacher-1', class_id: 'class-1'
    });
  });

  it('keeps a branch admin on their assigned tenant and branch', async () => {
    const { next, queryOptions } = await runController(
      { id: 'admin-1', role: 'branch_admin', school_id: 'school-1', branch_id: 'branch-1' },
      { page: '1', limit: '100', school_id: 'school-other', branch_id: 'branch-other' }
    );

    expect(next).not.toHaveBeenCalled();
    expect(queryOptions.where).toMatchObject({ school_id: 'school-1', branch_id: 'branch-1' });
  });
});
