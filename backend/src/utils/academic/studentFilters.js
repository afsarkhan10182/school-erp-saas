const { Op } = require('sequelize');
const { sequelize } = require('~/config/database');
const ApiError = require('~/utils/shared/ApiError');
const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');

const appendStudentCondition = (whereClause, condition) => {
  const existing = whereClause[Op.and];
  whereClause[Op.and] = [...(Array.isArray(existing) ? existing : existing ? [existing] : []), condition];
};

const getStudentIdsWithSiblings = async schoolId => {
  const { Student, StudentParent, Parent } = require('~/models');
  const sharedParents = await StudentParent.findAll({
    attributes: ['parent_id'],
    include: [
      {
        model: Parent,
        as: 'parent',
        attributes: [],
        where: { school_id: schoolId },
        required: true
      }
    ],
    group: ['StudentParent.parent_id'],
    having: sequelize.literal('COUNT(DISTINCT "StudentParent"."student_id") > 1'),
    raw: true
  });
  const parentIds = sharedParents.map(row => row.parent_id);
  if (!parentIds.length) return [];

  const links = await StudentParent.findAll({
    attributes: ['student_id'],
    where: { parent_id: { [Op.in]: parentIds } },
    include: [
      {
        model: Student,
        as: 'student',
        attributes: [],
        where: { school_id: schoolId },
        required: true
      }
    ],
    raw: true
  });
  return [...new Set(links.map(row => row.student_id))];
};

const applySiblingFilter = async (whereClause, filter) => {
  if (!['yes', 'no'].includes(filter) || !whereClause.school_id) return;
  const studentIds = await getStudentIdsWithSiblings(whereClause.school_id);
  if (filter === 'yes') {
    whereClause.id = studentIds.length ? { [Op.in]: studentIds } : { [Op.is]: null };
  } else if (studentIds.length) {
    whereClause.id = { [Op.notIn]: studentIds };
  }
};

const applyEnrollmentFilter = async (whereClause, filter, academicYear) => {
  if (!['currently_studying', 'full_register', 'unassigned'].includes(filter)) return;
  if (filter === 'full_register') {
    delete whereClause.academic_year;
    appendStudentCondition(whereClause, { status: { [Op.ne]: 'deleted' } });
    return;
  }
  if (!whereClause.school_id) {
    throw new ApiError(400, 'A school is required for enrollment filtering');
  }

  const year = academicYear || (await getCurrentAcademicYearForSchool(whereClause.school_id)).name;
  if (filter === 'currently_studying') {
    appendStudentCondition(whereClause, {
      status: 'active',
      academic_year: year,
      class_id: { [Op.not]: null }
    });
    return;
  }

  delete whereClause.academic_year;
  appendStudentCondition(whereClause, {
    status: 'active',
    [Op.or]: [
      { academic_year: { [Op.ne]: year } },
      { academic_year: { [Op.is]: null } },
      { class_id: { [Op.is]: null } }
    ]
  });
};

module.exports = { appendStudentCondition, applyEnrollmentFilter, applySiblingFilter };
