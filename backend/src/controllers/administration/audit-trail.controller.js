const { Op, Sequelize } = require('sequelize');
const { AuditEvent, Branch, User } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const sharedExport = require('~/controllers/shared/export.controller');

const schoolIdFor = req => req.user.role === 'super_admin' ? req.schoolId : req.user.school_id;
const dateValue = value => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? undefined : date;
};

const list = async (req, res) => {
  try {
    const schoolId = schoolIdFor(req);
    if (!schoolId) return res.status(400).json({ success: false, message: 'Select a school first.' });
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const search = String(req.query.search || '').trim().slice(0, 120);
    const sortBy = ['user', 'activity'].includes(req.query.sort_by) ? req.query.sort_by : 'date';
    const sortOrder = String(req.query.sort_order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const from = dateValue(req.query.from);
    const to = dateValue(req.query.to);
    if (from === undefined || to === undefined || (from && to && from > to)) {
      return res.status(400).json({ success: false, message: 'Enter a valid date range.' });
    }
    const where = { school_id: schoolId };
    if (req.query.branch_id) {
      const branch = await Branch.findOne({ where: { id: req.query.branch_id, school_id: schoolId } });
      if (!branch) return res.status(400).json({ success: false, message: 'Select a branch in this school.' });
      where.branch_id = req.query.branch_id;
    }
    if (req.query.action) where.action = String(req.query.action).slice(0, 24);
    if (req.query.entity) where.entity_name = { [Op.iLike]: `%${String(req.query.entity).trim().slice(0, 120)}%` };
    const retainedFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    where.created_at = {
      [Op.gte]: from && from > retainedFrom ? from : retainedFrom,
      ...(to ? { [Op.lt]: new Date(to.getTime() + 86400000) } : {})
    };
    if (search) {
      const pattern = `%${search}%`;
      where[Op.or] = [
        { entity_name: { [Op.iLike]: pattern } },
        { action: { [Op.iLike]: pattern } },
        { '$actor.first_name$': { [Op.iLike]: pattern } },
        { '$actor.last_name$': { [Op.iLike]: pattern } },
        { request_path: { [Op.iLike]: pattern } },
        Sequelize.where(Sequelize.cast(Sequelize.col('changes'), 'text'), { [Op.iLike]: pattern })
      ];
    }
    const order = sortBy === 'user'
      ? [[{ model: User, as: 'actor' }, 'first_name', sortOrder], [{ model: User, as: 'actor' }, 'last_name', sortOrder], ['created_at', 'DESC']]
      : [[sortBy === 'activity' ? 'action' : 'created_at', sortOrder], ...(sortBy === 'date' ? [] : [['created_at', 'DESC']])];
    const result = await AuditEvent.findAndCountAll({
      where,
      include: [{ association: 'actor', attributes: ['id', 'first_name', 'last_name'] }],
      order,
      limit,
      offset: (page - 1) * limit,
      distinct: true
    });
    return res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total: result.count, pages: Math.ceil(result.count / limit) }
    });
  } catch (error) {
    logger.error('Audit trail list failed', error);
    return res.status(500).json({ success: false, message: 'Unable to load audit events.' });
  }
};

const exportEvents = async (req, res, next) => {
  try {
    const schoolId = schoolIdFor(req);
    if (!schoolId) return res.status(400).json({ success: false, message: 'Select a school first.' });
    const from = dateValue(req.query.from);
    const to = dateValue(req.query.to);
    if (from === undefined || to === undefined || (from && to && from > to)) {
      return res.status(400).json({ success: false, message: 'Enter a valid date range.' });
    }
    if (req.query.branch_id) {
      const branch = await Branch.findOne({ where: { id: req.query.branch_id, school_id: schoolId } });
      if (!branch) return res.status(400).json({ success: false, message: 'Select a branch in this school.' });
    }
    req.auditTrailExport = true;
    return sharedExport.exportReport(req, res, next);
  } catch (error) {
    return next(error);
  }
};

module.exports = { list, exportEvents };
