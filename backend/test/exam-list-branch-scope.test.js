require('module-alias/register');

const ExamController = require('../src/controllers/academic/exams/exam.controller');
const ExamService = require('../src/services/academic/exam.service');

describe('exam list branch context', () => {
  afterEach(() => jest.restoreAllMocks());

  it('uses the validated branch context instead of a conflicting query branch', async () => {
    jest.spyOn(ExamService, 'getAllExams').mockResolvedValue({ exams: [] });
    const next = jest.fn();
    let resolveResponse;
    const response = new Promise(resolve => { resolveResponse = resolve; });
    const res = { status: jest.fn().mockReturnThis(), json: resolveResponse };

    ExamController.getAllExams(
      {
        query: { page: '1', limit: '100', branch_id: 'branch-other' },
        branchId: 'branch-assigned',
        schoolId: 'school-1',
        user: { role: 'teacher', school_id: 'school-1', branch_id: 'branch-assigned' }
      },
      res,
      next
    );
    await response;

    expect(next).not.toHaveBeenCalled();
    expect(ExamService.getAllExams).toHaveBeenCalledWith(
      expect.objectContaining({ school_id: 'school-1', branch_id: 'branch-assigned' }),
      expect.objectContaining({ role: 'teacher' })
    );
  });
});
