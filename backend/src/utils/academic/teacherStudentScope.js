const { ClassTeacher, SubjectTeacher } = require('~/models');
const { Op } = require('sequelize');

const getTeacherStudentWhere = async ({ teacherId, schoolId, academicYear }) => {
  if (!teacherId || !schoolId || !academicYear) return { id: { [Op.is]: null } };

  const assignmentWhere = { teacher_id: teacherId, school_id: schoolId, academic_year: academicYear };
  const [classAssignments, subjectAssignments] = await Promise.all([
    ClassTeacher.findAll({
      where: { ...assignmentWhere, is_active: true },
      attributes: ['class_id', 'section_id', 'stream_id', 'branch_id']
    }),
    SubjectTeacher.findAll({
      where: assignmentWhere,
      attributes: ['class_id', 'section_id', 'stream_id', 'branch_id']
    })
  ]);

  const assignments = [...classAssignments, ...subjectAssignments]
    .filter(assignment => assignment.class_id && assignment.branch_id)
    .map(assignment => ({
      class_id: assignment.class_id,
      branch_id: assignment.branch_id,
      ...(assignment.section_id && { section_id: assignment.section_id }),
      ...(assignment.stream_id && { stream_id: assignment.stream_id })
    }));

  return assignments.length ? { [Op.or]: assignments } : { id: { [Op.is]: null } };
};

module.exports = { getTeacherStudentWhere };
