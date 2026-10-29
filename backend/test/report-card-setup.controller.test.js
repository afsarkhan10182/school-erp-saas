require('module-alias/register');

const Controller = require('../src/controllers/academic/exams/report-card-setup.controller');
const { Exam, ReportCardSetup, ReportTemplate } = require('../src/models');

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockImplementation(payload => payload);
  return res;
};

describe('report-card setup scope and validation', () => {
  const originalFindAll = ReportCardSetup.findAll;
  const originalFindOne = ReportCardSetup.findOne;
  const originalUpdate = ReportCardSetup.update;
  const originalCreate = ReportCardSetup.create;
  const originalTemplateFindOne = ReportTemplate.findOne;
  const originalExamFindAll = Exam.findAll;

  beforeEach(() => {
    ReportCardSetup.create = jest.fn();
    ReportCardSetup.findOne = jest.fn();
    ReportCardSetup.update = jest.fn();
    ReportTemplate.findOne = jest.fn();
    Exam.findAll = jest.fn();
  });

  afterEach(() => {
    ReportCardSetup.findAll = originalFindAll;
    ReportCardSetup.findOne = originalFindOne;
    ReportCardSetup.update = originalUpdate;
    ReportCardSetup.create = originalCreate;
    ReportTemplate.findOne = originalTemplateFindOne;
    Exam.findAll = originalExamFindAll;
    jest.clearAllMocks();
  });

  it('requires an explicit branch before listing setups', async () => {
    const res = response();
    await Controller.list({ schoolId: 'school-a', user: { school_id: 'school-a' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Select a school and one branch' })
    );
  });

  it('rejects repeated exam IDs before querying templates or writing', async () => {
    const res = response();
    await Controller.create(
      {
        schoolId: 'school-a',
        branchId: 'branch-a',
        user: { id: 'user-a' },
        body: {
          name: 'Terms',
          template_id: 'template-a',
          orientation: 'portrait',
          exam_entries: [
            { exam_id: 'exam-a', weightage: 50 },
            { exam_id: 'exam-a', weightage: 50 }
          ]
        }
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ReportTemplate.findOne).not.toHaveBeenCalled();
    expect(Exam.findAll).not.toHaveBeenCalled();
  });

  it('rejects zero or over-100 weightages before querying references', async () => {
    for (const weightage of [0, 100.01]) {
      const res = response();
      await Controller.create(
        {
          schoolId: 'school-a',
          branchId: 'branch-a',
          user: { id: 'user-a' },
          body: {
            name: 'Terms',
            template_id: 'template-a',
            orientation: 'portrait',
            exam_entries: [{ exam_id: 'exam-a', weightage }]
          }
        },
        res
      );
      expect(res.status).toHaveBeenCalledWith(400);
    }
    expect(ReportTemplate.findOne).not.toHaveBeenCalled();
    expect(Exam.findAll).not.toHaveBeenCalled();
  });

  it('rejects an exam not returned in the selected school and branch scope', async () => {
    ReportTemplate.findOne = jest.fn().mockResolvedValue({ id: 'template-a' });
    Exam.findAll = jest.fn().mockResolvedValue([]);
    const res = response();
    await Controller.create(
      {
        schoolId: 'school-a',
        branchId: 'branch-a',
        user: { id: 'user-a' },
        body: {
          name: 'Terms',
          template_id: 'template-a',
          orientation: 'portrait',
          exam_entries: [{ exam_id: 'exam-from-another-branch', weightage: 100 }]
        }
      },
      res
    );

    expect(Exam.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ school_id: 'school-a', branch_id: 'branch-a' })
      })
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(ReportCardSetup.create).not.toHaveBeenCalled();
  });

  it('lists only the selected school and branch', async () => {
    ReportCardSetup.findAll = jest.fn().mockResolvedValue([]);
    const res = response();
    await Controller.list(
      { schoolId: 'school-a', branchId: 'branch-a', user: { school_id: 'school-a' } },
      res
    );

    expect(ReportCardSetup.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { school_id: 'school-a', branch_id: 'branch-a' } })
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
  });

  it('refuses to publish until every included exam has released results', async () => {
    ReportCardSetup.findOne = jest.fn().mockResolvedValue({
      examEntries: [{ exam: { result_status: true } }, { exam: { result_status: false } }],
      update: jest.fn()
    });
    const res = response();
    await Controller.setPublication(
      {
        schoolId: 'school-a',
        branchId: 'branch-a',
        user: { id: 'admin-a' },
        params: { setupId: 'setup-a' },
        body: { is_published: true }
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(ReportCardSetup.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'setup-a', school_id: 'school-a', branch_id: 'branch-a' }
      })
    );
  });

  it('loads exam scope/status fields and publishes a released same-branch setup', async () => {
    const update = jest.fn();
    ReportCardSetup.findOne = jest.fn().mockResolvedValue({
      examEntries: [
        {
          exam: {
            result_status: true,
            is_active: true,
            school_id: 'school-a',
            branch_id: 'branch-a'
          }
        }
      ],
      update
    });
    const res = response();

    await Controller.setPublication(
      {
        schoolId: 'school-a',
        branchId: 'branch-a',
        user: { id: 'admin-a' },
        params: { setupId: 'setup-a' },
        body: { is_published: true }
      },
      res
    );

    const examInclude = ReportCardSetup.findOne.mock.calls[0][0].include[0].include[0];
    expect(examInclude.attributes).toEqual([
      'school_id',
      'branch_id',
      'is_active',
      'result_status'
    ]);
    expect(update).toHaveBeenCalledWith({ is_published: true, updated_by: 'admin-a' });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { is_published: true } });
  });
});
