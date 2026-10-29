const { Op } = require('sequelize');
const { ExamResult, ExamSchedule, ExamSubjectMark } = require('~/models');
const { completeSubjectMarkRollups } = require('~/utils/academic/completeSubjectMarkRollups');

const getResolvedExamResults = async ({ exams, students, schoolId, branchId }) => {
  if (!students.length || !exams.length) return new Map();
  const studentIds = students.map(student => student.id);
  const examIds = exams.map(exam => exam.id);
  const [examResults, schedules] = await Promise.all([
    ExamResult.findAll({
      where: {
        exam_id: { [Op.in]: examIds },
        school_id: schoolId,
        ...(branchId && { branch_id: branchId }),
        student_id: { [Op.in]: studentIds }
      }
    }),
    ExamSchedule.findAll({
      where: {
        exam_id: { [Op.in]: examIds },
        school_id: schoolId,
        ...(branchId && { branch_id: branchId }),
        class_id: { [Op.in]: [...new Set(students.map(student => student.class_id))] },
        subject_id: { [Op.ne]: null },
        is_active: true,
        status: { [Op.ne]: 'cancelled' }
      }
    })
  ]);
  const subjectMarks = schedules.length
    ? await ExamSubjectMark.findAll({
        where: {
          exam_schedule_id: { [Op.in]: schedules.map(schedule => schedule.id) },
          school_id: schoolId,
          ...(branchId && { branch_id: branchId }),
          student_id: { [Op.in]: studentIds }
        }
      })
    : [];

  return completeSubjectMarkRollups({ exams, students, schedules, subjectMarks, examResults });
};

module.exports = { getResolvedExamResults };
