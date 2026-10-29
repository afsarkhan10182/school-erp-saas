const { Op } = require('sequelize');
const {
  Homework,
  HomeworkSubmission,
  Student,
  Class,
  Section,
  Subject,
  ClassTeacher,
  SubjectTeacher
} = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const getLinkedStudent = async req =>
  Student.findOne({ where: { user_id: req.user.id, school_id: req.schoolId } });

const getStudentHomework = async (req, student) =>
  Homework.findOne({
    where: {
      id: req.params.id,
      school_id: student.school_id,
      branch_id: student.branch_id,
      class_id: student.class_id,
      [Op.and]: [
        ...(student.academic_year
          ? [{ [Op.or]: [{ academic_year: student.academic_year }, { academic_year: null }] }]
          : []),
        { [Op.or]: [{ section_id: null }, { section_id: student.section_id }] }
      ]
    }
  });

const canManageHomework = (req, homework) =>
  req.user.role !== 'teacher' || homework.created_by === req.user.id;

const normalizeHomeworkAttachmentUrl = value => {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  if (/^\/uploads\/schools\/[A-Za-z0-9_-]+\/documents\/\d{4}\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9]+)?$/.test(value)) {
    return value;
  }
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
};

const uploadedHomeworkAttachmentUrl = async req => {
  if (!req.file) return null;
  const { schoolCode, type, year } = req.uploadMetadata || {};
  if (!schoolCode || type !== 'documents' || !/^\d{4}$/.test(String(year || ''))) {
    throw new Error('Uploaded homework attachment has no valid school storage path');
  }
  return `/uploads/schools/${encodeURIComponent(schoolCode)}/${type}/${year}/${encodeURIComponent(req.file.filename)}`;
};

const homeworkWhere = (req, id) => req.user.role === 'teacher'
  ? { id, school_id: req.user.school_id || req.schoolId || null, branch_id: req.user.branch_id || null }
  : { id, ...schoolWhere(req) };

const resolveHomeworkScope = async (req, options) => {
  if (req.user.role !== 'teacher') return resolveSchoolBranchScope(req, options);
  const requestedBranchId = req.body?.branch_id || req.query?.branch_id || req.branchId;
  if (!req.user.branch_id || (requestedBranchId && requestedBranchId !== req.user.branch_id)) return null;
  return resolveSchoolBranchScope(
    { ...req, body: { ...req.body, branch_id: req.user.branch_id } },
    { ...options, branchRequired: true }
  );
};

const validateHomeworkPlacement = async ({ schoolId, branchId, classId, sectionId, subjectId }) => {
  const classRecord = await Class.findOne({
    where: { id: classId, school_id: schoolId, branch_id: branchId }
  });
  if (!classRecord) return 'Invalid class for this branch';

  if (sectionId) {
    const section = await Section.findOne({
      where: { id: sectionId, class_id: classId, school_id: schoolId, branch_id: branchId }
    });
    if (!section) return 'Invalid section for this class and branch';
  }

  if (subjectId) {
    const subject = await Subject.findOne({
      where: {
        id: subjectId,
        school_id: schoolId,
        [Op.and]: [
          { [Op.or]: [{ class_id: classId }, { class_id: null }] },
          { [Op.or]: [{ branch_id: branchId }, { branch_id: null }] }
        ]
      }
    });
    if (!subject) return 'Invalid subject for this class and branch';
  }
  return null;
};

const teacherPlacementError = async ({
  teacherId,
  schoolId,
  branchId,
  classId,
  sectionId,
  subjectId,
  academicYear
}) => {
  if (!academicYear) return 'Academic year is required for teacher homework';

  const assignmentWhere = {
    teacher_id: teacherId,
    school_id: schoolId,
    branch_id: branchId,
    class_id: classId,
    academic_year: academicYear,
    ...(sectionId
      ? { [Op.or]: [{ section_id: null }, { section_id: sectionId }] }
      : { section_id: null })
  };

  const assignment = subjectId
    ? await SubjectTeacher.findOne({ where: { ...assignmentWhere, subject_id: subjectId } })
    : await ClassTeacher.findOne({ where: { ...assignmentWhere, is_active: true } });

  return assignment ? null : 'You are not assigned to this class, section, subject and academic year';
};

const getPlacementOptions = async (req, res) => {
  try {
    const classId = req.query.class_id;
    const academicYear = req.query.academic_year;
    if (!classId) return res.status(400).json({ success: false, message: 'class_id is required' });

    const scope = await resolveHomeworkScope(req, { branchRequired: true });
    if (!scope) return res.status(403).json({ success: false, message: 'Invalid teacher branch scope' });
    const classRecord = await Class.findOne({
      where: { id: classId, school_id: scope.school_id, branch_id: scope.branch_id }
    });
    if (!classRecord) return res.status(400).json({ success: false, message: 'Invalid class for this branch' });

    const sectionWhere = {
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      class_id: classId,
      is_active: true
    };
    let assignments = [];
    let subjects;
    let sections;

    if (req.user.role === 'teacher') {
      if (!academicYear) {
        return res.status(400).json({ success: false, message: 'academic_year is required for teachers' });
      }
      const assignmentWhere = {
        teacher_id: req.user.id,
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        class_id: classId,
        academic_year: academicYear
      };
      const [classAssignments, subjectAssignments] = await Promise.all([
        ClassTeacher.findAll({ where: { ...assignmentWhere, is_active: true }, attributes: ['section_id'] }),
        SubjectTeacher.findAll({
          where: assignmentWhere,
          attributes: ['subject_id', 'section_id'],
          include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'], required: true }]
        })
      ]);
      assignments = [
        ...classAssignments.map(item => ({ subject_id: null, section_id: item.section_id })),
        ...subjectAssignments.map(item => ({ subject_id: item.subject_id, section_id: item.section_id }))
      ];
      if (!assignments.length) {
        return res.status(403).json({ success: false, message: 'No teaching assignment for this class and academic year' });
      }

      const subjectIds = [...new Set(subjectAssignments.map(item => item.subject_id))];
      subjects = subjectIds.length
        ? await Subject.findAll({
            where: { id: { [Op.in]: subjectIds }, school_id: scope.school_id, is_active: true },
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
          })
        : [];
      const availableSections = await Section.findAll({
        where: sectionWhere,
        attributes: ['id', 'name'],
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      });
      const canAssignAllSections = assignments.some(item => !item.section_id);
      const assignedSectionIds = new Set(assignments.map(item => item.section_id).filter(Boolean));
      sections = canAssignAllSections
        ? availableSections
        : availableSections.filter(item => assignedSectionIds.has(item.id));
    } else {
      subjects = await Subject.findAll({
        where: {
          school_id: scope.school_id,
          is_active: true,
          [Op.and]: [
            { [Op.or]: [{ class_id: classId }, { class_id: null }] },
            { [Op.or]: [{ branch_id: scope.branch_id }, { branch_id: null }] }
          ]
        },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      });
      sections = await Section.findAll({
        where: sectionWhere,
        attributes: ['id', 'name'],
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      });
    }

    return res.json({
      success: true,
      data: {
        subjects,
        sections,
        assignments,
        can_assign_general: req.user.role !== 'teacher' || assignments.some(item => !item.subject_id)
      }
    });
  } catch (error) {
    logger.error('homework placement options', error);
    return res.status(500).json({ success: false, message: 'Unable to load homework placement options' });
  }
};

const list = async (req, res) => {
  try {
    const scope = await resolveHomeworkScope(req, { allowSchoolWide: true });
    if (!scope) return res.status(403).json({ success: false, message: 'Invalid teacher branch scope' });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.query.class_id) where.class_id = req.query.class_id;
    const conditions = [];
    if (req.query.academic_year && req.query.academic_year !== 'all') {
      conditions.push({ [Op.or]: [{ academic_year: req.query.academic_year }, { academic_year: null }] });
    }
    const search = String(req.query.search || '').trim();
    if (search) {
      const pattern = `%${search}%`;
      conditions.push({ [Op.or]: [
        { title: { [Op.iLike]: pattern } },
        { description: { [Op.iLike]: pattern } },
        { '$class.name$': { [Op.iLike]: pattern } },
        { '$section.name$': { [Op.iLike]: pattern } },
        { '$subject.name$': { [Op.iLike]: pattern } }
      ] });
    }
    if (conditions.length) where[Op.and] = conditions;
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 10;
    const limit = [10, 25, 50, 100].includes(requestedLimit) ? requestedLimit : 10;
    const sortBy = ['title', 'due_date'].includes(req.query.sort_by) ? req.query.sort_by : 'due_date';
    const sortOrder = req.query.sort_order === 'ASC' ? 'ASC' : 'DESC';
    const { count, rows: homeworks } = await Homework.findAndCountAll({
      where,
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'] },
        { model: Section, as: 'section', attributes: ['id', 'name'], required: false },
        { model: Subject, as: 'subject', attributes: ['id', 'name'], required: false }
      ],
      order: [[sortBy, sortOrder], ['id', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true
    });
    const progressRows = homeworks.length
      ? await HomeworkSubmission.findAll({
          where: {
            school_id: scope.school_id,
            homework_id: { [Op.in]: homeworks.map(item => item.id) },
            ...(scope.branch_id ? { branch_id: scope.branch_id } : {})
          },
          attributes: [
            'homework_id',
            [HomeworkSubmission.sequelize.fn('COUNT', HomeworkSubmission.sequelize.col('id')), 'submitted'],
            [HomeworkSubmission.sequelize.fn(
              'COUNT',
              HomeworkSubmission.sequelize.literal('CASE WHEN evaluated_at IS NOT NULL THEN 1 END')
            ), 'evaluated']
          ],
          group: ['homework_id'],
          raw: true
        })
      : [];
    const enrollmentRows = homeworks.length
      ? await Student.count({
          where: {
            school_id: scope.school_id,
            status: 'active',
            class_id: { [Op.in]: [...new Set(homeworks.map(item => item.class_id))] },
            ...(scope.branch_id ? { branch_id: scope.branch_id } : {})
          },
          group: ['branch_id', 'class_id', 'section_id']
        })
      : [];
    const progressByHomework = new Map(progressRows.map(row => [row.homework_id, {
      submitted: Number(row.submitted || 0),
      evaluated: Number(row.evaluated || 0)
    }]));
    return res.json({
      success: true,
      data: {
        pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
        homeworks: homeworks.map(item => {
          const record = item.toJSON();
          const progress = progressByHomework.get(item.id) || { submitted: 0, evaluated: 0 };
          return {
            ...record,
            submission_progress: {
              ...progress,
              total_enrolled: enrollmentRows.reduce((total, row) =>
                row.branch_id === item.branch_id && row.class_id === item.class_id &&
                  (!item.section_id || row.section_id === item.section_id)
                  ? total + Number(row.count || 0)
                  : total, 0),
              pending_evaluation: progress.submitted - progress.evaluated
            }
          };
        })
      }
    });
  } catch (error) {
    logger.error('homework list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.title || !req.body.due_date || !req.body.class_id) {
      return res.status(400).json({
        success: false,
        message: 'title, due_date and class_id are required'
      });
    }
    const attachmentUrl = req.file
      ? await uploadedHomeworkAttachmentUrl(req)
      : normalizeHomeworkAttachmentUrl(req.body.attachment_url);
    if (attachmentUrl === undefined) {
      return res.status(400).json({ success: false, message: 'attachment_url must be a valid HTTP or HTTPS URL' });
    }
    const scope = await resolveHomeworkScope(req, { branchRequired: true });
    if (!scope) return res.status(403).json({ success: false, message: 'Invalid teacher branch scope' });
    const placementError = await validateHomeworkPlacement({
      schoolId: scope.school_id,
      branchId: scope.branch_id,
      classId: req.body.class_id,
      sectionId: req.body.section_id,
      subjectId: req.body.subject_id
    });
    if (placementError) return res.status(400).json({ success: false, message: placementError });
    if (req.user.role === 'teacher') {
      const assignmentError = await teacherPlacementError({
        teacherId: req.user.id,
        schoolId: scope.school_id,
        branchId: scope.branch_id,
        classId: req.body.class_id,
        sectionId: req.body.section_id,
        subjectId: req.body.subject_id,
        academicYear: req.body.academic_year
      });
      if (assignmentError) return res.status(403).json({ success: false, message: assignmentError });
    }
    const homework = await Homework.create({
      title: req.body.title,
      description: req.body.description,
      due_date: req.body.due_date,
      academic_year: req.body.academic_year || null,
      class_id: req.body.class_id,
      section_id: req.body.section_id || null,
      subject_id: req.body.subject_id || null,
      attachment_url: attachmentUrl,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      created_by: req.user.id
    });
    return res.status(201).json({ success: true, data: { homework } });
  } catch (error) {
    logger.error('homework create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const homework = await Homework.findOne({
      where: homeworkWhere(req, req.params.id)
    });
    if (!homework) return res.status(404).json({ success: false, message: 'Not found' });
    if (!canManageHomework(req, homework)) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    const editableFields = [
      'title', 'description', 'due_date', 'academic_year', 'class_id',
      'section_id', 'subject_id', 'attachment_url'
    ];
    const changes = Object.fromEntries(
      editableFields
        .filter(field => Object.prototype.hasOwnProperty.call(req.body, field))
        .map(field => [field, req.body[field]])
    );
    if (Object.prototype.hasOwnProperty.call(changes, 'attachment_url')) {
      changes.attachment_url = normalizeHomeworkAttachmentUrl(changes.attachment_url);
      if (changes.attachment_url === undefined) {
        return res.status(400).json({ success: false, message: 'attachment_url must be a valid HTTP or HTTPS URL' });
      }
    }
    if (req.file) changes.attachment_url = await uploadedHomeworkAttachmentUrl(req);
    for (const field of ['section_id', 'subject_id', 'academic_year']) {
      if (changes[field] === '') changes[field] = null;
    }
    changes.updated_by = req.user.id;
    const targetClassId = Object.prototype.hasOwnProperty.call(changes, 'class_id')
      ? changes.class_id
      : homework.class_id;
    const targetSectionId = Object.prototype.hasOwnProperty.call(changes, 'section_id')
      ? changes.section_id
      : homework.section_id;
    const targetSubjectId = Object.prototype.hasOwnProperty.call(changes, 'subject_id')
      ? changes.subject_id
      : homework.subject_id;
    const placementChanged = ['class_id', 'section_id', 'subject_id', 'academic_year'].some(field =>
      Object.prototype.hasOwnProperty.call(changes, field)
    );
    if (req.user.role !== 'teacher' || placementChanged) {
      const placementError = await validateHomeworkPlacement({
        schoolId: homework.school_id,
        branchId: homework.branch_id,
        classId: targetClassId,
        sectionId: targetSectionId,
        subjectId: targetSubjectId
      });
      if (placementError) return res.status(400).json({ success: false, message: placementError });
      if (req.user.role === 'teacher') {
        const assignmentError = await teacherPlacementError({
          teacherId: req.user.id,
          schoolId: homework.school_id,
          branchId: homework.branch_id,
          classId: targetClassId,
          sectionId: targetSectionId,
          subjectId: targetSubjectId,
          academicYear: Object.prototype.hasOwnProperty.call(changes, 'academic_year')
            ? changes.academic_year
            : homework.academic_year
        });
        if (assignmentError) return res.status(403).json({ success: false, message: assignmentError });
      }
    }
    if (await HomeworkSubmission.count({ where: { homework_id: homework.id } })) {
      const placementChanged =
        (changes.class_id && changes.class_id !== homework.class_id) ||
        (Object.prototype.hasOwnProperty.call(changes, 'section_id') && changes.section_id !== homework.section_id) ||
        (Object.prototype.hasOwnProperty.call(changes, 'academic_year') && changes.academic_year !== homework.academic_year);
      if (placementChanged) {
        return res.status(409).json({ success: false, message: 'Homework with submissions cannot change class, section, or academic year' });
      }
    }
    await homework.update(changes);
    return res.json({ success: true, data: { homework } });
  } catch (error) {
    logger.error('homework update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMySubmission = async (req, res) => {
  try {
    const student = await getLinkedStudent(req);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not linked' });
    const homework = await getStudentHomework(req, student);
    if (!homework) return res.status(404).json({ success: false, message: 'Homework not found' });
    const submission = await HomeworkSubmission.findOne({
      where: { homework_id: homework.id, student_id: student.id, school_id: student.school_id }
    });
    return res.json({ success: true, data: { submission } });
  } catch (error) {
    logger.error('homework submission read', error);
    return res.status(500).json({ success: false, message: 'Unable to load submission' });
  }
};

const submitWork = async (req, res) => {
  try {
    const submissionText = typeof req.body.submission_text === 'string'
      ? req.body.submission_text.trim()
      : '';
    if (!submissionText || submissionText.length > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Submission text must be between 1 and 50000 characters'
      });
    }

    const student = await getLinkedStudent(req);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not linked' });
    const homework = await getStudentHomework(req, student);
    if (!homework) return res.status(404).json({ success: false, message: 'Homework not found' });

    const existing = await HomeworkSubmission.findOne({
      where: { homework_id: homework.id, student_id: student.id, school_id: student.school_id }
    });
    if (existing?.evaluated_at) {
      return res.status(409).json({ success: false, message: 'Evaluated submissions cannot be changed' });
    }

    const values = {
      homework_id: homework.id,
      student_id: student.id,
      school_id: student.school_id,
      branch_id: student.branch_id,
      submission_text: submissionText,
      submitted_at: new Date()
    };
    const submission = existing
      ? await existing.update(values)
      : await HomeworkSubmission.create(values);
    return res.status(existing ? 200 : 201).json({ success: true, data: { submission } });
  } catch (error) {
    logger.error('homework submission save', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'A submission already exists; reload and try again' });
    }
    return res.status(500).json({ success: false, message: 'Unable to save submission' });
  }
};

const listSubmissions = async (req, res) => {
  try {
    const homework = await Homework.findOne({
      where: homeworkWhere(req, req.params.id)
    });
    if (!homework || !canManageHomework(req, homework)) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }

    const scope = { school_id: homework.school_id, branch_id: homework.branch_id, class_id: homework.class_id };
    if (homework.section_id) scope.section_id = homework.section_id;
    const [students, submissions] = await Promise.all([
      Student.count({ where: { ...scope, status: 'active' } }),
      HomeworkSubmission.findAll({
        where: { homework_id: homework.id, school_id: homework.school_id, branch_id: homework.branch_id },
        include: [{ model: Student, as: 'student', attributes: ['id', 'first_name', 'last_name', 'admission_number'] }],
        order: [['submitted_at', 'ASC']]
      })
    ]);
    const evaluated = submissions.filter(item => item.evaluated_at).length;
    return res.json({
      success: true,
      data: {
        total_enrolled: students,
        submitted: submissions.length,
        evaluated,
        pending_evaluation: submissions.length - evaluated,
        submissions
      }
    });
  } catch (error) {
    logger.error('homework submissions list', error);
    return res.status(500).json({ success: false, message: 'Unable to load submissions' });
  }
};

const gradeSubmission = async (req, res) => {
  try {
    const marks = Number(req.body.marks);
    if (!Number.isFinite(marks) || marks < 0) {
      return res.status(400).json({ success: false, message: 'Marks must be a non-negative number' });
    }
    const submission = await HomeworkSubmission.findOne({
      where: { id: req.params.submissionId, school_id: req.schoolId },
      include: [{ model: Homework, as: 'homework' }]
    });
    if (!submission || !submission.homework || !canManageHomework(req, submission.homework)) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    const scopedHomework = await Homework.findOne({
      where: homeworkWhere(req, submission.homework.id),
      attributes: ['id']
    });
    if (!scopedHomework) return res.status(404).json({ success: false, message: 'Submission not found' });

    await submission.update({
      marks,
      remarks: typeof req.body.remarks === 'string' ? req.body.remarks.trim().slice(0, 5000) : null,
      evaluated_by: req.user.id,
      evaluated_at: new Date()
    });
    return res.json({ success: true, data: { submission } });
  } catch (error) {
    logger.error('homework submission grade', error);
    return res.status(500).json({ success: false, message: 'Unable to save grade' });
  }
};

const remove = async (req, res) => {
  try {
    const homework = await Homework.findOne({
      where: homeworkWhere(req, req.params.id)
    });
    if (!homework) return res.status(404).json({ success: false, message: 'Not found' });
    if (!canManageHomework(req, homework)) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    if (await HomeworkSubmission.count({ where: { homework_id: homework.id } })) {
      return res.status(409).json({ success: false, message: 'Homework with submissions cannot be deleted' });
    }
    await homework.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('homework delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  list,
  create,
  update,
  remove,
  getMySubmission,
  submitWork,
  listSubmissions,
  gradeSubmission,
  getPlacementOptions
};
