require('module-alias/register');
const {
  getStudentsForReportCards
} = require('../src/controllers/academic/exam-reports/exam-reports.controller');
const { Exam, ExamResult, ExamSchedule, ExamSubjectMark, Student, StudentPromotion, Class } = require('../src/models');
const ReportCardService = require('../src/services/academic/report-card.service');
const { Op } = require('sequelize');

describe('Report-card student lookup scope', () => {
  const originals = [Exam.findOne, ExamResult.findAll, ExamSchedule.findAll, ExamSubjectMark.findAll, Student.findAll, StudentPromotion.findAll, Class.findOne];
  const originalGetGradingSystem = ReportCardService.prototype.getGradingSystem;

  afterEach(() => {
    [Exam.findOne, ExamResult.findAll, ExamSchedule.findAll, ExamSubjectMark.findAll, Student.findAll, StudentPromotion.findAll, Class.findOne] = originals;
    ReportCardService.prototype.getGradingSystem = originalGetGradingSystem;
  });

  it('uses selected school scope while allowing all of its branches', async () => {
    const schoolId = 's0000000-0000-0000-0000-000000000001';
    const studentId = 'u0000000-0000-0000-0000-000000000001';
    Exam.findOne = jest.fn().mockResolvedValue({ id: 'exam-1' });
    Student.findAll = jest.fn().mockResolvedValue([
      {
        id: studentId,
        first_name: 'Demo',
        last_name: 'Student',
        class: { name: 'Class 1' },
        sectionInfo: { name: 'A' }
      }
    ]);
    ExamResult.findAll = jest.fn().mockResolvedValue([]);
    ExamSchedule.findAll = jest.fn().mockResolvedValue([]);
    ExamSubjectMark.findAll = jest.fn().mockResolvedValue([]);
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getStudentsForReportCards(
      {
        query: {
          exam_id: 'exam-1',
          class_id: 'class-1',
          school_id: 'untrusted-query-school',
          branch_id: 'untrusted-query-branch'
        },
        user: { role: 'admin', school_id: schoolId },
        schoolId,
        branchId: undefined
      },
      res
    );

    expect(Exam.findOne.mock.calls[0][0].where).toEqual({ id: 'exam-1', school_id: schoolId });
    expect(Student.findAll.mock.calls[0][0].where).toEqual({
      class_id: 'class-1',
      school_id: schoolId,
      status: 'active'
    });
    expect(ExamResult.findAll.mock.calls[0][0].where).toEqual({
      exam_id: { [Op.in]: ['exam-1'] },
      school_id: schoolId,
      student_id: { [Op.in]: [studentId] }
    });
  });

  it('uses complete subject marks instead of a stale exam aggregate in marksheet lookup', async () => {
    const schoolId = 's0000000-0000-0000-0000-000000000001';
    const studentId = 'u0000000-0000-0000-000000000001';
    Exam.findOne = jest.fn().mockResolvedValue({ id: 'exam-1', max_marks: 100 });
    Student.findAll = jest.fn().mockResolvedValue([{
      id: studentId,
      class_id: 'class-1',
      section_id: 'section-1',
      first_name: 'Demo',
      last_name: 'Student',
      class: { name: 'Class 1' },
      sectionInfo: { name: 'A' }
    }]);
    ExamResult.findAll = jest.fn().mockResolvedValue([{
      student_id: studentId, exam_id: 'exam-1', marks_obtained: 80, percentage: 80
    }]);
    ExamSchedule.findAll = jest.fn().mockResolvedValue([
      { id: 'schedule-1', exam_id: 'exam-1', class_id: 'class-1', section_id: 'section-1', total_marks: 50 },
      { id: 'schedule-2', exam_id: 'exam-1', class_id: 'class-1', section_id: 'section-1', total_marks: 50 }
    ]);
    ExamSubjectMark.findAll = jest.fn().mockResolvedValue([
      { exam_schedule_id: 'schedule-1', student_id: studentId, marks_obtained: 25 },
      { exam_schedule_id: 'schedule-2', student_id: studentId, marks_obtained: 40 }
    ]);
    ReportCardService.prototype.getGradingSystem = jest.fn().mockResolvedValue({
      gradeScales: [
        { grade: 'A', min_percentage: 80, max_percentage: 100 },
        { grade: 'B', min_percentage: 0, max_percentage: 79 }
      ]
    });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getStudentsForReportCards({
      query: { exam_id: 'exam-1', class_id: 'class-1', section_id: 'section-1' },
      user: { role: 'admin', school_id: schoolId }, schoolId, branchId: undefined
    }, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [expect.objectContaining({ id: studentId, total_marks: 65, grade: 'B' })]
    });
  });

  it('does not assign a grade when the student has no percentage', async () => {
    const schoolId = 's0000000-0000-0000-0000-000000000001';
    const studentId = 'u0000000-0000-0000-000000000001';
    Exam.findOne = jest.fn().mockResolvedValue({ id: 'exam-1', max_marks: 100 });
    Student.findAll = jest.fn().mockResolvedValue([{
      id: studentId,
      class_id: 'class-1',
      first_name: 'Demo',
      last_name: 'Student'
    }]);
    ExamResult.findAll = jest.fn().mockResolvedValue([{
      student_id: studentId, exam_id: 'exam-1', marks_obtained: null, percentage: null, grade: null
    }]);
    ExamSchedule.findAll = jest.fn().mockResolvedValue([]);
    ExamSubjectMark.findAll = jest.fn().mockResolvedValue([]);
    ReportCardService.prototype.getGradingSystem = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getStudentsForReportCards({
      query: { exam_id: 'exam-1', class_id: 'class-1' },
      user: { role: 'admin', school_id: schoolId }, schoolId, branchId: undefined
    }, res);

    expect(ReportCardService.prototype.getGradingSystem).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [expect.objectContaining({ id: studentId, grade: null })]
    });
  });

  it('includes only promoted students from the selected exam-year class and resolves marks against that class', async () => {
    const schoolId = 's0000000-0000-0000-0000-000000000001';
    const studentId = 'u0000000-0000-0000-0000-000000000001';
    Exam.findOne = jest.fn().mockResolvedValue({ id: 'exam-1', academic_year: '2025-2026', max_marks: 100 });
    Class.findOne = jest.fn().mockResolvedValue({ id: 'exam-class', branch_id: 'branch-1' });
    StudentPromotion.findAll = jest.fn().mockResolvedValue([{ student_id: studentId }]);
    Student.findAll = jest.fn().mockResolvedValue([{
      id: studentId,
      class_id: 'next-class',
      section_id: 'next-section',
      first_name: 'Demo',
      last_name: 'Student',
      class: { name: 'Class 2' },
      sectionInfo: { name: 'B' }
    }]);
    ExamResult.findAll = jest.fn().mockResolvedValue([]);
    ExamSchedule.findAll = jest.fn().mockResolvedValue([]);
    ExamSubjectMark.findAll = jest.fn().mockResolvedValue([]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getStudentsForReportCards({
      query: {
        exam_id: 'exam-1', class_id: 'exam-class', section_id: 'exam-section',
        enrollment_scope: 'full_register'
      },
      user: { role: 'admin', school_id: schoolId }, schoolId, branchId: undefined
    }, res);

    expect(StudentPromotion.findAll.mock.calls[0][0].where).toEqual({
      from_class_id: 'exam-class',
      from_academic_year: '2025-2026',
      action: 'promote',
      school_id: schoolId,
      branch_id: 'branch-1',
      from_section_id: 'exam-section'
    });
    expect(Student.findAll.mock.calls[0][0].where[Op.or]).toEqual([
      { class_id: 'exam-class', section_id: 'exam-section' },
      { id: { [Op.in]: [studentId] } }
    ]);
    expect(ExamSchedule.findAll.mock.calls[0][0].where.class_id[Op.in]).toEqual(['exam-class']);
    expect(res.json.mock.calls[0][0].data[0]).toMatchObject({
      id: studentId,
      is_promoted_since_exam: true
    });
  });

  it('requires a selected school for platform-wide requests', async () => {
    Exam.findOne = jest.fn();
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getStudentsForReportCards(
      {
        query: { exam_id: 'exam-1', class_id: 'class-1' },
        user: { role: 'super_admin' }
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Exam.findOne).not.toHaveBeenCalled();
  });

  it('keeps the exam lookup inside a selected branch', async () => {
    const schoolId = 's0000000-0000-0000-0000-000000000001';
    const branchId = 'b0000000-0000-0000-0000-000000000001';
    Exam.findOne = jest.fn().mockResolvedValue(null);
    Student.findAll = jest.fn();
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getStudentsForReportCards(
      {
        query: { exam_id: 'exam-1', class_id: 'class-1' },
        user: { role: 'admin', school_id: schoolId },
        schoolId,
        branchId
      },
      res
    );

    expect(Exam.findOne).toHaveBeenCalledWith({
      where: { id: 'exam-1', school_id: schoolId, branch_id: branchId }
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(Student.findAll).not.toHaveBeenCalled();
  });
});
