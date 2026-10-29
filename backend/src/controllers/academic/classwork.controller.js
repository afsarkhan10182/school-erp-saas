const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const { Op, Sequelize } = require('sequelize');
const { Class, Section, Subject, SubjectTeacher, ClassSubjectAssignment, DynamicEntityRecord } = require('~/models');
const { resolveSchoolBranchScope } = require('~/utils/shared/requestScope');
const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');
const { getTeacherStudentWhere } = require('~/utils/academic/teacherStudentScope');
const { resolvePrivateStudyMaterialsPath } = require('~/utils/shared/pathHelper');
const { logger } = require('~/utils/shared/logger');

const ENTRY_TYPE = 'classwork_entry';
const kinds = ['Classwork', 'Logbook', 'Notes'];
const privateKeyPattern = /^[0-9a-f-]{36}\.(?:pdf|jpg|jpeg|png|gif|doc|docx)$/i;
const isDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};

const fileKey = value => typeof value === 'string' && privateKeyPattern.test(value) ? value : null;
const publicEntry = record => {
  const json = record.toJSON ? record.toJSON() : record;
  const payload = { ...(json.payload || {}) };
  const fileAvailable = Boolean(fileKey(payload.private_file_key));
  delete payload.private_file_key;
  delete payload.private_file_mime;
  return { ...json, payload, ...payload, file_available: fileAvailable };
};

const savePrivateFile = async file => {
  if (!file) return null;
  const extension = path.extname(file.originalname).toLowerCase();
  const key = `${randomUUID()}${extension}`;
  const destination = resolvePrivateStudyMaterialsPath(key);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, file.buffer, { flag: 'wx', mode: 0o600 });
  return { key, name: path.basename(file.originalname).slice(0, 180), mime: file.mimetype };
};

const resolveWriteScope = req => {
  const requestedBranchId = req.body?.branch_id || req.query?.branch_id || req.branchId;
  if (['admin', 'super_admin'].includes(req.user.role) && !requestedBranchId) {
    const error = new Error('Select a branch before changing classwork entries');
    error.status = 400;
    throw error;
  }
  return resolveSchoolBranchScope(req, { branchRequired: true, lockAssignedBranch: req.user.role === 'teacher' });
};

const assignmentsFor = async req => {
  const year = await getCurrentAcademicYearForSchool(req.user.school_id);
  const scope = await getTeacherStudentWhere({
    teacherId: req.user.id,
    schoolId: req.user.school_id,
    academicYear: year?.code || year?.name
  });
  return scope[Op.or] || [];
};

const list = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const { from_date: fromDate, to_date: toDate } = req.query;
    if ((fromDate && !isDate(fromDate)) || (toDate && !isDate(toDate)) || (req.query.date && !isDate(req.query.date))) {
      return res.status(400).json({ success: false, message: 'Use valid dates for the selected date filters' });
    }
    if (fromDate && toDate && fromDate > toDate) return res.status(400).json({ success: false, message: 'From date must be on or before To date' });
    if (req.query.entry_type && !kinds.includes(req.query.entry_type)) return res.status(400).json({ success: false, message: 'Choose a valid entry type' });
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { entity_type: ENTRY_TYPE, school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.user.role === 'teacher') {
      const assignments = (await assignmentsFor(req))
        .filter(item => item.class_id && item.branch_id)
        .map(({ class_id, branch_id }) => ({ class_id, branch_id }));
      where[Op.and] = [{ [Op.or]: assignments.length ? assignments : [{ class_id: null }] }];
      where.created_by = req.user.id;
    }
    if (req.query.class_id) where.class_id = req.query.class_id;
    if (req.query.entry_type && kinds.includes(req.query.entry_type)) {
      where[Op.and] = [...(where[Op.and] || []), Sequelize.where(Sequelize.json('payload.entry_type'), req.query.entry_type)];
    }
    if (fromDate && toDate) where.date_value = { [Op.between]: [fromDate, toDate] };
    else if (fromDate) where.date_value = { [Op.gte]: fromDate };
    else if (toDate) where.date_value = { [Op.lte]: toDate };
    if (req.query.date) where.date_value = req.query.date;
    if (req.query.academic_year) {
      where[Op.and] = [...(where[Op.and] || []), Sequelize.where(Sequelize.json('payload.academic_year'), req.query.academic_year)];
    }
    const search = String(req.query.search || '').trim().slice(0, 120);
    if (search) {
      where[Op.and] = [...(where[Op.and] || []), { [Op.or]: [
        { title: { [Op.iLike]: `%${search}%` } },
        { notes: { [Op.iLike]: `%${search}%` } },
        Sequelize.where(Sequelize.cast(Sequelize.col('payload'), 'text'), { [Op.iLike]: `%${search}%` })
      ] }];
    }
    const sortColumns = { date: 'date_value', title: 'title', type: Sequelize.json('payload.entry_type') };
    const sortColumn = sortColumns[req.query.sort_by] || sortColumns.date;
    const sortOrder = req.query.sort_order === 'ASC' ? 'ASC' : 'DESC';
    const { rows, count } = await DynamicEntityRecord.findAndCountAll({
      where, order: [[sortColumn, sortOrder], ['created_at', 'DESC']], limit, offset: (page - 1) * limit
    });
    return res.json({ success: true, data: rows.map(publicEntry), pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    logger.error('classwork list', error);
    return res.status(Number.isInteger(error.status) ? error.status : 500).json({ success: false, message: error.message });
  }
};

const validateEntry = async req => {
  const { title, entry_type: kind, date, class_id: classId, section_id: sectionId, subject_id: subjectId, notes } = req.body || {};
  if (!String(title || '').trim() || !kinds.includes(kind) || !isDate(date) || !classId || !subjectId || !String(notes || '').trim()) {
    return { error: 'Type, date, class, subject, title, and entry notes are required' };
  }
  const scope = await resolveWriteScope(req);
  const year = await getCurrentAcademicYearForSchool(scope.school_id);
  if (!year) return { error: 'No current academic year is configured' };
  const classroom = await Class.findOne({ where: { id: classId, school_id: scope.school_id, branch_id: scope.branch_id } });
  if (!classroom) return { error: 'Class is not in the selected branch' };
  let section = null;
  if (sectionId) {
    section = await Section.findOne({ where: { id: sectionId, class_id: classId, branch_id: scope.branch_id } });
    if (!section) return { error: 'Section is not part of the selected class' };
  }
  const subject = await Subject.findOne({ where: { id: subjectId, school_id: scope.school_id, is_active: true } });
  if (!subject) return { error: 'Subject is unavailable' };
  const classSubject = await ClassSubjectAssignment.findOne({ where: {
    school_id: scope.school_id, class_id: classId, subject_id: subjectId,
    academic_year: year.code || year.name, is_active: true,
    [Op.or]: [{ branch_id: scope.branch_id }, { branch_id: null }]
  } });
  if (!classSubject) return { error: 'Subject is not assigned to this class' };
  if (req.user.role === 'teacher') {
    const assignments = await assignmentsFor(req);
    if (!assignments.some(item => item.class_id === classId && item.branch_id === scope.branch_id && (!item.section_id || item.section_id === sectionId))) {
      return { forbidden: true, error: 'You can only record entries for an assigned class and section' };
    }
    const subjectAssignment = await SubjectTeacher.findOne({ where: {
      teacher_id: req.user.id, school_id: scope.school_id, branch_id: scope.branch_id,
      class_id: classId, subject_id: subjectId, academic_year: year.code || year.name,
      ...(sectionId ? { [Op.or]: [{ section_id: sectionId }, { section_id: null }] } : { section_id: null })
    } });
    if (!subjectAssignment) return { forbidden: true, error: 'You can only record an entry for an assigned subject' };
  }
  return { values: {
    entity_type: ENTRY_TYPE, title: String(title).trim().slice(0, 180), status: 'active',
    date_value: date, class_id: classId, branch_id: scope.branch_id, school_id: scope.school_id,
    notes: String(notes).trim(), created_by: req.user.id,
    payload: { entry_type: kind, section_id: sectionId || null, section_name: section?.name || '', class_name: classroom.name, subject_id: subjectId, subject_name: subject.name, teacher_name: req.user.name || req.user.full_name || req.user.email, academic_year: year.code || year.name }
  } };
};

const create = async (req, res) => {
  let uploadedFile;
  try {
    const result = await validateEntry(req);
    if (result.error) return res.status(result.forbidden ? 403 : 400).json({ success: false, message: result.error });
    uploadedFile = await savePrivateFile(req.file);
    if (uploadedFile) Object.assign(result.values.payload, { private_file_key: uploadedFile.key, private_file_name: uploadedFile.name, private_file_mime: uploadedFile.mime });
    const record = await DynamicEntityRecord.create(result.values);
    return res.status(201).json({ success: true, data: publicEntry(record) });
  } catch (error) {
    if (uploadedFile) await fs.unlink(resolvePrivateStudyMaterialsPath(uploadedFile.key)).catch(() => {});
    logger.error('classwork create', error);
    return res.status(Number.isInteger(error.status) ? error.status : 500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  let uploadedFile;
  try {
    const scope = await resolveWriteScope(req);
    const record = await DynamicEntityRecord.findOne({ where: { id: req.params.id, entity_type: ENTRY_TYPE, school_id: scope.school_id, ...(scope.branch_id ? { branch_id: scope.branch_id } : {}) } });
    if (!record) return res.status(404).json({ success: false, message: 'Classwork entry not found' });
    if (req.user.role === 'teacher' && record.created_by !== req.user.id) return res.status(404).json({ success: false, message: 'Classwork entry not found' });
    const result = await validateEntry(req);
    if (result.error) return res.status(result.forbidden ? 403 : 400).json({ success: false, message: result.error });
    const { created_by, ...values } = result.values;
    const oldFileKey = fileKey(record.payload?.private_file_key);
    uploadedFile = await savePrivateFile(req.file);
    values.payload = { ...(record.payload || {}), ...values.payload };
    if (uploadedFile) Object.assign(values.payload, { private_file_key: uploadedFile.key, private_file_name: uploadedFile.name, private_file_mime: uploadedFile.mime });
    await record.update({ ...values, updated_by: req.user.id });
    if (uploadedFile && oldFileKey) await fs.unlink(resolvePrivateStudyMaterialsPath(oldFileKey)).catch(() => {});
    return res.json({ success: true, data: publicEntry(record) });
  } catch (error) {
    if (uploadedFile) await fs.unlink(resolvePrivateStudyMaterialsPath(uploadedFile.key)).catch(() => {});
    logger.error('classwork update', error);
    return res.status(Number.isInteger(error.status) ? error.status : 500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const scope = await resolveWriteScope(req);
    const record = await DynamicEntityRecord.findOne({ where: { id: req.params.id, entity_type: ENTRY_TYPE, school_id: scope.school_id, ...(scope.branch_id ? { branch_id: scope.branch_id } : {}) } });
    if (!record || (req.user.role === 'teacher' && record.created_by !== req.user.id)) return res.status(404).json({ success: false, message: 'Classwork entry not found' });
    await record.destroy();
    if (fileKey(record.payload?.private_file_key)) await fs.unlink(resolvePrivateStudyMaterialsPath(record.payload.private_file_key)).catch(error => logger.warn('classwork attachment cleanup failed', error));
    return res.json({ success: true, message: 'Classwork entry deleted' });
  } catch (error) {
    logger.error('classwork delete', error);
    return res.status(Number.isInteger(error.status) ? error.status : 500).json({ success: false, message: error.message });
  }
};

const download = async (req, res) => {
  try {
    const scope = req.user.role === 'teacher' ? null : await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const record = await DynamicEntityRecord.findOne({ where: { id: req.params.id, entity_type: ENTRY_TYPE, school_id: scope?.school_id || req.user.school_id, ...(scope?.branch_id ? { branch_id: scope.branch_id } : {}) } });
    if (!record || (req.user.role === 'teacher' && record.created_by !== req.user.id)) return res.status(404).json({ success: false, message: 'Classwork entry not found' });
    if (req.user.role === 'teacher') {
      const assignments = (await assignmentsFor(req)).filter(item => item.class_id && item.branch_id);
      if (!assignments.some(item => item.class_id === record.class_id && item.branch_id === record.branch_id)) return res.status(404).json({ success: false, message: 'Classwork entry not found' });
    }
    const key = fileKey(record.payload?.private_file_key);
    if (!key) return res.status(404).json({ success: false, message: 'Classwork attachment not found' });
    res.set({
      'Content-Type': record.payload.private_file_mime || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${path.basename(record.payload.private_file_name || 'classwork-file').replace(/["\r\n]/g, '')}"`,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
    });
    return res.sendFile(resolvePrivateStudyMaterialsPath(key), error => {
      if (error && !res.headersSent) res.status(404).json({ success: false, message: 'Classwork attachment not found' });
    });
  } catch (error) {
    logger.error('classwork download', error);
    return res.status(Number.isInteger(error.status) ? error.status : 500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove, download };
