const crypto = require('crypto');
const { Op } = require('sequelize');
const { ReportTemplate } = require('~/models');
const { logger } = require('~/utils/shared/logger');

const REPORT_TYPES = ['student_wise', 'detailed'];
const NATIVE_CONFIG_KEYS = ['show_rank', 'show_remarks'];

const schoolIdOf = req => req.schoolId || req.user?.school_id;
const safeTemplate = template => ({
  id: template.id,
  name: template.name,
  code: template.code,
  description: template.description,
  report_type: template.report_type,
  footer_template: template.footer_template,
  config: template.config,
  is_default: template.is_default,
  is_active: template.is_active,
  school_id: template.school_id
});

const validateName = name =>
  typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 255;

const normalizeConfig = (input, current = {}) => {
  if (input === undefined) return { value: current };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Invalid template settings' };
  const value = { ...current };
  for (const key of NATIVE_CONFIG_KEYS) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== 'boolean') return { error: `${key} must be true or false` };
    value[key] = input[key];
  }
  return { value };
};

const normalizeFooter = (input, current) => {
  if (input === undefined) return { value: current };
  if (input !== null && (typeof input !== 'string' || input.length > 1000)) {
    return { error: 'Footer must be text of 1000 characters or fewer' };
  }
  return { value: typeof input === 'string' && input.trim() ? input.trim() : null };
};

const respondError = (res, error, fallback) => {
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ success: false, message: 'A template with this code already exists' });
  }
  logger.error(fallback, error);
  return res.status(500).json({ success: false, message: fallback });
};

const create = async (req, res) => {
  const schoolId = schoolIdOf(req);
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!schoolId) return res.status(400).json({ success: false, message: 'Select a school first' });
  if (!validateName(name)) {
    return res.status(400).json({ success: false, message: 'Template name is required (max 255 characters)' });
  }
  if (typeof req.body?.source_template_id !== 'string') {
    return res.status(400).json({ success: false, message: 'Choose a template to copy' });
  }

  try {
    const source = await ReportTemplate.findOne({
      where: {
        id: req.body.source_template_id,
        is_active: true,
        report_type: { [Op.in]: REPORT_TYPES },
        [Op.or]: [{ school_id: schoolId }, { school_id: null }]
      }
    });
    if (!source) return res.status(404).json({ success: false, message: 'Source template not found' });

    const config = normalizeConfig(req.body.config, source.config || {});
    const footer = normalizeFooter(req.body.footer_template, source.footer_template);
    if (config.error || footer.error) {
      return res.status(400).json({ success: false, message: config.error || footer.error });
    }
    const description = req.body.description;
    if (description !== undefined && description !== null && typeof description !== 'string') {
      return res.status(400).json({ success: false, message: 'Description must be text' });
    }

    const template = await ReportTemplate.create({
      name,
      code: `RC-${crypto.randomUUID()}`,
      description: description === undefined ? source.description : description.trim() || null,
      report_type: source.report_type,
      template_content: source.template_content,
      css_styles: source.css_styles,
      header_template: source.header_template,
      footer_template: footer.value,
      config: config.value,
      is_default: false,
      is_active: true,
      school_id: schoolId,
      created_by: req.user.id,
      updated_by: req.user.id
    });
    return res.status(201).json({ success: true, data: safeTemplate(template) });
  } catch (error) {
    return respondError(res, error, 'Could not copy report-card template');
  }
};

const update = async (req, res) => {
  const schoolId = schoolIdOf(req);
  if (!schoolId) return res.status(400).json({ success: false, message: 'Select a school first' });
  try {
    const template = await ReportTemplate.findOne({
      where: { id: req.params.templateId, school_id: schoolId, report_type: { [Op.in]: REPORT_TYPES } }
    });
    if (!template) return res.status(404).json({ success: false, message: 'School template not found' });

    const body = req.body || {};
    const name =
      body.name === undefined
        ? template.name
        : typeof body.name === 'string'
          ? body.name.trim()
          : '';
    if (!validateName(name)) {
      return res.status(400).json({ success: false, message: 'Template name is required (max 255 characters)' });
    }
    if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
      return res.status(400).json({ success: false, message: 'Description must be text' });
    }
    const config = normalizeConfig(body.config, template.config || {});
    const footer = normalizeFooter(body.footer_template, template.footer_template);
    if (config.error || footer.error) {
      return res.status(400).json({ success: false, message: config.error || footer.error });
    }

    await template.update({
      name,
      description:
        body.description === undefined
          ? template.description
          : typeof body.description === 'string'
            ? body.description.trim() || null
            : null,
      config: config.value,
      footer_template: footer.value,
      updated_by: req.user.id
    });
    return res.json({ success: true, data: safeTemplate(template) });
  } catch (error) {
    return respondError(res, error, 'Could not update report-card template');
  }
};

module.exports = { create, update };
