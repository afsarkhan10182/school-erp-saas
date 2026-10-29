require('module-alias/register');
const controller = require('../src/controllers/academic/student.controller');
const { Student, StudentParent, StudentPromotion, LibraryIssue, School, AcademicYear, ClassTeacher, SubjectTeacher } = require('../src/models');
const { Op } = require('sequelize');

describe('student profile parent data access', () => {
  afterEach(() => jest.restoreAllMocks());

  const getParentAttributes = async role => {
    jest.spyOn(School, 'findByPk').mockResolvedValue({ current_academic_year_id: 'year-1' });
    jest.spyOn(AcademicYear, 'findByPk').mockResolvedValue({ code: '2026-2027' });
    jest.spyOn(ClassTeacher, 'findAll').mockResolvedValue([
      { class_id: 'class-1', branch_id: 'branch-1' }
    ]);
    jest.spyOn(SubjectTeacher, 'findAll').mockResolvedValue([]);
    const student = {
      school_id: 'school-1',
      parents: [{ id: 'parent-1' }],
      toJSON: () => ({ id: 'student-1', parents: [{ id: 'parent-1' }] })
    };
    jest.spyOn(Student, 'findOne').mockResolvedValue(student);
    jest.spyOn(Student, 'findAll').mockResolvedValue([]);
    jest.spyOn(StudentPromotion, 'findAll').mockResolvedValue([]);
    jest.spyOn(LibraryIssue, 'findAll').mockResolvedValue([]);
    jest.spyOn(StudentParent, 'findAll').mockResolvedValue([{ student_id: 'sibling-1' }]);
    const response = { status: () => ({ json: body => body }) };
    await controller.getStudentById({
      params: { id: 'student-1' },
      user: { id: 'teacher-1', role },
      schoolId: 'school-1'
    }, response, error => { throw error; });
    return {
      parentAttributes: Student.findOne.mock.calls[0][0].include[0].attributes,
      siblingWhere: Student.findAll.mock.calls[0][0].where
    };
  };

  it('limits teacher profiles to parent names and contact details', async () => {
    const { parentAttributes: attributes, siblingWhere } = await getParentAttributes('teacher');
    expect(attributes).toContain('guardian_phone');
    expect(attributes).toContain('guardian_email');
    expect(attributes).not.toEqual(expect.arrayContaining([
      'father_income', 'mother_income', 'guardian_income', 'father_occupation',
      'mother_occupation', 'guardian_occupation', 'father_qualification',
      'mother_qualification', 'guardian_education', 'address', 'city', 'state'
    ]));
    expect(siblingWhere).toMatchObject({ school_id: 'school-1', academic_year: '2026-2027' });
    expect(siblingWhere[Op.and]).toContainEqual({
      [Op.or]: [{ class_id: 'class-1', branch_id: 'branch-1' }]
    });
  });

  it('preserves full parent details for school administrators', async () => {
    const { parentAttributes: attributes, siblingWhere } = await getParentAttributes('admin');
    expect(attributes).toEqual(expect.arrayContaining([
      'guardian_phone', 'father_income', 'mother_income', 'guardian_income',
      'father_occupation', 'guardian_occupation', 'address'
    ]));
    expect(siblingWhere.academic_year).toBeUndefined();
  });
});
