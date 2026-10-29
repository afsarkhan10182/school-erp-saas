require('module-alias/register');
const { Op } = require('sequelize');
const { Class, Subject, SubjectTeacher, SyllabusUnit } = require('../src/models');
const controller = require('../src/controllers/academic/syllabus.controller');

jest.mock('../src/utils/shared/requestScope', () => ({
  resolveSchoolBranchScope: jest.fn(async req => ({
    school_id: 'school-1',
    branch_id: req.user.role === 'teacher' ? req.user.branch_id : req.query?.branch_id || null
  }))
}));
jest.mock('../src/utils/academic/academicYearUtils', () => ({
  getCurrentAcademicYearForSchool: jest.fn().mockResolvedValue({ code: '2026-2027' })
}));

describe('Syllabus chapter/topic scope', () => {
  const methods = [
    [Class, 'findOne'],
    [Class, 'findAll'],
    [Subject, 'findOne'],
    [Subject, 'findAll'],
    [SubjectTeacher, 'findOne'],
    [SubjectTeacher, 'findAll'],
    [SyllabusUnit, 'findOne'],
    [SyllabusUnit, 'findAll'],
    [SyllabusUnit, 'create']
  ];
  const originals = methods.map(([model, method]) => [model, method, model[method]]);
  const response = () => ({
    status: jest.fn(function (code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function (body) {
      this.body = body;
      return this;
    })
  });
  const request = (body = {}, query = {}, user = {}) => ({
    user: { id: 'admin-1', role: 'admin', school_id: 'school-1', ...user },
    body,
    query
  });
  const validPlacement = () => {
    Class.findOne = jest.fn().mockResolvedValue({ id: 'class-1', branch_id: 'branch-1' });
    Subject.findOne = jest.fn().mockResolvedValue({ id: 'subject-1' });
  };

  afterEach(() => {
    originals.forEach(([model, method, original]) => {
      model[method] = original;
    });
    jest.clearAllMocks();
  });

  it('lists only the selected class, subject, school and actual class branch', async () => {
    validPlacement();
    SyllabusUnit.findAll = jest.fn().mockResolvedValue([]);
    const res = response();
    await controller.list(
      request({}, { class_id: 'class-1', subject_id: 'subject-1', branch_id: 'branch-1' }),
      res
    );
    expect(res.statusCode).toBeUndefined();
    expect(SyllabusUnit.findAll.mock.calls[0][0].where).toEqual({
      school_id: 'school-1',
      branch_id: 'branch-1',
      class_id: 'class-1',
      subject_id: 'subject-1'
    });
  });

  it('lists active class-specific and school-wide subjects within the selected branch', async () => {
    Class.findOne = jest.fn().mockResolvedValue({ id: 'class-1', branch_id: 'branch-1' });
    Subject.findAll = jest.fn().mockResolvedValue([]);
    const res = response();
    await controller.subjects(request({}, { class_id: 'class-1', branch_id: 'branch-1' }), res);
    const where = Subject.findAll.mock.calls[0][0].where;
    expect(where.school_id).toBe('school-1');
    expect(where.is_active).toBe(true);
    expect(where[Op.and]).toEqual([
      { [Op.or]: [{ class_id: 'class-1' }, { class_id: null }] },
      { [Op.or]: [{ branch_id: 'branch-1' }, { branch_id: null }] }
    ]);
  });

  it('limits teacher subject choices to current-year assignments in the assigned branch', async () => {
    Class.findOne = jest.fn().mockResolvedValue({ id: 'class-1', branch_id: 'branch-1' });
    SubjectTeacher.findAll = jest.fn().mockResolvedValue([{ subject_id: 'subject-1' }]);
    Subject.findAll = jest.fn().mockResolvedValue([{ id: 'subject-1' }]);
    const res = response();
    await controller.subjects(
      request({}, { class_id: 'class-1', branch_id: 'branch-foreign' }, {
        id: 'teacher-1', role: 'teacher', branch_id: 'branch-1'
      }),
      res
    );
    expect(res.statusCode).toBeUndefined();
    expect(SubjectTeacher.findAll.mock.calls[0][0].where).toEqual({
      teacher_id: 'teacher-1',
      school_id: 'school-1',
      branch_id: 'branch-1',
      class_id: 'class-1',
      academic_year: '2026-2027'
    });
    expect(Subject.findAll.mock.calls[0][0].where.id).toEqual({ [Op.in]: ['subject-1'] });
  });

  it('returns only active classes with a current-year subject assignment for the teacher branch', async () => {
    SubjectTeacher.findAll = jest.fn().mockResolvedValue([
      { class_id: 'class-1', subject_id: 'subject-1' },
      { class_id: 'class-1', subject_id: 'subject-2' },
      { class_id: 'class-old', subject_id: 'subject-3' }
    ]);
    Class.findAll = jest.fn().mockResolvedValue([{ id: 'class-1', branch_id: 'branch-1' }]);
    const res = response();
    await controller.classes(
      request({}, { branch_id: 'branch-foreign' }, {
        id: 'teacher-1', role: 'teacher', branch_id: 'branch-1'
      }),
      res
    );
    expect(res.body.data).toEqual([{ id: 'class-1', branch_id: 'branch-1' }]);
    expect(SubjectTeacher.findAll.mock.calls[0][0].where).toMatchObject({
      branch_id: 'branch-1',
      academic_year: '2026-2027'
    });
    expect(Class.findAll.mock.calls[0][0].where).toEqual({
      id: { [Op.in]: ['class-1', 'class-old'] },
      school_id: 'school-1',
      branch_id: 'branch-1',
      is_active: true
    });
  });

  it('allows assigned teachers to read a syllabus and rejects unassigned subjects', async () => {
    validPlacement();
    SubjectTeacher.findAll = jest.fn().mockResolvedValue([{ subject_id: 'subject-1' }]);
    SyllabusUnit.findAll = jest.fn().mockResolvedValue([]);
    const allowed = response();
    await controller.list(
      request({}, { class_id: 'class-1', subject_id: 'subject-1', branch_id: 'branch-foreign' }, {
        id: 'teacher-1', role: 'teacher', branch_id: 'branch-1'
      }),
      allowed
    );
    expect(allowed.statusCode).toBeUndefined();
    expect(SyllabusUnit.findAll.mock.calls[0][0].where.branch_id).toBe('branch-1');

    SubjectTeacher.findAll = jest.fn().mockResolvedValue([]);
    const denied = response();
    await controller.list(
      request({}, { class_id: 'class-1', subject_id: 'subject-1' }, {
        id: 'teacher-1', role: 'teacher', branch_id: 'branch-1'
      }),
      denied
    );
    expect(denied.statusCode).toBe(400);
    expect(SyllabusUnit.findAll).toHaveBeenCalledTimes(1);
  });

  it('fails closed for a teacher without an assigned branch', async () => {
    Class.findOne = jest.fn();
    const res = response();
    await controller.subjects(
      request({}, { class_id: 'class-1' }, { id: 'teacher-1', role: 'teacher' }),
      res
    );
    expect(res.statusCode).toBe(403);
    expect(Class.findOne).not.toHaveBeenCalled();
  });

  it('creates a chapter with server-derived school and branch scope', async () => {
    validPlacement();
    SyllabusUnit.create = jest.fn(async values => values);
    const res = response();
    await controller.create(
      request({
        class_id: 'class-1',
        subject_id: 'subject-1',
        title: 'Fractions',
        description: 'Number concepts'
      }),
      res
    );
    expect(res.statusCode).toBe(201);
    expect(SyllabusUnit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        school_id: 'school-1',
        branch_id: 'branch-1',
        class_id: 'class-1',
        subject_id: 'subject-1',
        parent_id: null,
        title: 'Fractions',
        created_by: 'admin-1'
      })
    );
  });

  it('accepts a topic only under a chapter in the same scope', async () => {
    validPlacement();
    SyllabusUnit.findOne = jest.fn().mockResolvedValue({ id: 'chapter-1', parent_id: null });
    SyllabusUnit.create = jest.fn(async values => values);
    const res = response();
    await controller.create(
      request({
        class_id: 'class-1',
        subject_id: 'subject-1',
        parent_id: 'chapter-1',
        title: 'Equivalent fractions'
      }),
      res
    );
    expect(res.statusCode).toBe(201);
    expect(SyllabusUnit.findOne.mock.calls[0][0].where).toEqual({
      id: 'chapter-1',
      school_id: 'school-1',
      branch_id: 'branch-1',
      class_id: 'class-1',
      subject_id: 'subject-1',
      parent_id: null
    });
  });

  it('allows an assigned teacher to create an item in their current-year subject', async () => {
    validPlacement();
    SubjectTeacher.findAll = jest.fn().mockResolvedValue([{ subject_id: 'subject-1' }]);
    SyllabusUnit.create = jest.fn(async values => values);
    const res = response();
    await controller.create(
      request({
        class_id: 'class-1',
        subject_id: 'subject-1',
        title: 'Fractions'
      }, {}, { id: 'teacher-1', role: 'teacher', branch_id: 'branch-1' }),
      res
    );
    expect(res.statusCode).toBe(201);
    expect(SyllabusUnit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        school_id: 'school-1',
        branch_id: 'branch-1',
        class_id: 'class-1',
        subject_id: 'subject-1',
        created_by: 'teacher-1'
      })
    );
  });

  it('rejects a parent chapter from another branch/class before writing', async () => {
    validPlacement();
    SyllabusUnit.findOne = jest.fn().mockResolvedValue(null);
    SyllabusUnit.create = jest.fn();
    const res = response();
    await controller.create(
      request({
        class_id: 'class-1',
        subject_id: 'subject-1',
        parent_id: 'foreign-id',
        title: 'Topic'
      }),
      res
    );
    expect(res.statusCode).toBe(400);
    expect(SyllabusUnit.create).not.toHaveBeenCalled();
  });

  it('rejects missing selection and invalid title before database writes', async () => {
    Class.findOne = jest.fn();
    const missing = response();
    await controller.create(request({ title: 'Chapter' }), missing);
    expect(missing.statusCode).toBe(400);
    const invalid = response();
    await controller.create(
      request({ class_id: 'class-1', subject_id: 'subject-1', title: '  ' }),
      invalid
    );
    expect(invalid.statusCode).toBe(400);
    expect(Class.findOne).not.toHaveBeenCalled();
  });
});
