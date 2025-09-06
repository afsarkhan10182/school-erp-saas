const express = require('express');
const {
  sendAbsenceNotifications,
  sendLateArrivalNotifications,
  sendAttendanceSummary,
  getNotificationSettings,
} = require('~/controllers/academic/attendance/attendance-notification.controller');
const { verifyToken, authorize, setSchoolContext } = require('~/middleware/auth');
const { validate } = require('~/middleware/validate');
const { createAttendanceNotificationValidator, updateAttendanceNotificationValidator } = require('~/validations/academic/attendance-notification.validation');
const { validateModuleAccess, checkSubscriptionStatus } = require('~/middleware/subscriptionValidation');
const router = express.Router();

// Middleware to ensure authentication
router.use(verifyToken);

// Middleware to ensure school context is set
router.use(setSchoolContext);

// Middleware to ensure user has appropriate role
router.use(authorize(['super_admin', 'school_admin', 'branch_admin', 'teacher']));

// Middleware to check subscription status
router.use(checkSubscriptionStatus);

// Middleware to validate attendance module access
router.use(validateModuleAccess('attendance'));

/**
 * @route POST /api/attendance-notifications/absence
 * @desc Send absence notifications to parents
 * @access Private (super_admin, school_admin, branch_admin, teacher)
 */
router.post('/absence', sendAbsenceNotifications);

/**
 * @route POST /api/attendance-notifications/late-arrival
 * @desc Send late arrival notifications to parents
 * @access Private (super_admin, school_admin, branch_admin, teacher)
 */
router.post('/late-arrival', sendLateArrivalNotifications);

/**
 * @route POST /api/attendance-notifications/summary
 * @desc Send attendance summary notifications
 * @access Private (super_admin, school_admin, branch_admin, teacher)
 */
router.post('/summary', sendAttendanceSummary);

/**
 * @route GET /api/attendance-notifications/settings
 * @desc Get notification settings and statistics
 * @access Private (super_admin, school_admin, branch_admin, teacher)
 */
router.get('/settings', getNotificationSettings);



module.exports = router;