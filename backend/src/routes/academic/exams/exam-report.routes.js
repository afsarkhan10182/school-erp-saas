const express = require('express');
const { verifyToken, setSchoolContext, requireRole } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { validate } = require('~/middleware/shared/validate');
const ExamReportController = require('~/controllers/academic/exams/exam-report.controller');
const { EXAM_ROLES, EXAM_ADMIN_ROLES } = require('~/constants/roles');

const router = express.Router();

/**
 * @route /api/exam-reports
 * @desc Exam report management routes
 * @access Private (authenticated users with exam module access)
 */

// All exam report routes require auth, school context, and exam module access
router.use(verifyToken, setSchoolContext, requireModuleAccess('exams'));

// ===== EXAM REPORT MANAGEMENT ROUTES =====

/**
 * @route GET /api/exams/:examId/reports
 * @desc Get generated reports by exam ID
 * @access Private (EXAM_ROLES)
 * @query {number} page, {number} limit, {string} report_type, {string} status
 */
router.get('/exams/:examId/reports', requireRole(EXAM_ROLES), ExamReportController.getByExamId);

/**
 * @route POST /api/exams/:examId/reports/preview
 * @desc Preview report
 * @access Private (EXAM_ROLES)
 * @body {string} report_type, {string} template_id, {object} filters, {object} config
 */
router.post(
  '/exams/:examId/reports/preview',
  requireRole(EXAM_ROLES),
  ExamReportController.preview
);

/**
 * @route POST /api/exams/:examId/reports/generate
 * @desc Generate report
 * @access Private (EXAM_ADMIN_ROLES)
 * @body {string} report_type, {string} title, {string} description, {string} template_id, {object} filters, {object} config
 */
router.post(
  '/exams/:examId/reports/generate',
  requireRole(EXAM_ADMIN_ROLES),
  ExamReportController.generate
);

/**
 * @route GET /api/exam-reports/:reportId/download
 * @desc Download report
 * @access Private (EXAM_ROLES)
 */
router.get('/:reportId/download', requireRole(EXAM_ROLES), ExamReportController.download);

/**
 * @route DELETE /api/exam-reports/:reportId
 * @desc Delete report
 * @access Private (EXAM_ADMIN_ROLES)
 */
router.delete('/:reportId', requireRole(EXAM_ADMIN_ROLES), ExamReportController.delete);

/**
 * @route GET /api/exam-reports/:reportId
 * @desc Get single report
 * @access Private (EXAM_ROLES)
 */
router.get('/:reportId', requireRole(EXAM_ROLES), ExamReportController.getById);

module.exports = router;
