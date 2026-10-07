const { AlumniEvent } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    
    const events = await AlumniEvent.findAll({
      where,
      order: [['event_date', 'DESC']]
    });
    return res.json({ success: true, data: { events } });
  } catch (error) {
    logger.error('alumni event list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.title || !req.body.event_date) {
      return res.status(400).json({
        success: false,
        message: 'title and event_date are required'
      });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    
    const event = await AlumniEvent.create({
      ...req.body,
      school_id: scope.school_id,
      branch_id: scope.branch_id
    });
    return res.status(201).json({ success: true, data: { event } });
  } catch (error) {
    logger.error('alumni event create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { id: req.params.id, school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;

    const event = await AlumniEvent.findOne({ where });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Alumni Event not found' });
    }

    await event.update(req.body);
    return res.json({ success: true, data: { event } });
  } catch (error) {
    logger.error('alumni event update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const destroy = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { id: req.params.id, school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;

    const event = await AlumniEvent.findOne({ where });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Alumni Event not found' });
    }

    await event.destroy();
    return res.json({ success: true, message: 'Alumni Event deleted successfully' });
  } catch (error) {
    logger.error('alumni event destroy', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  list,
  create,
  update,
  destroy
};
