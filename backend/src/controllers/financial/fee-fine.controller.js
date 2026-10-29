const { FeeFine } = require('~/models');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');
const { resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const getScope = req => {
  const isBranchAdmin = req.user?.role === 'branch_admin';
  if (isBranchAdmin && !req.user.branch_id) {
    throw new ApiError(403, 'Branch access is not configured for this account');
  }
  return resolveSchoolBranchScope(req, {
    branchRequired: isBranchAdmin,
    allowSchoolWide: !isBranchAdmin
  });
};

const scopedWhere = (scope, extra = {}) => ({
  ...extra,
  school_id: scope.school_id,
  ...(scope.branch_id ? { branch_id: scope.branch_id } : {})
});

const list = async (req, res, next) => {
  try {
    const scope = await getScope(req);
    const fines = await FeeFine.findAll({
      where: scopedWhere(scope),
      order: [['name', 'ASC']]
    });
    return res.json({ success: true, data: { fines } });
  } catch (error) {
    logger.error('fee fines list', error);
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const scope = await getScope(req);
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
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const scope = await getScope(req);
    const fine = await FeeFine.findOne({
      where: scopedWhere(scope, { id: req.params.id })
    });
    if (!fine) return res.status(404).json({ success: false, message: 'Not found' });
    const changes = { ...req.body, updated_by: req.user.id };
    delete changes.school_id;
    delete changes.branch_id;
    await fine.update(changes);
    return res.json({ success: true, data: { fine } });
  } catch (error) {
    logger.error('fee fines update', error);
    return next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const scope = await getScope(req);
    const fine = await FeeFine.findOne({
      where: scopedWhere(scope, { id: req.params.id })
    });
    if (!fine) return res.status(404).json({ success: false, message: 'Not found' });
    await fine.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('fee fines delete', error);
    return next(error);
  }
};

module.exports = { list, create, update, remove };
