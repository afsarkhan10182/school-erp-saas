require('module-alias/register');
const fs = require('fs');
const os = require('os');
const path = require('path');
const XLSX = require('xlsx');

jest.mock('../src/models', () => ({
  Exam: { findOne: jest.fn() },
  ExamResult: { findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
  ExamSubjectMark: { findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
  ExamSchedule: { findOne: jest.fn(), count: jest.fn(), create: jest.fn() },
  Student: { findAll: jest.fn() },
  Class: {},
  Section: {},
  Subject: {},
  SubjectTeacher: { findOne: jest.fn() }
}));
jest.mock('../src/utils/shared/requestScope', () => ({
  resolveSchoolBranchScope: jest.fn().mockResolvedValue({ school_id: 'school-1', branch_id: 'branch-1' })
}));

const { Exam, ExamResult, ExamSchedule, ExamSubjectMark, Student, SubjectTeacher } = require('../src/models');
const { resolveSchoolBranchScope } = require('../src/utils/shared/requestScope');
const MarksEntryController = require('../src/controllers/academic/marks-entry/marks-entry.controller');

const req = (query = {}) => ({
  schoolId: 'school-1',
  branchId: 'branch-1',
  query: { exam_id: 'exam-1', class_id: 'class-1', section_id: 'section-1', subject_id: 'subject-1', ...query },
  user: { id: 'teacher-1', role: 'teacher', school_id: 'school-1', branch_id: 'branch-1' }
});
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() });

describe('marks entry school, branch, schedule, and teacher assignment scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveSchoolBranchScope.mockResolvedValue({ school_id: 'school-1', branch_id: 'branch-1' });
    Exam.findOne.mockResolvedValue({ id: 'exam-1', school_id: 'school-1', branch_id: 'branch-1', academic_year: '2026-2027', max_marks: 100 });
    ExamSchedule.findOne.mockResolvedValue({ id: 'schedule-1', theory_marks: 100, practical_marks: 0, viva_marks: 0, assignment_marks: 0, total_marks: 100, pass_marks: 40 });
    ExamSchedule.count.mockResolvedValue(1);
    SubjectTeacher.findOne.mockResolvedValue({ id: 'assignment-1' });
    Student.findAll.mockResolvedValue([{ id: 'student-1', first_name: 'A', last_name: 'Student', class: { name: 'Class 1' }, sectionInfo: { name: 'A' } }]);
    ExamSubjectMark.findAll.mockResolvedValue([]);
    ExamResult.findAll.mockResolvedValue([]);
  });

  it('loads only students for the exact scheduled subject and assigned teacher', async () => {
    const res = response();
    await MarksEntryController.getStudentsForMarksEntry(req({ branch_id: 'foreign-branch' }), res);

    expect(resolveSchoolBranchScope).toHaveBeenCalledWith(expect.any(Object), {
      branchRequired: true,
      lockAssignedBranch: true
    });
    expect(Exam.findOne).toHaveBeenCalledWith({
      where: { id: 'exam-1', school_id: 'school-1', branch_id: 'branch-1' }
    });
    expect(ExamSchedule.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({
        exam_id: 'exam-1', school_id: 'school-1', branch_id: 'branch-1',
        class_id: 'class-1', section_id: 'section-1', subject_id: 'subject-1'
      })
    });
    expect(SubjectTeacher.findOne).toHaveBeenCalled();
    expect(Student.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-1', class_id: 'class-1', section_id: 'section-1', status: 'active'
    });
    expect(ExamSubjectMark.findAll.mock.calls[0][0].where).toMatchObject({
      exam_schedule_id: 'schedule-1', school_id: 'school-1', branch_id: 'branch-1',
      student_id: { [require('sequelize').Op.in]: ['student-1'] }
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('shows legacy exam-wide marks only when the selected cohort has one scheduled subject', async () => {
    ExamResult.findAll.mockResolvedValue([{
      student_id: 'student-1', theory_marks_obtained: 86, practical_marks_obtained: null,
      viva_marks_obtained: null, assignment_marks_obtained: null, marks_obtained: 86, is_absent: false
    }]);
    const res = response();

    await MarksEntryController.getStudentsForMarksEntry(req(), res);

    expect(ExamResult.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ exam_id: 'exam-1', school_id: 'school-1', branch_id: 'branch-1' })
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        students: [expect.objectContaining({ existing_marks: expect.objectContaining({ marks_obtained: 86 }) })]
      })
    }));
  });

  it('does not attribute legacy exam-wide marks when the cohort has multiple scheduled subjects', async () => {
    ExamSchedule.count.mockResolvedValue(2);
    const res = response();

    await MarksEntryController.getStudentsForMarksEntry(req(), res);

    expect(ExamResult.findAll).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        students: [expect.objectContaining({ existing_marks: null })]
      })
    }));
  });

  it('does not create a schedule or load students when the selected subject is unscheduled', async () => {
    ExamSchedule.findOne.mockResolvedValue(null);
    const res = response();

    await MarksEntryController.getStudentsForMarksEntry(req(), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ExamSchedule.create).not.toHaveBeenCalled();
    expect(Student.findAll).not.toHaveBeenCalled();
  });

  it('denies teachers without the matching subject assignment', async () => {
    SubjectTeacher.findOne.mockResolvedValue(null);
    const res = response();

    await MarksEntryController.getStudentsForMarksEntry(req(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(Student.findAll).not.toHaveBeenCalled();
  });

  it('summarizes only the selected schedule and its scoped students', async () => {
    ExamSubjectMark.findAll.mockResolvedValue([{ student_id: 'student-1', is_absent: true }]);
    const res = response();

    await MarksEntryController.getMarksEntrySummary(req(), res);

    expect(ExamSubjectMark.findAll.mock.calls[0][0].where).toMatchObject({
      exam_schedule_id: 'schedule-1', school_id: 'school-1', branch_id: 'branch-1',
      student_id: { [require('sequelize').Op.in]: ['student-1'] }
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { total_students: 1, marks_entered: 1, absent_students: 1, pending: 0 }
    });
  });

  it('rejects saves containing students outside the scheduled class before writing results', async () => {
    Student.findAll.mockResolvedValue([]);
    const saveReq = {
      ...req(),
      body: {
        exam_id: 'exam-1', class_id: 'class-1', section_id: 'section-1', subject_id: 'subject-1', branch_id: 'branch-1',
        marks_data: [{ student_id: 'foreign-student', theory_marks_obtained: 50 }]
      }
    };
    const res = response();

    await MarksEntryController.saveMarks(saveReq, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ExamSubjectMark.findOne).not.toHaveBeenCalled();
    expect(ExamSubjectMark.create).not.toHaveBeenCalled();
    expect(ExamSubjectMark.update).not.toHaveBeenCalled();
  });

  it('rejects component marks above the exam schedule limit before writing results', async () => {
    const saveReq = {
      ...req(),
      body: {
        exam_id: 'exam-1', class_id: 'class-1', section_id: 'section-1', subject_id: 'subject-1', branch_id: 'branch-1',
        marks_data: [{ student_id: 'student-1', theory_marks_obtained: 101 }]
      }
    };
    const res = response();

    await MarksEntryController.saveMarks(saveReq, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ExamSubjectMark.findOne).not.toHaveBeenCalled();
    expect(ExamSubjectMark.create).not.toHaveBeenCalled();
    expect(ExamSubjectMark.update).not.toHaveBeenCalled();
  });

  it('saves valid marks under the resolved school and branch scope', async () => {
    ExamSubjectMark.findOne.mockResolvedValue(null);
    ExamSubjectMark.create.mockResolvedValue({ id: 'subject-mark-1' });
    const saveReq = {
      ...req(),
      body: {
        exam_id: 'exam-1', class_id: 'class-1', section_id: 'section-1', subject_id: 'subject-1', branch_id: 'branch-1',
        marks_data: [{ student_id: 'student-1', theory_marks_obtained: 86 }]
      }
    };
    const res = response();

    await MarksEntryController.saveMarks(saveReq, res);

    expect(ExamSubjectMark.create).toHaveBeenCalledWith(expect.objectContaining({
      exam_schedule_id: 'schedule-1', student_id: 'student-1', theory_marks_obtained: 86,
      marks_obtained: 86, school_id: 'school-1', branch_id: 'branch-1'
    }));
    expect(ExamResult.create).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('previews a subject-scoped spreadsheet and never writes marks', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'marks-preview-'));
    const filePath = path.join(directory, 'marks.xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
      'Admission Number': 'ADM-1', theory_marks: 86, 'Is Absent': false
    }]), 'Marks Entry');
    XLSX.writeFile(workbook, filePath);
    Student.findAll.mockResolvedValue([{
      id: 'student-1', first_name: 'A', last_name: 'Student', admission_number: 'ADM-1', roll_number: '1'
    }]);
    const importReq = {
      ...req(),
      body: { exam_id: 'exam-1', class_id: 'class-1', section_id: 'section-1', subject_id: 'subject-1', branch_id: 'branch-1' },
      file: { path: filePath }
    };
    const res = response();

    await MarksEntryController.previewMarksImport(importReq, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        records: [{
          student_id: 'student-1', theory_marks_obtained: 86,
          practical_marks_obtained: 0, viva_marks_obtained: 0,
          assignment_marks_obtained: 0, is_absent: false
        }],
        errors: [], total_rows: 1
      }
    });
    expect(ExamSubjectMark.create).not.toHaveBeenCalled();
    expect(fs.existsSync(filePath)).toBe(false);
    fs.rmSync(directory, { recursive: true, force: true });
  });
});
