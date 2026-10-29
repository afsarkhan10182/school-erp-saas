const {
  completeSubjectMarkRollups,
  resultKey
} = require('../src/utils/academic/completeSubjectMarkRollups');

const exam = { id: 'exam-1', max_marks: 100 };
const student = { id: 'student-1', class_id: 'class-1', section_id: 'section-1' };
const schedules = [
  {
    id: 'schedule-1',
    exam_id: 'exam-1',
    class_id: 'class-1',
    section_id: 'section-1',
    total_marks: 50
  },
  {
    id: 'schedule-2',
    exam_id: 'exam-1',
    class_id: 'class-1',
    section_id: 'section-1',
    total_marks: 50
  }
];

describe('complete scheduled subject-mark rollups', () => {
  it('normalizes complete subject totals to the configured exam maximum', () => {
    const results = completeSubjectMarkRollups({
      exams: [exam],
      students: [student],
      schedules,
      subjectMarks: [
        {
          exam_schedule_id: 'schedule-1',
          student_id: 'student-1',
          marks_obtained: 25,
          theory_marks_obtained: 25
        },
        {
          exam_schedule_id: 'schedule-2',
          student_id: 'student-1',
          marks_obtained: 40,
          practical_marks_obtained: 40
        }
      ],
      examResults: []
    });

    expect(results.get(resultKey('student-1', 'exam-1'))).toMatchObject({
      marks_obtained: 65,
      percentage: 65,
      theory_marks_obtained: 25,
      practical_marks_obtained: 40,
      is_absent: false,
      is_subject_rollup: true
    });
  });

  it('keeps an existing exam aggregate while any scheduled subject is still missing', () => {
    const legacy = {
      student_id: 'student-1',
      exam_id: 'exam-1',
      marks_obtained: 82,
      percentage: 82
    };
    const results = completeSubjectMarkRollups({
      exams: [exam],
      students: [student],
      schedules,
      subjectMarks: [
        { exam_schedule_id: 'schedule-1', student_id: 'student-1', marks_obtained: 25 }
      ],
      examResults: [legacy]
    });

    expect(results.get(resultKey('student-1', 'exam-1'))).toBe(legacy);
  });

  it('does not emit an aggregate for an impossible score or another cohort', () => {
    const results = completeSubjectMarkRollups({
      exams: [exam],
      students: [student],
      schedules: [...schedules, { ...schedules[0], id: 'other-cohort', section_id: 'section-2' }],
      subjectMarks: [
        { exam_schedule_id: 'schedule-1', student_id: 'student-1', marks_obtained: 51 },
        { exam_schedule_id: 'schedule-2', student_id: 'student-1', marks_obtained: 50 }
      ],
      examResults: []
    });

    expect(results.has(resultKey('student-1', 'exam-1'))).toBe(false);
  });
});
