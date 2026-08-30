const { CardTemplate, Student, School, User } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, schoolIdOf, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const DEFAULT_FIELDS = {
  show_photo: true,
  show_admission: true,
  show_class: true,
  show_roll: true,
  show_dob: true,
  show_blood: true,
  show_valid_until: true,
  background_image_url: ''
};

const safeBackgroundUrl = url => {
  const value = String(url || '').trim();
  if (!/^(https?:\/\/|\/uploads\/|data:image\/)/i.test(value)) return '';
  return value.replace(/['")\\]/g, '');
};

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.query.kind) where.kind = req.query.kind;
    if (req.query.user_type) where.user_type = req.query.user_type;
    const rows = await CardTemplate.findAll({ where, order: [['created_at', 'DESC']] });
    return res.json({ success: true, data: { templates: rows } });
  } catch (error) {
    logger.error('card template list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    const row = await CardTemplate.create({
      name: req.body.name || 'Untitled template',
      kind: req.body.kind === 'admit' ? 'admit' : 'id',
      user_type: req.body.user_type === 'employee' ? 'employee' : 'student',
      layout_width: Number(req.body.layout_width) || 86,
      layout_height: Number(req.body.layout_height) || 54,
      background_color: req.body.background_color || '#4f46e5',
      fields_json: { ...DEFAULT_FIELDS, ...(req.body.fields_json || {}) },
      html_template: req.body.html_template || null,
      is_active: req.body.is_active !== false,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      created_by: req.user.id
    });
    return res.status(201).json({ success: true, data: { template: row } });
  } catch (error) {
    logger.error('card template create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const row = await CardTemplate.findOne({ where: { id: req.params.id, ...schoolWhere(req) } });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    const patch = {};
    [
      'name',
      'kind',
      'user_type',
      'layout_width',
      'layout_height',
      'background_color',
      'fields_json',
      'html_template',
      'is_active'
    ].forEach(k => {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    });
    patch.updated_by = req.user.id;
    await row.update(patch);
    return res.json({ success: true, data: { template: row } });
  } catch (error) {
    logger.error('card template update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const row = await CardTemplate.findOne({ where: { id: req.params.id, ...schoolWhere(req) } });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    await row.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('card template delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const renderCardHtml = (template, student, school) => {
  const fields = { ...DEFAULT_FIELDS, ...(template.fields_json || {}) };
  const name = `${student.first_name} ${student.last_name || ''}`.trim();
  const title = template.kind === 'admit' ? 'Admit Card' : 'Student Identity Card';
  const w = template.layout_width || 86;
  const h = template.layout_height || 54;
  const bg = template.background_color || '#4f46e5';

  if (template.html_template) {
    return template.html_template
      .replace(/\{\{school_name\}\}/g, school?.name || '')
      .replace(/\{\{student_name\}\}/g, name)
      .replace(/\{\{admission_number\}\}/g, student.admission_number || '')
      .replace(/\{\{class\}\}/g, student.current_class || '')
      .replace(/\{\{roll\}\}/g, student.roll_number || '')
      .replace(/\{\{dob\}\}/g, student.date_of_birth || '')
      .replace(/\{\{blood\}\}/g, student.blood_group || '')
      .replace(/\{\{title\}\}/g, title);
  }

  const bgImage = safeBackgroundUrl(fields.background_image_url);
  const background = bgImage
    ? `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)),url('${bgImage}') center/cover`
    : `linear-gradient(135deg,${bg},#312e81)`;

  return `
<div style="width:${w}mm;min-height:${h}mm;background:${background};border-radius:8px;color:#fff;padding:10px;font-family:Arial,sans-serif;box-sizing:border-box;">
  <div style="background:rgba(255,255,255,.95);color:#111;padding:6px 8px;border-radius:4px;text-align:center;margin-bottom:8px;">
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;">${school?.name || 'School'}</div>
    <div style="font-size:10px;">${title}</div>
  </div>
  <div style="display:flex;gap:10px;">
    ${
      fields.show_photo
        ? `<div style="width:48px;height:48px;background:#fff;border-radius:4px;color:#666;font-size:9px;display:flex;align-items:center;justify-content:center;overflow:hidden;">${
            student.photo_url
              ? `<img src="${student.photo_url}" style="width:100%;height:100%;object-fit:cover"/>`
              : 'PHOTO'
          }</div>`
        : ''
    }
    <div style="font-size:11px;line-height:1.35;flex:1;">
      <div style="font-weight:700;margin-bottom:4px;">${name}</div>
      ${fields.show_admission ? `<div>Adm: ${student.admission_number || '—'}</div>` : ''}
      ${fields.show_class ? `<div>Class: ${student.current_class || '—'}</div>` : ''}
      ${fields.show_roll ? `<div>Roll: ${student.roll_number || '—'}</div>` : ''}
      ${fields.show_dob ? `<div>DOB: ${student.date_of_birth || '—'}</div>` : ''}
      ${fields.show_blood ? `<div>Blood: ${student.blood_group || '—'}</div>` : ''}
    </div>
  </div>
  ${
    fields.show_valid_until
      ? `<div style="margin-top:8px;font-size:9px;opacity:.9;">Valid until: 31 Mar ${new Date().getFullYear() + 1}</div>`
      : ''
  }
</div>`;
};

const renderEmployeeCardHtml = (template, employee, school) => {
  const fields = { ...DEFAULT_FIELDS, ...(template.fields_json || {}) };
  const name = `${employee.first_name} ${employee.last_name || ''}`.trim();
  const w = template.layout_width || 86;
  const h = template.layout_height || 54;
  const bg = template.background_color || '#4f46e5';

  if (template.html_template) {
    return template.html_template
      .replace(/\{\{school_name\}\}/g, school?.name || '')
      .replace(/\{\{employee_name\}\}/g, name)
      .replace(/\{\{staff_id\}\}/g, employee.email || '')
      .replace(/\{\{designation\}\}/g, employee.role || '')
      .replace(/\{\{department\}\}/g, '')
      .replace(/\{\{title\}\}/g, 'Employee Identity Card');
  }

  const bgImage = safeBackgroundUrl(fields.background_image_url);
  const background = bgImage
    ? `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)),url('${bgImage}') center/cover`
    : `linear-gradient(135deg,${bg},#312e81)`;

  return `
<div style="width:${w}mm;min-height:${h}mm;background:${background};border-radius:8px;color:#fff;padding:10px;font-family:Arial,sans-serif;box-sizing:border-box;">
  <div style="background:rgba(255,255,255,.95);color:#111;padding:6px 8px;border-radius:4px;text-align:center;margin-bottom:8px;">
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;">${school?.name || 'School'}</div>
    <div style="font-size:10px;">Employee Identity Card</div>
  </div>
  <div style="display:flex;gap:10px;">
    ${
      fields.show_photo
        ? `<div style="width:48px;height:48px;background:#fff;border-radius:4px;color:#666;font-size:9px;display:flex;align-items:center;justify-content:center;overflow:hidden;">${
            employee.profile_image
              ? `<img src="${employee.profile_image}" style="width:100%;height:100%;object-fit:cover"/>`
              : 'PHOTO'
          }</div>`
        : ''
    }
    <div style="font-size:11px;line-height:1.35;flex:1;">
      <div style="font-weight:700;margin-bottom:4px;">${name}</div>
      ${fields.show_admission ? `<div>Staff ID: ${employee.email || '—'}</div>` : ''}
      ${fields.show_class ? `<div>Role: ${employee.role || '—'}</div>` : ''}
      ${fields.show_roll ? `<div>Phone: ${employee.phone || '—'}</div>` : ''}
    </div>
  </div>
</div>`;
};

const generate = async (req, res) => {
  try {
    const { student_id, user_id, template_id, kind, user_type } = req.body;
    const employeeMode = user_type === 'employee';
    if (!employeeMode && !student_id) return res.status(400).json({ success: false, message: 'student_id required' });
    if (employeeMode && !user_id) return res.status(400).json({ success: false, message: 'user_id required' });

    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    const selectedBranchId =
      req.user.role === 'branch_admin'
        ? scope.branch_id
        : req.body.branch_id || req.query.branch_id || scope.branch_id;
    const person = employeeMode
      ? await User.findOne({
          where: { id: user_id, school_id: scope.school_id, branch_id: selectedBranchId, status: 'active' }
        })
      : await Student.findOne({
          where: { id: student_id, school_id: scope.school_id, branch_id: selectedBranchId }
        });
    if (!person) return res.status(404).json({ success: false, message: employeeMode ? 'Employee not found' : 'Student not found' });
    if (employeeMode && ['super_admin', 'admin', 'student', 'parent'].includes(person.role)) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    let template = null;
    if (template_id) {
      template = await CardTemplate.findOne({
        where: { id: template_id, school_id: scope.school_id, branch_id: scope.branch_id, is_active: true }
      });
    }
    if (!template) {
      template = await CardTemplate.findOne({
        where: {
          school_id: scope.school_id,
          branch_id: scope.branch_id,
          is_active: true,
          kind: kind === 'admit' ? 'admit' : 'id',
          user_type: employeeMode ? 'employee' : 'student'
        },
        order: [['created_at', 'DESC']]
      });
    }
    if (!template) {
      template = {
        kind: kind === 'admit' ? 'admit' : 'id',
        layout_width: 86,
        layout_height: 54,
        background_color: '#4f46e5',
        fields_json: DEFAULT_FIELDS,
        html_template: null
      };
    }

    const school = await School.findByPk(schoolIdOf(req));
    const html = employeeMode
      ? renderEmployeeCardHtml(template, person, school)
      : renderCardHtml(template, person, school);
    return res.json({
      success: true,
      data: {
        html,
        student_id: employeeMode ? null : person.id,
        user_id: employeeMode ? person.id : null,
        template_id: template.id || null,
        kind: template.kind
      }
    });
  } catch (error) {
    logger.error('card generate', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, create, update, remove, generate };
