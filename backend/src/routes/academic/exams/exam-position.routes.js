const express = require('express');
const { verifyToken, setSchoolContext, requireRole } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { validate } = require('~/middleware/shared/validate');
const ExamPositionController = require('~/controllers/academic/exams/exam-position.controller');
const { EXAM_ROLES, EXAM_ADMIN_ROLES } = require('~/constants/roles');

const router = express.Router();

/**
 * @route /api/exam-positions
 * @desc Exam position management routes
 * @access Private (authenticated users with exam module access)
 */

// All exam position routes require auth, school context, and exam module access
router.use(verifyToken, setSchoolContext, requireModuleAccess('exams'));

// ===== EXAM POSITION MANAGEMENT ROUTES =====

/**
 * @route GET /api/exams/:examId/positions
 * @desc Get positions by exam ID
 * @access Private (EXAM_ROLES)
 * @query {number} page, {number} limit, {string} search, {string} sort_by, {string} sort_order
 */
router.get('/exams/:examId/positions', requireRole(EXAM_ROLES), ExamPositionController.getByExamId);

/**
 * @route POST /api/exams/:examId/calculate-positions
 * @desc Calculate positions for an exam
 * @access Private (EXAM_ADMIN_ROLES)
 */
router.post(
  '/exams/:examId/calculate-positions',
  requireRole(EXAM_ADMIN_ROLES),
  ExamPositionController.calculatePositions
);

/**
 * @route GET /api/exams/:examId/positions/export
 * @desc Export positions
 * @access Private (EXAM_ROLES)
 * @query {string} format (csv, json)
 */
router.get(
  '/exams/:examId/positions/export',
  requireRole(EXAM_ROLES),
  ExamPositionController.exportPositions
);

/**
 * @route GET /api/exam-positions/:id
 * @desc Get single position
 * @access Private (EXAM_ROLES)
 */
router.get('/:id', requireRole(EXAM_ROLES), ExamPositionController.getById);

/**
 * @route PUT /api/exam-positions/:id
 * @desc Update position
 * @access Private (EXAM_ADMIN_ROLES)
 */
router.put('/:id', requireRole(EXAM_ADMIN_ROLES), ExamPositionController.update);

/**
 * @route DELETE /api/exam-positions/:id
 * @desc Delete position
 * @access Private (EXAM_ADMIN_ROLES)
 */
router.delete('/:id', requireRole(EXAM_ADMIN_ROLES), ExamPositionController.delete);

module.exports = router;
