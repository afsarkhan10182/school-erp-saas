const express = require('express');
const DashboardController = require('~/controllers/shared/dashboard.controller');
const { verifyToken, authorize } = require('~/middleware/core/auth');

const router = express.Router();
const financeDashboardRoles = ['super_admin', 'admin', 'branch_admin', 'accountant'];
const staffDashboardRoles = [...financeDashboardRoles, 'teacher', 'receptionist', 'librarian'];

// All dashboard routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Get overview statistics for the dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/stats',
  authorize(['super_admin', 'admin', 'branch_admin', 'teacher', 'accountant', 'receptionist', 'librarian']),
  DashboardController.getStats
);

/**
 * @swagger
 * /dashboard/overview-report:
 *   get:
 *     summary: Get overview report
 *     description: Get comprehensive overview report (Super Admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin access required
 */
router.get('/overview-report', authorize(['super_admin']), DashboardController.getOverviewReport);

/**
 * @swagger
 * /dashboard/school-report:
 *   get:
 *     summary: Get school report
 *     description: Get school-specific report (Admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: School report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/school-report', authorize(['admin']), DashboardController.getSchoolReport);

router.get(
  '/notices',
  authorize(['super_admin', 'admin', 'branch_admin']),
  DashboardController.getNotices
);
router.get(
  '/attendance-today',
  authorize(['super_admin', 'admin', 'branch_admin']),
  DashboardController.getTodayAttendance
);
router.get('/overdue-fees', authorize(financeDashboardRoles), DashboardController.getOverdueFees);

/**
 * @swagger
 * /dashboard/recent-activities:
 *   get:
 *     summary: Get recent activities
 *     description: Get recent activities based on user role
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of activities to return
 *     responses:
 *       200:
 *         description: Recent activities retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/recent-activities', DashboardController.getRecentActivities);

/**
 * @swagger
 * /dashboard/students-chart:
 *   get:
 *     summary: Get students chart data
 *     description: Get monthly students data for chart visualization
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Students chart data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/students-chart', authorize(staffDashboardRoles), DashboardController.getStudentsChartData);

/**
 * @swagger
 * /dashboard/fees-chart:
 *   get:
 *     summary: Get fees chart data
 *     description: Get fee collection status data for chart visualization
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fees chart data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/fees-chart', authorize(financeDashboardRoles), DashboardController.getFeesChartData);

/**
 * @swagger
 * /dashboard/student-distribution:
 *   get:
 *     summary: Get student distribution data
 *     description: Get student distribution by class for chart visualization
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student distribution data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/student-distribution', authorize(staffDashboardRoles), DashboardController.getStudentDistributionData);

/**
 * @swagger
 * /dashboard/fee-trend:
 *   get:
 *     summary: Get fee trend data
 *     description: Get fee collection trend data for chart visualization
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fee trend data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/fee-trend', authorize(financeDashboardRoles), DashboardController.getFeeTrendData);

/**
 * @swagger
 * /dashboard/fee-collection-summary:
 *   get:
 *     summary: Get fee collection summary
 *     description: Get detailed fee collection summary with branch breakdown
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academic_year
 *         schema:
 *           type: string
 *           example: "2024-2025"
 *         description: Academic year for the summary (optional, defaults to current)
 *     responses:
 *       200:
 *         description: Fee collection summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Access denied
 */
router.get(
  '/fee-collection-summary',
  authorize(financeDashboardRoles),
  DashboardController.getFeeCollectionSummary
);
router.get('/academic-year-months', authorize(financeDashboardRoles), DashboardController.getAcademicYearMonths);
router.get('/income-vs-expense', authorize(financeDashboardRoles), DashboardController.getIncomeVsExpense);
router.get('/weekend-attendance', authorize(staffDashboardRoles), DashboardController.getWeekendAttendance);
router.get('/annual-fees-summary', authorize(financeDashboardRoles), DashboardController.getAnnualFeesSummary);

module.exports = router;
