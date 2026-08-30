const { Parent, Student, User } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    const parents = await Parent.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'students',
          attributes: ['id', 'first_name', 'last_name', 'admission_number']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'status'],
          required: false
        }
      ],
      order: [['guardian_name', 'ASC']]
    });
    return res.json({ success: true, data: { parents } });
  } catch (error) {
    logger.error('parents list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { guardian_name, guardian_phone, guardian_relation } = req.body;
    if (!guardian_name || !guardian_phone || !guardian_relation) {
      return res.status(400).json({
        success: false,
        message: 'guardian_name, guardian_phone and guardian_relation are required'
      });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    const parent = await Parent.create({
      ...req.body,
      address: req.body.address || 'Not provided',
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      created_by: req.user.id
    });
    return res.status(201).json({ success: true, data: { parent } });
  } catch (error) {
    logger.error('parents create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const parent = await Parent.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!parent) return res.status(404).json({ success: false, message: 'Not found' });
    const changes = { ...req.body, updated_by: req.user.id };
    delete changes.school_id;
    delete changes.branch_id;
    await parent.update(changes);
    return res.json({ success: true, data: { parent } });
  } catch (error) {
    logger.error('parents update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update };
