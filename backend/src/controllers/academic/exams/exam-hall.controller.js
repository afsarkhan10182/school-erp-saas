const httpStatus = require('http-status');
const { success, asyncHandler } = require('~/utils/shared/apiResponse');
const ExamHallService = require('~/services/academic/exam-hall.service');

class ExamHallController {
  /**
   * Create exam hall
   */
  static createExamHall = asyncHandler(async (req, res) => {
    // Use req.schoolId if available, otherwise fall back to user's school_id
    const schoolId = req.schoolId || req.user.school_id;

    if (!schoolId) {
      return res.status(400).json({
        status: 'error',
        message: 'School context is required'
      });
    }

    // Only accept essential fields
    const hallData = {
      name: req.body.name,
      capacity: req.body.capacity,
      branch_id: req.body.branch_id,
      school_id: schoolId
    };

    const hall = await ExamHallService.createExamHall(hallData, req.user.id);

    success(res, { hall }, 'Exam hall created successfully', httpStatus.CREATED);
  });

  /**
   * Get all exam halls
   */
  static getAllExamHalls = asyncHandler(async (req, res) => {
    // Ensure user has school_id
    if (!req.user.school_id) {
      return res.status(400).json({
        status: 'error',
        message: 'User must be associated with a school'
      });
    }

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
    // Ensure user has school_id
    if (!req.user.school_id) {
      return res.status(400).json({
        status: 'error',
        message: 'User must be associated with a school'
      });
    }

    const { id } = req.params;
    const hall = await ExamHallService.getExamHallById(id, req.user);

    success(res, { hall }, 'Exam hall retrieved successfully');
  });

  /**
   * Update exam hall
   */
  static updateExamHall = asyncHandler(async (req, res) => {
    // Ensure user has school_id
    if (!req.user.school_id) {
      return res.status(400).json({
        status: 'error',
        message: 'User must be associated with a school'
      });
    }

    const { id } = req.params;

    // Only accept essential fields for update
    const updateData = {
      name: req.body.name,
      capacity: req.body.capacity,
      branch_id: req.body.branch_id
    };

    const hall = await ExamHallService.updateExamHall(id, updateData, req.user);

    success(res, { hall }, 'Exam hall updated successfully');
  });

  /**
   * Delete exam hall
   */
  static deleteExamHall = asyncHandler(async (req, res) => {
    // Ensure user has school_id
    if (!req.user.school_id) {
      return res.status(400).json({
        status: 'error',
        message: 'User must be associated with a school'
      });
    }

    const { id } = req.params;
    const result = await ExamHallService.deleteExamHall(id, req.user);

    success(res, result, 'Exam hall deleted successfully');
  });

  /**
   * Get exam halls for dropdown
   */
  static getExamHallsForDropdown = asyncHandler(async (req, res) => {
    // Ensure user has school_id
    if (!req.user.school_id) {
      return res.status(400).json({
        status: 'error',
        message: 'User must be associated with a school'
      });
    }

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
