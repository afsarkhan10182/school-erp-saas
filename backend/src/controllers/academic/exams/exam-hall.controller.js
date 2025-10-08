const httpStatus = require('http-status');
const { success, asyncHandler } = require('~/utils/shared/apiResponse');
const ExamHallService = require('~/services/academic/exam-hall.service');

class ExamHallController {
  /**
   * Create exam hall
   */
  static createExamHall = asyncHandler(async (req, res) => {
    const hallData = {
      ...req.body,
      school_id: req.schoolId
    };

    const hall = await ExamHallService.createExamHall(hallData, req.user.id);

    success(res, { hall }, 'Exam hall created successfully', httpStatus.CREATED);
  });

  /**
   * Get all exam halls
   */
  static getAllExamHalls = asyncHandler(async (req, res) => {
    const params = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      is_active: req.query.is_active
    };

    const result = await ExamHallService.getAllExamHalls(params, req.user);

    success(res, result, 'Exam halls retrieved successfully');
  });

  /**
   * Get exam hall by ID
   */
  static getExamHallById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const hall = await ExamHallService.getExamHallById(id, req.user);

    success(res, { hall }, 'Exam hall retrieved successfully');
  });

  /**
   * Update exam hall
   */
  static updateExamHall = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const hall = await ExamHallService.updateExamHall(id, req.body, req.user);

    success(res, { hall }, 'Exam hall updated successfully');
  });

  /**
   * Delete exam hall
   */
  static deleteExamHall = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ExamHallService.deleteExamHall(id, req.user);

    success(res, result, 'Exam hall deleted successfully');
  });

  /**
   * Get exam halls for dropdown
   */
  static getExamHallsForDropdown = asyncHandler(async (req, res) => {
    const halls = await ExamHallService.getExamHallsForDropdown(req.user);

    success(res, { halls }, 'Exam halls retrieved successfully');
  });

  /**
   * Check hall availability
   */
  static checkHallAvailability = asyncHandler(async (req, res) => {
    const { hallId, examDate, startTime, endTime, excludeScheduleId } = req.query;

    const availability = await ExamHallService.checkHallAvailability(
      hallId,
      examDate,
      startTime,
      endTime,
      excludeScheduleId
    );

    success(res, availability, 'Hall availability checked successfully');
  });
}

module.exports = ExamHallController;
