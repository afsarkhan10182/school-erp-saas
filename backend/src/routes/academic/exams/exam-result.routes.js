const express = require('express');
const { verifyToken, setSchoolContext, requireRole } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { validate } = require('~/middleware/shared/validate');
const ExamResultController = require('~/controllers/academic/exams/exam-result.controller');
const { EXAM_ROLES, EXAM_ADMIN_ROLES } = require('~/constants/roles');

const router = express.Router();

/**
 * @route /api/exam-results
 * @desc Exam result management routes
 * @access Private (authenticated users with exam module access)
 */

// All exam result routes require auth, school context, and exam module access
router.use(verifyToken, setSchoolContext, requireModuleAccess('exams'));

// ===== EXAM RESULT MANAGEMENT ROUTES =====

/**
 * @route GET /api/exams/:examId/results
 * @desc Get results by exam ID
 * @access Private (EXAM_ROLES)
 * @query {number} page, {number} limit, {string} search, {string} grade, {string} sort_by, {string} sort_order
 */
router.get('/exams/:examId/results', requireRole(...EXAM_ROLES), ExamResultController.getByExamId);

/**
 * @route POST /api/exams/:examId/results/bulk
 * @desc Create bulk results
 * @access Private (EXAM_ADMIN_ROLES)
 * @body {Array} results - Array of result objects
 */
router.post(
  '/exams/:examId/results/bulk',
  requireRole(...EXAM_ADMIN_ROLES),
  ExamResultController.createBulk
);

/**
 * @route POST /api/exams/:examId/calculate-grades
 * @desc Calculate grades for an exam
 * @access Private (EXAM_ADMIN_ROLES)
 */
router.post(
  '/exams/:examId/calculate-grades',
  requireRole(...EXAM_ADMIN_ROLES),
  ExamResultController.calculateGrades
);

/**
 * @route GET /api/exams/:examId/results/export
 * @desc Export results
 * @access Private (EXAM_ROLES)
 * @query {string} format (csv, json)
 */
router.get(
  '/exams/:examId/results/export',
  requireRole(...EXAM_ROLES),
  ExamResultController.exportResults
);

/**
 * @route GET /api/exam-results/:id
 * @desc Get single result
 * @access Private (EXAM_ROLES)
 */
router.get('/:id', requireRole(...EXAM_ROLES), ExamResultController.getById);

/**
 * @route PUT /api/exam-results/:id
 * @desc Update result
 * @access Private (EXAM_ADMIN_ROLES)
 */
router.put('/:id', requireRole(...EXAM_ADMIN_ROLES), ExamResultController.update);

/**
 * @route DELETE /api/exam-results/:id
 * @desc Delete result
 * @access Private (EXAM_ADMIN_ROLES)
 */
router.delete('/:id', requireRole(...EXAM_ADMIN_ROLES), ExamResultController.delete);

module.exports = router;
