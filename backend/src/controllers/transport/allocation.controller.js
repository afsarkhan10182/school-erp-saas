const { StudentTransport, Student, TransportRoute, Vehicle } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.query.student_id) where.student_id = req.query.student_id;
    if (req.query.route_id) where.route_id = req.query.route_id;
    if (req.query.vehicle_id) where.vehicle_id = req.query.vehicle_id;
    
    const allocations = await StudentTransport.findAll({
      where,
      include: [
        { model: Student, as: 'student', attributes: ['id', 'first_name', 'last_name', 'admission_number'] },
        { model: TransportRoute, as: 'route', attributes: ['id', 'route_name'] },
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'vehicle_number'] }
      ],
      order: [['created_at', 'DESC']]
    });
    return res.json({ success: true, data: { allocations } });
  } catch (error) {
    logger.error('student transport list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.student_id || !req.body.route_id || !req.body.vehicle_id) {
      return res.status(400).json({
        success: false,
        message: 'student_id, route_id, and vehicle_id are required'
      });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    
    // Verify student belongs to this school/branch
    const student = await Student.findOne({
      where: { id: req.body.student_id, school_id: scope.school_id, branch_id: scope.branch_id }
    });
    if (!student) {
      return res.status(400).json({ success: false, message: 'Invalid student for this branch' });
    }

    const allocation = await StudentTransport.create({
      ...req.body,
      school_id: scope.school_id,
      branch_id: scope.branch_id
    });
    return res.status(201).json({ success: true, data: { allocation } });
  } catch (error) {
    logger.error('student transport create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const allocation = await StudentTransport.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!allocation) return res.status(404).json({ success: false, message: 'Not found' });
    
    const changes = { ...req.body };
    delete changes.school_id;
    delete changes.branch_id;
    delete changes.student_id; // Usually we don't change the student for a transport record
    
    await allocation.update(changes);
    return res.json({ success: true, data: { allocation } });
  } catch (error) {
    logger.error('student transport update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const allocation = await StudentTransport.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!allocation) return res.status(404).json({ success: false, message: 'Not found' });
    
    await allocation.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('student transport delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove };
