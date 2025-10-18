const express = require('express');
const router = express.Router();
const {
  getStudentsForMarksEntry,
  saveMarks,
  getMarksEntrySummary
} = require('~/controllers/academic/marks-entry/marks-entry.controller');
const { verifyToken, setSchoolContext } = require('~/middleware/core/auth');

// Apply authentication to all routes
router.use(verifyToken);
router.use(setSchoolContext);

// GET /api/marks-entry/students - Get students for marks entry
router.get('/students', getStudentsForMarksEntry);

// POST /api/marks-entry/save - Save marks for multiple students
router.post('/save', saveMarks);

// GET /api/marks-entry/summary - Get marks entry summary
router.get('/summary', getMarksEntrySummary);

module.exports = router;
