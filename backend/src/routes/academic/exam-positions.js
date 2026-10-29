const express = require('express');
const router = express.Router();
const {
  getStudentsForPositions,
  getPositionStats,
  calculatePositions,
  savePositions
} = require('~/controllers/academic/exam-positions/exam-positions.controller');
const {
  verifyToken,
  setSchoolContext,
  setBranchContext,
  requireRole
} = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { EXAM_ROLES } = require('~/constants/roles');

// Position management is an exam workflow; constrain its tenant and branch before reading or writing.
router.use(verifyToken);
router.use(setSchoolContext);
router.use(setBranchContext);
router.use(requireModuleAccess('exams'));
router.use(requireRole(...EXAM_ROLES));

// GET /api/exam-positions/students - Get students for position management
router.get('/students', getStudentsForPositions);
router.get('/stats', getPositionStats);

// POST /api/exam-positions/calculate - Calculate positions automatically
router.post('/calculate', calculatePositions);

// POST /api/exam-positions/save - Save positions
router.post('/save', savePositions);

module.exports = router;
