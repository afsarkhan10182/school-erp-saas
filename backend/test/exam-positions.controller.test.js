require('module-alias/register');
const models = require('../src/models');
const controller = require('../src/controllers/academic/exam-positions/exam-positions.controller');

describe('Exam positions school and branch scope', () => {
  const modelMethods = [
    [models.Class, 'findOne'],
    [models.Exam, 'findOne'],
    [models.GradingSystem, 'findOne'],
    [models.Section, 'findOne'],
    [models.ClassTeacher, 'findOne'],
    [models.SubjectTeacher, 'findOne'],
    [models.Student, 'findAll'],
    [models.ExamResult, 'findAll'],
    [models.ExamSchedule, 'findAll'],
    [models.ExamSubjectMark, 'findAll'],
    [models.ExamPosition, 'findAll'],
    [models.ExamPosition, 'findOne'],
    [models.ExamPosition, 'create']
  ];
  const originals = modelMethods.map(([model, method]) => [model, method, model[method]]);

  afterEach(() => {
    for (const [model, method, original] of originals) model[method] = original;
  });

  const invoke = async (action, req) => {
    let payload;
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        payload = body;
        return this;
      }
    };
    await action(req, res);
    return { status: res.statusCode, payload };
  };

  const adminRequest = (query = {}, body = {}) => ({
    user: { id: 'admin', role: 'admin', school_id: 'school', branch_id: 'main' },
    schoolId: 'school',
    query,
    body
  });

  const setSecondBranchClass = () => {
    models.Class.findOne = jest.fn().mockResolvedValue({
      id: 'class-second',
      school_id: 'school',
      branch_id: 'second'
    });
    models.Exam.findOne = jest.fn().mockResolvedValue({ id: 'exam' });
    models.GradingSystem.findOne = jest.fn().mockResolvedValue(null);
    models.Section.findOne = jest.fn().mockResolvedValue({ id: 'section-second' });
    models.ExamSchedule.findAll = jest.fn().mockResolvedValue([]);
    models.ExamSubjectMark.findAll = jest.fn().mockResolvedValue([]);
  };

  it('loads a second-branch class under School Admin All Branches, not the login branch', async () => {
    setSecondBranchClass();
    models.Student.findAll = jest.fn().mockResolvedValue([
      { id: 'student-second', first_name: 'Riya', class: { name: 'Class 2' }, sectionInfo: { name: 'A' } }
    ]);
    models.ExamResult.findAll = jest.fn().mockResolvedValue([
      { student_id: 'student-second', marks_obtained: 88, percentage: 88, grade: 'A' }
    ]);
    models.ExamPosition.findAll = jest.fn().mockResolvedValue([]);

    const result = await invoke(controller.getStudentsForPositions, adminRequest({
      exam_id: 'exam', class_id: 'class-second', section_id: 'section-second'
    }));

    expect(result.status).toBe(200);
    expect(models.Student.findAll.mock.calls[0][0].where).toMatchObject({
      class_id: 'class-second', school_id: 'school', branch_id: 'second', section_id: 'section-second'
    });
    expect(models.ExamResult.findAll.mock.calls[0][0].where.branch_id).toBe('second');
    expect(result.payload.data[0]).toMatchObject({ id: 'student-second', position: 1, total_marks: 88 });
  });

  it('returns position stats scoped to the selected class branch', async () => {
    setSecondBranchClass();
    models.Student.findAll = jest.fn().mockResolvedValue([{ id: 'student-second' }]);
    models.ExamPosition.findAll = jest.fn().mockResolvedValue([
      { is_passed: true, percentage: 90 },
      { is_passed: false, percentage: 50 }
    ]);

    const result = await invoke(controller.getPositionStats, adminRequest({
      exam_id: 'exam', class_id: 'class-second'
    }));

    expect(result.payload.data).toEqual({
      total: 2, passed: 1, failed: 1, pass_rate: 50, average_percentage: 70
    });
    expect(models.ExamPosition.findAll.mock.calls[0][0].where).toMatchObject({
      exam_id: 'exam', school_id: 'school', branch_id: 'second'
    });
  });

  it('calculates rankings from results in the selected class branch', async () => {
    setSecondBranchClass();
    models.Student.findAll = jest.fn().mockResolvedValue([
      { id: 'student-low', roll_number: '1' },
      { id: 'student-high', roll_number: '2' }
    ]);
    models.ExamResult.findAll = jest.fn().mockResolvedValue([
      { student_id: 'student-low', marks_obtained: 65, percentage: 65, grade: 'B' },
      { student_id: 'student-high', marks_obtained: 92, percentage: 92, grade: 'A' }
    ]);

    const result = await invoke(controller.calculatePositions, adminRequest({}, {
      exam_id: 'exam', class_id: 'class-second', calculation_method: 'total_marks'
    }));

    expect(result.status).toBe(200);
    expect(models.ExamResult.findAll.mock.calls[0][0].where.branch_id).toBe('second');
    expect(result.payload.data.map(row => [row.student_id, row.position])).toEqual([
      ['student-high', 1], ['student-low', 2]
    ]);
  });

  it('ranks from complete subject marks instead of a stale exam aggregate', async () => {
    setSecondBranchClass();
    models.Student.findAll = jest.fn().mockResolvedValue([
      { id: 'student-low', class_id: 'class-second', section_id: 'section-second', roll_number: '1' },
      { id: 'student-high', class_id: 'class-second', section_id: 'section-second', roll_number: '2' }
    ]);
    models.ExamResult.findAll = jest.fn().mockResolvedValue([
      { exam_id: 'exam', student_id: 'student-low', marks_obtained: 90, percentage: 90 },
      { exam_id: 'exam', student_id: 'student-high', marks_obtained: 40, percentage: 40 }
    ]);
    models.ExamSchedule.findAll = jest.fn().mockResolvedValue([
      { id: 's1', exam_id: 'exam', class_id: 'class-second', section_id: 'section-second', total_marks: 50 },
      { id: 's2', exam_id: 'exam', class_id: 'class-second', section_id: 'section-second', total_marks: 50 }
    ]);
    models.ExamSubjectMark.findAll = jest.fn().mockResolvedValue([
      { exam_schedule_id: 's1', student_id: 'student-low', marks_obtained: 20 },
      { exam_schedule_id: 's2', student_id: 'student-low', marks_obtained: 20 },
      { exam_schedule_id: 's1', student_id: 'student-high', marks_obtained: 40 },
      { exam_schedule_id: 's2', student_id: 'student-high', marks_obtained: 40 }
    ]);

    const result = await invoke(controller.calculatePositions, adminRequest({}, {
      exam_id: 'exam', class_id: 'class-second', calculation_method: 'total_marks'
    }));

    expect(result.status).toBe(200);
    expect(result.payload.data.map(row => [row.student_id, row.position, row.marks])).toEqual([
      ['student-high', 1, 80], ['student-low', 2, 40]
    ]);
  });

  it('shows the resolved subject total in the position roster', async () => {
    setSecondBranchClass();
    models.Student.findAll = jest.fn().mockResolvedValue([{
      id: 'student-second', class_id: 'class-second', section_id: 'section-second',
      first_name: 'Riya', class: { name: 'Class 2' }, sectionInfo: { name: 'A' }
    }]);
    models.ExamResult.findAll = jest.fn().mockResolvedValue([
      { exam_id: 'exam', student_id: 'student-second', marks_obtained: 90, percentage: 90 }
    ]);
    models.ExamSchedule.findAll = jest.fn().mockResolvedValue([
      { id: 's1', exam_id: 'exam', class_id: 'class-second', section_id: null, total_marks: 100 }
    ]);
    models.ExamSubjectMark.findAll = jest.fn().mockResolvedValue([
      { exam_schedule_id: 's1', student_id: 'student-second', marks_obtained: 55 }
    ]);
    models.ExamPosition.findAll = jest.fn().mockResolvedValue([]);

    const result = await invoke(controller.getStudentsForPositions, adminRequest({
      exam_id: 'exam', class_id: 'class-second', section_id: 'section-second'
    }));

    expect(result.status).toBe(200);
    expect(result.payload.data[0]).toMatchObject({ total_marks: 55, percentage: 55, grade: 'C+' });
  });

  it('saves only students from the selected class and writes their actual branch', async () => {
    setSecondBranchClass();
    models.Student.findAll = jest.fn().mockResolvedValue([{ id: 'student-second' }]);
    models.ExamResult.findAll = jest.fn().mockResolvedValue([
      { student_id: 'student-second', marks_obtained: 88, percentage: 88, grade: 'A' }
    ]);
    models.ExamPosition.findOne = jest.fn().mockResolvedValue(null);
    models.ExamPosition.create = jest.fn().mockImplementation(async data => ({
      ...data,
      id: 'position',
      reload: jest.fn()
    }));

    const result = await invoke(controller.savePositions, adminRequest({}, {
      exam_id: 'exam',
      class_id: 'class-second',
      positions: [
        { student_id: 'student-second', position: 1 },
        { student_id: 'student-main', position: 2 }
      ]
    }));

    expect(result.status).toBe(200);
    expect(models.ExamPosition.create).toHaveBeenCalledTimes(1);
    expect(models.ExamPosition.create.mock.calls[0][0]).toMatchObject({
      student_id: 'student-second', school_id: 'school', branch_id: 'second'
    });
    expect(result.payload.data.errors).toEqual([
      { student_id: 'student-main', error: 'Exam result not found for this student' }
    ]);
  });

  it('saves the configured grade and pass state for derived subject totals', async () => {
    setSecondBranchClass();
    models.Student.findAll = jest.fn().mockResolvedValue([
      { id: 'student-second', class_id: 'class-second', section_id: 'section-second' }
    ]);
    models.ExamResult.findAll = jest.fn().mockResolvedValue([]);
    models.ExamSchedule.findAll = jest.fn().mockResolvedValue([
      { id: 's1', exam_id: 'exam', class_id: 'class-second', section_id: 'section-second', total_marks: 100 }
    ]);
    models.ExamSubjectMark.findAll = jest.fn().mockResolvedValue([
      { exam_schedule_id: 's1', student_id: 'student-second', marks_obtained: 55 }
    ]);
    models.GradingSystem.findOne = jest.fn().mockResolvedValue({
      gradeScales: [{ grade: 'S', min_percentage: 50, max_percentage: 59, grade_points: 1, is_passing: false }],
      passing_percentage: 50
    });
    models.ExamPosition.findOne = jest.fn().mockResolvedValue(null);
    models.ExamPosition.create = jest.fn().mockImplementation(async data => ({
      ...data, id: 'position', reload: jest.fn()
    }));

    const result = await invoke(controller.savePositions, adminRequest({}, {
      exam_id: 'exam', class_id: 'class-second', positions: [{ student_id: 'student-second', position: 1 }]
    }));

    expect(result.status).toBe(200);
    expect(models.ExamPosition.create.mock.calls[0][0]).toMatchObject({
      total_marks: 55, percentage: 55, grade: 'S', is_passed: false
    });
  });

  it('denies teachers who are not assigned to the selected class', async () => {
    setSecondBranchClass();
    models.ClassTeacher.findOne = jest.fn().mockResolvedValue(null);
    models.SubjectTeacher.findOne = jest.fn().mockResolvedValue(null);
    models.Student.findAll = jest.fn();

    const result = await invoke(controller.getStudentsForPositions, {
      user: { id: 'teacher', role: 'teacher', school_id: 'school', branch_id: 'second' },
      schoolId: 'school', branchId: 'second',
      query: { exam_id: 'exam', class_id: 'class-second' }
    });

    expect(result.status).toBe(403);
    expect(models.Exam.findOne).not.toHaveBeenCalled();
    expect(models.Student.findAll).not.toHaveBeenCalled();
  });

  it('does not resolve a class outside a Branch Admin assigned branch', async () => {
    models.Class.findOne = jest.fn().mockResolvedValue(null);
    models.Student.findAll = jest.fn();

    const result = await invoke(controller.getStudentsForPositions, {
      user: { id: 'branch-admin', role: 'branch_admin', school_id: 'school', branch_id: 'main' },
      schoolId: 'school', branchId: 'main',
      query: { exam_id: 'exam', class_id: 'class-second' }
    });

    expect(result.status).toBe(404);
    expect(models.Class.findOne.mock.calls[0][0].where).toMatchObject({ branch_id: 'main' });
    expect(models.Student.findAll).not.toHaveBeenCalled();
  });
});
