const { ItemIssue, InventoryItem } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.query.item_id) where.item_id = req.query.item_id;
    if (req.query.status) where.status = req.query.status;
    
    const issues = await ItemIssue.findAll({
      where,
      include: [
        { model: InventoryItem, as: 'item', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    return res.json({ success: true, data: { issues } });
  } catch (error) {
    logger.error('itemIssue list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.item_id || !req.body.issued_to_type || !req.body.issued_to_id) {
      return res.status(400).json({
        success: false,
        message: 'item_id, issued_to_type, and issued_to_id are required'
      });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    
    const issue = await ItemIssue.create({
      ...req.body,
      school_id: scope.school_id,
      branch_id: scope.branch_id
    });
    
    // Optionally update inventory item available quantity
    if (issue.status === 'issued') {
      const item = await InventoryItem.findByPk(issue.item_id);
      if (item) {
        await item.decrement('available_quantity', { by: issue.quantity || 1 });
      }
    }
    
    return res.status(201).json({ success: true, data: { issue } });
  } catch (error) {
    logger.error('itemIssue create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const issue = await ItemIssue.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!issue) return res.status(404).json({ success: false, message: 'Not found' });
    
    const changes = { ...req.body };
    delete changes.school_id;
    delete changes.branch_id;
    
    const previousStatus = issue.status;
    
    await issue.update(changes);
    
    // update inventory item available quantity on return
    if (previousStatus === 'issued' && issue.status === 'returned') {
      const item = await InventoryItem.findByPk(issue.item_id);
      if (item) {
        await item.increment('available_quantity', { by: issue.quantity || 1 });
      }
    }
    
    return res.json({ success: true, data: { issue } });
  } catch (error) {
    logger.error('itemIssue update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const issue = await ItemIssue.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!issue) return res.status(404).json({ success: false, message: 'Not found' });
    
    // Revert quantity if it was issued
    if (issue.status === 'issued') {
      const item = await InventoryItem.findByPk(issue.item_id);
      if (item) {
        await item.increment('available_quantity', { by: issue.quantity || 1 });
      }
    }
    
    await issue.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('itemIssue delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove };
