const { Op } = require('sequelize');
const {
  DynamicEntityRecord,
  Student,
  Class,
  Section,
  StudentParent,
  Parent,
  User,
  School,
  Branch,
  Homework,
  FeeInvoice
} = require('~/models');
const { ENTITIES } = require('~/config/dynamic-entities');
const { logger } = require('~/utils/shared/logger');
const { generateStudentIdCard } = require('~/services/academic/id-card.service');
const {
  schoolWhere: scopedWhere,
  schoolIdOf,
  branchIdOf,
  resolveSchoolBranchScope
} = require('~/utils/shared/requestScope');

const schoolWhere = (req, extra = {}) => scopedWhere(req, extra);

const getEntity = name => {
  const entity = ENTITIES[name];
  if (!entity) {
    const error = new Error('Unknown entity');
    error.status = 404;
    throw error;
  }
  return entity;
};

const errorStatus = error => Number.isInteger(error.status) ? error.status : 500;

const serialize = record => {
  const json = record.toJSON ? record.toJSON() : record;
  return {
    ...json,
    ...(json.payload || {})
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
  const missing = fields.find(field =>
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
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id, entity_type: entityType };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.class_id) where.class_id = req.query.class_id;
    if (req.query.student_id) where.student_id = req.query.student_id;
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
    const { count, rows } = await DynamicEntityRecord.findAndCountAll({
      where,
      include: [
        { model: Student, as: 'student', attributes: ['id', 'first_name', 'last_name', 'admission_number'], required: false },
        { model: Class, as: 'class', attributes: ['id', 'name'], required: false },
        { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email', 'status'], required: false }
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
    const title = body.title || body.name || body.subject || `${entityType} ${Date.now()}`;
    const emptyToNull = value => (value === '' || value === undefined ? null : value);
    const scope = await resolveSchoolBranchScope(req, { branchRequired: false });
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const record = await DynamicEntityRecord.findOne({
      where: { id: req.params.id, ...schoolWhere(req), entity_type: req.params.entity }
    });
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    const body = req.body || {};
    await record.update({
      title: body.title || body.name || record.title,
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const record = await DynamicEntityRecord.findOne({
      where: { id: req.params.id, ...schoolWhere(req), entity_type: req.params.entity }
    });
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    await record.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('dynamic-entities delete', error);
    return res.status(500).json({ success: false, message: error.message });
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
    const emptyToNull = value => (value === '' || value === undefined ? null : value);
    const scope = await resolveSchoolBranchScope(req, { branchRequired: false });
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

const runAction = async (req, res) => {
  try {
    const { entity, id, action } = req.params;
    const meta = getEntity(entity);
    const record = await DynamicEntityRecord.findOne({
      where: { id, ...schoolWhere(req), entity_type: entity }
    });
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });

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
      await record.update({
        status: 'exited',
        payload: { ...(record.payload || {}), exit_time: new Date().toISOString() },
        updated_by: req.user.id
      });
      return res.json({ success: true, data: { record: serialize(record) } });
    }

    const nextStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action;
    if (meta.actions && !meta.actions.includes(action) && !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action not allowed' });
    }
    await record.update({ status: nextStatus, updated_by: req.user.id });
    return res.json({ success: true, data: { record: serialize(record) } });
  } catch (error) {
    logger.error('dynamic-entities action', error);
    return res.status(500).json({ success: false, message: error.message });
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
    return res.json({ success: true, data: { school: { id: school.id, name: school.name }, classes, custom_fields: customFields } });
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
    return res.status(201).json({ success: true, message: 'Application submitted', data: { id: record.id } });
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
        include: [{ model: User, as: 'user', attributes: ['id', 'email', 'status', 'role'], required: false }],
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
        attributes: ['id', 'first_name', 'last_name', 'admission_number', 'admission_date', 'current_class', 'status', 'documents'],
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
                .map(([key, value]) => `${documents.custom_field_labels?.[key] || key}: ${value === true ? 'Yes' : value}`)
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
    const scopedStudentWhere = extra => {
      const where = schoolWhere(req, extra);
      const branchId = branchIdOf(req);
      if (branchId) where.branch_id = branchId;
      return where;
    };
    if (Array.isArray(rowUpdates)) {
      if (!rowUpdates.length) {
        return res.status(400).json({ success: false, message: 'students[] is required' });
      }
      const allowedKeys = [
        'admission_number', 'roll_number', 'first_name', 'last_name', 'admission_date',
        'category_id', 'gender', 'date_of_birth', 'blood_group', 'mother_tongue',
        'religion', 'caste', 'email', 'phone', 'city', 'state', 'address',
        'class_id', 'section_id', 'status', 'academic_year', 'notes'
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
            if (row.updates?.[key] !== undefined) clean[key] = row.updates[key] === '' ? null : row.updates[key];
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
      return res.status(400).json({ success: false, message: 'student_ids and updates are required' });
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
      return res.status(400).json({ success: false, message: 'student_ids and to_branch_id are required' });
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
      return res.status(400).json({ success: false, message: 'Selected students are already in this branch' });
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

const portalDashboard = async (req, res) => {
  try {
    const role = req.user.role;
    if (role === 'student') {
      const student = await Student.findOne({ where: { user_id: req.user.id } });
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not linked' });
      const [homeworks, invoices, entityRecords] = await Promise.all([
        Homework.findAll({
          where: { school_id: student.school_id, class_id: student.class_id },
          order: [['due_date', 'DESC']],
          limit: 20
        }),
        FeeInvoice.findAll({
          where: { student_id: student.id },
          order: [['created_at', 'DESC']],
          limit: 20
        }).catch(() => []),
        DynamicEntityRecord.findAll({
          where: { school_id: student.school_id, student_id: student.id },
          order: [['created_at', 'DESC']],
          limit: 20
        })
      ]);
      return res.json({
        success: true,
        data: { kind: 'student', student, homeworks, invoices, records: entityRecords }
      });
    }
    if (role === 'parent') {
      const parent = await Parent.findOne({
        where: { user_id: req.user.id },
        include: [{ model: Student, as: 'students' }]
      });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not linked' });
      return res.json({ success: true, data: { kind: 'parent', parent, students: parent.students || [] } });
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

const createStudentLogin = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { id: req.params.studentId, ...schoolWhere(req) } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (student.user_id) return res.status(400).json({ success: false, message: 'Login already exists' });
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
    if (!parent.user_id) return res.status(400).json({ success: false, message: 'No login account' });
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
    if (parent.user_id) return res.status(400).json({ success: false, message: 'Login already exists' });
    const email = req.body.email || parent.guardian_email || parent.father_email || parent.mother_email;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const password = req.body.password || `Par${Math.random().toString(36).slice(-8)}A1`;
    const nameParts = String(parent.guardian_name || 'Parent').trim().split(/\s+/);
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
  createStudentLogin,
  setParentAuthentication,
  createParentLogin
};
