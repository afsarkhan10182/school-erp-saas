const express = require('express');
const router = express.Router();
const {
  getStudentsForPositions,
  calculatePositions,
  savePositions
} = require('~/controllers/academic/exam-positions/exam-positions.controller');
const { verifyToken, setSchoolContext } = require('~/middleware/core/auth');

// Apply authentication to all routes
router.use(verifyToken);
router.use(setSchoolContext);

// GET /api/exam-positions/students - Get students for position management
router.get('/students', getStudentsForPositions);

// POST /api/exam-positions/calculate - Calculate positions automatically
router.post('/calculate', calculatePositions);

// POST /api/exam-positions/save - Save positions
router.post('/save', savePositions);

module.exports = router;
