const { Store } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    
    const stores = await Store.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    return res.json({ success: true, data: { stores } });
  } catch (error) {
    logger.error('store list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({
        success: false,
        message: 'name is required'
      });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    
    const store = await Store.create({
      ...req.body,
      school_id: scope.school_id,
      branch_id: scope.branch_id
    });
    return res.status(201).json({ success: true, data: { store } });
  } catch (error) {
    logger.error('store create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const store = await Store.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!store) return res.status(404).json({ success: false, message: 'Not found' });
    
    const changes = { ...req.body };
    delete changes.school_id;
    delete changes.branch_id;
    
    await store.update(changes);
    return res.json({ success: true, data: { store } });
  } catch (error) {
    logger.error('store update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const store = await Store.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!store) return res.status(404).json({ success: false, message: 'Not found' });
    
    await store.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('store delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove };
