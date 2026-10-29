const resultKey = (studentId, examId) => `${studentId}:${examId}`;
const scheduleMatchesStudent = (schedule, student) =>
  schedule.class_id === student.class_id &&
  (schedule.section_id == null || schedule.section_id === (student.section_id || null));

const roundMarks = value => Math.round((value + Number.EPSILON) * 100) / 100;

const completeSubjectMarkRollups = ({ exams, students, schedules, subjectMarks, examResults }) => {
  const examsById = new Map(exams.map(exam => [exam.id, exam]));
  const marksByScheduleStudent = new Map(
    subjectMarks.map(mark => [resultKey(mark.student_id, mark.exam_schedule_id), mark])
  );
  const results = new Map(
    examResults.map(result => [resultKey(result.student_id, result.exam_id), result])
  );

  for (const student of students) {
    const cohortExams = new Set(
      schedules
        .filter(
          schedule =>
            scheduleMatchesStudent(schedule, student)
        )
        .map(schedule => schedule.exam_id)
    );

    for (const examId of cohortExams) {
      const examSchedules = schedules.filter(
        schedule =>
          schedule.exam_id === examId &&
          scheduleMatchesStudent(schedule, student)
      );
      const marks = examSchedules.map(schedule =>
        marksByScheduleStudent.get(resultKey(student.id, schedule.id))
      );
      if (marks.some(mark => !mark)) continue;

      const maxMarks = examSchedules.reduce(
        (sum, schedule) => sum + Number(schedule.total_marks || 0),
        0
      );
      const earnedMarks = marks.reduce((sum, mark) => sum + Number(mark.marks_obtained || 0), 0);
      const exam = examsById.get(examId);
      if (!exam || maxMarks <= 0 || earnedMarks < 0 || earnedMarks > maxMarks) continue;

      const percentage = roundMarks((earnedMarks / maxMarks) * 100);
      const examMaximum = Number(exam.max_marks) || 100;
      const priorResult = results.get(resultKey(student.id, examId));
      results.set(resultKey(student.id, examId), {
        ...(priorResult?.toJSON ? priorResult.toJSON() : priorResult || {}),
        rank: null,
        exam_id: examId,
        student_id: student.id,
        exam,
        marks_obtained: roundMarks((percentage / 100) * examMaximum),
        percentage,
        grade: null,
        is_absent: marks.every(mark => mark.is_absent),
        theory_marks_obtained: roundMarks(
          marks.reduce((sum, mark) => sum + Number(mark.theory_marks_obtained || 0), 0)
        ),
        practical_marks_obtained: roundMarks(
          marks.reduce((sum, mark) => sum + Number(mark.practical_marks_obtained || 0), 0)
        ),
        viva_marks_obtained: roundMarks(
          marks.reduce((sum, mark) => sum + Number(mark.viva_marks_obtained || 0), 0)
        ),
        assignment_marks_obtained: roundMarks(
          marks.reduce((sum, mark) => sum + Number(mark.assignment_marks_obtained || 0), 0)
        ),
        is_subject_rollup: true
      });
    }
  }

  return results;
};

module.exports = { completeSubjectMarkRollups, resultKey };
