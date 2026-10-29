require('module-alias/register');
const { Op } = require('sequelize');
const { Class, ClassSubjectAssignment, DynamicEntityRecord, Section, Subject, SubjectTeacher } = require('../src/models');
const controller = require('../src/controllers/academic/classwork.controller');

jest.mock('fs/promises', () => ({ mkdir: jest.fn().mockResolvedValue(undefined), writeFile: jest.fn().mockResolvedValue(undefined), unlink: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../src/utils/shared/pathHelper', () => ({
  ...jest.requireActual('../src/utils/shared/pathHelper'),
  resolvePrivateStudyMaterialsPath: (...parts) => `/private/${parts.join('/')}`
}));

jest.mock('../src/utils/shared/requestScope', () => ({
  resolveSchoolBranchScope: jest.fn().mockResolvedValue({ school_id: 'school-1', branch_id: 'branch-1' })
}));
jest.mock('../src/utils/academic/academicYearUtils', () => ({
  getCurrentAcademicYearForSchool: jest.fn().mockResolvedValue({ code: '2026-2027' })
}));
jest.mock('../src/utils/academic/teacherStudentScope', () => ({
  getTeacherStudentWhere: jest.fn()
}));

describe('Classwork and Logbook records', () => {
  const originals = [[Class, 'findOne'], [ClassSubjectAssignment, 'findOne'], [DynamicEntityRecord, 'create'], [DynamicEntityRecord, 'findAndCountAll'], [Section, 'findOne'], [Subject, 'findOne'], [SubjectTeacher, 'findOne']]
    .map(([model, method]) => [model, method, model[method]]);
  const response = () => ({ status: jest.fn(function (code) { this.statusCode = code; return this; }), json: jest.fn(function (body) { this.body = body; return this; }) });

  afterEach(() => {
    originals.forEach(([model, method, original]) => { model[method] = original; });
    jest.clearAllMocks();
  });

  it('limits Teacher list results to assigned branch/class and the Teacher’s own entries', async () => {
    const { getTeacherStudentWhere } = require('../src/utils/academic/teacherStudentScope');
    getTeacherStudentWhere.mockResolvedValue({ [Op.or]: [{ class_id: 'class-1', branch_id: 'branch-1', section_id: 'section-1' }] });
    DynamicEntityRecord.findAndCountAll = jest.fn().mockResolvedValue({ rows: [], count: 0 });
    const res = response();
    await controller.list({ user: { id: 'teacher-1', role: 'teacher', school_id: 'school-1', branch_id: 'branch-1' }, query: {} }, res);
    const where = DynamicEntityRecord.findAndCountAll.mock.calls[0][0].where;
    expect(where.school_id).toBe('school-1');
    expect(where.branch_id).toBe('branch-1');
    expect(where.created_by).toBe('teacher-1');
    expect(where[Op.and][0][Op.or]).toEqual([{ class_id: 'class-1', branch_id: 'branch-1' }]);
  });

  it('filters by dates/session/type and redacts private storage keys on list responses', async () => {
    DynamicEntityRecord.findAndCountAll = jest.fn().mockResolvedValue({ rows: [{ toJSON: () => ({ id: 'entry-1', payload: { entry_type: 'Notes', academic_year: '2026-2027', private_file_key: '123e4567-e89b-42d3-a456-426614174000.pdf', private_file_mime: 'application/pdf', private_file_name: 'lesson.pdf' } }) }], count: 1 });
    const res = response();
    await controller.list({ user: { id: 'admin-1', role: 'admin', school_id: 'school-1' }, query: { branch_id: 'branch-1', from_date: '2026-10-01', to_date: '2026-10-31', academic_year: '2026-2027', entry_type: 'Notes', sort_by: 'type', sort_order: 'ASC' } }, res);
    const options = DynamicEntityRecord.findAndCountAll.mock.calls[0][0];
    expect(options.where.date_value[Op.between]).toEqual(['2026-10-01', '2026-10-31']);
    expect(options.order[0][1]).toBe('ASC');
    expect(res.body.data[0].file_available).toBe(true);
    expect(res.body.data[0].private_file_key).toBeUndefined();
    expect(res.body.data[0].private_file_mime).toBeUndefined();
    expect(res.body.data[0].private_file_name).toBe('lesson.pdf');
  });

  it('rejects a Teacher entry outside their assigned subject without writing', async () => {
    const { getTeacherStudentWhere } = require('../src/utils/academic/teacherStudentScope');
    getTeacherStudentWhere.mockResolvedValue({ [Op.or]: [{ class_id: 'another-class', branch_id: 'branch-1' }] });
    Class.findOne = jest.fn().mockResolvedValue({ id: 'class-1', name: 'Class 1' });
    Section.findOne = jest.fn().mockResolvedValue({ id: 'section-1', name: 'A' });
    Subject.findOne = jest.fn().mockResolvedValue({ id: 'subject-1', name: 'Mathematics' });
    ClassSubjectAssignment.findOne = jest.fn().mockResolvedValue({ id: 'class-subject-1' });
    DynamicEntityRecord.create = jest.fn();
    const res = response();
    await controller.create({
      user: { id: 'teacher-1', role: 'teacher', school_id: 'school-1', branch_id: 'branch-1' },
      body: { entry_type: 'Classwork', date: '2026-10-28', class_id: 'class-1', section_id: 'section-1', subject_id: 'subject-1', title: 'Fractions', notes: 'Equivalent fractions' }
    }, res);
    expect(res.statusCode).toBe(403);
    expect(DynamicEntityRecord.create).not.toHaveBeenCalled();
  });

  it('stores validated school/branch and class placement on create', async () => {
    Class.findOne = jest.fn().mockResolvedValue({ id: 'class-1', name: 'Class 1' });
    Section.findOne = jest.fn().mockResolvedValue({ id: 'section-1', name: 'A' });
    Subject.findOne = jest.fn().mockResolvedValue({ id: 'subject-1', name: 'Mathematics' });
    ClassSubjectAssignment.findOne = jest.fn().mockResolvedValue({ id: 'class-subject-1' });
    DynamicEntityRecord.create = jest.fn(async values => ({ ...values, id: 'entry-1', toJSON() { return { ...values, id: this.id }; } }));
    const res = response();
    await controller.create({
      user: { id: 'admin-1', role: 'admin', school_id: 'school-1', name: 'Demo Admin' },
      body: { branch_id: 'branch-1', entry_type: 'Logbook', date: '2026-10-28', class_id: 'class-1', section_id: 'section-1', subject_id: 'subject-1', title: 'Fractions', notes: 'Equivalent fractions' }
    }, res);
    expect(res.statusCode).toBe(201);
    expect(DynamicEntityRecord.create.mock.calls[0][0]).toMatchObject({ school_id: 'school-1', branch_id: 'branch-1', class_id: 'class-1', date_value: '2026-10-28', payload: { entry_type: 'Logbook', section_id: 'section-1', subject_name: 'Mathematics' } });
  });

  it('stores optional uploads privately and never returns the storage key', async () => {
    const fs = require('fs/promises');
    Class.findOne = jest.fn().mockResolvedValue({ id: 'class-1', name: 'Class 1' });
    Section.findOne = jest.fn().mockResolvedValue(null);
    Subject.findOne = jest.fn().mockResolvedValue({ id: 'subject-1', name: 'Mathematics' });
    ClassSubjectAssignment.findOne = jest.fn().mockResolvedValue({ id: 'class-subject-1' });
    DynamicEntityRecord.create = jest.fn(async values => ({ ...values, toJSON: () => values }));
    const res = response();
    await controller.create({
      user: { id: 'admin-1', role: 'admin', school_id: 'school-1', name: 'Demo Admin' },
      body: { branch_id: 'branch-1', entry_type: 'Notes', date: '2026-10-28', class_id: 'class-1', subject_id: 'subject-1', title: 'Lesson notes', notes: 'Fractions' },
      file: { originalname: 'lesson.pdf', mimetype: 'application/pdf', buffer: Buffer.from('pdf') }
    }, res);
    expect(fs.writeFile).toHaveBeenCalledWith(expect.stringMatching(/^\/private\/[0-9a-f-]{36}\.pdf$/), expect.any(Buffer), { flag: 'wx', mode: 0o600 });
    expect(res.body.data.file_available).toBe(true);
    expect(res.body.data.private_file_key).toBeUndefined();
  });

  it('rejects impossible dates', async () => {
    Class.findOne = jest.fn();
    DynamicEntityRecord.create = jest.fn();
    const res = response();
    await controller.create({ user: { id: 'admin-1', role: 'admin', school_id: 'school-1' }, body: { branch_id: 'branch-1', entry_type: 'Notes', date: '2026-02-31', class_id: 'class-1', subject_id: 'subject-1', title: 'Topic', notes: 'Content' } }, res);
    expect(res.statusCode).toBe(400);
    expect(Class.findOne).not.toHaveBeenCalled();
  });

  it('rejects malformed or inverted list date filters before querying', async () => {
    DynamicEntityRecord.findAndCountAll = jest.fn();
    const res = response();
    await controller.list({ user: { id: 'admin-1', role: 'admin', school_id: 'school-1' }, query: { from_date: '2026-11-01', to_date: '2026-10-01' } }, res);
    expect(res.statusCode).toBe(400);
    expect(DynamicEntityRecord.findAndCountAll).not.toHaveBeenCalled();
  });
});
