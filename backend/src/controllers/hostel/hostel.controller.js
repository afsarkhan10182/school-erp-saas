const { Hostel } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    
    const hostels = await Hostel.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    return res.json({ success: true, data: { hostels } });
  } catch (error) {
    logger.error('hostel list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.hostel_name) {
      return res.status(400).json({
        success: false,
        message: 'hostel_name is required'
      });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    
    const data = { ...req.body };
    if (data.intake === '' || data.intake === undefined) {
      data.intake = null;
    } else if (data.intake !== null) {
      data.intake = parseInt(data.intake, 10) || null;
    }

    const hostel = await Hostel.create({
      ...data,
      school_id: scope.school_id,
      branch_id: scope.branch_id
    });
    return res.status(201).json({ success: true, data: { hostel } });
  } catch (error) {
    logger.error('hostel create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const hostel = await Hostel.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
    
    const changes = { ...req.body };
    delete changes.id;
    delete changes.school_id;
    delete changes.branch_id;
    
    if (changes.intake === '' || changes.intake === undefined) {
      changes.intake = null;
    } else if (changes.intake !== null) {
      changes.intake = parseInt(changes.intake, 10) || null;
    }
    
    await hostel.update(changes);
    return res.json({ success: true, data: { hostel } });
  } catch (error) {
    logger.error('hostel update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const hostel = await Hostel.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!hostel) return res.status(404).json({ success: false, message: 'Not found' });
    
    await hostel.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('hostel delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove };
