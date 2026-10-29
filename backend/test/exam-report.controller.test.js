require('module-alias/register');
const ExamReportController = require('../src/controllers/academic/exams/exam-report.controller');
const { Exam, ReportTemplate } = require('../src/models');
const { Op } = require('sequelize');

describe('Exam report template tenant scope', () => {
  const originalExamFindOne = Exam.findOne;
  const originalTemplateFindOne = ReportTemplate.findOne;

  afterEach(() => {
    Exam.findOne = originalExamFindOne;
    ReportTemplate.findOne = originalTemplateFindOne;
  });

  it('limits a selected template to the caller school or a global template', async () => {
    const schoolId = 's0000000-0000-0000-0000-000000000001';
    const templateId = 'r0000000-0000-0000-0000-000000000001';
    Exam.findOne = jest.fn().mockResolvedValue({ id: 'exam-1', name: 'Term 1' });
    ReportTemplate.findOne = jest.fn().mockResolvedValue({
      id: templateId,
      name: 'School Report',
      template_content: '<h1>{{exam.name}}</h1>'
    });
    let res;
    let next;
    const response = new Promise((resolve, reject) => {
      res = { status: jest.fn().mockReturnThis(), json: resolve };
      next = reject;
    });

    ExamReportController.preview(
      {
        params: { examId: 'exam-1' },
        body: { report_type: 'student_wise', template_id: templateId },
        user: { role: 'admin', school_id: schoolId }
      },
      res,
      next
    );
    const payload = await response;

    expect(ReportTemplate.findOne).toHaveBeenCalledWith({
      where: {
        id: templateId,
        report_type: 'student_wise',
        is_active: true,
        [Op.or]: [{ school_id: schoolId }, { school_id: null }]
      }
    });
    expect(payload).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ template: expect.any(Object) })
      })
    );
  });
});
