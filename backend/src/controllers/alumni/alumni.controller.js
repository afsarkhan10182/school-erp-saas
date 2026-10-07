const { Alumni } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    
    const alumnis = await Alumni.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    return res.json({ success: true, data: { alumnis } });
  } catch (error) {
    logger.error('alumni list', error);
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
    
    const alumni = await Alumni.create({
      ...req.body,
      school_id: scope.school_id,
      branch_id: scope.branch_id
    });
    return res.status(201).json({ success: true, data: { alumni } });
  } catch (error) {
    logger.error('alumni create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { id: req.params.id, school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;

    const alumni = await Alumni.findOne({ where });
    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni not found' });
    }

    await alumni.update(req.body);
    return res.json({ success: true, data: { alumni } });
  } catch (error) {
    logger.error('alumni update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const destroy = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { id: req.params.id, school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;

    const alumni = await Alumni.findOne({ where });
    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni not found' });
    }

    await alumni.destroy();
    return res.json({ success: true, message: 'Alumni deleted successfully' });
  } catch (error) {
    logger.error('alumni destroy', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  list,
  create,
  update,
  destroy
};
