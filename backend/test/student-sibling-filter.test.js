require('module-alias/register');
const controller = require('../src/controllers/academic/student.controller');
const { Student, StudentParent, ClassTeacher, SubjectTeacher, FeeInvoice } = require('../src/models');
const { Op } = require('sequelize');

describe('student sibling filter', () => {
  const originals = {
    count: Student.count,
    findAll: Student.findAll,
    findAndCountAll: Student.findAndCountAll,
    parentFindAll: StudentParent.findAll,
    classTeacherFindAll: ClassTeacher.findAll,
    subjectTeacherFindAll: SubjectTeacher.findAll,
    invoiceFindAll: FeeInvoice.findAll
  };

  afterEach(() => {
    Student.count = originals.count;
    Student.findAll = originals.findAll;
    Student.findAndCountAll = originals.findAndCountAll;
    StudentParent.findAll = originals.parentFindAll;
    ClassTeacher.findAll = originals.classTeacherFindAll;
    SubjectTeacher.findAll = originals.subjectTeacherFindAll;
    FeeInvoice.findAll = originals.invoiceFindAll;
  });

  it('limits roster results to children linked to a shared parent in the same school', async () => {
    StudentParent.findAll = jest.fn()
      .mockResolvedValueOnce([{ parent_id: 'parent-1' }])
      .mockResolvedValueOnce([{ student_id: 'student-1' }, { student_id: 'student-2' }]);
    Student.count = jest.fn().mockResolvedValue(2);
    Student.findAll = jest.fn().mockResolvedValue([]);

    await controller.getStudents({
      user: { role: 'admin' },
      schoolId: 'school-1',
      query: { has_siblings: 'yes', branch_id: 'branch-1' }
    }, {
      status: () => ({ json: () => {} })
    }, error => { throw error; });

    const parentQuery = StudentParent.findAll.mock.calls[0][0];
    const rosterQuery = Student.count.mock.calls[0][0];
    expect(parentQuery.include[0].where.school_id).toBe('school-1');
    expect(rosterQuery.where).toMatchObject({
      school_id: 'school-1',
      branch_id: 'branch-1',
      id: { [Op.in]: ['student-1', 'student-2'] }
    });
  });

  it('uses a non-match predicate for has-siblings when the school has no shared parents', async () => {
    StudentParent.findAll = jest.fn().mockResolvedValueOnce([]);
    Student.count = jest.fn().mockResolvedValue(0);
    Student.findAll = jest.fn().mockResolvedValue([]);

    await controller.getStudents({
      user: { role: 'admin' },
      schoolId: 'school-1',
      query: { has_siblings: 'yes' }
    }, {
      status: () => ({ json: () => {} })
    }, error => { throw error; });

    expect(Student.count.mock.calls[0][0].where.id).toEqual({ [Op.is]: null });
  });

  it('filters currently studying and unassigned students against the selected academic year', async () => {
    Student.count = jest.fn().mockResolvedValue(0);
    Student.findAll = jest.fn().mockResolvedValue([]);
    const response = { status: () => ({ json: () => {} }) };
    const next = error => { throw error; };

    await controller.getStudents({
      user: { role: 'admin' },
      schoolId: 'school-1',
      query: { enrollment: 'currently_studying', academic_year: '2026-2027' }
    }, response, next);
    const currentWhere = Student.count.mock.calls[0][0].where;
    expect(currentWhere[Op.and]).toContainEqual({
      status: 'active',
      academic_year: '2026-2027',
      class_id: { [Op.not]: null }
    });

    Student.count.mockClear();
    await controller.getStudents({
      user: { role: 'admin' },
      schoolId: 'school-1',
      query: { enrollment: 'unassigned', academic_year: '2026-2027' }
    }, response, next);
    const unassignedWhere = Student.count.mock.calls[0][0].where;
    expect(unassignedWhere.academic_year).toBeUndefined();
    expect(unassignedWhere[Op.and]).toContainEqual({
      status: 'active',
      [Op.or]: [
        { academic_year: { [Op.ne]: '2026-2027' } },
        { academic_year: { [Op.is]: null } },
        { class_id: { [Op.is]: null } }
      ]
    });
  });

  it('keeps full-register results within a Branch Admin assigned branch', async () => {
    Student.count = jest.fn().mockResolvedValue(0);
    Student.findAll = jest.fn().mockResolvedValue([]);

    await controller.getStudents({
      user: { role: 'branch_admin', branch_id: 'branch-main' },
      schoolId: 'school-1',
      query: { enrollment: 'full_register', branch_id: 'branch-second' }
    }, {
      status: () => ({ json: () => {} })
    }, error => { throw error; });

    const where = Student.count.mock.calls[0][0].where;
    expect(where.branch_id).toBe('branch-main');
    expect(where.academic_year).toBeUndefined();
    expect(where[Op.and]).toContainEqual({ status: { [Op.ne]: 'deleted' } });
  });

  it('applies the sibling and enrollment filters to CSV exports as well as the roster', async () => {
    StudentParent.findAll = jest.fn()
      .mockResolvedValueOnce([{ parent_id: 'parent-1' }])
      .mockResolvedValueOnce([{ student_id: 'student-1' }]);
    Student.findAll = jest.fn().mockResolvedValue([]);
    const response = {
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      attachment: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await controller.exportStudentReport({
      user: { role: 'admin' },
      schoolId: 'school-1',
      query: { has_siblings: 'yes', enrollment: 'full_register', branch_id: 'branch-1' }
    }, response, error => { throw error; });

    expect(Student.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1',
      branch_id: 'branch-1',
      id: { [Op.in]: ['student-1'] }
    });
    expect(Student.findAll.mock.calls[0][0].where[Op.and]).toContainEqual({
      status: { [Op.ne]: 'deleted' }
    });
    expect(response.send).toHaveBeenCalled();
  });

  it('limits teacher rosters to current-year assigned class, section, stream, and branch scopes', async () => {
    ClassTeacher.findAll = jest.fn().mockResolvedValue([
      { class_id: 'class-1', section_id: 'section-1', stream_id: null, branch_id: 'branch-1' }
    ]);
    SubjectTeacher.findAll = jest.fn().mockResolvedValue([
      { class_id: 'class-2', section_id: null, stream_id: 'stream-2', branch_id: 'branch-2' }
    ]);
    Student.count = jest.fn().mockResolvedValue(2);
    Student.findAll = jest.fn().mockResolvedValue([]);

    await controller.getStudents({
      user: { id: 'teacher-1', role: 'teacher' },
      schoolId: 'school-1',
      query: { academic_year: '2026-2027', search: 'Demo' }
    }, { status: () => ({ json: () => {} }) }, error => { throw error; });

    const query = Student.count.mock.calls[0][0];
    expect(query.where).toMatchObject({ school_id: 'school-1', academic_year: '2026-2027' });
    expect(query.where[Op.and]).toContainEqual({
      [Op.or]: [
        { class_id: 'class-1', branch_id: 'branch-1', section_id: 'section-1' },
        { class_id: 'class-2', branch_id: 'branch-2', stream_id: 'stream-2' }
      ]
    });
    expect(ClassTeacher.findAll.mock.calls[0][0].where).toMatchObject({
      teacher_id: 'teacher-1', school_id: 'school-1', academic_year: '2026-2027', is_active: true
    });
    expect(Student.findAll.mock.calls[0][0].include[0].attributes).toEqual([
      'id', 'father_name', 'mother_name', 'guardian_name'
    ]);
  });

  it('includes guardian phone on managed rosters without fetching other parent details', async () => {
    Student.count = jest.fn().mockResolvedValue(0);
    Student.findAll = jest.fn().mockResolvedValue([]);

    await controller.getStudents({
      user: { role: 'admin' },
      schoolId: 'school-1',
      query: {}
    }, { status: () => ({ json: () => {} }) }, error => { throw error; });

    expect(Student.findAll.mock.calls[0][0].include[0].attributes).toEqual([
      'id', 'father_name', 'mother_name', 'guardian_name',
      'father_phone', 'mother_phone', 'guardian_phone'
    ]);
  });

  it('fails closed when a Branch Admin has no assigned branch', async () => {
    const next = jest.fn();
    Student.count = jest.fn();

    await controller.getStudents({
      user: { role: 'branch_admin' },
      schoolId: 'school-1',
      query: {}
    }, { status: () => ({ json: () => {} }) }, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(Student.count).not.toHaveBeenCalled();
  });

  it('does not let a Branch Admin query parameter widen student statistics', async () => {
    Student.count = jest.fn().mockResolvedValue(0);
    Student.findAll = jest.fn().mockResolvedValue([]);
    const response = { status: () => ({ json: () => {} }) };

    await controller.getStudentStats({
      user: { role: 'branch_admin', branch_id: 'branch-main' },
      schoolId: 'school-1',
      query: { branch_id: 'branch-second' }
    }, response, error => { throw error; });

    expect(Student.count.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-main'
    });
  });

  it('returns current-session, all-time, and unassigned counts in the school/branch scope', async () => {
    Student.count = jest.fn().mockResolvedValue(0);
    Student.findAll = jest.fn().mockResolvedValue([]);
    let payload;

    await controller.getStudentStats({
      user: { role: 'admin' },
      schoolId: 'school-1',
      query: {
        branch_id: 'branch-main',
        academic_year: '2026-2027',
        class_id: 'class-one',
        section_id: 'section-a'
      }
    }, { status: () => ({ json: body => { payload = body; } }) }, error => { throw error; });

    expect(payload.data).toMatchObject({
      current_academic_year: '2026-2027',
      current_session_total: 0,
      all_time_total: 0,
      unassigned_total: 0
    });
    const countWheres = Student.count.mock.calls.map(([query]) => query.where);
    expect(countWheres).toContainEqual(expect.objectContaining({
      school_id: 'school-1', branch_id: 'branch-main',
      status: 'active', academic_year: '2026-2027', class_id: { [Op.not]: null }
    }));
    expect(countWheres).toContainEqual(expect.objectContaining({
      school_id: 'school-1', branch_id: 'branch-main',
      status: { [Op.ne]: 'deleted' }
    }));
    expect(countWheres.some(where => where.class_id === 'class-one' && where.section_id === 'section-a')).toBe(true);
  });

  it('keeps Branch Admin student report and export in the assigned branch', async () => {
    Student.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    await controller.getStudentReport({
      user: { role: 'branch_admin', branch_id: 'branch-main' },
      schoolId: 'school-1',
      query: { branch_id: 'branch-second' }
    }, { status: () => ({ json: () => {} }) }, error => { throw error; });
    expect(Student.findAndCountAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-main'
    });

    Student.findAll = jest.fn().mockResolvedValue([]);
    const response = {
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      attachment: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    await controller.exportStudentReport({
      user: { role: 'branch_admin', branch_id: 'branch-main' },
      schoolId: 'school-1',
      query: { branch_id: 'branch-second' }
    }, response, error => { throw error; });
    expect(Student.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-main'
    });
  });

  it('filters student reports and exports by gender without widening branch scope', async () => {
    Student.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    await controller.getStudentReport({
      user: { role: 'branch_admin', branch_id: 'branch-main' },
      schoolId: 'school-1',
      query: {
        branch_id: 'branch-second', gender: 'female', stream_id: 'stream-1', category_id: 'category-1'
      }
    }, { status: () => ({ json: () => {} }) }, error => { throw error; });

    expect(Student.findAndCountAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-main', gender: 'female', stream_id: 'stream-1',
      category_id: 'category-1'
    });

    Student.findAll = jest.fn().mockResolvedValue([]);
    const response = {
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      attachment: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    await controller.exportStudentReport({
      user: { role: 'branch_admin', branch_id: 'branch-main' },
      schoolId: 'school-1',
      query: {
        branch_id: 'branch-second', gender: 'female', stream_id: 'stream-1', category_id: 'category-1'
      }
    }, response, error => { throw error; });

    expect(Student.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-main', gender: 'female', stream_id: 'stream-1',
      category_id: 'category-1'
    });
  });

  it('returns real gender counts from the selected school and branch', async () => {
    Student.count = jest.fn().mockResolvedValue(0);
    Student.findAll = jest.fn().mockResolvedValue([]);
    let payload;

    await controller.getStudentStats({
      user: { role: 'admin' },
      schoolId: 'school-1',
      query: {
        branch_id: 'branch-main',
        academic_year: '2026-2027',
        status: 'active',
        gender: 'female',
        stream_id: 'stream-1',
        category_id: 'category-1',
        from_date: '2026-01-01',
        to_date: '2026-06-30'
      }
    }, { status: () => ({ json: body => { payload = body; } }) }, error => { throw error; });

    const genderQuery = Student.findAll.mock.calls.find(([query]) =>
      query.attributes?.includes('gender')
    )[0];
    expect(genderQuery.where).toMatchObject({
      school_id: 'school-1',
      branch_id: 'branch-main',
      status: 'active',
      gender: 'female',
      stream_id: 'stream-1',
      category_id: 'category-1',
      admission_date: { [Op.gte]: new Date('2026-01-01'), [Op.lte]: new Date('2026-06-30') }
    });
    expect(payload.data.gender_distribution).toEqual([]);
  });

  it('does not let the student stats filter include deleted records', async () => {
    Student.count = jest.fn().mockResolvedValue(0);
    Student.findAll = jest.fn().mockResolvedValue([]);

    await controller.getStudentStats({
      user: { role: 'admin' },
      schoolId: 'school-1',
      query: { academic_year: '2026-2027', status: 'deleted' }
    }, { status: () => ({ json: () => {} }) }, error => { throw error; });

    const genderQuery = Student.findAll.mock.calls.find(([query]) =>
      query.attributes?.includes('gender')
    )[0];
    expect(genderQuery.where.status).toEqual({ [Op.ne]: 'deleted' });
    expect(Student.count.mock.calls.every(([query]) => query.where.status !== 'deleted')).toBe(true);
  });

  it('keeps deleted students out of report rows and CSV exports', async () => {
    Student.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    await controller.getStudentReport({
      user: { role: 'admin' },
      schoolId: 'school-1',
      query: { status: 'deleted' }
    }, { status: () => ({ json: () => {} }) }, error => { throw error; });

    expect(Student.findAndCountAll.mock.calls[0][0].where.status).toEqual({ [Op.ne]: 'deleted' });

    Student.findAll = jest.fn().mockResolvedValue([]);
    const response = {
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      attachment: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    await controller.exportStudentReport({
      user: { role: 'admin' },
      schoolId: 'school-1',
      query: { status: 'deleted' }
    }, response, error => { throw error; });

    expect(Student.findAll.mock.calls[0][0].where.status).toEqual({ [Op.ne]: 'deleted' });
  });

  it('keeps deleted students out of the general roster even when requested by status', async () => {
    Student.count = jest.fn().mockResolvedValue(0);
    Student.findAll = jest.fn().mockResolvedValue([]);

    await controller.getStudents({
      user: { role: 'admin' },
      schoolId: 'school-1',
      query: { status: 'deleted', category_id: 'category-1' }
    }, { status: () => ({ json: () => {} }) }, error => { throw error; });

    expect(Student.count.mock.calls[0][0].where).toMatchObject({
      status: { [Op.ne]: 'deleted' }, category_id: 'category-1'
    });
    expect(Student.findAll.mock.calls[0][0].where).toMatchObject({
      status: { [Op.ne]: 'deleted' }, category_id: 'category-1'
    });
  });

  it('returns sibling labels without crossing the Branch Admin assignment', async () => {
    FeeInvoice.findAll = jest.fn().mockResolvedValue([]);
    const student = {
      id: 'student-1',
      toJSON: () => ({ id: 'student-1', school_id: 'school-1', parents: [{ id: 'parent-1' }] })
    };
    const sibling = {
      id: 'student-2', school_id: 'school-1', first_name: 'Alex', last_name: 'Demo',
      current_class: 'Class 2', section: 'A'
    };
    Student.count = jest.fn().mockResolvedValue(1);
    Student.findAll = jest.fn().mockResolvedValueOnce([student]).mockResolvedValueOnce([sibling]);
    StudentParent.findAll = jest.fn().mockResolvedValue([
      { parent_id: 'parent-1', student_id: 'student-2' }
    ]);
    let result;

    await controller.getStudents({
      user: { role: 'branch_admin', branch_id: 'branch-main' },
      schoolId: 'school-1',
      query: {}
    }, { status: () => ({ json: body => { result = body; } }) }, error => { throw error; });

    expect(Student.findAll.mock.calls[1][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-main'
    });
    expect(result.data[0].siblings).toEqual([{
      id: 'student-2', first_name: 'Alex', last_name: 'Demo',
      current_class: 'Class 2', section: 'A'
    }]);
  });

  it('limits teacher roster sibling labels to assigned class scope and academic year', async () => {
    ClassTeacher.findAll = jest.fn().mockResolvedValue([
      { class_id: 'class-1', section_id: 'section-1', branch_id: 'branch-1' }
    ]);
    SubjectTeacher.findAll = jest.fn().mockResolvedValue([]);
    const student = {
      id: 'student-1',
      toJSON: () => ({ id: 'student-1', school_id: 'school-1', parents: [{ id: 'parent-1' }] })
    };
    Student.count = jest.fn().mockResolvedValue(1);
    Student.findAll = jest.fn().mockResolvedValueOnce([student]).mockResolvedValueOnce([]);
    StudentParent.findAll = jest.fn().mockResolvedValue([
      { parent_id: 'parent-1', student_id: 'student-2' }
    ]);

    await controller.getStudents({
      user: { id: 'teacher-1', role: 'teacher' },
      schoolId: 'school-1',
      query: { academic_year: '2026-2027' }
    }, { status: () => ({ json: () => {} }) }, error => { throw error; });

    const siblingWhere = Student.findAll.mock.calls[1][0].where;
    expect(siblingWhere).toMatchObject({ school_id: 'school-1', academic_year: '2026-2027' });
    expect(siblingWhere[Op.and]).toContainEqual({
      [Op.or]: [{ class_id: 'class-1', branch_id: 'branch-1', section_id: 'section-1' }]
    });
  });
});
