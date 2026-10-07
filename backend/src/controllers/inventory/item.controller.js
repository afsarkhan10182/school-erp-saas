const { InventoryItem, ItemCategory } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.query.category_id) where.category_id = req.query.category_id;
    
    const items = await InventoryItem.findAll({
      where,
      include: [
        { model: ItemCategory, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    return res.json({ success: true, data: { items } });
  } catch (error) {
    logger.error('inventoryItem list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.name || !req.body.category_id) {
      return res.status(400).json({
        success: false,
        message: 'name and category_id are required'
      });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    
    const item = await InventoryItem.create({
      ...req.body,
      school_id: scope.school_id,
      branch_id: scope.branch_id
    });
    return res.status(201).json({ success: true, data: { item } });
  } catch (error) {
    logger.error('inventoryItem create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const item = await InventoryItem.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    
    const changes = { ...req.body };
    delete changes.school_id;
    delete changes.branch_id;
    
    await item.update(changes);
    return res.json({ success: true, data: { item } });
  } catch (error) {
    logger.error('inventoryItem update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const item = await InventoryItem.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    
    await item.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('inventoryItem delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove };
