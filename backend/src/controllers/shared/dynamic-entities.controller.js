const { Op } = require('sequelize');
const {
  DynamicEntityRecord,
  sequelize,
  Student,
  AcademicCalendar,
  Class,
  Section,
  StudentParent,
  Parent,
  User,
  School,
  Branch,
  Homework,
  HomeworkSubmission,
  FeeInvoice,
  FeePayment,
  AttendanceRecord,
  AttendanceSession,
  ExamResult,
  Exam,
  ReportCardSetup,
  ReportCardSetupExam,
  ReportTemplate,
  TimetableSlot,
  Timetable,
  Subject,
  LibraryBook,
  LibraryIssue,
  StudentTransport,
  HostelAllocation,
  Hostel,
  HostelRoom
} = require('~/models');
const { ENTITIES } = require('~/config/dynamic-entities');
const { logger } = require('~/utils/shared/logger');
const { generateStudentIdCard } = require('~/services/academic/id-card.service');
const ReportCardService = require('~/services/academic/report-card.service');
const { calculateWeightedReportCard } = require('~/utils/academic/weightedReportCard');
const {
  generatePDFReportCard: renderExamReportCard,
  getReportCardAttendance
} = require('~/controllers/academic/exam-reports/exam-reports.controller');
const {
  schoolWhere: scopedWhere,
  schoolIdOf,
  resolveSchoolBranchScope
} = require('~/utils/shared/requestScope');
const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');
const { getTeacherStudentWhere } = require('~/utils/academic/teacherStudentScope');

const schoolWhere = (req, extra = {}) => scopedWhere(req, extra);
const assertReceptionistBranch = req => {
  if (req.user?.role === 'receptionist' && !req.user.branch_id) {
    throw Object.assign(new Error('Branch assignment is required.'), { status: 403 });
  }
};
const isTeacherLiveClass = req =>
  req.user?.role === 'teacher' && req.params?.entity === 'live_class';
const assertLiveClassBranch = req => {
  if (isTeacherLiveClass(req) && !req.user.branch_id) {
    throw Object.assign(new Error('Branch assignment is required.'), { status: 403 });
  }
};
const entityWhere = (req, extra = {}) => {
  assertReceptionistBranch(req);
  assertLiveClassBranch(req);
  const where = schoolWhere(req, extra);
  if (['accountant', 'receptionist'].includes(req.user?.role) && req.user.branch_id) {
    where.branch_id = req.user.branch_id;
  }
  if (isTeacherLiveClass(req)) where.branch_id = req.user.branch_id;
  return where;
};
const resolveEntityScope = (req, options) => {
  assertReceptionistBranch(req);
  assertLiveClassBranch(req);
  return resolveSchoolBranchScope(req, {
    ...options,
    lockAssignedBranch:
      isTeacherLiveClass(req) || ['accountant', 'receptionist'].includes(req.user?.role)
  });
};

const teacherAttachmentAssignments = async req => {
  const schoolId = schoolIdOf(req);
  const year = await getCurrentAcademicYearForSchool(schoolId);
  const assigned = await getTeacherStudentWhere({
    teacherId: req.user.id,
    schoolId,
    academicYear: year?.code || year?.name
  });
  return (assigned[Op.or] || []).map(({ class_id, branch_id }) => ({ class_id, branch_id }));
};

const teacherCanAccessAttachment = async (req, classId, branchId) => {
  if (req.user?.role !== 'teacher') return true;
  if (!classId || !branchId) return false;
  const assignments = await teacherAttachmentAssignments(req);
  return assignments.some(
    assignment => assignment.class_id === classId && assignment.branch_id === branchId
  );
};

const getEntity = name => {
  const entity = ENTITIES[name];
  if (!entity) {
    const error = new Error('Unknown entity');
    error.status = 404;
    throw error;
  }
  return entity;
};

const requiredEntityNameError = (entityType, body = {}) => {
  const label =
    entityType === 'enquiry' ? 'Student name' : entityType === 'visitor' ? 'Visitor name' : null;
  return label && !String(body?.title || body?.name || '').trim() ? `${label} is required` : null;
};

const errorStatus = error => (Number.isInteger(error.status) ? error.status : 500);

const serialize = record => {
  const json = record.toJSON ? record.toJSON() : record;
  const payload = { ...(json.payload || {}) };
  delete payload.class;
  delete payload.student;
  delete payload.user;
  return {
    ...json,
    ...payload
  };
};

const ADMISSION_EXTRA_KEYS = [
  'present_address',
  'permanent_address',
  'sibling_admission_number',
  'sibling_details',
  'previous_school_name',
  'previous_school_qualification',
  'previous_school_remarks',
  'transport_route_id',
  'transport_route',
  'transport_vehicle_id',
  'transport_vehicle',
  'transport_stop_id',
  'transport_stop'
];

const admissionCustomFields = async (schoolId, showKey) => {
  const records = await DynamicEntityRecord.findAll({
    where: { school_id: schoolId, entity_type: 'custom_field', status: 'active' },
    order: [['created_at', 'ASC']]
  });
  return records
    .map(record => ({ id: record.id, ...(record.payload || {}) }))
    .filter(field => field.is_active !== false && field[showKey] === true);
};

const validateCustomValues = (fields, values = {}) => {
  const missing = fields.find(
    field =>
      field.is_required && field.field_type !== 'checkbox' && !String(values[field.id] || '').trim()
  );
  if (missing) {
    const error = new Error(`${missing.title || 'Custom field'} is required`);
    error.status = 400;
    throw error;
  }
};

const list = async (req, res) => {
  try {
    const entityType = req.params.entity;
    getEntity(entityType);
    const scope = await resolveEntityScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id, entity_type: entityType };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.class_id) where.class_id = req.query.class_id;
    if (req.query.student_id) where.student_id = req.query.student_id;
    const search = String(req.query.search || '')
      .trim()
      .slice(0, 100);
    if (entityType === 'visitor' && search) {
      where[Op.or] = ['title', 'reference_no', 'notes'].map(field => ({
        [field]: { [Op.iLike]: `%${search}%` }
      }));
    }
    if (entityType === 'enquiry' && search) {
      const term = `%${search}%`;
      where[Op.or] = [
        ...['title', 'reference_no', 'notes', 'status'].map(field => ({
          [field]: { [Op.iLike]: term }
        })),
        sequelize.where(sequelize.cast(sequelize.col('payload'), 'text'), {
          [Op.iLike]: term
        })
      ];
    }
    if (entityType === 'attachment' && req.user?.role === 'teacher') {
      const assignments = await teacherAttachmentAssignments(req);
      const allowed = assignments.filter(
        assignment =>
          (!where.branch_id || assignment.branch_id === where.branch_id) &&
          (!where.class_id || assignment.class_id === where.class_id)
      );
      where[Op.and] = [{ [Op.or]: allowed.length ? allowed : [{ class_id: { [Op.is]: null } }] }];
    }
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
    const { count, rows } = await DynamicEntityRecord.findAndCountAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number'],
          required: false
        },
        { model: Class, as: 'class', attributes: ['id', 'name'], required: false },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'status'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });
    return res.json({
      success: true,
      data: {
        records: rows.map(serialize),
        pagination: { page, limit, total: count, totalPages: Math.max(Math.ceil(count / limit), 1) }
      }
    });
  } catch (error) {
    logger.error('dynamic-entities list', error);
    return res.status(errorStatus(error)).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const entityType = req.params.entity;
    getEntity(entityType);
    const body = req.body || {};
    const nameError = requiredEntityNameError(entityType, body);
    if (nameError) {
      return res.status(400).json({ success: false, message: nameError });
    }
    const title = body.title || body.name || body.subject || `${entityType} ${Date.now()}`;
    const emptyToNull = value => (value === '' || value === undefined ? null : value);
    const scope = await resolveEntityScope(req, { branchRequired: false });
    if (
      entityType === 'attachment' &&
      !(await teacherCanAccessAttachment(req, body.class_id, scope.branch_id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only upload content for an assigned class and branch'
      });
    }
    const record = await DynamicEntityRecord.create({
      entity_type: entityType,
      title,
      status: body.status || (entityType === 'admission_application' ? 'pending' : 'active'),
      reference_no: emptyToNull(body.reference_no),
      date_value: emptyToNull(body.date_value || body.date || body.due_date),
      amount: emptyToNull(body.amount),
      student_id: emptyToNull(body.student_id),
      user_id: emptyToNull(body.user_id),
      class_id: emptyToNull(body.class_id),
      related_id: emptyToNull(body.related_id),
      notes: emptyToNull(body.notes || body.description),
      payload: body,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      created_by: req.user.id
    });
    return res.status(201).json({ success: true, data: { record: serialize(record) } });
  } catch (error) {
    logger.error('dynamic-entities create', error);
    return res.status(errorStatus(error)).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const record = await DynamicEntityRecord.findOne({
      where: { id: req.params.id, ...entityWhere(req), entity_type: req.params.entity }
    });
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    const body = req.body || {};
    const nextTitle = body.title || body.name || record.title;
    const nameError = requiredEntityNameError(req.params.entity, { title: nextTitle });
    if (nameError) {
      return res.status(400).json({ success: false, message: nameError });
    }
    const classId = body.class_id !== undefined ? body.class_id : record.class_id;
    if (
      req.params.entity === 'attachment' &&
      !(await teacherCanAccessAttachment(req, classId, record.branch_id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage content for an assigned class and branch'
      });
    }
    await record.update({
      title: nextTitle,
      status: body.status || record.status,
      reference_no: body.reference_no !== undefined ? body.reference_no : record.reference_no,
      date_value: body.date_value || body.date || record.date_value,
      amount: body.amount !== undefined ? body.amount : record.amount,
      student_id: body.student_id !== undefined ? body.student_id : record.student_id,
      user_id: body.user_id !== undefined ? body.user_id : record.user_id,
      class_id: body.class_id !== undefined ? body.class_id : record.class_id,
      notes: body.notes !== undefined ? body.notes : record.notes,
      payload: { ...(record.payload || {}), ...body },
      updated_by: req.user.id
    });
    return res.json({ success: true, data: { record: serialize(record) } });
  } catch (error) {
    logger.error('dynamic-entities update', error);
    return res.status(errorStatus(error)).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const record = await DynamicEntityRecord.findOne({
      where: { id: req.params.id, ...entityWhere(req), entity_type: req.params.entity }
    });
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    if (
      req.params.entity === 'attachment' &&
      !(await teacherCanAccessAttachment(req, record.class_id, record.branch_id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage content for an assigned class and branch'
      });
    }
    await record.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('dynamic-entities delete', error);
    return res.status(errorStatus(error)).json({ success: false, message: error.message });
  }
};

const bulkCreate = async (req, res) => {
  try {
    const entityType = req.params.entity;
    getEntity(entityType);
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) {
      return res.status(400).json({ success: false, message: 'items[] is required' });
    }
    const invalidIndex = items.findIndex(item => requiredEntityNameError(entityType, item));
    if (invalidIndex !== -1) {
      return res.status(400).json({
        success: false,
        message: `Item ${invalidIndex + 1}: ${requiredEntityNameError(entityType, items[invalidIndex])}`
      });
    }
    const emptyToNull = value => (value === '' || value === undefined ? null : value);
    const scope = await resolveEntityScope(req, { branchRequired: false });
    if (entityType === 'attachment' && req.user?.role === 'teacher') {
      const assignments = await teacherAttachmentAssignments(req);
      const allowed = items.every(
        item =>
          item.class_id &&
          scope.branch_id &&
          assignments.some(
            assignment =>
              assignment.class_id === item.class_id && assignment.branch_id === scope.branch_id
          )
      );
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'You can only upload content for assigned classes and branches'
        });
      }
    }
    const rows = items.map(body => ({
      entity_type: entityType,
      title: body.title || body.name || `${entityType}`,
      status: body.status || 'active',
      date_value: emptyToNull(body.date_value || body.date),
      amount: emptyToNull(body.amount),
      student_id: emptyToNull(body.student_id),
      user_id: emptyToNull(body.user_id),
      class_id: emptyToNull(body.class_id),
      notes: emptyToNull(body.notes),
      payload: body,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      created_by: req.user.id
    }));
    const records = await DynamicEntityRecord.bulkCreate(rows);
    return res.status(201).json({ success: true, data: { records: records.map(serialize) } });
  } catch (error) {
    logger.error('dynamic-entities bulk', error);
    return res.status(errorStatus(error)).json({ success: false, message: error.message });
  }
};

const runAction = async (req, res) => {
  try {
    const { entity, id, action } = req.params;
    const meta = getEntity(entity);
    const record = await DynamicEntityRecord.findOne({
      where: { id, ...entityWhere(req), entity_type: entity }
    });
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    if (
      entity === 'attachment' &&
      !(await teacherCanAccessAttachment(req, record.class_id, record.branch_id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage content for an assigned class and branch'
      });
    }

    if (action === 'approve' && entity === 'admission_application') {
      const payload = record.payload || {};
      const klass = payload.class_id ? await Class.findByPk(payload.class_id) : null;
      const className = klass?.name || payload.class_name || 'NA';
      const student = await Student.create({
        admission_number: payload.admission_number || `ONL${Date.now()}`,
        first_name: payload.first_name || record.title,
        last_name: payload.last_name || '',
        date_of_birth: payload.date_of_birth || '2010-01-01',
        gender: payload.gender || 'male',
        email: payload.email || null,
        phone: payload.phone || null,
        address: payload.address || payload.present_address || null,
        city: payload.city || null,
        state: payload.state || null,
        documents: {
          admission_extras: ADMISSION_EXTRA_KEYS.reduce((extras, key) => {
            if (payload[key] !== undefined) extras[key] = payload[key] || null;
            return extras;
          }, {}),
          custom_fields: payload.custom_fields || {},
          custom_field_labels: payload.custom_field_labels || {}
        },
        admission_class: className,
        current_class: className,
        class_id: payload.class_id || null,
        section_id: payload.section_id || null,
        academic_year: payload.academic_year || null,
        school_id: record.school_id,
        branch_id: record.branch_id,
        status: 'active',
        created_by: req.user.id
      });
      await record.update({
        status: 'approved',
        student_id: student.id,
        payload: { ...payload, student_id: student.id },
        updated_by: req.user.id
      });
      return res.json({ success: true, data: { record: serialize(record), student } });
    }

    if (action === 'checkout' && entity === 'visitor') {
      if (record.status !== 'exited') {
        await record.update({
          status: 'exited',
          payload: { ...(record.payload || {}), exit_time: new Date().toISOString() },
          updated_by: req.user.id
        });
      }
      return res.json({ success: true, data: { record: serialize(record) } });
    }

    const nextStatus =
      action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action;
    if (meta.actions && !meta.actions.includes(action) && !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action not allowed' });
    }
    await record.update({ status: nextStatus, updated_by: req.user.id });
    return res.json({ success: true, data: { record: serialize(record) } });
  } catch (error) {
    logger.error('dynamic-entities action', error);
    return res.status(errorStatus(error)).json({ success: false, message: error.message });
  }
};

const publicClasses = async (req, res) => {
  try {
    const school = await School.findOne({ where: { code: req.params.schoolCode } });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    const classes = await Class.findAll({
      where: { school_id: school.id },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    const customFields = await admissionCustomFields(school.id, 'show_on_public_admission');
    return res.json({
      success: true,
      data: { school: { id: school.id, name: school.name }, classes, custom_fields: customFields }
    });
  } catch (error) {
    logger.error('public classes', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const publicAdmission = async (req, res) => {
  try {
    const school = await School.findOne({ where: { code: req.params.schoolCode } });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    const body = req.body || {};
    if (!body.first_name || !body.phone) {
      return res.status(400).json({ success: false, message: 'first_name and phone are required' });
    }
    const customFields = await admissionCustomFields(school.id, 'show_on_public_admission');
    validateCustomValues(customFields, body.custom_fields);

    let classId = null;
    if (body.class_id) {
      const klass = await Class.findOne({ where: { id: body.class_id, school_id: school.id } });
      if (!klass) return res.status(400).json({ success: false, message: 'Invalid class' });
      classId = klass.id;
    }

    const branches = await Branch.findAll({
      where: { school_id: school.id, status: 'active' },
      order: [
        ['is_main_branch', 'DESC'],
        ['created_at', 'ASC']
      ],
      limit: 2
    });
    const branchId = branches.length === 1 || branches[0]?.is_main_branch ? branches[0].id : null;
    const payload = {
      first_name: String(body.first_name || '').trim(),
      last_name: String(body.last_name || '').trim(),
      phone: String(body.phone || '').trim(),
      email: String(body.email || '').trim(),
      class_id: classId,
      date_of_birth: body.date_of_birth || null,
      gender: body.gender || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      notes: body.notes || null
    };
    ADMISSION_EXTRA_KEYS.forEach(key => {
      if (body[key] !== undefined) payload[key] = body[key] || null;
    });
    payload.custom_fields = body.custom_fields || {};
    payload.custom_field_labels = customFields.reduce((labels, field) => {
      labels[field.id] = field.title || field.id;
      return labels;
    }, {});

    const record = await DynamicEntityRecord.create({
      entity_type: 'admission_application',
      title: (payload.first_name + ' ' + payload.last_name).trim(),
      status: 'pending',
      date_value: new Date().toISOString().slice(0, 10),
      class_id: classId,
      notes: payload.notes,
      payload,
      school_id: school.id,
      branch_id: branchId
    });
    return res
      .status(201)
      .json({ success: true, message: 'Application submitted', data: { id: record.id } });
  } catch (error) {
    logger.error('public admission', error);
    return res.status(errorStatus(error)).json({ success: false, message: error.message });
  }
};

const studentReports = async (req, res) => {
  try {
    const type = req.params.type;
    const where = schoolWhere(req);
    if (req.query.class_id) where.class_id = req.query.class_id;
    if (req.query.section_id) where.section_id = req.query.section_id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.from_date || req.query.to_date) {
      where.admission_date = {};
      if (req.query.from_date) where.admission_date[Op.gte] = req.query.from_date;
      if (req.query.to_date) where.admission_date[Op.lte] = req.query.to_date;
    }

    if (type === 'credentials') {
      const students = await Student.findAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'status', 'role'],
            required: false
          }
        ],
        attributes: ['id', 'first_name', 'last_name', 'admission_number', 'current_class', 'email']
      });
      return res.json({
        success: true,
        data: {
          rows: students.map(s => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name || ''}`.trim(),
            admission_number: s.admission_number,
            class_name: s.current_class,
            login_email: s.user?.email || s.email || '—',
            login_status: s.user?.status || 'no account'
          }))
        }
      });
    }

    if (type === 'admissions') {
      const students = await Student.findAll({
        where,
        attributes: [
          'id',
          'first_name',
          'last_name',
          'admission_number',
          'admission_date',
          'current_class',
          'status',
          'documents'
        ],
        order: [['admission_date', 'DESC']],
        limit: 500
      });
      return res.json({
        success: true,
        data: {
          rows: students.map(student => {
            const row = student.toJSON();
            const documents = row.documents || {};
            return {
              ...row,
              ...(documents.admission_extras || {}),
              custom_fields: Object.entries(documents.custom_fields || {})
                .map(
                  ([key, value]) =>
                    `${documents.custom_field_labels?.[key] || key}: ${value === true ? 'Yes' : value}`
                )
                .join(', ')
            };
          })
        }
      });
    }

    if (type === 'class-section') {
      const students = await Student.findAll({
        where: { ...schoolWhere(req), status: { [Op.ne]: 'deleted' } },
        include: [
          { model: Class, as: 'class', attributes: ['id', 'name'], required: false },
          { model: Section, as: 'sectionInfo', attributes: ['id', 'name'], required: false }
        ],
        attributes: ['id', 'class_id', 'section_id']
      });
      const map = {};
      students.forEach(s => {
        const key = `${s.class?.name || s.class_id || 'Unassigned'} / ${s.sectionInfo?.name || '—'}`;
        map[key] = (map[key] || 0) + 1;
      });
      return res.json({
        success: true,
        data: { rows: Object.entries(map).map(([label, count]) => ({ label, count })) }
      });
    }

    if (type === 'siblings') {
      const links = await StudentParent.findAll({
        include: [
          {
            model: Student,
            as: 'student',
            where: schoolWhere(req),
            attributes: ['id', 'first_name', 'last_name', 'admission_number', 'current_class']
          },
          { model: Parent, as: 'parent', attributes: ['id', 'guardian_name', 'father_name'] }
        ]
      });
      const byParent = {};
      links.forEach(link => {
        const pid = link.parent_id;
        if (!byParent[pid]) {
          byParent[pid] = {
            parent: link.parent?.guardian_name || link.parent?.father_name || pid,
            students: []
          };
        }
        if (link.student) {
          byParent[pid].students.push(link.student);
        }
      });
      const rows = Object.values(byParent).filter(row => row.students.length > 1);
      return res.json({ success: true, data: { rows } });
    }

    return res.status(404).json({ success: false, message: 'Unknown report' });
  } catch (error) {
    logger.error('dynamic-entities report', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const bulkEditStudents = async (req, res) => {
  try {
    const { student_ids, updates, students: rowUpdates } = req.body;
    const scopedStudentWhere = extra => schoolWhere(req, extra);
    if (Array.isArray(rowUpdates)) {
      if (!rowUpdates.length) {
        return res.status(400).json({ success: false, message: 'students[] is required' });
      }
      const allowedKeys = [
        'admission_number',
        'roll_number',
        'first_name',
        'last_name',
        'admission_date',
        'category_id',
        'gender',
        'date_of_birth',
        'blood_group',
        'mother_tongue',
        'religion',
        'caste',
        'email',
        'phone',
        'city',
        'state',
        'address',
        'class_id',
        'section_id',
        'status',
        'academic_year',
        'notes'
      ];
      const transaction = await Student.sequelize.transaction();
      try {
        let updated = 0;
        for (const row of rowUpdates) {
          const student = await Student.findOne({
            where: scopedStudentWhere({ id: row.id }),
            transaction
          });
          if (!student) continue;
          const clean = {};
          allowedKeys.forEach(key => {
            if (row.updates?.[key] !== undefined)
              clean[key] = row.updates[key] === '' ? null : row.updates[key];
          });
          if (clean.class_id) {
            const klass = await Class.findByPk(clean.class_id, { transaction });
            if (klass) clean.current_class = klass.name;
          }
          await student.update({ ...clean, updated_by: req.user.id }, { transaction });
          updated += 1;
        }
        await transaction.commit();
        return res.json({ success: true, message: `Updated ${updated} students` });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }
    if (!Array.isArray(student_ids) || !updates) {
      return res
        .status(400)
        .json({ success: false, message: 'student_ids and updates are required' });
    }
    const allowed = {};
    ['class_id', 'section_id', 'status', 'academic_year', 'notes'].forEach(key => {
      if (updates[key] !== undefined) allowed[key] = updates[key];
    });
    if (allowed.class_id) {
      const klass = await Class.findByPk(allowed.class_id);
      if (klass) {
        allowed.current_class = klass.name;
      }
    }
    await Student.update(allowed, {
      where: scopedStudentWhere({ id: { [Op.in]: student_ids } })
    });
    return res.json({ success: true, message: `Updated ${student_ids.length} students` });
  } catch (error) {
    logger.error('bulk edit students', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const transferStudents = async (req, res) => {
  try {
    const { student_ids, to_branch_id } = req.body;
    if (!Array.isArray(student_ids) || !to_branch_id) {
      return res
        .status(400)
        .json({ success: false, message: 'student_ids and to_branch_id are required' });
    }
    const students = await Student.findAll({
      where: { id: { [Op.in]: student_ids }, ...schoolWhere(req) }
    });
    const targetBranch = await Branch.findOne({
      where: { id: to_branch_id, school_id: schoolIdOf(req), status: 'active' }
    });
    if (!targetBranch) {
      return res.status(400).json({ success: false, message: 'Invalid target branch' });
    }
    const transferable = students.filter(student => student.branch_id !== to_branch_id);
    if (!transferable.length) {
      return res
        .status(400)
        .json({ success: false, message: 'Selected students are already in this branch' });
    }
    for (const student of transferable) {
      await DynamicEntityRecord.create({
        entity_type: 'branch_transfer',
        title: `${student.first_name} ${student.last_name || ''}`.trim(),
        status: 'completed',
        student_id: student.id,
        payload: { from_branch_id: student.branch_id, to_branch_id },
        school_id: student.school_id,
        branch_id: to_branch_id,
        created_by: req.user.id
      });
      await student.update({ branch_id: to_branch_id, updated_by: req.user.id });
      if (student.user_id) {
        await User.update(
          { branch_id: to_branch_id, updated_by: req.user.id },
          { where: { id: student.user_id, school_id: student.school_id } }
        );
      }
    }
    return res.json({ success: true, message: `Transferred ${transferable.length} students` });
  } catch (error) {
    logger.error('branch transfer', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const idCard = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { id: req.params.studentId, ...schoolWhere(req) },
      include: [{ model: School, as: 'school', required: false }]
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const school = student.school || (await School.findByPk(student.school_id));
    const html = `
      <div style="width:320px;border:1px solid #333;padding:16px;font-family:sans-serif">
        <h3 style="margin:0 0 8px">${school?.name || 'School'}</h3>
        <p style="margin:0 0 4px"><strong>${student.first_name} ${student.last_name || ''}</strong></p>
        <p style="margin:0 0 4px">Adm: ${student.admission_number}</p>
        <p style="margin:0 0 4px">Class: ${student.current_class} ${student.section || ''}</p>
        <p style="margin:0">Roll: ${student.roll_number || '—'}</p>
      </div>`;
    try {
      await generateStudentIdCard(student, school || {});
    } catch (err) {
      logger.warn('id card file write skipped', err.message);
    }
    return res.json({ success: true, data: { html, kind: req.query.kind || 'id' } });
  } catch (error) {
    logger.error('id card', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentTimetableSlots = async student => {
  const where = {
    school_id: student.school_id,
    branch_id: student.branch_id,
    class_id: student.class_id,
    academic_year: student.academic_year,
    is_active: true
  };
  const include = [
    {
      model: TimetableSlot,
      as: 'slots',
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'], required: false },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'first_name', 'last_name'],
          required: false
        }
      ],
      required: false
    }
  ];
  const findTimetable = sectionId =>
    Timetable.findOne({
      where: { ...where, section_id: sectionId },
      include
    });
  const timetable =
    (student.section_id && (await findTimetable(student.section_id))) ||
    (await findTimetable(null));
  return timetable?.slots || [];
};

const buildStudentPortalData = async student => {
  const [
    homeworks,
    calendarEvents,
    invoices,
    feeSummary,
    dueInvoiceCount,
    attendanceRecords,
    examResults,
    timetableSlots,
    libraryIssues,
    libraryCatalog,
    transportAllocation,
    hostelAllocation,
    records,
    notices,
    studyMaterials
  ] = await Promise.all([
    Homework.findAll({
      where: {
        school_id: student.school_id,
        branch_id: student.branch_id,
        class_id: student.class_id,
        [Op.and]: [
          { [Op.or]: [{ section_id: null }, { section_id: student.section_id }] },
          ...(student.academic_year
            ? [{ [Op.or]: [{ academic_year: student.academic_year }, { academic_year: null }] }]
            : [])
        ]
      },
      attributes: [
        'id',
        'title',
        'description',
        'due_date',
        'academic_year',
        'class_id',
        'section_id',
        'subject_id',
        'created_at'
      ],
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name'], required: false },
        {
          model: HomeworkSubmission,
          as: 'submissions',
          where: { student_id: student.id },
          attributes: ['id', 'submission_text', 'submitted_at', 'marks', 'remarks', 'evaluated_at'],
          required: false
        }
      ],
      order: [['due_date', 'DESC']],
      limit: 20
    }).catch(() => []),
    AcademicCalendar.findAll({
      where: {
        school_id: student.school_id,
        branch_id: student.branch_id,
        day_type: { [Op.ne]: 'working' },
        ...(student.academic_year ? { academic_year: student.academic_year } : {})
      },
      attributes: ['id', 'date', 'day_type', 'description', 'academic_year'],
      order: [['date', 'ASC']],
      // shortcut: only non-working days are shown in one academic-year view; paginate if schools exceed 100 such events.
      limit: 100
    }).catch(() => []),
    FeeInvoice.findAll({
      where: { student_id: student.id },
      include: [
        {
          model: FeePayment,
          as: 'payments',
          attributes: ['id', 'receipt_number', 'payment_amount', 'payment_method', 'payment_date'],
          where: { payment_status: 'completed' },
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 20
    }).catch(() => []),
    FeeInvoice.findOne({
      where: { student_id: student.id, status: { [Op.notIn]: ['draft', 'cancelled'] } },
      attributes: [
        [
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_amount')), 0),
          'total_assigned'
        ],
        [
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('paid_amount')), 0),
          'total_paid'
        ],
        [
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('balance_amount')), 0),
          'due_balance'
        ]
      ],
      raw: true
    }).catch(() => ({ total_assigned: 0, total_paid: 0, due_balance: 0 })),
    FeeInvoice.count({
      where: {
        student_id: student.id,
        status: { [Op.notIn]: ['draft', 'cancelled'] },
        balance_amount: { [Op.gt]: 0 }
      }
    }).catch(() => 0),
    AttendanceRecord.findAll({
      where: {
        student_id: student.id,
        school_id: student.school_id,
        branch_id: student.branch_id
      },
      attributes: ['id', 'date', 'status', 'remarks'],
      include: [
        {
          model: AttendanceSession,
          as: 'session',
          attributes: ['id', 'attendance_type', 'period_number'],
          where: {
            status: 'published',
            ...(student.academic_year
              ? { [Op.or]: [{ academic_year: student.academic_year }, { academic_year: null }] }
              : {})
          },
          required: true
        }
      ],
      order: [['date', 'DESC']],
      // shortcut: 2,000 rows cover a normal year of period attendance; paginate if a school exceeds it.
      limit: 2000
    }).catch(() => []),
    ExamResult.findAll({
      where: { student_id: student.id },
      include: [
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'name', 'max_marks', 'result_status'],
          where: { result_status: true },
          required: true
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 20
    }).catch(() => []),
    Timetable && student.class_id && student.academic_year
      ? getStudentTimetableSlots(student).catch(() => [])
      : Promise.resolve([]),
    LibraryIssue
      ? LibraryIssue.findAll({
          where: { student_id: student.id },
          include: [{ model: LibraryBook, as: 'book', attributes: ['title'], required: false }],
          order: [['issue_date', 'DESC']],
          limit: 10
        }).catch(() => [])
      : [],
    LibraryBook
      ? LibraryBook.findAll({
          where: {
            school_id: student.school_id,
            [Op.or]: [{ branch_id: student.branch_id }, { branch_id: null }]
          },
          attributes: ['id', 'title', 'author', 'category', 'available', 'quantity'],
          order: [['created_at', 'DESC']],
          limit: 24
        }).catch(() => [])
      : [],
    StudentTransport
      ? StudentTransport.findOne({
          where: { student_id: student.id }
        }).catch(() => null)
      : null,
    HostelAllocation
      ? HostelAllocation.findOne({
          where: { student_id: student.id },
          include: [
            { model: Hostel, as: 'hostel', attributes: ['hostel_name'], required: false },
            { model: HostelRoom, as: 'room', attributes: ['room_number'], required: false }
          ]
        }).catch(() => null)
      : null,
    DynamicEntityRecord.findAll({
      where: { school_id: student.school_id, student_id: student.id },
      order: [['created_at', 'DESC']],
      limit: 20
    }).catch(() => []),
    DynamicEntityRecord.findAll({
      where: {
        school_id: student.school_id,
        entity_type: ['school_notice', 'notice', 'announcement'],
        [Op.or]: [{ branch_id: student.branch_id }, { branch_id: null }]
      },
      attributes: ['id', 'title', 'date_value', 'created_at', 'notes'],
      order: [['created_at', 'DESC']],
      limit: 10
    }).catch(() => []),
  ]);

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
  const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
  const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
  const attendanceRate =
    totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : null;

  return {
    student,
    homeworks,
    calendarEvents,
    invoices,
    feeSummary,
    dueInvoiceCount,
    attendance: {
      total: totalDays,
      present: presentDays,
      absent: absentDays,
      late: lateDays,
      rate: attendanceRate,
      records: attendanceRecords
    },
    examResults,
    timetable: timetableSlots,
    libraryIssues,
    libraryCatalog,
    transport: transportAllocation,
    hostel: hostelAllocation,
    records,
    notices
  };
};

const portalDashboard = async (req, res) => {
  try {
    const role = req.user.role;
    if (role === 'student') {
      const student = await Student.findOne({
        where: { user_id: req.user.id },
        include: [
          { model: Class, as: 'class', required: false },
          { model: Section, as: 'sectionInfo', required: false }
        ]
      });
      if (!student)
        return res.status(404).json({ success: false, message: 'Student profile not linked' });
      if (student.sectionInfo) student.setDataValue('section', student.sectionInfo);
      const studentData = await buildStudentPortalData(student);
      return res.json({
        success: true,
        data: {
          kind: 'student',
          ...studentData
        }
      });
    }
    if (role === 'parent') {
      const parent = await Parent.findOne({
        where: { user_id: req.user.id },
        include: [
          {
            model: Student,
            as: 'students',
            include: [
              { model: Class, as: 'class', required: false },
              { model: Section, as: 'sectionInfo', required: false }
            ]
          }
        ]
      });
      if (!parent)
        return res.status(404).json({ success: false, message: 'Parent profile not linked' });
      const parentProfile = {
        id: parent.id,
        guardian_name: parent.guardian_name,
        guardian_phone: parent.guardian_phone,
        guardian_relation: parent.guardian_relation
      };
      const students = parent.students || [];
      if (students.length === 0) {
        return res.json({
          success: true,
          data: { kind: 'parent', parent: parentProfile, students: [], activeStudent: null }
        });
      }
      const requestedStudentId = req.query.student_id;
      let activeStudent = null;
      if (requestedStudentId) {
        activeStudent = students.find(s => s.id === requestedStudentId);
      }
      if (!activeStudent) {
        activeStudent = students[0];
      }
      if (activeStudent && activeStudent.sectionInfo)
        activeStudent.setDataValue('section', activeStudent.sectionInfo);
      students.forEach(s => {
        if (s.sectionInfo) s.setDataValue('section', s.sectionInfo);
      });
      const childData = await buildStudentPortalData(activeStudent);
      return res.json({
        success: true,
        data: {
          kind: 'parent',
          parent: parentProfile,
          students,
          activeStudentId: activeStudent.id,
          ...childData
        }
      });
    }
    return res.json({
      success: true,
      data: { kind: 'staff', message: 'Staff users should use the main dashboard' }
    });
  } catch (error) {
    logger.error('portal dashboard', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const portalFeeInvoices = async (req, res) => {
  try {
    if (!['student', 'parent'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Portal access required' });
    }
    const schoolId = req.schoolId || req.user.school_id;
    if (!schoolId) {
      return res.status(403).json({ success: false, message: 'School scope is required' });
    }

    const requestedStudentId = String(req.query.student_id || '');
    let student;
    if (req.user.role === 'student') {
      student = await Student.findOne({
        where: { user_id: req.user.id, school_id: schoolId },
        attributes: ['id', 'school_id']
      });
      if (requestedStudentId && student?.id !== requestedStudentId) student = null;
    } else {
      const parent = await Parent.findOne({
        where: { user_id: req.user.id },
        include: [{
          model: Student,
          as: 'students',
          where: { school_id: schoolId },
          attributes: ['id', 'school_id'],
          required: false
        }]
      });
      const linkedStudents = parent?.students || [];
      if (requestedStudentId && !linkedStudents.some(item => item.id === requestedStudentId)) {
        return res.status(404).json({ success: false, message: 'Linked student not found' });
      }
      student = linkedStudents.find(item => item.id === requestedStudentId) || linkedStudents[0];
    }
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const { count, rows } = await FeeInvoice.findAndCountAll({
      where: { student_id: student.id, school_id: student.school_id },
      attributes: [
        'id', 'invoice_number', 'fee_type_name', 'invoice_date', 'due_date', 'total_amount',
        'discount_amount', 'late_fee_amount', 'paid_amount', 'balance_amount', 'status'
      ],
      include: [{
        model: FeePayment,
        as: 'payments',
        attributes: ['id', 'receipt_number', 'payment_amount', 'payment_method', 'payment_date'],
        where: { payment_status: 'completed' },
        required: false
      }],
      order: [['invoice_date', 'DESC'], ['invoice_number', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true
    });
    return res.json({
      success: true,
      data: rows,
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    logger.error('portal fee invoices', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const portalLibraryCatalog = async (req, res) => {
  try {
    if (!['student', 'parent'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Portal access required' });
    }

    const schoolId = req.schoolId || req.user.school_id;
    if (!schoolId)
      return res.status(403).json({ success: false, message: 'School scope is required' });
    let student;
    if (req.user.role === 'student') {
      student = await Student.findOne({ where: { user_id: req.user.id, school_id: schoolId } });
    } else {
      const parent = await Parent.findOne({
        where: { user_id: req.user.id },
        include: [{ model: Student, as: 'students', attributes: ['id', 'school_id', 'branch_id'] }]
      });
      const linkedStudents = (parent?.students || []).filter(item => item.school_id === schoolId);
      const requestedId = req.query.student_id;
      if (requestedId && !linkedStudents.some(item => item.id === requestedId)) {
        return res.status(404).json({ success: false, message: 'Linked student not found' });
      }
      student = linkedStudents.find(item => item.id === requestedId) || linkedStudents[0];
    }
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!student.school_id)
      return res.status(403).json({ success: false, message: 'School scope is required' });

    const scope = { school_id: student.school_id };
    const filters = [
      {
        [Op.or]: student.branch_id
          ? [{ branch_id: student.branch_id }, { branch_id: null }]
          : [{ branch_id: null }]
      }
    ];
    const search = String(req.query.search || '')
      .trim()
      .slice(0, 100);
    const category = String(req.query.category || '')
      .trim()
      .slice(0, 100);
    if (search) {
      filters.push({
        [Op.or]: ['title', 'author', 'category'].map(field => ({
          [field]: { [Op.iLike]: `%${search}%` }
        }))
      });
    }
    if (category) filters.push({ category });
    scope[Op.and] = filters;

    const page = Math.min(10000, Math.max(1, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
    const [{ count, rows }, categoryRows] = await Promise.all([
      LibraryBook.findAndCountAll({
        where: scope,
        attributes: ['id', 'title', 'author', 'category', 'available', 'quantity'],
        order: [['created_at', 'DESC']],
        limit,
        offset: (page - 1) * limit
      }),
      LibraryBook.findAll({
        where: {
          school_id: student.school_id,
          [Op.or]: student.branch_id
            ? [{ branch_id: student.branch_id }, { branch_id: null }]
            : [{ branch_id: null }]
        },
        attributes: ['category'],
        group: ['category'],
        order: [['category', 'ASC']]
      })
    ]);

    return res.json({
      success: true,
      data: rows,
      categories: categoryRows.map(row => row.category).filter(Boolean),
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    logger.error('portal library catalog', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const portalReportCard = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { setup_id: setupId } = req.query;
    let student;

    if (req.user.role === 'student') {
      student = await Student.findOne({
        where: { id: studentId, user_id: req.user.id, school_id: req.schoolId },
        attributes: [
          'id',
          'school_id',
          'branch_id',
          'academic_year',
          'admission_number',
          'date_of_birth',
          'first_name',
          'last_name',
          'roll_number'
        ],
        include: [
          { model: Class, as: 'class', attributes: ['id', 'name'] },
          { model: Section, as: 'sectionInfo', attributes: ['id', 'name'], required: false },
          {
            model: Parent,
            as: 'parents',
            attributes: ['father_name', 'mother_name', 'guardian_name'],
            through: { attributes: ['relationship', 'is_primary'] },
            required: false
          }
        ]
      });
    } else if (req.user.role === 'parent') {
      const parent = await Parent.findOne({
        where: { user_id: req.user.id },
        attributes: ['id', 'father_name', 'mother_name', 'guardian_name'],
        include: [
          {
            model: Student,
            as: 'students',
            where: { id: studentId, school_id: req.schoolId },
            attributes: [
              'id',
              'school_id',
              'branch_id',
              'academic_year',
              'admission_number',
              'date_of_birth',
              'first_name',
              'last_name',
              'roll_number'
            ],
            include: [
              { model: Class, as: 'class', attributes: ['id', 'name'] },
              { model: Section, as: 'sectionInfo', attributes: ['id', 'name'], required: false }
            ],
            through: { attributes: [] },
            required: true
          }
        ]
      });
      student = parent?.students?.[0];
      if (student && parent) student.parents = [parent];
    }

    if (!student)
      return res.status(404).json({ success: false, message: 'Linked student not found' });

    if (setupId) {
      const setup = await ReportCardSetup.findOne({
        where: {
          id: setupId,
          school_id: student.school_id,
          branch_id: student.branch_id,
          is_published: true
        },
        include: [
          { model: ReportTemplate, as: 'template' },
          {
            model: ReportCardSetupExam,
            as: 'examEntries',
            include: [
              {
                model: Exam,
                as: 'exam',
                include: [
                  { model: School, as: 'school', attributes: ['id', 'name', 'code'] },
                  { model: Branch, as: 'branch', attributes: ['id', 'name'] }
                ]
              }
            ]
          }
        ]
      });
      if (
        !setup ||
        !setup.template?.is_active ||
        !['student_wise', 'detailed'].includes(setup.template.report_type) ||
        ![student.school_id, null].includes(setup.template.school_id) ||
        setup.examEntries.length === 0 ||
        setup.examEntries.some(
          entry =>
            !entry.exam?.is_active ||
            !entry.exam?.result_status ||
            entry.exam.school_id !== student.school_id ||
            entry.exam.branch_id !== student.branch_id
        )
      ) {
        return res
          .status(404)
          .json({ success: false, message: 'Published report-card setup not found' });
      }

      const results = await ExamResult.findAll({
        where: {
          student_id: student.id,
          exam_id: setup.examEntries.map(entry => entry.exam_id),
          school_id: student.school_id,
          branch_id: student.branch_id
        }
      });
      if (!results.length)
        return res.status(404).json({ success: false, message: 'No published exam results found' });
      const resultByExam = Object.fromEntries(results.map(result => [result.exam_id, result]));
      const weighted = calculateWeightedReportCard(setup.examEntries, resultByExam);
      const service = new ReportCardService();
      const grade =
        weighted.percentage === null
          ? 'N/A'
          : service.calculateGrade(
              weighted.percentage,
              await service.getGradingSystem(student.school_id)
            );
      const reportResult = {
        percentage: weighted.percentage,
        marks_obtained: weighted.percentage,
        grade,
        is_absent: weighted.is_absent,
        exam_breakdown: weighted.breakdown
      };
      const firstExam = setup.examEntries[0].exam;
      student.attendance_summary = (
        await getReportCardAttendance(
          [student.id],
          student.school_id,
          student.branch_id,
          firstExam.academic_year
        )
      )[student.id];
      const pdf = await renderExamReportCard(
        { ...firstExam.toJSON(), name: setup.name, max_marks: 100 },
        [student],
        { [student.id]: reportResult },
        null,
        setup.template,
        setup.orientation
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="report-card-${student.admission_number}.pdf"`
      );
      return res.send(pdf);
    }

    let academicYear = req.query.academic_year || student.academic_year;
    if (!academicYear) {
      const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');
      academicYear = (await getCurrentAcademicYearForSchool(student.school_id))?.name;
    }
    if (!academicYear)
      return res.status(400).json({ success: false, message: 'Academic year is required' });

    const service = new ReportCardService();
    const reportCard = await service.generateReportCard(student.id, academicYear, null, {
      schoolId: student.school_id,
      branchId: student.branch_id,
      publishedOnly: true
    });
    if (!reportCard.results.length) {
      return res.status(404).json({ success: false, message: 'No published exam results found' });
    }

    const pdf = await service.generatePDFReportCard(reportCard);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-card-${student.admission_number}.pdf"`
    );
    return res.send(pdf);
  } catch (error) {
    logger.error('portal report card', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const portalReportCardSetups = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student =
      req.user.role === 'student'
        ? await Student.findOne({
            where: { id: studentId, user_id: req.user.id, school_id: req.schoolId },
            attributes: ['id', 'school_id', 'branch_id']
          })
        : (
            await Parent.findOne({
              where: { user_id: req.user.id },
              include: [
                {
                  model: Student,
                  as: 'students',
                  where: { id: studentId, school_id: req.schoolId },
                  attributes: ['id', 'school_id', 'branch_id'],
                  through: { attributes: [] },
                  required: true
                }
              ]
            })
          )?.students?.[0];
    if (!student)
      return res.status(404).json({ success: false, message: 'Linked student not found' });

    const setups = await ReportCardSetup.findAll({
      where: { school_id: student.school_id, branch_id: student.branch_id, is_published: true },
      attributes: ['id', 'name', 'template_id'],
      include: [
        {
          model: ReportTemplate,
          as: 'template',
          attributes: ['school_id', 'is_active', 'report_type']
        },
        {
          model: ReportCardSetupExam,
          as: 'examEntries',
          attributes: ['exam_id'],
          include: [
            {
              model: Exam,
              as: 'exam',
              attributes: ['school_id', 'branch_id', 'result_status', 'is_active']
            }
          ]
        }
      ],
      order: [['name', 'ASC']]
    });
    return res.json({
      success: true,
      data: setups.filter(
        setup =>
          setup.template?.is_active &&
          [student.school_id, null].includes(setup.template.school_id) &&
          ['student_wise', 'detailed'].includes(setup.template.report_type) &&
          setup.examEntries.length &&
          setup.examEntries.every(
            entry =>
              entry.exam?.is_active &&
              entry.exam?.result_status &&
              entry.exam.school_id === student.school_id &&
              entry.exam.branch_id === student.branch_id
          )
      )
    });
  } catch (error) {
    logger.error('portal report-card setups', error);
    return res
      .status(500)
      .json({ success: false, message: 'Could not load published report-card setups' });
  }
};

const parentSchoolVisitContext = async (req, studentId) => {
  if (!studentId) return null;
  const parent = await Parent.findOne({
    where: { user_id: req.user.id },
    attributes: ['id', 'guardian_name', 'guardian_phone', 'guardian_relation'],
    include: [
      {
        model: Student,
        as: 'students',
        where: { id: studentId, ...(req.schoolId ? { school_id: req.schoolId } : {}) },
        attributes: ['id', 'school_id', 'branch_id'],
        through: { attributes: [] },
        required: true
      }
    ]
  });
  return parent?.students?.[0] ? { parent, student: parent.students[0] } : null;
};

const parentSchoolVisits = async (req, res) => {
  try {
    const linked = await parentSchoolVisitContext(req, req.query.student_id);
    if (!linked)
      return res.status(404).json({ success: false, message: 'Linked student not found' });
    const records = await DynamicEntityRecord.findAll({
      where: {
        entity_type: 'visitor',
        school_id: linked.student.school_id,
        branch_id: linked.student.branch_id,
        student_id: linked.student.id,
        user_id: req.user.id
      },
      attributes: ['id', 'title', 'status', 'date_value', 'created_at', 'payload'],
      order: [
        ['date_value', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: 50
    });
    return res.json({
      success: true,
      data: {
        records: records.map(record => {
          const row = record.toJSON ? record.toJSON() : record;
          return {
            id: row.id,
            title: row.title,
            status: row.status,
            date_value: row.date_value,
            created_at: row.created_at,
            appointment_time: row.payload?.appointment_time || null,
            person_to_meet: row.payload?.person_to_meet || null,
            purpose: row.payload?.purpose || row.notes || ''
          };
        })
      }
    });
  } catch (error) {
    logger.error('parent school visits', error);
    return res.status(500).json({ success: false, message: 'Unable to load visit requests' });
  }
};

const createParentSchoolVisit = async (req, res) => {
  try {
    const {
      student_id: studentId,
      date,
      time,
      person_to_meet: personToMeet,
      purpose
    } = req.body || {};
    const timeIsValid = typeof time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    const dateIsValid =
      typeof date === 'string' &&
      date >= today &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
    const cleanPurpose = typeof purpose === 'string' ? purpose.trim() : '';
    const cleanPerson = typeof personToMeet === 'string' ? personToMeet.trim() : '';
    if (
      !dateIsValid ||
      !timeIsValid ||
      !cleanPurpose ||
      cleanPurpose.length > 2000 ||
      cleanPerson.length > 120
    ) {
      return res.status(400).json({
        success: false,
        message: 'Provide a future appointment date, valid time, and purpose.'
      });
    }
    const linked = await parentSchoolVisitContext(req, studentId);
    if (!linked)
      return res.status(404).json({ success: false, message: 'Linked student not found' });
    const { parent, student } = linked;
    if (!parent.guardian_name || !parent.guardian_phone) {
      return res.status(400).json({
        success: false,
        message: 'Update the guardian name and phone with the school before requesting a visit.'
      });
    }
    const payload = {
      visit_type: 'appointment',
      visitor_name: parent.guardian_name,
      appointment_time: time,
      person_to_meet: cleanPerson || null,
      purpose: cleanPurpose,
      guardian_relation: parent.guardian_relation
    };
    const record = await DynamicEntityRecord.create({
      entity_type: 'visitor',
      title: parent.guardian_name,
      status: 'pending',
      reference_no: parent.guardian_phone,
      date_value: date,
      student_id: student.id,
      user_id: req.user.id,
      notes: cleanPurpose,
      payload,
      school_id: student.school_id,
      branch_id: student.branch_id,
      created_by: req.user.id
    });
    const row = record.toJSON ? record.toJSON() : record;
    return res.status(201).json({
      success: true,
      data: {
        record: {
          id: row.id,
          title: row.title,
          status: row.status,
          date_value: row.date_value,
          appointment_time: payload.appointment_time,
          person_to_meet: payload.person_to_meet,
          purpose: payload.purpose
        }
      }
    });
  } catch (error) {
    logger.error('create parent school visit', error);
    return res.status(500).json({ success: false, message: 'Unable to request a school visit' });
  }
};

const createStudentLogin = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { id: req.params.studentId, ...schoolWhere(req) }
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (student.user_id)
      return res.status(400).json({ success: false, message: 'Login already exists' });
    const email = req.body.email || student.email;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const password = req.body.password || `Stu${Math.random().toString(36).slice(-8)}A1`;
    const user = await User.create({
      email,
      password,
      first_name: student.first_name,
      last_name: student.last_name || student.first_name,
      role: 'student',
      status: 'active',
      school_id: student.school_id,
      branch_id: student.branch_id
    });
    await student.update({ user_id: user.id, email });
    return res.json({
      success: true,
      data: { user_id: user.id, email, password }
    });
  } catch (error) {
    logger.error('create student login', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const setParentAuthentication = async (req, res) => {
  try {
    const parent = await Parent.findOne({ where: { id: req.params.id, ...schoolWhere(req) } });
    if (!parent) return res.status(404).json({ success: false, message: 'Not found' });
    if (!parent.user_id)
      return res.status(400).json({ success: false, message: 'No login account' });
    const user = await User.findByPk(parent.user_id);
    if (!user) return res.status(404).json({ success: false, message: 'Login not found' });
    await user.update({ status: req.body.enabled ? 'active' : 'inactive' });
    return res.json({ success: true, data: { status: user.status } });
  } catch (error) {
    logger.error('parent auth', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createParentLogin = async (req, res) => {
  try {
    const parent = await Parent.findOne({ where: { id: req.params.id, ...schoolWhere(req) } });
    if (!parent) return res.status(404).json({ success: false, message: 'Not found' });
    if (parent.user_id)
      return res.status(400).json({ success: false, message: 'Login already exists' });
    const email =
      req.body.email || parent.guardian_email || parent.father_email || parent.mother_email;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const password = req.body.password || `Par${Math.random().toString(36).slice(-8)}A1`;
    const nameParts = String(parent.guardian_name || 'Parent')
      .trim()
      .split(/\s+/);
    const user = await User.create({
      email,
      password,
      first_name: nameParts[0] || 'Parent',
      last_name: nameParts.slice(1).join(' ') || nameParts[0] || 'Parent',
      role: 'parent',
      status: 'active',
      school_id: parent.school_id,
      branch_id: parent.branch_id
    });
    await parent.update({ user_id: user.id, guardian_email: parent.guardian_email || email });
    return res.json({
      success: true,
      data: { user_id: user.id, email, password }
    });
  } catch (error) {
    logger.error('create parent login', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  list,
  create,
  update,
  remove,
  bulkCreate,
  runAction,
  publicClasses,
  publicAdmission,
  studentReports,
  bulkEditStudents,
  transferStudents,
  idCard,
  portalDashboard,
  portalFeeInvoices,
  portalLibraryCatalog,
  portalReportCard,
  portalReportCardSetups,
  parentSchoolVisits,
  createParentSchoolVisit,
  createStudentLogin,
  setParentAuthentication,
  createParentLogin
};
