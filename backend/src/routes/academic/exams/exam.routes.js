const express = require('express');
const {
  verifyToken,
  setSchoolContext,
  setBranchContext,
  requireRole
} = require('~/middleware/auth');
const { requireModuleAccess } = require('~/middleware/moduleAccess');
const { validate } = require('~/middleware/validate');
const { upload } = require('~/middleware/upload');
const ExamController = require('~/controllers/academic/exams/exam.controller');
const {
  createExamValidator,
  updateExamValidator
} = require('~/validations/academic/exam.validation');
const { EXAM_ROLES, EXAM_ADMIN_ROLES } = require('~/constants/roles');

const router = express.Router();

/**
 * @route /api/exams
 * @desc Exam management routes
 * @access Private (authenticated users with exam module access)
 */

// All exam routes require auth, school/branch context, and exam module access
router.use(verifyToken, setSchoolContext, setBranchContext, requireModuleAccess('exams'));

// ===== EXAM MANAGEMENT ROUTES =====

/**
 * @route POST /api/exams
 * @desc Create a new exam
 * @access Private (EXAM_ROLES)
 * @body {string} name, {string} exam_type_id, {string} class_id, {string} section_id, {date} exam_date, {string} academic_year
 */
router.post(
  '/',
  requireRole(...EXAM_ROLES),
  validate(createExamValidator),
  ExamController.createExam
);

/**
 * @route GET /api/exams
 * @desc Get all exams with pagination and filtering
 * @access Private (EXAM_ROLES)
 * @query {number} page, {number} limit, {string} search, {string} exam_type, {string} status, {string} class_id
 */
router.get('/', ExamController.getAllExams);

/**
 * @route GET /api/exams/stats
 * @desc Get exam statistics
 * @access Private (EXAM_ROLES)
 * @query {string} academic_year, {date} date_from, {date} date_to
 */
router.get('/stats', ExamController.getExamStats);

/**
 * @route GET /api/exams/calculate-grade
 * @desc Calculate grade based on percentage
 * @access Private (EXAM_ROLES)
 * @query {number} percentage - Percentage to calculate grade for
 */
router.get('/calculate-grade', ExamController.calculateGrade);

/**
 * @route GET /api/exams/:id
 * @desc Get exam by ID
 * @access Private (EXAM_ROLES)
 * @param {string} id - Exam ID
 */
router.get('/:id', ExamController.getExamById);

/**
 * @route PUT /api/exams/:id
 * @desc Update exam
 * @access Private (EXAM_ROLES)
 * @param {string} id - Exam ID
 * @body {string} name, {string} exam_type_id, {string} class_id, {string} section_id, {date} exam_date, {string} academic_year
 */
router.put(
  '/:id',
  requireRole(...EXAM_ROLES),
  validate(updateExamValidator),
  ExamController.updateExam
);

/**
 * @route DELETE /api/exams/:id
 * @desc Delete exam (soft delete)
 * @access Private (EXAM_ADMIN_ROLES)
 * @param {string} id - Exam ID
 */
router.delete('/:id', requireRole(...EXAM_ADMIN_ROLES), ExamController.deleteExam);

// ===== EXAM RESULTS ROUTES (NESTED) =====

/**
 * @route POST /api/exams/:id/results
 * @desc Bulk create exam results
 * @access Private (EXAM_ROLES)
 * @param {string} id - Exam ID
 * @body {Array} results - Array of exam result objects
 */
router.post('/:id/results', requireRole(...EXAM_ROLES), ExamController.bulkCreateResults);

/**
 * @route GET /api/exams/:id/results
 * @desc Get exam results
 * @access Private (EXAM_ROLES)
 * @param {string} id - Exam ID
 */
router.get('/:id/results', ExamController.getExamResults);

/**
 * @route GET /api/exams/:id/results/export
 * @desc Export exam results
 * @access Private (EXAM_ROLES)
 * @param {string} id - Exam ID
 * @query {string} format - Export format (json, pdf, excel)
 */
router.get('/:id/results/export', ExamController.exportExamResults);

/**
 * @route PUT /api/exams/:id/results/:resultId
 * @desc Update a single exam result
 * @access Private (EXAM_ROLES)
 * @param {string} id - Exam ID
 * @param {string} resultId - Result ID
 * @body {number} marks_obtained, {string} grade, {string} remarks
 */
router.put('/:id/results/:resultId', requireRole(...EXAM_ROLES), ExamController.updateExamResult);

// ===== STUDENT EXAM ROUTES =====

/**
 * @route GET /api/exams/student/:studentId/history
 * @desc Get student exam history
 * @access Private (EXAM_ROLES)
 * @param {string} studentId - Student ID
 * @query {number} page, {number} limit, {string} academic_year, {string} exam_type
 */
router.get('/student/:studentId/history', ExamController.getStudentExamHistory);

// ===== REPORT CARD ROUTES =====

/**
 * @route GET /api/exams/student/:studentId/report-card
 * @desc Generate report card for student
 * @access Private (EXAM_ROLES)
 * @param {string} studentId - Student ID
 * @query {string} academic_year, {string} exam_types, {string} format, {boolean} auto_print
 */
router.get('/student/:studentId/report-card', ExamController.generateReportCard);

// ===== BULK MARKS ENTRY ROUTES =====

/**
 * @route POST /api/exams/:examId/upload-marks
 * @desc Upload marks file (Excel/CSV)
 * @access Private (EXAM_ROLES)
 * @param {string} examId - Exam ID
 * @body {File} file - Excel/CSV file with marks data
 */
router.post(
  '/:examId/upload-marks',
  requireRole(...EXAM_ROLES),
  upload.single('file'),
  ExamController.uploadMarksFile
);

/**
 * @route GET /api/exams/:examId/template
 * @desc Download marks template
 * @access Private (EXAM_ROLES)
 * @param {string} examId - Exam ID
 */
router.get('/:examId/template', requireRole(...EXAM_ROLES), ExamController.downloadMarksTemplate);

/**
 * @route PUT /api/exams/:examId/results/bulk
 * @desc Bulk update exam results
 * @access Private (EXAM_ROLES)
 * @param {string} examId - Exam ID
 * @body {Array} results - Array of result objects
 */
router.put('/:examId/results/bulk', requireRole(...EXAM_ROLES), ExamController.bulkUpdateResults);

module.exports = router;
