require('module-alias/register');

jest.mock('../src/models', () => ({
  ExamSchedule: { findOne: jest.fn(), findAll: jest.fn() },
  ExamSubjectMark: { count: jest.fn() },
  Exam: { findOne: jest.fn() },
  ExamResult: { count: jest.fn() },
  ExamHall: {},
  User: {},
  Class: {},
  Section: {},
  Subject: {},
  Student: {}
}));

const { ExamSchedule, ExamSubjectMark } = require('../src/models');
const ExamScheduleService = require('../src/services/academic/exam-schedule.service');
const { Exam, ExamResult } = require('../src/models');
const ExamService = require('../src/services/academic/exam.service');

describe('exam schedule deletion with subject marks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('preserves a schedule when marks exist', async () => {
    const schedule = { id: 'schedule-1', school_id: 'school-1', branch_id: 'branch-1', destroy: jest.fn() };
    ExamSchedule.findOne.mockResolvedValue(schedule);
    ExamSubjectMark.count.mockResolvedValue(1);

    await expect(ExamScheduleService.deleteExamSchedule('schedule-1', {
      school_id: 'school-1', role: 'admin'
    })).rejects.toMatchObject({ statusCode: 409 });

    expect(schedule.destroy).not.toHaveBeenCalled();
  });

  it('deletes an unmarked schedule', async () => {
    const schedule = { id: 'schedule-1', school_id: 'school-1', branch_id: 'branch-1', destroy: jest.fn() };
    ExamSchedule.findOne.mockResolvedValue(schedule);
    ExamSubjectMark.count.mockResolvedValue(0);

    await ExamScheduleService.deleteExamSchedule('schedule-1', {
      school_id: 'school-1', role: 'admin'
    });

    expect(schedule.destroy).toHaveBeenCalledTimes(1);
  });

  it('preserves an exam when subject marks exist without an aggregate result', async () => {
    const exam = { id: 'exam-1', school_id: 'school-1', branch_id: 'branch-1', destroy: jest.fn() };
    Exam.findOne.mockResolvedValue(exam);
    ExamResult.count.mockResolvedValue(0);
    ExamSchedule.findAll.mockResolvedValue([{ id: 'schedule-1' }]);
    ExamSubjectMark.count.mockResolvedValue(1);

    await expect(ExamService.deleteExam('exam-1', {
      school_id: 'school-1', role: 'admin'
    })).rejects.toMatchObject({ statusCode: 409 });

    expect(exam.destroy).not.toHaveBeenCalled();
  });
});
