const express = require('express');
const config = require('~/config/config');
const { resolveTemplatesPath } = require('~/utils/shared/pathHelper');
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  getStudentsByClass,
  getStudentStats,
  getStudentReport,
  getStudentRiskRegister,
  exportStudentReport,
  bulkImportStudents,
  getStudentImportHistory,
  undoStudentImportBatch,
  getStudentInvoiceBreakdown,
  setStudentAuthentication
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
  authorize(['super_admin', 'admin', 'branch_admin', 'accountant', 'teacher'])
);

// Middleware to check subscription status
router.use(checkSubscriptionStatus);

// Middleware to validate module access
router.use(validateModuleAccess('students'));

// POST endpoint to create a new student
router.post(
  '/',
  authorize(['super_admin', 'admin', 'branch_admin']),
  validateSubscriptionLimits,
  uploadFields([
    { name: 'student_profile_picture', maxCount: 1 },
    { name: 'guardian_picture', maxCount: 1 }
  ]),
  createStudent
);

router.get(
  '/import-history',
  authorize(['super_admin', 'admin', 'branch_admin']),
  getStudentImportHistory
);

router.post(
  '/import-history/:id/undo',
  authorize(['super_admin', 'admin', 'branch_admin']),
  undoStudentImportBatch
);

// POST endpoint for bulk import students from CSV
router.post(
  '/bulk-import',
  authorize(['super_admin', 'admin', 'branch_admin']),
  uploadCSV('csv_file', {
    spreadsheets: true,
    maxFileSize: config.uploads.studentImportMaxFileSize
  }),
  bulkImportStudents
);

// GET endpoint to retrieve all students
router.get('/', authorize(['super_admin', 'admin', 'branch_admin', 'teacher']), getStudents);

// GET endpoint to retrieve students by class
router.get('/by-class', authorize(['super_admin', 'admin', 'branch_admin', 'teacher']), getStudentsByClass);

// GET endpoint to retrieve student statistics
router.get('/stats', authorize(['super_admin', 'admin', 'branch_admin']), getStudentStats);

// GET endpoint to retrieve student report
router.get('/report', authorize(['super_admin', 'admin', 'branch_admin']), getStudentReport);

router.get('/risk-register', authorize(['super_admin', 'admin', 'branch_admin']), getStudentRiskRegister);

// GET endpoint to export student report
router.get('/export', authorize(['super_admin', 'admin', 'branch_admin']), exportStudentReport);

// GET endpoint to retrieve a specific student by ID
router.get('/:id', authorize(['super_admin', 'admin', 'branch_admin', 'teacher']), getStudentById);

router.put(
  '/:id/authentication',
  authorize(['super_admin', 'admin', 'branch_admin']),
  setStudentAuthentication
);

// GET endpoint to retrieve student invoice breakdown (for accordion details)
router.get(
  '/:id/invoice-breakdown',
  authorize(['super_admin', 'admin', 'branch_admin', 'accountant']),
  getStudentInvoiceBreakdown
);

// PUT endpoint to update a student
router.put(
  '/:id',
  authorize(['super_admin', 'admin', 'branch_admin']),
  uploadFields([
    { name: 'student_profile_picture', maxCount: 1 },
    { name: 'guardian_picture', maxCount: 1 }
  ]),
  updateStudent
);

module.exports = router;
