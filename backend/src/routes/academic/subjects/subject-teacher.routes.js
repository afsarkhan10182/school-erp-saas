const express = require('express');
const {
  getAllSubjectTeachers,
  getSubjectTeacherById,
  createSubjectTeacher,
  updateSubjectTeacher,
  deleteSubjectTeacher,
  getSubjectTeachersBySubject,
  getSubjectTeachersByTeacher,
  getSubjectTeachersForDropdown,
  getTeacherWorkload,
} = require('~/controllers/academic/subjects/subject-teacher.controller');
const { verifyToken, authorize } = require('~/middleware/auth');
const { validate } = require('~/middleware/validate');
const { createSubjectTeacherValidator, updateSubjectTeacherValidator } = require('~/validations/academic/subject-teacher.validation');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

/**
 * @route   POST /api/subject-teachers
 * @desc    Create a new subject-teacher assignment
 * @access  Private (school_admin, branch_admin)
 */
router.post('/', 
  authorize(['school_admin', 'branch_admin']),
  validate(createSubjectTeacherValidator),
  createSubjectTeacher
);

/**
 * @route   GET /api/subject-teachers
 * @desc    Get all subject-teacher assignments with filtering and pagination
 * @access  Private (school_admin, branch_admin, teacher)
 */
router.get('/', 
  authorize(['school_admin', 'branch_admin', 'teacher']),
  getAllSubjectTeachers
);

/**
 * @route   GET /api/subject-teachers/dropdown
 * @desc    Get subject-teacher assignments for dropdown
 * @access  Private (school_admin, branch_admin, teacher)
 */
router.get('/dropdown', 
  authorize(['school_admin', 'branch_admin', 'teacher']),
  getSubjectTeachersForDropdown
);

/**
 * @route   GET /api/subject-teachers/workload
 * @desc    Get teacher workload data
 * @access  Private (school_admin, branch_admin)
 */
router.get('/workload', 
  authorize(['school_admin', 'branch_admin']),
  getTeacherWorkload
);

/**
 * @route   GET /api/subject-teachers/subject/:subjectId
 * @desc    Get subject-teacher assignments by subject
 * @access  Private (school_admin, branch_admin, teacher)
 */
router.get('/subject/:subjectId', 
  authorize(['school_admin', 'branch_admin', 'teacher']),
  getSubjectTeachersBySubject
);

/**
 * @route   GET /api/subject-teachers/teacher/:teacherId
 * @desc    Get subject-teacher assignments by teacher
 * @access  Private (school_admin, branch_admin, teacher)
 */
router.get('/teacher/:teacherId', 
  authorize(['school_admin', 'branch_admin', 'teacher']),
  getSubjectTeachersByTeacher
);

/**
 * @route   GET /api/subject-teachers/:id
 * @desc    Get subject-teacher assignment by ID
 * @access  Private (school_admin, branch_admin, teacher)
 */
router.get('/:id', 
  authorize(['school_admin', 'branch_admin', 'teacher']),
  getSubjectTeacherById
);

/**
 * @route   PUT /api/subject-teachers/:id
 * @desc    Update subject-teacher assignment
 * @access  Private (school_admin, branch_admin)
 */
router.put('/:id', 
  authorize(['school_admin', 'branch_admin']),
  validate(updateSubjectTeacherValidator),
  updateSubjectTeacher
);

/**
 * @route   DELETE /api/subject-teachers/:id
 * @desc    Delete subject-teacher assignment
 * @access  Private (school_admin, branch_admin)
 */
router.delete('/:id', 
  authorize(['school_admin', 'branch_admin']),
  deleteSubjectTeacher
);

module.exports = router;
