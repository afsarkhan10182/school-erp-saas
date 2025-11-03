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
const { verifyToken, setSchoolContext } = require('~/middleware/core/auth');

// Apply authentication to all routes
router.use(verifyToken);
router.use(setSchoolContext);

// GET /api/exam-publication/status - Get publication status for exams
router.get('/status', getPublicationStatus);

// POST /api/exam-publication/publish - Publish/unpublish exam results
router.post('/publish', publishExam);

// POST /api/exam-publication/bulk-publish - Bulk publish multiple exams
router.post('/bulk-publish', bulkPublish);

// POST /api/exam-publication/:examId/notify - Send notifications for published results
router.post('/:examId/notify', sendNotifications);

// GET /api/exam-publication/:examId/notifications - Get notification history
router.get('/:examId/notifications', getNotificationHistory);

// GET /api/exam-publication/stats - Get publication statistics
router.get('/stats', getStats);

module.exports = router;
