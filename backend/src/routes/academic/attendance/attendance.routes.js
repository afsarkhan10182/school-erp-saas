const express = require('express');
const { verifyToken, setSchoolContext, setBranchContext } = require('~/middleware/core/auth');
const { uploadCSV } = require('~/middleware/shared/upload');
const validate = require('~/middleware/shared/validate');
const {
  upsertSession,
  saveRecords,
  getSession,
  listSessions,
  getReport,
  bulkImport,
  notifyAbsentees,
  exportReport,
  bulkImportFile,
  exportPDFReport,
  exportExcelReport,
  getSummary,
  generateImportTemplate
} = require('~/controllers/academic/attendance/attendance.controller');

// Import enhanced analytics controller
const AttendanceAnalyticsController = require('~/controllers/academic/attendance/attendance-analytics.controller');
const {
  createAttendanceValidator,
  updateAttendanceValidator
} = require('~/validations/academic/attendance');

const router = express.Router();

// All attendance routes require auth and school/branch context
router.use(verifyToken, setSchoolContext, setBranchContext);

router.post('/session', upsertSession);
router.post('/records', saveRecords);
router.get('/sessions/:id', getSession);
router.get('/sessions', listSessions);
router.get('/reports', getReport);
router.get('/reports/export', exportReport);
router.get('/reports/export/pdf', exportPDFReport);
router.get('/reports/export/excel', exportReport);
router.get('/reports/summary', getSummary);
router.get('/import-template', generateImportTemplate);
router.post('/bulk-import', bulkImport);
router.post('/notify-absentees', notifyAbsentees);
router.post('/bulk-import/file', uploadCSV('file'), bulkImportFile);

// Enhanced Analytics Routes
router.get('/analytics', AttendanceAnalyticsController.getAttendanceAnalytics);
router.get('/analytics/summary', AttendanceAnalyticsController.getAttendanceSummary);
router.get('/analytics/trends', AttendanceAnalyticsController.getAttendanceTrends);
router.get('/analytics/performance/classes', AttendanceAnalyticsController.getClassPerformance);
router.get('/analytics/performance/students', AttendanceAnalyticsController.getStudentPerformance);
router.get('/analytics/alerts', AttendanceAnalyticsController.getAttendanceAlerts);
router.get('/analytics/export', AttendanceAnalyticsController.exportAttendanceAnalytics);
router.get('/reports/detailed', AttendanceAnalyticsController.getDetailedReport);
router.get(
  '/student/:studentId/history',
  AttendanceAnalyticsController.getStudentAttendanceHistory
);

module.exports = router;
