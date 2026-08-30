const { Homework, Class, Section, Subject } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.query.class_id) where.class_id = req.query.class_id;
    const homeworks = await Homework.findAll({
      where,
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'] },
        { model: Section, as: 'section', attributes: ['id', 'name'], required: false },
        { model: Subject, as: 'subject', attributes: ['id', 'name'], required: false }
      ],
      order: [['due_date', 'DESC']]
    });
    return res.json({ success: true, data: { homeworks } });
  } catch (error) {
    logger.error('homework list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.title || !req.body.due_date || !req.body.class_id) {
      return res.status(400).json({
        success: false,
        message: 'title, due_date and class_id are required'
      });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    const classRecord = await Class.findOne({
      where: { id: req.body.class_id, school_id: scope.school_id, branch_id: scope.branch_id }
    });
    if (!classRecord) {
      return res.status(400).json({ success: false, message: 'Invalid class for this branch' });
    }
    const homework = await Homework.create({
      title: req.body.title,
      description: req.body.description,
      due_date: req.body.due_date,
      class_id: req.body.class_id,
      section_id: req.body.section_id || null,
      subject_id: req.body.subject_id || null,
      attachment_url: req.body.attachment_url || null,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      created_by: req.user.id
    });
    return res.status(201).json({ success: true, data: { homework } });
  } catch (error) {
    logger.error('homework create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const homework = await Homework.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!homework) return res.status(404).json({ success: false, message: 'Not found' });
    const changes = { ...req.body, updated_by: req.user.id };
    delete changes.school_id;
    delete changes.branch_id;
    if (changes.class_id) {
      const classRecord = await Class.findOne({
        where: {
          id: changes.class_id,
          school_id: homework.school_id,
          branch_id: homework.branch_id
        }
      });
      if (!classRecord) {
        return res.status(400).json({ success: false, message: 'Invalid class for this branch' });
      }
    }
    await homework.update(changes);
    return res.json({ success: true, data: { homework } });
  } catch (error) {
    logger.error('homework update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const homework = await Homework.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!homework) return res.status(404).json({ success: false, message: 'Not found' });
    await homework.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('homework delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove };
