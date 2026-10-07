const { TransportRoute } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    
    const routes = await TransportRoute.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    return res.json({ success: true, data: { routes } });
  } catch (error) {
    logger.error('transport route list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.route_name) {
      return res.status(400).json({
        success: false,
        message: 'route_name is required'
      });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    
    const route = await TransportRoute.create({
      ...req.body,
      school_id: scope.school_id,
      branch_id: scope.branch_id
    });
    return res.status(201).json({ success: true, data: { route } });
  } catch (error) {
    logger.error('transport route create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const route = await TransportRoute.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!route) return res.status(404).json({ success: false, message: 'Not found' });
    
    const changes = { ...req.body };
    delete changes.school_id;
    delete changes.branch_id;
    
    await route.update(changes);
    return res.json({ success: true, data: { route } });
  } catch (error) {
    logger.error('transport route update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const route = await TransportRoute.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!route) return res.status(404).json({ success: false, message: 'Not found' });
    
    await route.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('transport route delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove };
