const express = require('express');
const { resolveTemplatesPath } = require('~/utils/shared/pathHelper');
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  getStudentsByClass,
  getStudentStats,
  getStudentReport,
  exportStudentReport,
  bulkImportStudents,
  getStudentInvoiceBreakdown
} = require('~/controllers/academic/student.controller');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { uploadFields, uploadSingle, uploadCSV } = require('~/middleware/shared/upload');
const {
  validateSubscriptionLimits,
  validateModuleAccess,
  checkSubscriptionStatus
} = require('~/middleware/administration/subscriptionValidation');
const router = express.Router();

// PUBLIC ROUTES - No authentication required
// GET endpoint to download student import template (query parameter format)
// No authentication required - templates are static and contain no sensitive data
router.get('/import-template', (req, res) => {
  const path = require('path');
  const { type = 'complete' } = req.query;

  let templatePath;
  let filename;

  if (type === 'required') {
    templatePath = resolveTemplatesPath('imports', 'student-import-template-required.csv');
    filename = 'Student-Import-Template-Required-Fields.csv';
  } else {
    templatePath = resolveTemplatesPath('imports', 'student-import-template-complete.csv');
    filename = 'Student-Import-Template-Complete-with-Sample-Data.csv';
  }

  res.download(templatePath, filename);
});

// GET endpoint to download student import template (path parameter format)
// No authentication required - templates are static and contain no sensitive data
router.get('/import-template/:type', (req, res) => {
  const path = require('path');
  const { type = 'complete' } = req.params;

  let templatePath;
  let filename;

  if (type === 'required') {
    templatePath = resolveTemplatesPath('imports', 'student-import-template-required.csv');
    filename = 'Student-Import-Template-Required-Fields.csv';
  } else {
    templatePath = resolveTemplatesPath('imports', 'student-import-template-complete.csv');
    filename = 'Student-Import-Template-Complete-with-Sample-Data.csv';
  }

  res.download(templatePath, filename);
});

// PROTECTED ROUTES - Authentication required
// Middleware to ensure authentication
router.use(verifyToken);

// Middleware to ensure school context is set
router.use(setSchoolContext);

// Middleware to ensure user has appropriate role
router.use(
  authorize(['super_admin', 'school_admin', 'branch_admin', 'teacher', 'student', 'parent'])
);

// Middleware to check subscription status
router.use(checkSubscriptionStatus);

// Middleware to validate module access
router.use(validateModuleAccess('students'));

// POST endpoint to create a new student
router.post(
  '/',
  validateSubscriptionLimits,
  uploadFields([
    { name: 'student_profile_picture', maxCount: 1 },
    { name: 'guardian_picture', maxCount: 1 }
  ]),
  createStudent
);

// POST endpoint for bulk import students from CSV
router.post('/bulk-import', uploadCSV('csv_file'), bulkImportStudents);

// GET endpoint to retrieve all students
router.get('/', getStudents);

// GET endpoint to retrieve students by class
router.get('/by-class', getStudentsByClass);

// GET endpoint to retrieve student statistics
router.get('/stats', getStudentStats);

// GET endpoint to retrieve student report
router.get('/report', getStudentReport);

// GET endpoint to export student report
router.get('/export', exportStudentReport);

// GET endpoint to retrieve a specific student by ID
router.get('/:id', getStudentById);

// GET endpoint to retrieve student invoice breakdown (for accordion details)
router.get('/:id/invoice-breakdown', getStudentInvoiceBreakdown);

// PUT endpoint to update a student
router.put(
  '/:id',
  uploadFields([
    { name: 'student_profile_picture', maxCount: 1 },
    { name: 'guardian_picture', maxCount: 1 }
  ]),
  updateStudent
);

module.exports = router;
