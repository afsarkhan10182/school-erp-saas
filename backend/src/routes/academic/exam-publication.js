const express = require('express');
const router = express.Router();
const {
  getPublicationStatus,
  publishExam,
  bulkPublish,
  sendNotifications,
  getNotificationHistory,
  getStats
} = require('~/controllers/academic/exam-publication/exam-publication.controller');
const { verifyToken, setSchoolContext, requireRole } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { EXAM_ROLES, EXAM_ADMIN_ROLES } = require('~/constants/roles');

// Publication uses the same tenant/module guards as the other exam routes.
router.use(verifyToken, setSchoolContext, requireModuleAccess('exams'));

// GET /api/exam-publication/status - Get publication status for exams
router.get('/status', requireRole(...EXAM_ROLES), getPublicationStatus);

// POST /api/exam-publication/publish - Publish/unpublish exam results
router.post('/publish', requireRole(...EXAM_ADMIN_ROLES), publishExam);

// POST /api/exam-publication/bulk-publish - Bulk publish multiple exams
router.post('/bulk-publish', requireRole(...EXAM_ADMIN_ROLES), bulkPublish);

// POST /api/exam-publication/:examId/notify - Send notifications for published results
router.post('/:examId/notify', requireRole(...EXAM_ADMIN_ROLES), sendNotifications);

// GET /api/exam-publication/:examId/notifications - Get notification history
router.get('/:examId/notifications', requireRole(...EXAM_ROLES), getNotificationHistory);

// GET /api/exam-publication/stats - Get publication statistics
router.get('/stats', requireRole(...EXAM_ROLES), getStats);

module.exports = router;
