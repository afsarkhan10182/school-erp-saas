const express = require('express');
const { verifyToken, setSchoolContext, setBranchContext } = require('../middleware/auth');
const { generateAttendanceTemplate } = require('../controllers/template.controller');

const router = express.Router();

// Template routes - require authentication for security
router.use(verifyToken, setSchoolContext, setBranchContext);

// Generate attendance import template
router.get('/attendance-import', generateAttendanceTemplate);

module.exports = router;