const { HostelAllocation, Student, HostelRoom, Hostel } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    
    const allocations = await HostelAllocation.findAll({
      where,
      include: [
        { model: Student, as: 'student', attributes: ['id', 'first_name', 'last_name', 'admission_number'] },
        { model: HostelRoom, as: 'room', attributes: ['id', 'room_number'] },
        { model: Hostel, as: 'hostel', attributes: ['id', 'hostel_name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    return res.json({ success: true, data: { allocations } });
  } catch (error) {
    logger.error('hostel allocation list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.student_id || !req.body.hostel_id || !req.body.room_id) {
      return res.status(400).json({
        success: false,
        message: 'student_id, hostel_id, room_id are required'
      });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    
    const allocation = await HostelAllocation.create({
      ...req.body,
      school_id: scope.school_id,
      branch_id: scope.branch_id
    });
    return res.status(201).json({ success: true, data: { allocation } });
  } catch (error) {
    logger.error('hostel allocation create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const allocation = await HostelAllocation.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!allocation) return res.status(404).json({ success: false, message: 'Not found' });
    
    const changes = { ...req.body };
    delete changes.school_id;
    delete changes.branch_id;
    
    await allocation.update(changes);
    return res.json({ success: true, data: { allocation } });
  } catch (error) {
    logger.error('hostel allocation update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const allocation = await HostelAllocation.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!allocation) return res.status(404).json({ success: false, message: 'Not found' });
    
    await allocation.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('hostel allocation delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove };
