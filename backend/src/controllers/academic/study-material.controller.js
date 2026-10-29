const fs = require('fs/promises');
const path = require('path');
const { Op, Sequelize } = require('sequelize');
const {
  Class,
  ClassSubjectAssignment,
  DynamicEntityRecord,
  Subject,
  SubjectTeacher,
  Student
} = require('~/models');
const { resolvePrivateStudyMaterialsPath } = require('~/utils/shared/pathHelper');
const { resolveSchoolBranchScope } = require('~/utils/shared/requestScope');
const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');
const { getTeacherStudentWhere } = require('~/utils/academic/teacherStudentScope');
const { logger } = require('~/utils/shared/logger');

const MATERIAL_TYPE = 'attachment';
const privateKeyPattern = /^[0-9a-f-]{36}\.(?:pdf|jpg|jpeg|png|gif|doc|docx)$/i;

const studentOf = async req => {
  const student = await Student.findOne({ where: { user_id: req.user.id } });
  if (!student || student.school_id !== req.user.school_id) return null;
  return student;
};

const teacherAssignments = async req => {
  const year = await getCurrentAcademicYearForSchool(req.user.school_id);
  const where = await getTeacherStudentWhere({
    teacherId: req.user.id,
    schoolId: req.user.school_id,
    academicYear: year?.code || year?.name
  });
  return (where[Op.or] || [])
    .filter(item => item.class_id && item.branch_id)
    .map(({ class_id, branch_id }) => ({ class_id, branch_id }));
};

const safeFileKey = key => (typeof key === 'string' && privateKeyPattern.test(key) ? key : null);

const publicRecord = record => {
  const json = record.toJSON ? record.toJSON() : record;
  const payload = { ...(json.payload || {}) };
  const fileAvailable = Boolean(safeFileKey(payload.private_file_key));
  delete payload.private_file_key;
  delete payload.private_file_name;
  delete payload.private_file_mime;
  return {
    ...json,
    payload,
    ...payload,
    file_available: fileAvailable
  };
};

const list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const offset = (page - 1) * limit;
    let where = { school_id: req.user.school_id, entity_type: MATERIAL_TYPE };
    if (req.user.role === 'student') {
      const student = await studentOf(req);
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not linked' });
      where = {
        ...where,
        branch_id: student.branch_id,
        class_id: student.class_id,
        status: 'active'
      };
    } else {
      const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
      where.school_id = scope.school_id;
      if (scope.branch_id) where.branch_id = scope.branch_id;
      if (req.user.role === 'teacher') {
        const assignments = await teacherAssignments(req);
        where[Op.and] = [{ [Op.or]: assignments.length ? assignments : [{ class_id: null }] }];
      }
      if (req.query.class_id) where.class_id = req.query.class_id;
    }
    const search = String(req.query.search || '').trim().slice(0, 120);
    if (search) {
      const searchClause = {
        [Op.or]: [
          { title: { [Op.iLike]: `%${search}%` } },
          { notes: { [Op.iLike]: `%${search}%` } },
          Sequelize.where(Sequelize.cast(Sequelize.col('payload'), 'text'), { [Op.iLike]: `%${search}%` })
        ]
      };
      where[Op.and] = [...(where[Op.and] || []), searchClause];
    }
    const { rows, count } = await DynamicEntityRecord.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    return res.json({
      success: true,
      data: rows.map(publicRecord),
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    logger.error('study materials list', error);
    return res.status(Number.isInteger(error.status) ? error.status : 500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  let privateKey;
  try {
    const { title, class_id: classId, subject_id: subjectId, topic = '', resource_type: type = 'link', external_url: url = '' } = req.body || {};
    if (!String(title || '').trim() || !classId || !subjectId) {
      return res.status(400).json({ success: false, message: 'Title, class, and subject are required' });
    }
    if (!['file', 'video', 'link'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Choose a valid resource type' });
    }
    if (type === 'file' && !req.file) {
      return res.status(400).json({ success: false, message: 'Choose a file to upload' });
    }
    let safeUrl = '';
    if (type !== 'file') {
      try {
        const parsed = new URL(String(url));
        if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error();
        safeUrl = parsed.href;
      } catch {
        return res.status(400).json({ success: false, message: 'Use a valid credential-free HTTPS link' });
      }
    }

    const requestedBranchId = req.user.role === 'teacher'
      ? req.user.branch_id
      : req.body.branch_id || req.query?.branch_id || req.branchId || req.user.branch_id;
    if (!requestedBranchId) {
      return res.status(400).json({ success: false, message: 'Select a branch before sharing material' });
    }
    const scope = await resolveSchoolBranchScope(req, {
      branchRequired: true,
      lockAssignedBranch: req.user.role === 'teacher'
    });
    const year = await getCurrentAcademicYearForSchool(scope.school_id);
    if (!year) return res.status(400).json({ success: false, message: 'No current academic year is configured' });
    const classroom = await Class.findOne({
      where: { id: classId, school_id: scope.school_id, branch_id: scope.branch_id }
    });
    if (!classroom) return res.status(400).json({ success: false, message: 'Class is not in the selected branch' });
    const classSubject = await ClassSubjectAssignment.findOne({
      where: {
        school_id: scope.school_id,
        class_id: classId,
        subject_id: subjectId,
        academic_year: year.code || year.name,
        is_active: true,
        [Op.or]: [{ branch_id: scope.branch_id }, { branch_id: null }]
      }
    });
    if (!classSubject) return res.status(400).json({ success: false, message: 'Subject is not assigned to this class' });
    const subject = await Subject.findOne({
      where: { id: subjectId, school_id: scope.school_id, is_active: true }
    });
    if (!subject) return res.status(400).json({ success: false, message: 'Subject is unavailable' });

    if (req.user.role === 'teacher') {
      const assignments = await teacherAssignments(req);
      if (!assignments.some(item => item.class_id === classId && item.branch_id === scope.branch_id)) {
        return res.status(403).json({ success: false, message: 'You can only share materials with an assigned class' });
      }
      const subjectAssignment = await SubjectTeacher.findOne({
        where: {
          teacher_id: req.user.id,
          school_id: scope.school_id,
          branch_id: scope.branch_id,
          class_id: classId,
          subject_id: subjectId,
          academic_year: year.code || year.name
        }
      });
      if (!subjectAssignment) return res.status(403).json({ success: false, message: 'You can only share materials for an assigned subject' });
    }

    const payload = {
      resource_type: type,
      topic: String(topic).trim(),
      subject_id: subjectId,
      subject_name: subject.name,
      academic_year: year.code || year.name,
      external_url: safeUrl
    };
    if (req.file) {
      const extension = path.extname(req.file.originalname).toLowerCase();
      privateKey = `${require('crypto').randomUUID()}${extension}`;
      const destination = resolvePrivateStudyMaterialsPath(privateKey);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, req.file.buffer, { flag: 'wx', mode: 0o600 });
      payload.private_file_key = privateKey;
      payload.private_file_name = path.basename(req.file.originalname).slice(0, 180);
      payload.private_file_mime = req.file.mimetype;
    }
    const record = await DynamicEntityRecord.create({
      entity_type: MATERIAL_TYPE,
      title: String(title).trim(),
      status: 'active',
      class_id: classId,
      branch_id: scope.branch_id,
      school_id: scope.school_id,
      notes: safeUrl || null,
      payload,
      created_by: req.user.id
    });
    return res.status(201).json({ success: true, data: publicRecord(record) });
  } catch (error) {
    if (privateKey) await fs.unlink(resolvePrivateStudyMaterialsPath(privateKey)).catch(() => {});
    logger.error('study materials create', error);
    return res.status(Number.isInteger(error.status) ? error.status : 500).json({ success: false, message: error.message });
  }
};

const download = async (req, res) => {
  try {
    const managerScope = ['student', 'teacher'].includes(req.user.role)
      ? null
      : await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const schoolId = managerScope?.school_id || req.user.school_id;
    const record = await DynamicEntityRecord.findOne({
      where: { id: req.params.id, school_id: schoolId, entity_type: MATERIAL_TYPE, status: 'active' }
    });
    if (!record) return res.status(404).json({ success: false, message: 'Study material not found' });

    if (req.user.role === 'student') {
      const student = await studentOf(req);
      if (!student || student.branch_id !== record.branch_id || student.class_id !== record.class_id) {
        return res.status(404).json({ success: false, message: 'Study material not found' });
      }
    } else if (req.user.role === 'teacher') {
      const assignments = await teacherAssignments(req);
      if (!assignments.some(item => item.class_id === record.class_id && item.branch_id === record.branch_id)) {
        return res.status(404).json({ success: false, message: 'Study material not found' });
      }
    } else {
      if (managerScope.school_id !== record.school_id || (managerScope.branch_id && managerScope.branch_id !== record.branch_id)) {
        return res.status(404).json({ success: false, message: 'Study material not found' });
      }
    }

    const key = safeFileKey(record.payload?.private_file_key);
    if (!key) return res.status(404).json({ success: false, message: 'Study material file not found' });
    const filePath = resolvePrivateStudyMaterialsPath(key);
    res.set({
      'Content-Type': record.payload.private_file_mime || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${path.basename(record.payload.private_file_name || 'study-material').replace(/["\r\n]/g, '')}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    return res.sendFile(filePath, error => {
      if (error && !res.headersSent) res.status(404).json({ success: false, message: 'Study material file not found' });
    });
  } catch (error) {
    logger.error('study materials download', error);
    return res.status(Number.isInteger(error.status) ? error.status : 500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const managerScope = req.user.role === 'teacher'
      ? null
      : await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const schoolId = managerScope?.school_id || req.user.school_id;
    const record = await DynamicEntityRecord.findOne({
      where: { id: req.params.id, school_id: schoolId, entity_type: MATERIAL_TYPE }
    });
    if (!record) return res.status(404).json({ success: false, message: 'Study material not found' });
    if (req.user.role === 'teacher') {
      const assignments = await teacherAssignments(req);
      if (record.created_by !== req.user.id || !assignments.some(item => item.class_id === record.class_id && item.branch_id === record.branch_id)) {
        return res.status(404).json({ success: false, message: 'Study material not found' });
      }
    } else {
      if (managerScope.school_id !== record.school_id || (managerScope.branch_id && managerScope.branch_id !== record.branch_id)) {
        return res.status(404).json({ success: false, message: 'Study material not found' });
      }
    }
    await record.destroy();
    const key = safeFileKey(record.payload?.private_file_key);
    if (key) await fs.unlink(resolvePrivateStudyMaterialsPath(key)).catch(error => logger.warn('study material file cleanup failed', error));
    return res.json({ success: true });
  } catch (error) {
    logger.error('study materials delete', error);
    return res.status(Number.isInteger(error.status) ? error.status : 500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, download, remove };
