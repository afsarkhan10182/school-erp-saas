require('module-alias/register');
const { Op } = require('sequelize');
const { sequelize } = require('../src/config/database');
const { AcademicYear, Class, Section, Student, StudentPromotion } = require('../src/models');
const {
  getPromotionStudents,
  promoteStudents
} = require('../src/controllers/academic/student-promotion.controller');

const sourceClass = {
  id: 'class-source',
  name: 'Class 1',
  school_id: 'school-1',
  branch_id: 'branch-1'
};
const targetClass = {
  id: 'class-target',
  name: 'Promotion Target Class 2027',
  school_id: 'school-1',
  branch_id: 'branch-1'
};
const studentId = 'student-1';
const transaction = { LOCK: { UPDATE: 'UPDATE' } };

const makeRequest = (overrides = {}) => ({
  user: { id: 'admin-1', role: 'admin', school_id: 'school-1' },
  query: { branch_id: 'branch-1' },
  body: {
    from_class_id: sourceClass.id,
    to_class_id: targetClass.id,
    to_section_id: 'section-target',
    to_academic_year: '2027-2028',
    students: [{ student_id: studentId, action: 'promote' }],
    branch_id: 'branch-1'
  },
  ...overrides
});

const makeResponse = () => {
  const res = {};
  res.status = jest.fn(code => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn(body => {
    res.body = body;
    return res;
  });
  return res;
};

describe('student promotion scope and atomicity', () => {
  const originals = {
    academicYearFindOne: AcademicYear.findOne,
    classFindOne: Class.findOne,
    sectionFindOne: Section.findOne,
    studentFindAll: Student.findAll,
    promotionCreate: StudentPromotion.create,
    sequelizeTransaction: sequelize.transaction
  };

  afterEach(() => {
    AcademicYear.findOne = originals.academicYearFindOne;
    Class.findOne = originals.classFindOne;
    Section.findOne = originals.sectionFindOne;
    Student.findAll = originals.studentFindAll;
    StudentPromotion.create = originals.promotionCreate;
    sequelize.transaction = originals.sequelizeTransaction;
    jest.clearAllMocks();
  });

  it('does not return students for a class outside the selected school and branch', async () => {
    Class.findOne = jest.fn().mockResolvedValue(null);
    Student.findAll = jest.fn();
    const res = makeResponse();

    await getPromotionStudents(
      makeRequest({ query: { class_id: 'foreign-class', branch_id: 'branch-1' } }),
      res
    );

    expect(Class.findOne).toHaveBeenCalledWith({
      where: { id: 'foreign-class', school_id: 'school-1', branch_id: 'branch-1' }
    });
    expect(res.statusCode).toBe(404);
    expect(Student.findAll).not.toHaveBeenCalled();
  });

  it('rejects a destination class from another school before starting writes', async () => {
    Class.findOne = jest.fn(({ where }) =>
      Promise.resolve(where.id === sourceClass.id ? sourceClass : null)
    );
    AcademicYear.findOne = jest.fn().mockResolvedValue({ name: '2027-2028' });
    sequelize.transaction = jest.fn();
    const res = makeResponse();

    await promoteStudents(makeRequest(), res);

    expect(Class.findOne).toHaveBeenCalledWith({
      where: { id: targetClass.id, school_id: 'school-1', branch_id: 'branch-1', is_active: true }
    });
    expect(res.statusCode).toBe(404);
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('does not let a Branch Admin choose a different branch through request scope', async () => {
    Class.findOne = jest.fn().mockResolvedValue(null);
    AcademicYear.findOne = jest.fn().mockResolvedValue({ name: '2027-2028' });
    sequelize.transaction = jest.fn();
    const res = makeResponse();
    const req = makeRequest({
      user: {
        id: 'branch-admin-1',
        role: 'branch_admin',
        school_id: 'school-1',
        branch_id: 'branch-2'
      },
      query: { branch_id: 'branch-1' },
      body: { ...makeRequest().body, branch_id: 'branch-1' }
    });

    await promoteStudents(req, res);

    expect(Class.findOne).toHaveBeenCalledTimes(2);
    expect(Class.findOne).toHaveBeenCalledWith({
      where: { id: sourceClass.id, school_id: 'school-1', branch_id: 'branch-2' }
    });
    expect(Class.findOne).toHaveBeenNthCalledWith(2, {
      where: { id: targetClass.id, school_id: 'school-1', branch_id: 'branch-2', is_active: true }
    });
    expect(res.statusCode).toBe(404);
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('rejects a destination class in a different branch', async () => {
    const otherBranchClass = { ...targetClass, branch_id: 'branch-2' };
    Class.findOne = jest.fn(({ where }) =>
      Promise.resolve(where.id === sourceClass.id ? sourceClass : otherBranchClass)
    );
    AcademicYear.findOne = jest.fn().mockResolvedValue({ name: '2027-2028' });
    sequelize.transaction = jest.fn();
    const res = makeResponse();

    await promoteStudents(
      makeRequest({
        query: {},
        body: { ...makeRequest().body, branch_id: undefined }
      }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/same branch/);
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('rejects a source section outside the selected source class', async () => {
    Class.findOne = jest.fn(({ where }) =>
      Promise.resolve(where.id === sourceClass.id ? sourceClass : targetClass)
    );
    AcademicYear.findOne = jest.fn().mockResolvedValue({ name: '2027-2028' });
    Section.findOne = jest.fn().mockResolvedValue(null);
    sequelize.transaction = jest.fn();
    const res = makeResponse();
    const req = makeRequest({
      body: { ...makeRequest().body, from_section_id: 'foreign-section' }
    });

    await promoteStudents(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Source section/);
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('rejects students outside the selected class and does not create history', async () => {
    Class.findOne = jest.fn(({ where }) =>
      Promise.resolve(where.id === sourceClass.id ? sourceClass : targetClass)
    );
    AcademicYear.findOne = jest.fn().mockResolvedValue({ name: '2027-2028' });
    Section.findOne = jest.fn().mockResolvedValue({ id: 'section-target', name: 'B' });
    Student.findAll = jest.fn().mockResolvedValue([]);
    StudentPromotion.create = jest.fn();
    sequelize.transaction = jest.fn(callback => callback(transaction));
    const res = makeResponse();

    await promoteStudents(makeRequest(), res);

    expect(Student.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          school_id: 'school-1',
          branch_id: 'branch-1',
          class_id: sourceClass.id,
          id: { [Op.in]: [studentId] }
        }),
        transaction,
        lock: { level: transaction.LOCK.UPDATE, of: Student }
      })
    );
    expect(res.statusCode).toBe(404);
    expect(StudentPromotion.create).not.toHaveBeenCalled();
  });

  it('validates target section and commits long class names plus student update in one transaction', async () => {
    const student = {
      id: studentId,
      school_id: 'school-1',
      branch_id: 'branch-1',
      class_id: sourceClass.id,
      section_id: 'section-source',
      academic_year: '2026-2027',
      update: jest.fn().mockResolvedValue(undefined)
    };
    Class.findOne = jest.fn(({ where }) =>
      Promise.resolve(where.id === sourceClass.id ? sourceClass : targetClass)
    );
    AcademicYear.findOne = jest.fn().mockResolvedValue({ name: '2027-2028' });
    Section.findOne = jest.fn().mockResolvedValue({ id: 'section-target', name: 'B' });
    Student.findAll = jest.fn().mockResolvedValue([student]);
    StudentPromotion.create = jest.fn().mockResolvedValue({});
    sequelize.transaction = jest.fn(callback => callback(transaction));
    const res = makeResponse();

    await promoteStudents(makeRequest(), res);

    expect(Section.findOne).toHaveBeenCalledWith({
      where: {
        id: 'section-target',
        class_id: targetClass.id,
        school_id: targetClass.school_id,
        branch_id: targetClass.branch_id,
        is_active: true
      }
    });
    expect(StudentPromotion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: studentId,
        from_class_id: sourceClass.id,
        from_section_id: 'section-source',
        to_class_id: targetClass.id,
        to_section_id: 'section-target',
        from_academic_year: '2026-2027',
        to_academic_year: '2027-2028',
        school_id: 'school-1',
        branch_id: 'branch-1'
      }),
      { transaction }
    );
    expect(student.update).toHaveBeenCalledWith(
      {
        class_id: targetClass.id,
        section_id: 'section-target',
        current_class: targetClass.name,
        section: 'B',
        academic_year: '2027-2028'
      },
      { transaction }
    );
    expect(res.body.data.count).toBe(1);
  });
});
