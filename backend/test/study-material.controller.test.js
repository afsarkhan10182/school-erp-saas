require('module-alias/register');
const fs = require('fs/promises');
const path = require('path');
const { Op } = require('sequelize');
const config = require('../src/config/config');
const { Class, ClassSubjectAssignment, DynamicEntityRecord, Subject, SubjectTeacher, Student } = require('../src/models');
const { resolvePrivateStudyMaterialsPath, resolveUploadsPath } = require('../src/utils/shared/pathHelper');
const controller = require('../src/controllers/academic/study-material.controller');

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined)
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

describe('private Study Center material files', () => {
  const originals = [
    [Class, 'findOne'],
    [ClassSubjectAssignment, 'findOne'],
    [DynamicEntityRecord, 'create'],
    [DynamicEntityRecord, 'findAll'],
    [DynamicEntityRecord, 'findAndCountAll'],
    [DynamicEntityRecord, 'findOne'],
    [Subject, 'findOne'],
    [SubjectTeacher, 'findOne'],
    [Student, 'findOne']
  ].map(([model, method]) => [model, method, model[method]]);

  afterEach(() => {
    originals.forEach(([model, method, original]) => { model[method] = original; });
    jest.clearAllMocks();
  });

  const response = () => ({
    status: jest.fn(function (code) { this.statusCode = code; return this; }),
    json: jest.fn(function (body) { this.body = body; return this; }),
    set: jest.fn(),
    sendFile: jest.fn(function (filePath) { this.filePath = filePath; return this; })
  });

  it('searches and paginates within the Teacher assignment scope', async () => {
    const { getTeacherStudentWhere } = require('../src/utils/academic/teacherStudentScope');
    getTeacherStudentWhere.mockResolvedValue({ [Op.or]: [{ class_id: 'class-1', branch_id: 'branch-1' }] });
    const record = { toJSON: () => ({ id: 'material-1', title: 'Fractions', payload: { topic: 'Fractions' } }) };
    DynamicEntityRecord.findAndCountAll = jest.fn().mockResolvedValue({ rows: [record], count: 26 });
    const res = response();

    await controller.list({
      user: { id: 'teacher-1', role: 'teacher', school_id: 'school-1', branch_id: 'branch-1' },
      query: { search: 'fractions', page: '2', limit: '25' }
    }, res);

    const options = DynamicEntityRecord.findAndCountAll.mock.calls[0][0];
    expect(options.limit).toBe(25);
    expect(options.offset).toBe(25);
    expect(options.where[Op.and]).toHaveLength(2);
    expect(options.where[Op.and][0][Op.or]).toEqual([{ class_id: 'class-1', branch_id: 'branch-1' }]);
    expect(options.where[Op.and][1][Op.or][0].title[Op.iLike]).toBe('%fractions%');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toEqual({ page: 2, limit: 25, total: 26, totalPages: 2 });
  });

  it('stores a teacher upload outside public uploads and hides its private key from JSON', async () => {
    const { getTeacherStudentWhere } = require('../src/utils/academic/teacherStudentScope');
    getTeacherStudentWhere.mockResolvedValue({ [Op.or]: [{ class_id: 'class-1', branch_id: 'branch-1' }] });
    Class.findOne = jest.fn().mockResolvedValue({ id: 'class-1' });
    ClassSubjectAssignment.findOne = jest.fn().mockResolvedValue({ id: 'class-subject-1' });
    Subject.findOne = jest.fn().mockResolvedValue({ id: 'subject-1', name: 'Mathematics' });
    SubjectTeacher.findOne = jest.fn().mockResolvedValue({ id: 'teacher-subject-1' });
    const saved = {
      id: 'material-1',
      payload: {},
      toJSON() { return { id: this.id, payload: this.payload, title: 'Fractions' }; }
    };
    DynamicEntityRecord.create = jest.fn(async values => {
      saved.payload = values.payload;
      return saved;
    });
    const res = response();

    await controller.create({
      user: { id: 'teacher-1', role: 'teacher', school_id: 'school-1', branch_id: 'branch-1' },
      body: { title: 'Fractions', class_id: 'class-1', subject_id: 'subject-1', branch_id: 'branch-1', resource_type: 'file' },
      file: {
        originalname: 'fractions.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('sample pdf')
      }
    }, res);

    const storedPath = fs.writeFile.mock.calls[0][0];
    expect(storedPath).toBe(resolvePrivateStudyMaterialsPath(path.basename(storedPath)));
    expect(storedPath.startsWith(resolveUploadsPath())).toBe(false);
    expect(DynamicEntityRecord.create).toHaveBeenCalledWith(expect.objectContaining({
      school_id: 'school-1', branch_id: 'branch-1', class_id: 'class-1', status: 'active'
    }));
    expect(res.body.data.file_available).toBe(true);
    expect(res.body.data.payload).not.toHaveProperty('private_file_key');
  });

  it('refuses private storage configured under the public uploads directory', () => {
    const original = config.uploads.privateStudyMaterialsDir;
    config.uploads.privateStudyMaterialsDir = `${config.uploads.dir}/private-materials`;
    try {
      expect(() => resolvePrivateStudyMaterialsPath('file.pdf')).toThrow(/outside the public uploads directory/);
    } finally {
      config.uploads.privateStudyMaterialsDir = original;
    }
  });

  it('does not let a Student fetch a file assigned to another class or branch', async () => {
    Student.findOne = jest.fn().mockResolvedValue({
      id: 'student-1', school_id: 'school-1', branch_id: 'branch-2', class_id: 'class-2'
    });
    DynamicEntityRecord.findOne = jest.fn().mockResolvedValue({
      id: 'material-1', school_id: 'school-1', branch_id: 'branch-1', class_id: 'class-1',
      payload: { private_file_key: 'a91ce2c5-a465-4a70-b88a-d2e632979e48.pdf' }
    });
    const res = response();

    await controller.download({
      user: { id: 'student-user', role: 'student', school_id: 'school-1' },
      params: { id: 'material-1' }
    }, res);

    expect(res.statusCode).toBe(404);
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('streams an authorized file only from private storage with no-store headers', async () => {
    Student.findOne = jest.fn().mockResolvedValue({
      id: 'student-1', school_id: 'school-1', branch_id: 'branch-1', class_id: 'class-1'
    });
    DynamicEntityRecord.findOne = jest.fn().mockResolvedValue({
      id: 'material-1', school_id: 'school-1', branch_id: 'branch-1', class_id: 'class-1',
      payload: {
        private_file_key: 'a91ce2c5-a465-4a70-b88a-d2e632979e48.pdf',
        private_file_mime: 'application/pdf',
        private_file_name: 'fractions.pdf'
      }
    });
    const res = response();

    await controller.download({
      user: { id: 'student-user', role: 'student', school_id: 'school-1' },
      params: { id: 'material-1' }
    }, res);

    expect(res.filePath).toBe(resolvePrivateStudyMaterialsPath('a91ce2c5-a465-4a70-b88a-d2e632979e48.pdf'));
    expect(res.filePath.startsWith(resolveUploadsPath())).toBe(false);
    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({
      'Content-Disposition': 'attachment; filename="fractions.pdf"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff'
    }));
  });
});
