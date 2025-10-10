const httpStatus = require('http-status');
const ApiError = require('~/utils/shared/ApiError');
const { success, error, asyncHandler } = require('~/utils/shared/apiResponse');
const {
  Exam,
  ExamType,
  ExamStatus,
  ExamResult,
  Subject,
  Class,
  Section,
  School,
  Branch
} = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');
const ExamService = require('~/services/academic/exam.service');
const ReportCardService = require('~/services/academic/report-card.service');

class ExamController {
  /**
   * Test method
   */
  static test = (req, res) => {
    console.log('DEBUG: Test method called');
    res.json({ success: true, message: 'Test method reached' });
  };

  /**
   * Test async method
   */
  static testAsync = asyncHandler(async (req, res) => {
    console.log('DEBUG: Test async method called');
    res.json({ success: true, message: 'Test async method reached' });
  });

  /**
   * Create a new exam
   */
  static createExam = asyncHandler(async (req, res) => {
    // Use req.schoolId if available, otherwise fall back to user's school_id
    const schoolId = req.schoolId || req.user.school_id;

    if (!schoolId) {
      return res.status(400).json({
        status: 'error',
        message: 'School context is required'
      });
    }

    if (!req.user.branch_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Branch context is required'
      });
    }

    const examData = {
      ...req.body,
      school_id: schoolId,
      branch_id: req.user.branch_id
    };

    const exam = await ExamService.createExam(examData, req.user.id);

    success(res, { exam }, 'Exam created successfully', httpStatus.CREATED);
  });

  /**
   * Get all exams with pagination and filtering
   */
  static getAllExams = asyncHandler(async (req, res) => {
    const params = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      exam_type: req.query.exam_type,
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      academic_year: req.query.academic_year,
      branch_id: req.branchId || req.query.branch_id
    };

    const result = await ExamService.getAllExams(params, req.user);

    success(res, result, 'Exams retrieved successfully');
  });

  /**
   * Get exam by ID
   */
  static getExamById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const exam = await ExamService.getExamById(id, req.user);

    success(res, { exam }, 'Exam retrieved successfully');
  });

  /**
   * Update exam
   */
  static updateExam = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const exam = await ExamService.updateExam(id, updateData, req.user);

    success(res, { exam }, 'Exam updated successfully');
  });

  /**
   * Delete exam (soft delete)
   */
  static deleteExam = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await ExamService.deleteExam(id, req.user);

    success(res, result, 'Exam cancelled successfully');
  });

  /**
   * Bulk create exam results
   */
  static bulkCreateResults = asyncHandler(async (req, res) => {
    const { id: examId } = req.params;
    const { results } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Results array is required and cannot be empty');
    }

    const result = await ExamService.bulkCreateResults(examId, results, req.user);

    success(res, result, 'Results saved successfully');
  });

  /**
   * Update a single exam result
   */
  static updateExamResult = asyncHandler(async (req, res) => {
    const { resultId } = req.params;
    const updateData = req.body;

    const result = await ExamService.updateExamResult(resultId, updateData, req.user);

    success(res, result, 'Result updated successfully');
  });

  /**
   * Get exam results
   */
  static getExamResults = asyncHandler(async (req, res) => {
    const { id: examId } = req.params;
    const result = await ExamService.getExamResults(examId, req.user);

    success(res, result, 'Exam results retrieved successfully');
  });

  /**
   * Get student exam history
   */
  static getStudentExamHistory = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const params = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      academic_year: req.query.academic_year,
      exam_type: req.query.exam_type
    };

    const result = await ExamService.getStudentExamHistory(studentId, req.user, params);

    success(res, result, 'Student exam history retrieved successfully');
  });

  /**
   * Get exam statistics
   */
  static getExamStats = asyncHandler(async (req, res) => {
    const params = {
      academic_year: req.query.academic_year,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };

    const stats = await ExamService.getExamStats(req.user, params);

    success(res, { stats }, 'Exam statistics retrieved successfully');
  });

  /**
   * Export exam results
   */
  static exportExamResults = asyncHandler(async (req, res) => {
    const { id: examId } = req.params;
    const { format = 'json' } = req.query;

    const result = await ExamService.exportExamResults(examId, req.user, format);

    // For now, return JSON data - PDF/Excel generation can be added later
    success(res, result, 'Exam results exported successfully');
  });

  /**
   * Calculate grade based on percentage
   */
  static calculateGrade = asyncHandler(async (req, res) => {
    const { percentage } = req.query;

    if (!percentage || isNaN(parseFloat(percentage))) {
      return error(res, 'Valid percentage is required', httpStatus.BAD_REQUEST);
    }

    const gradeData = await ExamService.calculateGrade(parseFloat(percentage), req.schoolId);

    success(res, gradeData, 'Grade calculated successfully');
  });

  /**
   * Generate report card for student
   */
  static generateReportCard = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { academic_year, exam_types, format = 'html', auto_print = 'false' } = req.query;

    const reportCardService = new ReportCardService();

    // Get current academic year from system if not provided
    let currentAcademicYear = academic_year;
    if (!currentAcademicYear) {
      const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');
      const academicYearData = await getCurrentAcademicYearForSchool(req.schoolId);
      currentAcademicYear = academicYearData?.name;

      if (!currentAcademicYear) {
        return res.status(400).json({
          success: false,
          message: 'Academic year is required for report card generation'
        });
      }
    }

    // Generate comprehensive report card
    const reportCardData = await reportCardService.generateReportCard(
      studentId,
      currentAcademicYear,
      exam_types,
      { autoPrint: auto_print === 'true' }
    );

    // Generate report card in requested format
    const reportCardContent = await reportCardService.generateReportCardInFormat(
      studentId,
      currentAcademicYear,
      format,
      { autoPrint: auto_print === 'true' }
    );

    const fileName = `report-card-${reportCardData.student.admission_number}-${currentAcademicYear}`;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.json"`);
      res.send(reportCardContent);
    } else {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.html"`);
      res.send(reportCardContent);
    }
  });

  /**
   * Upload marks file (Excel/CSV)
   */
  static uploadMarksFile = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const file = req.file;

    if (!file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
    }

    const result = await ExamService.uploadMarksFile(examId, file, req.user);

    success(res, result, 'Marks file processed successfully');
  });

  /**
   * Download marks template
   */
  static downloadMarksTemplate = asyncHandler(async (req, res) => {
    const { examId } = req.params;

    const template = await ExamService.downloadMarksTemplate(examId, req.user);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="marks-template-${examId}.xlsx"`);
    res.send(template);
  });

  /**
   * Bulk update exam results
   */
  static bulkUpdateResults = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const { results } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Results array is required and cannot be empty');
    }

    const result = await ExamService.bulkUpdateResults(examId, results, req.user);

    success(res, result, 'Results updated successfully');
  });
}

module.exports = ExamController;
