const express = require('express');
const router = express.Router();
const {
  getStudentsForReportCards,
  getReportCardTemplates,
  generateReportCards
} = require('~/controllers/academic/exam-reports/exam-reports.controller');
const { verifyToken, setSchoolContext } = require('~/middleware/core/auth');

// Apply authentication to all routes
router.use(verifyToken);
router.use(setSchoolContext);

// GET /api/exam-reports/students - Get students for report cards
router.get('/students', getStudentsForReportCards);

// GET /api/exam-reports/templates - Get report card templates
router.get('/templates', getReportCardTemplates);

// POST /api/exam-reports/generate - Generate report cards
router.post('/generate', generateReportCards);

module.exports = router;
