require('module-alias/register');

const Controller = require('../src/controllers/academic/exams/report-card-template.controller');
const { Op } = require('sequelize');
const { ReportTemplate } = require('../src/models');

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

describe('school-scoped report-card template settings', () => {
  const originalFindOne = ReportTemplate.findOne;
  const originalCreate = ReportTemplate.create;

  beforeEach(() => {
    ReportTemplate.findOne = jest.fn();
    ReportTemplate.create = jest.fn();
  });

  afterEach(() => {
    ReportTemplate.findOne = originalFindOne;
    ReportTemplate.create = originalCreate;
    jest.clearAllMocks();
  });

  it('copies a same-school/global template into the active school without changing the source', async () => {
    const source = {
      id: 'global-template',
      school_id: null,
      name: 'Base',
      code: 'BASE',
      description: 'Default',
      report_type: 'student_wise',
      template_content: '<h1>{{exam.name}}</h1>',
      css_styles: 'body {}',
      header_template: 'School',
      footer_template: 'Original footer',
      config: { show_rank: true, show_remarks: true, future_setting: 'preserve' }
    };
    ReportTemplate.findOne.mockResolvedValue(source);
    ReportTemplate.create.mockImplementation(async values => ({ id: 'copy-1', ...values }));
    const res = response();

    await Controller.create(
      {
        schoolId: 'school-a',
        user: { id: 'admin-a' },
        body: {
          source_template_id: source.id,
          name: 'Main Report Card',
          config: { show_rank: false },
          footer_template: 'Main Campus'
        }
      },
      res
    );

    const sourceWhere = ReportTemplate.findOne.mock.calls[0][0].where;
    expect(sourceWhere[Op.or]).toEqual([{ school_id: 'school-a' }, { school_id: null }]);
    const created = ReportTemplate.create.mock.calls[0][0];
    expect(created).toEqual(
      expect.objectContaining({
        name: 'Main Report Card',
        school_id: 'school-a',
        created_by: 'admin-a',
        is_default: false,
        is_active: true,
        template_content: source.template_content,
        css_styles: source.css_styles,
        footer_template: 'Main Campus',
        config: { show_rank: false, show_remarks: true, future_setting: 'preserve' }
      })
    );
    expect(created.code).toMatch(/^RC-/);
    expect(source.name).toBe('Base');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('does not copy a template outside the school scope', async () => {
    ReportTemplate.findOne.mockResolvedValue(null);
    const res = response();
    await Controller.create(
      {
        schoolId: 'school-a',
        user: { id: 'admin-a' },
        body: { source_template_id: 'other-school-template', name: 'Copy' }
      },
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(ReportTemplate.create).not.toHaveBeenCalled();
  });

  it('rejects invalid native option values and unsafe footer size before writes', async () => {
    ReportTemplate.findOne.mockResolvedValue({ id: 'source', school_id: 'school-a', report_type: 'detailed' });
    for (const body of [
      { source_template_id: 'source', name: 'Bad config', config: { show_rank: 'yes' } },
      { source_template_id: 'source', name: 'Bad footer', footer_template: 'x'.repeat(1001) }
    ]) {
      const res = response();
      await Controller.create({ schoolId: 'school-a', user: { id: 'admin-a' }, body }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    }
    expect(ReportTemplate.create).not.toHaveBeenCalled();
  });

  it('updates only native PDF settings on an owned school template', async () => {
    const template = {
      id: 'template-a',
      school_id: 'school-a',
      name: 'Old name',
      description: 'Old description',
      footer_template: 'Old footer',
      template_content: '<h1>Keep</h1>',
      config: { show_rank: true, show_remarks: true, future_setting: 'keep' },
      update: jest.fn().mockResolvedValue(undefined)
    };
    ReportTemplate.findOne.mockResolvedValue(template);
    const res = response();
    await Controller.update(
      {
        schoolId: 'school-a',
        user: { id: 'admin-a' },
        params: { templateId: template.id },
        body: {
          name: 'Updated',
          description: '',
          footer_template: 'Updated footer',
          config: { show_remarks: false }
        }
      },
      res
    );

    expect(ReportTemplate.findOne.mock.calls[0][0].where).toEqual(
      expect.objectContaining({ id: template.id, school_id: 'school-a' })
    );
    expect(template.update).toHaveBeenCalledWith({
      name: 'Updated',
      description: null,
      config: { show_rank: true, show_remarks: false, future_setting: 'keep' },
      footer_template: 'Updated footer',
      updated_by: 'admin-a'
    });
    expect(template.template_content).toBe('<h1>Keep</h1>');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('cannot update a global or another school template', async () => {
    ReportTemplate.findOne.mockResolvedValue(null);
    const res = response();
    await Controller.update(
      {
        schoolId: 'school-a',
        user: { id: 'admin-a' },
        params: { templateId: 'global-template' },
        body: { name: 'Overwrite global' }
      },
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
