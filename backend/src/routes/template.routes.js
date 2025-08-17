const express = require('express');
const { verifyToken, setSchoolContext, setBranchContext } = require('../middleware/auth');
const { generateAttendanceTemplate, generateStudentTemplateRequired, generateStudentTemplateComplete } = require('../controllers/template.controller');

const router = express.Router();

// Template routes - require authentication for security
router.use(verifyToken, setSchoolContext, setBranchContext);

// Generate attendance import template
router.get('/attendance-import', generateAttendanceTemplate);

// Generate student import templates
router.get('/student-import', (req, res, next) => {
  const { type = 'complete' } = req.query;
  
  if (type === 'required') {
    return generateStudentTemplateRequired(req, res, next);
  } else {
    return generateStudentTemplateComplete(req, res, next);
  }
});

module.exports = router;