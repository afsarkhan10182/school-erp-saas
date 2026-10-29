const express = require('express');
const router = express.Router();
const {
  getStudentsForMarksEntry,
  saveMarks,
  getMarksEntrySummary,
  previewMarksImport,
  downloadMarksImportTemplate
} = require('~/controllers/academic/marks-entry/marks-entry.controller');
const { verifyToken, setSchoolContext, requireRole } = require('~/middleware/core/auth');
const { EXAM_ROLES } = require('~/constants/roles');
const { upload } = require('~/middleware/shared/upload');

// Apply authentication to all routes
router.use(verifyToken);
router.use(setSchoolContext);
router.use(requireRole(...EXAM_ROLES));

// GET /api/marks-entry/students - Get students for marks entry
router.get('/students', getStudentsForMarksEntry);
router.get('/import-template', downloadMarksImportTemplate);
router.post('/import-preview', upload.single('file'), previewMarksImport);

// POST /api/marks-entry/save - Save marks for multiple students
router.post('/save', saveMarks);

// GET /api/marks-entry/summary - Get marks entry summary
router.get('/summary', getMarksEntrySummary);

module.exports = router;
