const express = require('express');
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
} = require('../controllers/student.controller');
const { verifyToken, setSchoolContext, authorize } = require('../middleware/auth');
const { uploadFields, uploadSingle, uploadCSV } = require('../middleware/upload');
const router = express.Router();



// Middleware to ensure authentication
router.use(verifyToken);

// Middleware to ensure school context is set
router.use(setSchoolContext);

// Middleware to ensure user has appropriate role
router.use(authorize(['super_admin', 'school_admin', 'branch_admin', 'teacher', 'student', 'parent']));



// POST endpoint to create a new student
router.post('/', 
  uploadFields([
    { name: 'student_profile_picture', maxCount: 1 },
    { name: 'guardian_picture', maxCount: 1 },
  ]),
  createStudent
);

// GET endpoint to download student import template
router.get('/import-template', (req, res) => {
  const path = require('path');
  const templatePath = path.join(__dirname, '../../templates/student-import-template.csv');
  res.download(templatePath, 'Student-Admission-template.csv');
});

// POST endpoint for bulk import students from CSV
router.post('/bulk-import', 
  uploadCSV('csv_file'),
  bulkImportStudents
);

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

// PUT endpoint to update a student
router.put('/:id', 
  uploadFields([
    { name: 'student_profile_picture', maxCount: 1 },
    { name: 'guardian_picture', maxCount: 1 },
  ]),
  updateStudent
);

module.exports = router;
