require('module-alias/register');
const ClassController = require('../src/controllers/academic/class.controller');
const SectionController = require('../src/controllers/academic/section.controller');
const StreamController = require('../src/controllers/academic/stream.controller');
const { Class, ClassTeacher, Section, Stream, SubjectTeacher } = require('../src/models');

describe('ClassController teacher dropdown scope', () => {
  const originalClassFindAll = Class.findAll;
  const originalClassFindAndCountAll = Class.findAndCountAll;
  const originalAssignmentFindAll = ClassTeacher.findAll;
  const originalSubjectAssignmentFindAll = SubjectTeacher.findAll;
  const originalSectionFindAndCountAll = Section.findAndCountAll;
  const originalSectionFindAll = Section.findAll;
  const originalStreamFindAndCountAll = Stream.findAndCountAll;

  afterEach(() => {
    Class.findAll = originalClassFindAll;
    Class.findAndCountAll = originalClassFindAndCountAll;
    ClassTeacher.findAll = originalAssignmentFindAll;
    SubjectTeacher.findAll = originalSubjectAssignmentFindAll;
    Section.findAndCountAll = originalSectionFindAndCountAll;
    Section.findAll = originalSectionFindAll;
    Stream.findAndCountAll = originalStreamFindAndCountAll;
  });

  it('limits teacher dropdown results to their active assigned classes and own branch', async () => {
    const classId = 'c0000000-0000-0000-0000-000000000001';
    const subjectClassId = 'c0000000-0000-0000-0000-000000000002';
    ClassTeacher.findAll = jest.fn().mockResolvedValue([{ class_id: classId }]);
    SubjectTeacher.findAll = jest.fn().mockResolvedValue([{ class_id: subjectClassId }, { class_id: classId }]);
    Class.findAll = jest.fn().mockResolvedValue([]);
    const req = {
      user: {
        id: 't0000000-0000-0000-0000-000000000001',
        role: 'teacher',
        school_id: 's0000000-0000-0000-0000-000000000001',
        branch_id: 'b0000000-0000-0000-0000-000000000001'
      },
      query: { branch_id: 'b0000000-0000-0000-0000-000000000002' }
    };
    const res = { json: jest.fn() };

    await ClassController.getClassesForDropdown(req, res, error => {
      if (error) throw error;
    });

    expect(ClassTeacher.findAll).toHaveBeenCalledWith({
      where: {
        teacher_id: req.user.id,
        school_id: req.user.school_id,
        branch_id: req.user.branch_id,
        is_active: true
      },
      attributes: ['class_id'],
      raw: true
    });
    expect(SubjectTeacher.findAll).toHaveBeenCalledWith({
      where: {
        teacher_id: req.user.id,
        school_id: req.user.school_id,
        branch_id: req.user.branch_id
      },
      attributes: ['class_id'],
      raw: true
    });
    expect(Class.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: req.user.school_id,
      branch_id: req.user.branch_id,
      id: [classId, subjectClassId]
    });
  });

  it('returns no classes when the teacher has no active assignments', async () => {
    ClassTeacher.findAll = jest.fn().mockResolvedValue([]);
    SubjectTeacher.findAll = jest.fn().mockResolvedValue([]);
    Class.findAll = jest.fn().mockResolvedValue([]);
    const req = {
      user: { id: 't0000000-0000-0000-0000-000000000001', role: 'teacher', school_id: 's0000000-0000-0000-0000-000000000001', branch_id: 'b0000000-0000-0000-0000-000000000001' },
      query: {}
    };
    const res = { json: jest.fn() };

    await ClassController.getClassesForDropdown(req, res, error => {
      if (error) throw error;
    });

    expect(Class.findAll.mock.calls[0][0].where.id).toEqual([]);
  });

  it('limits receptionist dropdown results to their own school and branch', async () => {
    Class.findAll = jest.fn().mockResolvedValue([]);
    const req = {
      user: {
        role: 'receptionist',
        school_id: 's0000000-0000-0000-0000-000000000001',
        branch_id: 'b0000000-0000-0000-0000-000000000001'
      },
      query: {
        school_id: 's0000000-0000-0000-0000-000000000002',
        branch_id: 'b0000000-0000-0000-0000-000000000002'
      }
    };
    const res = { json: jest.fn() };

    await ClassController.getClassesForDropdown(req, res, error => {
      if (error) throw error;
    });

    expect(Class.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: req.user.school_id,
      branch_id: req.user.branch_id,
      is_active: true
    });
  });

  it('limits accountant class dropdown results to their school and assigned branch', async () => {
    Class.findAll = jest.fn().mockResolvedValue([]);
    const req = {
      user: { role: 'accountant', school_id: 'school-1', branch_id: 'branch-1' },
      query: { branch_id: 'branch-other' }
    };

    await ClassController.getClassesForDropdown(req, { json: jest.fn() }, error => {
      if (error) throw error;
    });

    expect(Class.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1',
      branch_id: 'branch-1',
      is_active: true
    });
  });

  it('limits accountant section dropdown results to their school and assigned branch', async () => {
    Section.findAll = jest.fn().mockResolvedValue([]);
    const req = {
      user: { role: 'accountant', school_id: 'school-1', branch_id: 'branch-1' },
      query: { branch_id: 'branch-other', class_id: 'class-1' }
    };

    await SectionController.getSectionsForDropdown(req, { json: jest.fn() }, error => {
      if (error) throw error;
    });

    expect(Section.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1',
      branch_id: 'branch-1',
      class_id: 'class-1',
      is_active: true
    });
  });

  it('allows accountants to list classes within their school and selected branch', async () => {
    Class.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    const req = {
      user: { role: 'accountant', school_id: 'school-1' },
      query: { branch_id: 'branch-1' }
    };
    const res = { json: jest.fn() };

    await ClassController.getAllClasses(req, res, error => {
      if (error) throw error;
    });

    expect(Class.findAndCountAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1',
      branch_id: 'branch-1'
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('filters super-admin class lists by the selected school when supplied', async () => {
    Class.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    const req = {
      user: { role: 'super_admin' },
      query: { school_id: 'school-2', branch_id: 'branch-2' }
    };
    const res = { json: jest.fn() };

    await ClassController.getAllClasses(req, res, error => {
      if (error) throw error;
    });

    expect(Class.findAndCountAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-2',
      branch_id: 'branch-2'
    });
  });

  it('allows accountants to list sections within their school and selected branch', async () => {
    Section.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    const req = {
      user: { role: 'accountant', school_id: 'school-1' },
      query: { branch_id: 'branch-1' }
    };
    const res = { json: jest.fn() };

    await SectionController.getAllSections(req, res, error => {
      if (error) throw error;
    });

    expect(Section.findAndCountAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1',
      branch_id: 'branch-1'
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('filters super-admin section lists by the selected school when supplied', async () => {
    Section.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    const req = {
      user: { role: 'super_admin' },
      query: { school_id: 'school-2', branch_id: 'branch-2' }
    };
    const res = { json: jest.fn() };

    await SectionController.getAllSections(req, res, error => {
      if (error) throw error;
    });

    expect(Section.findAndCountAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-2',
      branch_id: 'branch-2'
    });
  });

  it('allows accountants to list streams within their school despite a foreign school filter', async () => {
    Stream.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    const req = {
      user: { role: 'accountant', school_id: 'school-1' },
      query: { school_id: 'school-2', branch_id: 'branch-1' }
    };
    const res = { json: jest.fn() };

    await StreamController.getAllStreams(req, res, error => {
      if (error) throw error;
    });

    expect(Stream.findAndCountAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1',
      branch_id: 'branch-1'
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('filters super-admin stream lists by the selected school when supplied', async () => {
    Stream.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    const req = {
      user: { role: 'super_admin' },
      query: { school_id: 'school-2', branch_id: 'branch-2' }
    };
    const res = { json: jest.fn() };

    await StreamController.getAllStreams(req, res, error => {
      if (error) throw error;
    });

    expect(Stream.findAndCountAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-2',
      branch_id: 'branch-2'
    });
  });

  it('limits teacher section dropdowns to their assigned class sections', async () => {
    ClassTeacher.findAll = jest.fn().mockResolvedValue([{ section_id: 'section-1' }]);
    Section.findAll = jest.fn().mockResolvedValue([]);
    const req = {
      user: {
        id: 'teacher-1',
        role: 'teacher',
        school_id: 'school-1',
        branch_id: 'branch-1'
      },
      query: { class_id: 'class-1' }
    };
    const res = { json: jest.fn() };

    await SectionController.getSectionsForDropdown(req, res, error => {
      if (error) throw error;
    });

    expect(ClassTeacher.findAll).toHaveBeenCalledWith({
      where: {
        teacher_id: 'teacher-1',
        school_id: 'school-1',
        branch_id: 'branch-1',
        is_active: true,
        class_id: 'class-1'
      },
      attributes: ['section_id'],
      raw: true
    });
    expect(Section.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1',
      branch_id: 'branch-1',
      class_id: 'class-1',
      id: ['section-1']
    });
  });
});
