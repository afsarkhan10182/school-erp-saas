const httpStatus = require('http-status');
const { success, asyncHandler } = require('~/utils/shared/apiResponse');
const ExamScheduleService = require('~/services/academic/exam-schedule.service');

class ExamScheduleController {
  /**
   * Create exam schedule
   */
  static createExamSchedule = asyncHandler(async (req, res) => {
    const scheduleData = {
      ...req.body,
      school_id: req.schoolId,
      branch_id: req.branchId || req.user.branch_id
    };

    const schedule = await ExamScheduleService.createExamSchedule(scheduleData, req.user.id);

    success(res, { schedule }, 'Exam schedule created successfully', httpStatus.CREATED);
  });

  /**
   * Get all exam schedules
   */
  static getAllExamSchedules = asyncHandler(async (req, res) => {
    const params = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      exam_id: req.query.exam_id,
      branch_id: req.query.branch_id,
      exam_hall_id: req.query.exam_hall_id,
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      invigilator_id: req.query.invigilator_id
    };

    const result = await ExamScheduleService.getAllExamSchedules(params, req.user);

    success(res, result, 'Exam schedules retrieved successfully');
  });

  /**
   * Get exam schedule by ID
   */
  static getExamScheduleById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const schedule = await ExamScheduleService.getExamScheduleById(id, req.user);

    success(res, { schedule }, 'Exam schedule retrieved successfully');
  });

  /**
   * Update exam schedule
   */
  static updateExamSchedule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const schedule = await ExamScheduleService.updateExamSchedule(id, req.body, req.user);

    success(res, { schedule }, 'Exam schedule updated successfully');
  });

  /**
   * Delete exam schedule
   */
  static deleteExamSchedule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ExamScheduleService.deleteExamSchedule(id, req.user);

    success(res, result, 'Exam schedule deleted successfully');
  });

  /**
   * Get schedules for a specific exam
   */
  static getSchedulesForExam = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const schedules = await ExamScheduleService.getSchedulesForExam(examId, req.user);

    success(res, { schedules }, 'Exam schedules retrieved successfully');
  });

  /**
   * Create quick exam schedule ()
   */
  static createQuickSchedule = asyncHandler(async (req, res) => {
    const quickScheduleData = {
      ...req.body,
      school_id: req.schoolId,
      branch_id: req.branchId || req.user.branch_id
    };

    const result = await ExamScheduleService.createQuickSchedule(quickScheduleData, req.user.id);

    const message = `Quick schedule creation completed. ${result.success_count} schedules created, ${result.error_count} errors.`;

    success(res, result, message, httpStatus.CREATED);
  });
}

module.exports = ExamScheduleController;
