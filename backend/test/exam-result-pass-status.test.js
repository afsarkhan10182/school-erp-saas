require('module-alias/register');
const ExamResultController = require('../src/controllers/academic/exams/exam-result.controller');
const ExamService = require('../src/services/academic/exam.service');
const { Exam, ExamResult, GradingSystem } = require('../src/models');

describe('Exam result pass status', () => {
  const originalFindAndCountAll = ExamResult.findAndCountAll;
  const originalFindAll = ExamResult.findAll;
  const originalFindOne = GradingSystem.findOne;
  const originalExamFindOne = Exam.findOne;

  afterEach(() => {
    ExamResult.findAndCountAll = originalFindAndCountAll;
    ExamResult.findAll = originalFindAll;
    GradingSystem.findOne = originalFindOne;
    Exam.findOne = originalExamFindOne;
  });

  it('returns pass status from the school grade scale without persisting a column', async () => {
    GradingSystem.findOne = jest.fn().mockResolvedValue({
      passing_percentage: '40.00',
      gradeScales: [
        { min_percentage: '80.00', max_percentage: '100.00', is_passing: true },
        { min_percentage: '0.00', max_percentage: '79.99', is_passing: false }
      ]
    });
    ExamResult.findAndCountAll = jest.fn().mockResolvedValue({
      count: 3,
      rows: [
        { toJSON: () => ({ percentage: '86.00', is_absent: false }) },
        { toJSON: () => ({ percentage: '74.00', is_absent: false }) },
        { toJSON: () => ({ percentage: '39.00', is_absent: false }) },
        { toJSON: () => ({ percentage: '0.00', is_absent: true }) }
      ]
    });

    let next;
    const response = new Promise((resolve, reject) => {
      next = reject;
      ExamResultController.getByExamId(
        { params: { examId: 'exam-1' }, query: {}, user: { school_id: 'school-1' } },
        { status: jest.fn().mockReturnThis(), json: resolve },
        next
      );
    });

    const payload = await response;
    expect(payload.data.results.map(row => row.is_passed)).toEqual([true, false, false, null]);
    expect(ExamResult.findAndCountAll.mock.calls[0][0].order).toEqual([
      ['marks_obtained', 'DESC']
    ]);
    expect(ExamResult.findAndCountAll.mock.calls[0][0].include[0].attributes).toContain('class_id');
    expect(ExamResult.findAndCountAll.mock.calls[0][0].include[0].attributes).toContain('section_id');
    expect(GradingSystem.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { school_id: 'school-1', is_active: true } })
    );
  });

  it('derives pass status on the service used by the exam results page', async () => {
    Exam.findOne = jest.fn().mockResolvedValue({ id: 'exam-1' });
    GradingSystem.findOne = jest.fn().mockResolvedValue({
      passing_percentage: '40.00',
      gradeScales: [{ min_percentage: '80.00', max_percentage: '100.00', is_passing: true }]
    });
    ExamResult.findAndCountAll = jest.fn().mockResolvedValue({
      count: 2,
      rows: [
        { toJSON: () => ({ percentage: '86.00', is_absent: false }) },
        { toJSON: () => ({ percentage: '74.00', is_absent: false }) }
      ]
    });

    const result = await ExamService.getExamResults('exam-1', {
      school_id: 'school-1',
      role: 'teacher'
    });

    expect(result.results.map(row => row.is_passed)).toEqual([true, true]);
  });

  it('exports statuses from the school grade scale instead of a fixed percentage', async () => {
    GradingSystem.findOne = jest.fn().mockResolvedValue({
      passing_percentage: '40.00',
      gradeScales: [
        { min_percentage: '80.00', max_percentage: '100.00', is_passing: true },
        { min_percentage: '0.00', max_percentage: '39.99', is_passing: false }
      ]
    });
    ExamResult.findAll = jest.fn().mockResolvedValue([
      { student: { first_name: 'A', last_name: 'Pass' }, exam: { max_marks: 100 }, percentage: '86', is_absent: false },
      { student: { first_name: 'B', last_name: 'Fail' }, exam: { max_marks: 100 }, percentage: '39', is_absent: false },
      { student: { first_name: 'C', last_name: 'Absent' }, exam: { max_marks: 100 }, percentage: '0', is_absent: true }
    ]);

    const csv = await new Promise((resolve, reject) => {
      ExamResultController.exportResults(
        { params: { examId: 'exam-1' }, query: {}, user: { school_id: 'school-1', role: 'branch_admin', branch_id: 'branch-1' } },
        { setHeader: jest.fn(), send: resolve },
        reject
      );
    });

    expect(csv.split('\n').slice(1).map(row => row.split(',')[8])).toEqual([
      '"Passed"', '"Failed"', '"Absent"'
    ]);
    expect(ExamResult.findAll.mock.calls[0][0].where).toEqual({
      exam_id: 'exam-1', school_id: 'school-1', branch_id: 'branch-1'
    });
  });
});
