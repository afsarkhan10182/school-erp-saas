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
} = require('../controllers/student.controller');
const { verifyToken, setSchoolContext, authorize } = require('../middleware/auth');
const { uploadFields } = require('../middleware/upload');
const router = express.Router();



// Middleware to ensure authentication
router.use(verifyToken);

// Middleware to ensure school context is set
router.use(setSchoolContext);

// Middleware to ensure user has appropriate role
router.use(authorize(['super_admin', 'school_admin', 'branch_admin', 'teacher', 'student', 'parent']));



// POST endpoint to create a new student
router.post('/', createStudent);

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
