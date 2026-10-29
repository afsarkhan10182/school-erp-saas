const express = require('express');
const {
  verifyToken,
  authorize,
  setSchoolContext,
  setBranchContext
} = require('~/middleware/core/auth');
const { uploadCSV } = require('~/middleware/shared/upload');
const validate = require('~/middleware/shared/validate');
const {
  upsertSession,
  saveRecords,
  getSession,
  listSessions,
  getReport,
  notifyAbsentees,
  exportReport,
  exportPDFReport,
  exportExcelReport,
  getSummary,
  debugAttendanceData
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
router.use(authorize(['super_admin', 'admin', 'branch_admin', 'teacher']));

const attendanceAdminRoles = authorize(['super_admin', 'admin', 'branch_admin']);

router.post('/session', upsertSession);
router.post('/records', saveRecords);
router.get('/sessions/:id', getSession);
router.get('/sessions', listSessions);
router.get('/reports', attendanceAdminRoles, getReport);
router.get('/reports/export', attendanceAdminRoles, exportReport);
router.get('/reports/export/pdf', attendanceAdminRoles, exportPDFReport);
router.get('/reports/export/excel', attendanceAdminRoles, exportReport);
router.get('/reports/summary', attendanceAdminRoles, getSummary);
router.post('/notify-absentees', attendanceAdminRoles, notifyAbsentees);

// Enhanced Analytics Routes
router.get(
  '/analytics',
  attendanceAdminRoles,
  AttendanceAnalyticsController.getAttendanceAnalytics
);
router.get(
  '/analytics/summary',
  attendanceAdminRoles,
  AttendanceAnalyticsController.getAttendanceSummary
);
router.get(
  '/analytics/trends',
  attendanceAdminRoles,
  AttendanceAnalyticsController.getAttendanceTrends
);
router.get(
  '/analytics/performance/classes',
  attendanceAdminRoles,
  AttendanceAnalyticsController.getClassPerformance
);
router.get(
  '/analytics/performance/students',
  attendanceAdminRoles,
  AttendanceAnalyticsController.getStudentPerformance
);
router.get(
  '/analytics/alerts',
  attendanceAdminRoles,
  AttendanceAnalyticsController.getAttendanceAlerts
);
router.get(
  '/analytics/export',
  attendanceAdminRoles,
  AttendanceAnalyticsController.exportAttendanceAnalytics
);
router.get(
  '/reports/detailed',
  attendanceAdminRoles,
  AttendanceAnalyticsController.getDetailedReport
);
router.get(
  '/student/:studentId/history',
  attendanceAdminRoles,
  AttendanceAnalyticsController.getStudentAttendanceHistory
);

// Debug route to check attendance data
router.get('/debug', attendanceAdminRoles, debugAttendanceData);

module.exports = router;
