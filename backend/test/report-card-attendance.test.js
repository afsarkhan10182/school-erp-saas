require('module-alias/register');
const { Op } = require('sequelize');
const { AttendanceRecord, Student, Exam, ExamResult, ExamSchedule, ExamSubjectMark, GradingSystem } = require('../src/models');
const ReportCardService = require('../src/services/academic/report-card.service');

describe('report-card attendance', () => {
  const originalFindAll = AttendanceRecord.findAll;
  const originalStudentFindOne = Student.findOne;
  const originalExamFindAll = Exam.findAll;
  const originalExamResultFindAll = ExamResult.findAll;
  const originalScheduleFindAll = ExamSchedule.findAll;
  const originalSubjectMarkFindAll = ExamSubjectMark.findAll;
  const originalGradingSystemFindOne = GradingSystem.findOne;

  afterEach(() => {
    AttendanceRecord.findAll = originalFindAll;
    Student.findOne = originalStudentFindOne;
    Exam.findAll = originalExamFindAll;
    ExamResult.findAll = originalExamResultFindAll;
    ExamSchedule.findAll = originalScheduleFindAll;
    ExamSubjectMark.findAll = originalSubjectMarkFindAll;
    GradingSystem.findOne = originalGradingSystemFindOne;
    jest.clearAllMocks();
  });

  test('counts only published attendance within the student school, branch, and academic year', async () => {
    AttendanceRecord.findAll = jest.fn().mockResolvedValue([
      { status: 'present', record_count: '8' },
      { status: 'late', record_count: '1' },
      { status: 'absent', record_count: '2' },
      { status: 'excused', record_count: '1' }
    ]);

    const attendance = await new ReportCardService().getAttendanceData(
      { id: 'student-1', school_id: 'school-1', branch_id: 'branch-1' },
      '2026-2027'
    );

    expect(AttendanceRecord.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { student_id: 'student-1', school_id: 'school-1', branch_id: 'branch-1' },
        include: [
          expect.objectContaining({
            where: expect.objectContaining({
              school_id: 'school-1',
              branch_id: 'branch-1',
              status: 'published',
              [Op.or]: [{ academic_year: '2026-2027' }, { academic_year: null }]
            })
          })
        ]
      })
    );
    expect(attendance).toEqual({
      total_days: 12,
      present_days: 8,
      absent_days: 2,
      late_days: 1,
      excused_days: 1,
      attendance_percentage: (9 / 12) * 100,
      attended_days: 9
    });
  });

  test('returns no fabricated percentage when there are no published attendance records', async () => {
    AttendanceRecord.findAll = jest.fn().mockResolvedValue([]);

    const attendance = await new ReportCardService().getAttendanceData(
      { id: 'student-1', school_id: 'school-1', branch_id: 'branch-1' },
      '2026-2027'
    );

    expect(attendance.total_days).toBe(0);
    expect(attendance.attendance_percentage).toBeNull();
  });

  test('labels a result by its scheduled subject only when the exam has one distinct subject', async () => {
    Student.findOne = jest.fn().mockResolvedValue({
      class_id: 'class-1',
      section_id: 'section-1',
      school_id: 'school-1',
      branch_id: 'branch-1'
    });
    Exam.findAll = jest.fn().mockResolvedValue([
      {
        id: 'exam-1',
        max_marks: 100,
        schedules: [
          { id: 'schedule-1', exam_id: 'exam-1', class_id: 'class-1', section_id: 'section-1', subject_id: 'subject-1', total_marks: 50, subject: { id: 'subject-1', name: 'Mathematics' } },
          { id: 'schedule-2', exam_id: 'exam-1', class_id: 'class-1', section_id: 'section-1', subject_id: 'subject-1', total_marks: 50, subject: { id: 'subject-1', name: 'Mathematics' } }
        ]
      }
    ]);
    ExamResult.findAll = jest.fn().mockResolvedValue([
      { exam_id: 'exam-1', student_id: 'student-1', marks_obtained: 80, percentage: 80, exam: { name: 'First Term Examination' } }
    ]);
    ExamSubjectMark.findAll = jest.fn().mockResolvedValue([
      { exam_schedule_id: 'schedule-1', student_id: 'student-1', marks_obtained: 25 },
      { exam_schedule_id: 'schedule-2', student_id: 'student-1', marks_obtained: 40 }
    ]);
    GradingSystem.findOne = jest.fn().mockResolvedValue({ gradeScales: [
      { grade: 'A', min_percentage: 80, max_percentage: 100 },
      { grade: 'F', min_percentage: 0, max_percentage: 79.99 }
    ] });

    const report = await new ReportCardService().getAcademicData(
      'student-1',
      '2026-2027',
      null,
      { schoolId: 'school-1', branchId: 'branch-1' }
    );
    expect(report.results[0].exam.subject.name).toBe('Mathematics');
    expect(report.results[0].marks_obtained).toBe(65);
    expect(report.results[0].percentage).toBe(65);
    expect(report.results[0].grade).toBe('F');
    expect(ExamResult.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        student_id: 'student-1',
        school_id: 'school-1',
        branch_id: 'branch-1',
        exam_id: { [Op.in]: ['exam-1'] }
      })
    }));
    expect(Exam.findAll).toHaveBeenCalledWith(expect.objectContaining({
      include: [expect.objectContaining({
        as: 'schedules',
        where: expect.objectContaining({ school_id: 'school-1', branch_id: 'branch-1' }),
        include: [expect.objectContaining({ as: 'subject' })]
      })]
    }));

    Exam.findAll.mockResolvedValueOnce([
      {
        id: 'exam-1',
        schedules: [
          { subject_id: 'subject-1', subject: { id: 'subject-1', name: 'Mathematics' } },
          { subject_id: 'subject-2', subject: { id: 'subject-2', name: 'English' } }
        ]
      }
    ]);
    const ambiguousReport = await new ReportCardService().getAcademicData(
      'student-1',
      '2026-2027',
      null,
      { schoolId: 'school-1', branchId: 'branch-1' }
    );
    expect(ambiguousReport.results[0].exam.subject).toBeUndefined();
  });
});
