const express = require('express');
const router = express.Router();
const {
  getStudentsForReportCards,
  getReportCardTemplates,
  generateReportCards,
  downloadReportCard
} = require('~/controllers/academic/exam-reports/exam-reports.controller');
const { verifyToken, setSchoolContext, setBranchContext } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { EXAM_ROLES } = require('~/constants/roles');

// Apply authentication, school context, branch context, and module access to all routes
router.use(verifyToken, setSchoolContext, setBranchContext, requireModuleAccess('exams'));

// GET /api/exam-reports/students - Get students for report cards
router.get('/students', getStudentsForReportCards);

// GET /api/exam-reports/templates - Get report card templates
router.get('/templates', getReportCardTemplates);

// POST /api/exam-reports/generate - Generate report cards
router.post('/generate', generateReportCards);

// GET /api/exam-reports/download/:reportId - Download generated report card
// This must come before any catch-all routes in exam-report.routes.js
router.get('/download/:reportId', downloadReportCard);

module.exports = router;
