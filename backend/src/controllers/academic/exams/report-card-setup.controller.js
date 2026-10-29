const { Op } = require('sequelize');
const { sequelize } = require('~/config/database');
const { Exam, ReportCardSetup, ReportCardSetupExam, ReportTemplate } = require('~/models');

const setupIncludes = [
  { model: ReportTemplate, as: 'template', attributes: ['id', 'name', 'description'] },
  {
    model: ReportCardSetupExam,
    as: 'examEntries',
    attributes: ['exam_id', 'weightage', 'sort_order'],
          include: [{ model: Exam, as: 'exam', attributes: ['id', 'name', 'academic_year', 'school_id', 'branch_id', 'is_active', 'result_status'] }]
  }
];

const getScope = req => ({
  schoolId: req.schoolId || req.user?.school_id,
  branchId: req.branchId
});

const validateSetup = async (schoolId, branchId, body) => {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 255) return { error: 'Setup name is required and must be 255 characters or fewer' };
  if (!['portrait', 'landscape'].includes(body.orientation)) return { error: 'Invalid page orientation' };
  if (typeof body.template_id !== 'string') return { error: 'Report-card template is required' };
  if (!Array.isArray(body.exam_entries) || body.exam_entries.length === 0) {
    return { error: 'Add at least one exam to the report-card setup' };
  }

  const examIds = body.exam_entries.map(entry => entry?.exam_id);
  if (examIds.some(id => typeof id !== 'string') || new Set(examIds).size !== examIds.length) {
    return { error: 'Exam selections must be valid and unique' };
  }
  const entries = body.exam_entries.map((entry, sortOrder) => ({
    exam_id: entry.exam_id,
    weightage: Number(entry.weightage),
    sort_order: sortOrder
  }));
  if (entries.some(entry => !Number.isFinite(entry.weightage) || entry.weightage <= 0 || entry.weightage > 100)) {
    return { error: 'Each exam weightage must be greater than 0 and no more than 100' };
  }

  const template = await ReportTemplate.findOne({
    where: {
      id: body.template_id,
      is_active: true,
      report_type: { [Op.in]: ['student_wise', 'detailed'] },
      [Op.or]: [{ school_id: schoolId }, { school_id: null }]
    }
  });
  if (!template) return { error: 'Report-card template not found', status: 404 };

  const exams = await Exam.findAll({
    where: { id: { [Op.in]: examIds }, school_id: schoolId, branch_id: branchId, is_active: true },
    attributes: ['id']
  });
  if (exams.length !== examIds.length) {
    return { error: 'One or more exams are not available in this school and branch', status: 404 };
  }
  return { name, template, entries };
};

const handleError = (res, error) => {
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ success: false, message: 'A setup with this name already exists in this branch' });
  }
  return res.status(500).json({ success: false, message: 'Report-card setup request failed' });
};

const list = async (req, res) => {
  const { schoolId, branchId } = getScope(req);
  if (!schoolId || !branchId) {
    return res.status(400).json({ success: false, message: 'Select a school and one branch' });
  }
  try {
    const setups = await ReportCardSetup.findAll({
      where: { school_id: schoolId, branch_id: branchId },
      include: setupIncludes,
      order: [['name', 'ASC'], [{ model: ReportCardSetupExam, as: 'examEntries' }, 'sort_order', 'ASC']]
    });
    return res.json({ success: true, data: setups });
  } catch (error) {
    return handleError(res, error);
  }
};

const create = async (req, res) => {
  const { schoolId, branchId } = getScope(req);
  if (!schoolId || !branchId) {
    return res.status(400).json({ success: false, message: 'Select a school and one branch' });
  }
  try {
    const payload = await validateSetup(schoolId, branchId, req.body || {});
    if (payload.error) return res.status(payload.status || 400).json({ success: false, message: payload.error });
    const transaction = await sequelize.transaction();
    try {
      const setup = await ReportCardSetup.create(
        {
          name: payload.name,
          template_id: payload.template.id,
          orientation: req.body.orientation,
          school_id: schoolId,
          branch_id: branchId,
          created_by: req.user.id,
          updated_by: req.user.id
        },
        { transaction }
      );
      await ReportCardSetupExam.bulkCreate(
        payload.entries.map(entry => ({ ...entry, setup_id: setup.id })),
        { transaction }
      );
      await transaction.commit();
      const created = await ReportCardSetup.findOne({
        where: { id: setup.id, school_id: schoolId, branch_id: branchId },
        include: setupIncludes
      });
      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    return handleError(res, error);
  }
};

const update = async (req, res) => {
  const { schoolId, branchId } = getScope(req);
  if (!schoolId || !branchId) {
    return res.status(400).json({ success: false, message: 'Select a school and one branch' });
  }
  try {
    const setup = await ReportCardSetup.findOne({
      where: { id: req.params.setupId, school_id: schoolId, branch_id: branchId }
    });
    if (!setup) return res.status(404).json({ success: false, message: 'Report-card setup not found' });
    const payload = await validateSetup(schoolId, branchId, req.body || {});
    if (payload.error) return res.status(payload.status || 400).json({ success: false, message: payload.error });
    const transaction = await sequelize.transaction();
    try {
      await setup.update(
        {
          name: payload.name,
          template_id: payload.template.id,
          orientation: req.body.orientation,
          is_published: false,
          updated_by: req.user.id
        },
        { transaction }
      );
      await ReportCardSetupExam.destroy({ where: { setup_id: setup.id }, transaction });
      await ReportCardSetupExam.bulkCreate(
        payload.entries.map(entry => ({ ...entry, setup_id: setup.id })),
        { transaction }
      );
      await transaction.commit();
      const updated = await ReportCardSetup.findOne({
        where: { id: setup.id, school_id: schoolId, branch_id: branchId },
        include: setupIncludes
      });
      return res.json({ success: true, data: updated });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    return handleError(res, error);
  }
};

const setPublication = async (req, res) => {
  const { schoolId, branchId } = getScope(req);
  if (!schoolId || !branchId) {
    return res.status(400).json({ success: false, message: 'Select a school and one branch' });
  }
  if (typeof req.body?.is_published !== 'boolean') {
    return res.status(400).json({ success: false, message: 'is_published must be a boolean' });
  }
  try {
    const setup = await ReportCardSetup.findOne({
      where: { id: req.params.setupId, school_id: schoolId, branch_id: branchId },
      include: [
        {
          model: ReportCardSetupExam,
          as: 'examEntries',
          required: true,
          include: [
            {
              model: Exam,
              as: 'exam',
              attributes: ['school_id', 'branch_id', 'is_active', 'result_status'],
              required: true
            }
          ]
        }
      ]
    });
    if (!setup) return res.status(404).json({ success: false, message: 'Report-card setup not found' });
    if (
      req.body.is_published &&
      setup.examEntries.some(
        entry =>
          !entry.exam?.result_status ||
          !entry.exam?.is_active ||
          entry.exam.school_id !== schoolId ||
          entry.exam.branch_id !== branchId
      )
    ) {
      return res.status(409).json({
        success: false,
        message: 'Release results for every exam before publishing this report-card setup'
      });
    }
    await setup.update({ is_published: req.body.is_published, updated_by: req.user.id });
    return res.json({ success: true, data: { is_published: req.body.is_published } });
  } catch (error) {
    return handleError(res, error);
  }
};

const remove = async (req, res) => {
  const { schoolId, branchId } = getScope(req);
  if (!schoolId || !branchId) {
    return res.status(400).json({ success: false, message: 'Select a school and one branch' });
  }
  try {
    const deleted = await ReportCardSetup.destroy({
      where: { id: req.params.setupId, school_id: schoolId, branch_id: branchId }
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Report-card setup not found' });
    return res.json({ success: true, message: 'Report-card setup deleted' });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { list, create, update, setPublication, remove };
