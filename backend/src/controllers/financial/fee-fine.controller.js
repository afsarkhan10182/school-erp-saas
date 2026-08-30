const { FeeFine } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    const fines = await FeeFine.findAll({
      where,
      order: [['name', 'ASC']]
    });
    return res.json({ success: true, data: { fines } });
  } catch (error) {
    logger.error('fee fines list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    const fine = await FeeFine.create({
      name: req.body.name,
      fine_type: req.body.fine_type || 'fixed',
      amount: req.body.amount || 0,
      days_after_due: req.body.days_after_due || 0,
      is_active: req.body.is_active !== false,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      created_by: req.user.id
    });
    return res.status(201).json({ success: true, data: { fine } });
  } catch (error) {
    logger.error('fee fines create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const fine = await FeeFine.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!fine) return res.status(404).json({ success: false, message: 'Not found' });
    const changes = { ...req.body, updated_by: req.user.id };
    delete changes.school_id;
    delete changes.branch_id;
    await fine.update(changes);
    return res.json({ success: true, data: { fine } });
  } catch (error) {
    logger.error('fee fines update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const fine = await FeeFine.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!fine) return res.status(404).json({ success: false, message: 'Not found' });
    await fine.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('fee fines delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove };
