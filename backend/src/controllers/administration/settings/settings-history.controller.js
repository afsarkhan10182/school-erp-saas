const { Transaction, Op } = require('sequelize');
const { sequelize, School, SettingsChangeLog } = require('~/models');

const labels = {
  dateFormat: 'Date format',
  defaultLanguage: 'Default language',
  timeFormat: 'Time format',
  defaultTheme: 'Dashboard style',
  defaultPaginationSize: 'Default pagination size',
  itemsPerPage: 'Items per page',
  showNotifications: 'Show notifications'
};

const schoolIdFor = req => req.user.role === 'super_admin' ? req.schoolId : req.user.school_id;
const stateFor = (school, field) => {
  if (field === 'dateFormat') return { exists: true, value: school.date_format };
  const settings = school.settings || {};
  return Object.prototype.hasOwnProperty.call(settings, field)
    ? { exists: true, value: settings[field] }
    : { exists: false, value: null };
};
const equal = (left, right) =>
  left.exists === right.exists && (!left.exists || JSON.stringify(left.value) === JSON.stringify(right.value));
const logOptions = {
  include: [{ association: 'actor', attributes: ['id', 'first_name', 'last_name'] }]
};

const list = async (req, res) => {
  const schoolId = schoolIdFor(req);
  if (!schoolId) return res.status(400).json({ success: false, message: 'Select a school first.' });
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const search = String(req.query.search || '').trim().slice(0, 120);
  const parseDate = value => {
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? undefined : date;
  };
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to);
  if (from === undefined || to === undefined || (from && to && from > to)) {
    return res.status(400).json({ success: false, message: 'Enter a valid date range.' });
  }
  const where = { school_id: schoolId };
  if (from || to) {
    where.created_at = {
      ...(from ? { [Op.gte]: from } : {}),
      ...(to ? { [Op.lt]: new Date(to.getTime() + 86400000) } : {})
    };
  }
  if (search) {
    const pattern = `%${search}%`;
    where[Op.or] = [
      { category: { [Op.iLike]: pattern } },
      { '$actor.first_name$': { [Op.iLike]: pattern } },
      { '$actor.last_name$': { [Op.iLike]: pattern } },
      sequelize.where(sequelize.cast(sequelize.col('changes'), 'text'), { [Op.iLike]: pattern })
    ];
  }
  const result = await SettingsChangeLog.findAndCountAll({
    ...logOptions,
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true
  });
  return res.json({
    success: true,
    data: result.rows,
    pagination: { page, limit, total: result.count, pages: Math.ceil(result.count / limit) }
  });
};

const detail = async (req, res) => {
  const schoolId = schoolIdFor(req);
  if (!schoolId) return res.status(400).json({ success: false, message: 'Select a school first.' });
  const record = await SettingsChangeLog.findOne({
    ...logOptions,
    where: { id: req.params.id, school_id: schoolId }
  });
  if (!record) return res.status(404).json({ success: false, message: 'Settings change not found.' });
  const school = await School.findByPk(schoolId, { attributes: ['settings', 'date_format'] });
  if (!school) return res.status(404).json({ success: false, message: 'School not found.' });
  const changes = Object.entries(record.changes || {}).map(([field, change]) => {
    const current = stateFor(school, field);
    return {
      field,
      label: labels[field] || field,
      before: change.before,
      saved: change.after,
      current,
      can_restore: !record.undo_of_id && equal(current, change.after)
    };
  });
  return res.json({ success: true, data: { ...record.toJSON(), changes, can_restore: changes.some(change => change.can_restore) } });
};

const undo = async (req, res) => {
  const schoolId = schoolIdFor(req);
  if (!schoolId) return res.status(400).json({ success: false, message: 'Select a school first.' });
  const fields = req.body?.fields;
  if (!Array.isArray(fields) || !fields.length || fields.length > Object.keys(labels).length || new Set(fields).size !== fields.length) {
    return res.status(400).json({ success: false, message: 'Select one or more settings to put back.' });
  }

  const result = await sequelize.transaction(async transaction => {
    const record = await SettingsChangeLog.findOne({
      where: { id: req.params.id, school_id: schoolId, undo_of_id: null },
      transaction
    });
    if (!record) return { status: 404, message: 'Settings change not found.' };
    const changes = record.changes || {};
    if (fields.some(field => !labels[field] || !changes[field])) {
      return { status: 400, message: 'The selected settings are not part of this change.' };
    }

    const school = await School.findByPk(schoolId, {
      transaction,
      lock: Transaction.LOCK.UPDATE
    });
    if (!school) return { status: 404, message: 'School not found.' };
    const stale = fields.filter(field => !equal(stateFor(school, field), changes[field].after));
    if (stale.length) {
      return { status: 409, message: 'Some selected settings have changed since this save; refresh and review them.' };
    }

    const settings = { ...(school.settings || {}) };
    const inverse = {};
    let dateFormat;
    for (const field of fields) {
      const change = changes[field];
      inverse[field] = { before: change.after, after: change.before };
      if (field === 'dateFormat') {
        dateFormat = change.before.value;
      } else if (change.before.exists) {
        settings[field] = change.before.value;
      } else {
        delete settings[field];
      }
    }
    await school.update({ settings, ...(dateFormat ? { date_format: dateFormat } : {}) }, { transaction });
    await SettingsChangeLog.create({
      school_id: schoolId,
      actor_id: req.user.id || null,
      undo_of_id: record.id,
      category: record.category,
      changes: inverse
    }, { transaction });
    return { status: 200, data: { restored_count: fields.length } };
  });

  if (result.status !== 200) return res.status(result.status).json({ success: false, message: result.message });
  return res.json({ success: true, data: result.data });
};

module.exports = { list, detail, undo };
