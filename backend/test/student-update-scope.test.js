require('module-alias/register');

const { Student, Class, Section, DynamicEntityRecord } = require('../src/models');
const Controller = require('../src/controllers/academic/student.controller');

describe('student update tenant and placement scope', () => {
  const originals = {
    studentFindOne: Student.findOne,
    classFindOne: Class.findOne,
    sectionFindOne: Section.findOne,
    dynamicEntityFindAll: DynamicEntityRecord.findAll
  };
  let student;

  beforeEach(() => {
    jest.clearAllMocks();
    student = {
      id: 'student-a',
      school_id: 'school-a',
      branch_id: 'branch-a',
      class_id: 'class-a',
      section_id: 'section-a',
      stream_id: null,
      current_class: 'Class 1',
      section: 'A',
      gender: 'female',
      category: 'general',
      status: 'inactive',
      admission_sought_in: null,
      documents: {},
      update: jest.fn().mockImplementation(async updates => Object.assign(student, updates))
    };
    Student.findOne = jest.fn().mockResolvedValue(student);
    Class.findOne = jest.fn();
    Section.findOne = jest.fn();
    DynamicEntityRecord.findAll = jest.fn().mockResolvedValue([]);
  });

  afterAll(() => {
    Student.findOne = originals.studentFindOne;
    Class.findOne = originals.classFindOne;
    Section.findOne = originals.sectionFindOne;
    DynamicEntityRecord.findAll = originals.dynamicEntityFindAll;
  });

  const request = studentData => ({
    user: { id: 'admin-a', role: 'admin', school_id: 'school-a' },
    schoolId: 'school-a',
    params: { id: 'student-a' },
    body: { studentData: JSON.stringify(studentData) }
  });
  const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

  it('rejects a foreign class and does not modify the student', async () => {
    Class.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await Controller.updateStudent(
      request({
        school_id: 'school-b',
        branch_id: 'branch-b',
        class_id: 'class-b',
        student: { first_name: 'Tampered', school_id: 'school-b', branch_id: 'branch-b' }
      }),
      response(),
      next
    );

    expect(Class.findOne).toHaveBeenCalledWith({
      where: { id: 'class-b', school_id: 'school-a', branch_id: 'branch-a', is_active: true }
    });
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(student.update).not.toHaveBeenCalled();
  });

  it('fails closed when a Branch Admin has no branch assignment', async () => {
    const next = jest.fn();
    await Controller.updateStudent(
      {
        ...request({ student: { first_name: 'Should not update' } }),
        user: { id: 'branch-admin', role: 'branch_admin' }
      },
      response(),
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(Student.findOne).not.toHaveBeenCalled();
    expect(student.update).not.toHaveBeenCalled();
  });

  it('ignores caller ownership IDs and applies a valid same-branch class and section', async () => {
    Class.findOne.mockResolvedValue({ id: 'class-next', name: 'Class 2' });
    Section.findOne.mockResolvedValue({ id: 'section-next', name: 'B' });
    const res = response();
    const next = jest.fn();

    await Controller.updateStudent(
      request({
        school_id: 'school-b',
        branch_id: 'branch-b',
        class_id: 'class-next',
        section_id: 'section-next',
        student: {
          first_name: 'Updated',
          school_id: 'school-b',
          branch_id: 'branch-b',
          user_id: 'foreign-user',
          class_id: 'class-b'
        }
      }),
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(Class.findOne).toHaveBeenCalledWith({
      where: { id: 'class-next', school_id: 'school-a', branch_id: 'branch-a', is_active: true }
    });
    expect(Section.findOne).toHaveBeenCalledWith({
      where: {
        id: 'section-next',
        class_id: 'class-next',
        school_id: 'school-a',
        branch_id: 'branch-a',
        stream_id: null,
        is_active: true
      }
    });
    const saved = student.update.mock.calls[0][0];
    expect(saved).toMatchObject({
      first_name: 'Updated',
      class_id: 'class-next',
      current_class: 'Class 2',
      section_id: 'section-next',
      section: 'B'
    });
    expect(saved).not.toHaveProperty('school_id');
    expect(saved).not.toHaveProperty('branch_id');
    expect(saved).not.toHaveProperty('user_id');
    expect(saved).not.toHaveProperty('status');
    expect(student.status).toBe('inactive');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects a section that does not belong to the selected class before writing', async () => {
    Class.findOne.mockResolvedValue({ id: 'class-next', name: 'Class 2' });
    Section.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await Controller.updateStudent(
      request({
        class_id: 'class-next',
        section_id: 'foreign-section',
        student: { first_name: 'Updated' }
      }),
      response(),
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(student.update).not.toHaveBeenCalled();
  });
});
