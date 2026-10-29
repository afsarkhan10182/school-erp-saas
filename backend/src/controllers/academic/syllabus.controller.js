const { Op } = require('sequelize');
const { SyllabusUnit, Class, Subject, SubjectTeacher, Branch } = require('~/models');
const { resolveSchoolBranchScope } = require('~/utils/shared/requestScope');
const { logger } = require('~/utils/shared/logger');
const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');

const resolveScope = req => {
  if (req.user.role === 'teacher' && !req.user.branch_id) {
    throw Object.assign(new Error('Teacher branch assignment is required.'), { statusCode: 403 });
  }
  return resolveSchoolBranchScope(req, {
    allowSchoolWide: true,
    lockAssignedBranch: ['branch_admin', 'teacher'].includes(req.user.role)
  });
};

const teacherSubjectAssignments = async (req, scope, classroom = null) => {
  if (req.user.role !== 'teacher') return null;
  const year = await getCurrentAcademicYearForSchool(scope.school_id);
  const academicYear = year?.code || year?.name;
  if (!academicYear) return [];
  return SubjectTeacher.findAll({
    where: {
      teacher_id: req.user.id,
      school_id: scope.school_id,
      branch_id: classroom?.branch_id || scope.branch_id,
      ...(classroom?.id ? { class_id: classroom.id } : {}),
      academic_year: academicYear
    },
    attributes: ['subject_id', 'class_id'],
    raw: true
  });
};

const classes = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Teacher access is required.' });
    }
    const scope = await resolveScope(req);
    const assignments = await teacherSubjectAssignments(req, scope);
    const classIds = [...new Set(assignments.map(item => item.class_id).filter(Boolean))];
    const rows = classIds.length
      ? await Class.findAll({
          where: {
            id: { [Op.in]: classIds },
            school_id: scope.school_id,
            branch_id: scope.branch_id,
            is_active: true
          },
          attributes: ['id', 'name', 'code', 'numeric_value', 'branch_id'],
          include: [{ model: Branch, as: 'branch', attributes: ['id', 'name'] }],
          order: [['name', 'ASC']]
        })
      : [];
    return res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('syllabus teacher classes', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const placement = async (req, scope) => {
  const classId = String(req.body?.class_id || req.query?.class_id || '');
  const subjectId = String(req.body?.subject_id || req.query?.subject_id || '');
  if (!classId || !subjectId) return { error: 'Select a class and subject.' };
  const classroom = await Class.findOne({
    where: {
      id: classId,
      school_id: scope.school_id,
      ...(scope.branch_id ? { branch_id: scope.branch_id } : {})
    }
  });
  if (!classroom) return { error: 'Class is not available in this school or branch.' };
  const subject = await Subject.findOne({
    where: {
      id: subjectId,
      school_id: scope.school_id,
      [Op.and]: [
        { [Op.or]: [{ class_id: classId }, { class_id: null }] },
        { [Op.or]: [{ branch_id: classroom.branch_id }, { branch_id: null }] }
      ]
    }
  });
  if (!subject) return { error: 'Subject is not available for the selected class.' };
  if (req.user.role === 'teacher') {
    const assignments = await teacherSubjectAssignments(req, scope, classroom);
    if (!assignments?.some(assignment => assignment.subject_id === subjectId)) {
      return { error: 'You are not assigned to this subject in the current academic year.' };
    }
  }
  return { classroom, subject, class_id: classId, subject_id: subjectId };
};

const subjects = async (req, res) => {
  try {
    const scope = await resolveScope(req);
    const classId = String(req.query?.class_id || '');
    if (!classId) return res.status(400).json({ success: false, message: 'Select a class.' });
    const classroom = await Class.findOne({
      where: {
        id: classId,
        school_id: scope.school_id,
        ...(scope.branch_id ? { branch_id: scope.branch_id } : {})
      }
    });
    if (!classroom)
      return res
        .status(400)
        .json({ success: false, message: 'Class is not available in this school or branch.' });
    const teacherAssignments = await teacherSubjectAssignments(req, scope, classroom);
    if (teacherAssignments && !teacherAssignments.length) {
      return res.status(403).json({
        success: false,
        message: 'No subject assignment for this class in the current academic year.'
      });
    }
    const rows = await Subject.findAll({
      where: {
        school_id: scope.school_id,
        is_active: true,
        ...(teacherAssignments
          ? { id: { [Op.in]: [...new Set(teacherAssignments.map(item => item.subject_id))] } }
          : {}),
        [Op.and]: [
          { [Op.or]: [{ class_id: classId }, { class_id: null }] },
          { [Op.or]: [{ branch_id: classroom.branch_id }, { branch_id: null }] }
        ]
      },
      attributes: ['id', 'name', 'code'],
      order: [['name', 'ASC']]
    });
    return res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('syllabus subjects', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const list = async (req, res) => {
  try {
    const scope = await resolveScope(req);
    const selected = await placement(req, scope);
    if (selected.error) return res.status(400).json({ success: false, message: selected.error });
    const rows = await SyllabusUnit.findAll({
      where: {
        school_id: scope.school_id,
        branch_id: selected.classroom.branch_id,
        class_id: selected.class_id,
        subject_id: selected.subject_id
      },
      order: [
        ['created_at', 'ASC'],
        ['title', 'ASC']
      ]
    });
    return res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('syllabus list', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const parentId = req.body?.parent_id || null;
    if (!title || title.length > 180 || description.length > 5000) {
      return res.status(400).json({
        success: false,
        message:
          'Enter a title (up to 180 characters) and a description no longer than 5,000 characters.'
      });
    }
    const scope = await resolveScope(req);
    const selected = await placement(req, scope);
    if (selected.error) return res.status(400).json({ success: false, message: selected.error });
    if (parentId) {
      const parent = await SyllabusUnit.findOne({
        where: {
          id: parentId,
          school_id: scope.school_id,
          branch_id: selected.classroom.branch_id,
          class_id: selected.class_id,
          subject_id: selected.subject_id,
          parent_id: null
        }
      });
      if (!parent)
        return res
          .status(400)
          .json({ success: false, message: 'Choose a chapter in this class and subject.' });
    }
    const row = await SyllabusUnit.create({
      school_id: scope.school_id,
      branch_id: selected.classroom.branch_id,
      class_id: selected.class_id,
      subject_id: selected.subject_id,
      parent_id: parentId,
      title,
      description: description || null,
      created_by: req.user.id
    });
    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    logger.error('syllabus create', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = { list, classes, subjects, create };
