const { Vehicle } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    
    const vehicles = await Vehicle.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    return res.json({ success: true, data: { vehicles } });
  } catch (error) {
    logger.error('vehicle list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.vehicle_number) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_number is required'
      });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    
    const vehicle = await Vehicle.create({
      ...req.body,
      school_id: scope.school_id,
      branch_id: scope.branch_id
    });
    return res.status(201).json({ success: true, data: { vehicle } });
  } catch (error) {
    logger.error('vehicle create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Not found' });
    
    const changes = { ...req.body };
    delete changes.school_id;
    delete changes.branch_id;
    
    await vehicle.update(changes);
    return res.json({ success: true, data: { vehicle } });
  } catch (error) {
    logger.error('vehicle update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Not found' });
    
    await vehicle.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('vehicle delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove };
