const httpStatus = require('http-status');
const ApiError = require('../../../utils/ApiError');
const { success, error, asyncHandler } = require('../../../utils/apiResponse');
const { ExamType } = require('~/models');
const { logger } = require('~/utils/logger');
const ExamTypeService = require('~/services/academic/exam-type.service');

class ExamTypeController {
  /**
   * Create a new exam type
   */
  static createExamType = asyncHandler(async (req, res) => {
    const examTypeData = {
      ...req.body,
      school_id: req.schoolId
    };

    const examType = await ExamTypeService.createExamType(examTypeData, req.user.id);
    
    success(res, { examType }, 'Exam type created successfully', httpStatus.CREATED);
  });

  /**
   * Get all exam types with pagination and filtering
   */
  static getAllExamTypes = asyncHandler(async (req, res) => {
    const params = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      is_active: req.query.is_active,
      school_id: req.query.school_id
    };

    const result = await ExamTypeService.getAllExamTypes(params, req.user);
    
    success(res, result, 'Exam types retrieved successfully');
  });

  /**
   * Get exam type by ID
   */
  static getExamTypeById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const examType = await ExamTypeService.getExamTypeById(id, req.user);
    
    success(res, { examType }, 'Exam type retrieved successfully');
  });

  /**
   * Update exam type
   */
  static updateExamType = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const examType = await ExamTypeService.updateExamType(id, updateData, req.user);
    
    success(res, { examType }, 'Exam type updated successfully');
  });

  /**
   * Delete exam type
   */
  static deleteExamType = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ExamTypeService.deleteExamType(id, req.user);
    
    success(res, result, 'Exam type deleted successfully');
  });

  /**
   * Get active exam types for dropdown
   */
  static getActiveExamTypes = asyncHandler(async (req, res) => {
    const examTypes = await ExamTypeService.getActiveExamTypes(req.user);
    
    success(res, { examTypes }, 'Active exam types retrieved successfully');
  });
}

module.exports = ExamTypeController;
