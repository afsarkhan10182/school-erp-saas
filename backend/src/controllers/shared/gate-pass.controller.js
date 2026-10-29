const { Op, Transaction } = require('sequelize');
const { randomUUID } = require('node:crypto');
const { sequelize, GatePass, Student, Class } = require('~/models');
const { resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const managers = ['super_admin', 'admin', 'branch_admin'];
const reasons = ['sick', 'parent_pickup', 'doctor', 'family_emergency', 'school_event', 'other'];
const idTypes = ['school_id', 'aadhaar', 'passport', 'driving_license', 'other'];
const statuses = ['pending', 'approved', 'rejected', 'out', 'returned', 'cancelled'];
const includeStudent = {
  model: Student,
  as: 'student',
  attributes: ['id', 'first_name', 'middle_name', 'last_name', 'admission_number', 'class_id'],
  include: [{ model: Class, as: 'class', attributes: ['id', 'name'], required: false }]
};

const scopeFor = (req, options = {}) => {
  const requestedBranch = req.query?.branch_id || req.body?.branch_id || req.branchId;
  if (req.user.role === 'super_admin' && !req.schoolId) {
    throw Object.assign(new Error('Select a school first.'), { statusCode: 400 });
  }
  if (options.branchRequired && managers.includes(req.user.role) && !requestedBranch) {
    throw Object.assign(new Error('Select a branch first.'), { statusCode: 400 });
  }
  if (req.user.role === 'branch_admin' && !req.user.branch_id) {
    throw Object.assign(new Error('Branch assignment is required.'), { statusCode: 403 });
  }
  if (req.user.role === 'receptionist' && !req.user.branch_id) {
    throw Object.assign(new Error('Branch assignment is required.'), { statusCode: 403 });
  }
  const scopedReq = req.user.role === 'receptionist'
    ? { ...req, branchId: req.user.branch_id, query: { ...req.query, branch_id: req.user.branch_id }, body: { ...req.body, branch_id: req.user.branch_id } }
    : managers.includes(req.user.role) && !requestedBranch
      ? { ...req, branchId: null, user: { ...req.user, branch_id: null } }
    : req;
  return resolveSchoolBranchScope(scopedReq, options);
};
const passWhere = (scope, extra = {}) => ({
  school_id: scope.school_id,
  ...(scope.branch_id ? { branch_id: scope.branch_id } : {}),
  ...extra
});
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const actorId = req => req.user.id;
const clean = value => typeof value === 'string' ? value.trim() : '';
const createPassNumber = () => `GP-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

const list = async (req, res) => {
  try {
    const scope = await scopeFor(req);
    const where = passWhere(scope);
    if (statuses.includes(req.query.status)) where.status = req.query.status;
    if (req.query.today === 'true') {
      const now = new Date();
      where.leaving_at = { [Op.gte]: new Date(now.setHours(0, 0, 0, 0)), [Op.lt]: new Date(now.setHours(24, 0, 0, 0)) };
    }
    const query = clean(req.query.search);
    if (query) where[Op.or] = [
      { pass_no: { [Op.iLike]: `%${query}%` } },
      { collector_name: { [Op.iLike]: `%${query}%` } },
      { '$student.first_name$': { [Op.iLike]: `%${query}%` } },
      { '$student.last_name$': { [Op.iLike]: `%${query}%` } },
      { '$student.admission_number$': { [Op.iLike]: `%${query}%` } }
    ];
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = [10, 25, 50, 100].includes(Number.parseInt(req.query.limit, 10))
      ? Number.parseInt(req.query.limit, 10) : 25;
    const result = await GatePass.findAndCountAll({
      where,
      include: [includeStudent],
      order: [['leaving_at', 'DESC'], ['id', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true
    });
    return res.json({ success: true, data: result.rows, pagination: {
      page, limit, total: result.count, totalPages: Math.max(1, Math.ceil(result.count / limit))
    } });
  } catch (error) {
    return fail(res, error.statusCode || 500, error.statusCode ? error.message : 'Could not load gate passes.');
  }
};

const getById = async (req, res) => {
  try {
    const scope = await scopeFor(req);
    const pass = await GatePass.findOne({ where: passWhere(scope, { id: req.params.id }), include: [includeStudent] });
    if (!pass) return fail(res, 404, 'Gate pass not found.');
    return res.json({ success: true, data: pass });
  } catch (error) {
    return fail(res, error.statusCode || 500, error.statusCode ? error.message : 'Could not load gate pass.');
  }
};

const studentChoices = async (req, res) => {
  try {
    const scope = await scopeFor(req, { branchRequired: true });
    const search = clean(req.query.search);
    const rows = await Student.findAll({
      where: {
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        status: 'active',
        ...(search ? { [Op.or]: [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { admission_number: { [Op.iLike]: `%${search}%` } }
        ] } : {})
      },
      attributes: ['id', 'first_name', 'last_name', 'admission_number', 'class_id'],
      include: [{ model: Class, as: 'class', attributes: ['id', 'name'], required: false }],
      order: [['first_name', 'ASC']],
      limit: Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 100))
    });
    return res.json({ success: true, data: rows.map(row => {
      const student = row.toJSON ? row.toJSON() : row;
      return {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        admission_number: student.admission_number,
        class: student.class ? { id: student.class.id, name: student.class.name } : null
      };
    }) });
  } catch (error) {
    return fail(res, error.statusCode || 500, error.statusCode ? error.message : 'Could not load eligible students.');
  }
};

const create = async (req, res) => {
  try {
    const scope = await scopeFor(req, { branchRequired: true });
    const body = req.body || {};
    const studentId = clean(body.student_id);
    const reason = clean(body.reason);
    const leavingAt = new Date(body.leaving_at);
    const collectorName = clean(body.collector_name);
    const relation = clean(body.collector_relation);
    const phone = clean(body.collector_phone);
    const idType = clean(body.collector_id_type);
    const idLast4 = clean(body.collector_id_last4);
    if (!studentId || !reasons.includes(reason) || Number.isNaN(leavingAt.getTime()) ||
        !collectorName || collectorName.length > 120 || !relation || relation.length > 60 ||
        !/^[+\d\s()-]{7,24}$/.test(phone) || !idTypes.includes(idType) || !/^\d{4}$/.test(idLast4)) {
      return fail(res, 400, 'Enter a valid student, departure reason/time, collector details, and the last four ID digits.');
    }
    if (body.expected_return_at && Number.isNaN(new Date(body.expected_return_at).getTime())) {
      return fail(res, 400, 'Expected return time is invalid.');
    }
    const student = await Student.findOne({
      where: { id: studentId, school_id: scope.school_id, branch_id: scope.branch_id, status: 'active' },
      attributes: ['id']
    });
    if (!student) return fail(res, 400, 'Choose an active student from the selected branch.');
    const manager = managers.includes(req.user.role);
    const pass = await GatePass.create({
      pass_no: createPassNumber(), school_id: scope.school_id, branch_id: scope.branch_id,
      student_id: student.id, reason, note: clean(body.note).slice(0, 500) || null,
      leaving_at: leavingAt, expected_return_at: body.expected_return_at || null,
      collector_name: collectorName, collector_relation: relation, collector_phone: phone,
      collector_id_type: idType, collector_id_last4: idLast4,
      gate_name: clean(body.gate_name).slice(0, 80) || 'Main Gate',
      internal_notes: clean(body.internal_notes).slice(0, 500) || null,
      status: manager ? 'approved' : 'pending', created_by: actorId(req),
      ...(manager ? { approved_by: actorId(req), approved_at: new Date() } : {})
    });
    const result = await GatePass.findByPk(pass.id, { include: [includeStudent] });
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return fail(res, error.statusCode || 500, error.statusCode ? error.message : 'Could not issue gate pass.');
  }
};

const transition = action => async (req, res) => {
  try {
    const scope = await scopeFor(req);
    const result = await sequelize.transaction(async transaction => {
      const pass = await GatePass.findOne({
        where: passWhere(scope, { id: req.params.id }),
        transaction,
        lock: Transaction.LOCK.UPDATE
      });
      if (!pass) return { status: 404, message: 'Gate pass not found.' };
      const now = new Date();
      if (action === 'approve' || action === 'reject') {
        if (pass.status !== 'pending') return { status: 409, message: 'Only a pending pass can be approved or rejected.' };
        await pass.update(action === 'approve'
          ? { status: 'approved', approved_by: actorId(req), approved_at: now }
          : { status: 'rejected', decided_by: actorId(req), decision_note: clean(req.body?.reason).slice(0, 500) || null }, { transaction });
      } else if (action === 'out') {
        if (pass.status !== 'approved') return { status: 409, message: 'Only an approved pass can be marked out.' };
        await pass.update({ status: 'out', out_by: actorId(req), actual_out_at: now }, { transaction });
      } else if (action === 'return') {
        if (pass.status !== 'out') return { status: 409, message: 'Only a student currently marked out can be checked back in.' };
        await pass.update({ status: 'returned', returned_by: actorId(req), returned_at: now }, { transaction });
      } else if (action === 'cancel') {
        if (!['pending', 'approved'].includes(pass.status)) return { status: 409, message: 'Only a pending or approved pass can be cancelled.' };
        if (!managers.includes(req.user.role) && pass.created_by !== actorId(req)) return { status: 403, message: 'Only the issuer or a school administrator can cancel this pass.' };
        await pass.update({ status: 'cancelled', cancelled_by: actorId(req), cancelled_at: now }, { transaction });
      }
      return { status: 200, id: pass.id };
    });
    if (result.status !== 200) return fail(res, result.status, result.message);
    return getById({ ...req, params: { ...req.params, id: result.id } }, res);
  } catch (error) {
    return fail(res, error.statusCode || 500, error.statusCode ? error.message : 'Could not update gate pass.');
  }
};

const terminalLookup = async (req, res) => {
  try {
    const scope = await scopeFor(req);
    const code = clean(req.params.code);
    let pass = await GatePass.findOne({
      where: passWhere(scope, { pass_no: code }), include: [includeStudent]
    });
    if (!pass) {
      const students = await Student.findAll({
        where: { school_id: scope.school_id, ...(scope.branch_id ? { branch_id: scope.branch_id } : {}), admission_number: code, status: 'active' },
        attributes: ['id']
      });
      if (students.length !== 1) return fail(res, students.length ? 409 : 404, students.length ? 'Student code matches more than one branch; select a branch.' : 'No active gate pass or student matches this code.');
      const passes = await GatePass.findAll({
        where: passWhere(scope, { student_id: students[0].id, status: ['approved', 'out'] }),
        include: [includeStudent], order: [['created_at', 'DESC']], limit: 2
      });
      if (passes.length !== 1) return fail(res, passes.length ? 409 : 404, passes.length ? 'More than one active pass exists for this student. Scan the pass number.' : 'This student has no approved or active gate pass.');
      [pass] = passes;
    }
    if (!['approved', 'out'].includes(pass.status)) return fail(res, 409, `This pass is ${pass.status}; it cannot be used at the gate.`);
    const { student } = pass;
    return res.json({ success: true, data: {
      id: pass.id, pass_no: pass.pass_no, status: pass.status, reason: pass.reason,
      gate_name: pass.gate_name, leaving_at: pass.leaving_at, expected_return_at: pass.expected_return_at,
      collector_name: pass.collector_name, collector_relation: pass.collector_relation,
      student: student && { id: student.id, name: [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' '), admission_number: student.admission_number, class_name: student.class?.name || null }
    } });
  } catch (error) {
    return fail(res, error.statusCode || 500, error.statusCode ? error.message : 'Could not look up gate code.');
  }
};

module.exports = {
  list, getById, create, studentChoices, terminalLookup,
  approve: transition('approve'), reject: transition('reject'),
  markOut: transition('out'), markReturned: transition('return'), cancel: transition('cancel')
};
