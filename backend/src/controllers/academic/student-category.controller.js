const { StudentCategory } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const categories = await StudentCategory.findAll({
      where: schoolWhere(req),
      order: [['name', 'ASC']]
    });
    return res.json({ success: true, data: { categories } });
  } catch (error) {
    logger.error('student categories list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: false });
    const category = await StudentCategory.create({
      name: req.body.name,
      description: req.body.description || null,
      is_active: req.body.is_active !== false,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      created_by: req.user.id
    });
    return res.status(201).json({ success: true, data: { category } });
  } catch (error) {
    logger.error('student categories create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const category = await StudentCategory.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!category) return res.status(404).json({ success: false, message: 'Not found' });
    await category.update({
      name: req.body.name ?? category.name,
      description: req.body.description ?? category.description,
      is_active: req.body.is_active ?? category.is_active,
      updated_by: req.user.id
    });
    return res.json({ success: true, data: { category } });
  } catch (error) {
    logger.error('student categories update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const category = await StudentCategory.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!category) return res.status(404).json({ success: false, message: 'Not found' });
    await category.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('student categories delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove };
