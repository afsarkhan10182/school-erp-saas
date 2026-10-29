const express = require('express');
const router = express.Router();
const {
  getStudentsForReportCards,
  getReportCardTemplates,
  generateReportCards,
  getStudentReportCardArchives,
  downloadStudentReportCardArchive,
  downloadReportCard,
  getTabulationSheet,
  getProgressReport
} = require('~/controllers/academic/exam-reports/exam-reports.controller');
const { verifyToken, setSchoolContext, setBranchContext, requireRole } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { EXAM_ROLES } = require('~/constants/roles');
const ReportCardTemplateController = require('~/controllers/academic/exams/report-card-template.controller');

// Apply authentication, school context, branch context, and module access to all routes
router.use(verifyToken, setSchoolContext, setBranchContext, requireModuleAccess('exams'));

// GET /api/exam-reports/students - Get students for report cards
router.get('/students', getStudentsForReportCards);

router.get('/tabulation', getTabulationSheet);
router.get('/progress', getProgressReport);
router.get('/students/:studentId/archives', requireRole('admin', 'branch_admin', 'super_admin'), getStudentReportCardArchives);
router.get('/archives/:archiveId/download', requireRole('admin', 'branch_admin', 'super_admin'), downloadStudentReportCardArchive);

// GET /api/exam-reports/templates - Get report card templates
router.get('/templates', getReportCardTemplates);
router.post('/templates', requireRole('admin', 'super_admin'), ReportCardTemplateController.create);
router.put('/templates/:templateId', requireRole('admin', 'super_admin'), ReportCardTemplateController.update);

// POST /api/exam-reports/generate - Generate report cards
router.post('/generate', generateReportCards);

// GET /api/exam-reports/download/:reportId - Download generated report card
// This must come before any catch-all routes in exam-report.routes.js
router.get('/download/:reportId', downloadReportCard);

module.exports = router;
