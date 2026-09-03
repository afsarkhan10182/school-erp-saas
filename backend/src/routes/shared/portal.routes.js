const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { portalDashboard } = require('~/controllers/shared/dynamic-entities.controller');

const router = express.Router();
router.use(
  verifyToken,
  setSchoolContext,
  authorize(['super_admin', 'admin', 'branch_admin', 'teacher', 'student', 'parent', 'receptionist', 'accountant', 'librarian'])
);
router.get('/dashboard', portalDashboard);
module.exports = router;
