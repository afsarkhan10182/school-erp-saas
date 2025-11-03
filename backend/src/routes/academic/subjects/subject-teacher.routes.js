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
  getTeacherWorkload
} = require('~/controllers/academic/subjects/subject-teacher.controller');
const { verifyToken, authorize } = require('~/middleware/core/auth');
const { validate } = require('~/middleware/shared/validate');
const {
  createSubjectTeacherValidator,
  updateSubjectTeacherValidator
} = require('~/validations/academic/subject-teacher');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

/**
 * @route   POST /api/subject-teachers
 * @desc    Create a new subject-teacher assignment
 * @access  Private (admin, branch_admin)
 */
router.post(
  '/',
  authorize(['admin', 'branch_admin']),
  validate(createSubjectTeacherValidator),
  createSubjectTeacher
);

/**
 * @route   GET /api/subject-teachers
 * @desc    Get all subject-teacher assignments with filtering and pagination
 * @access  Private (admin, branch_admin, teacher)
 */
router.get('/', authorize(['admin', 'branch_admin', 'teacher']), getAllSubjectTeachers);

/**
 * @route   GET /api/subject-teachers/dropdown
 * @desc    Get subject-teacher assignments for dropdown
 * @access  Private (admin, branch_admin, teacher)
 */
router.get(
  '/dropdown',
  authorize(['admin', 'branch_admin', 'teacher']),
  getSubjectTeachersForDropdown
);

/**
 * @route   GET /api/subject-teachers/workload
 * @desc    Get teacher workload data
 * @access  Private (admin, branch_admin)
 */
router.get('/workload', authorize(['admin', 'branch_admin']), getTeacherWorkload);

/**
 * @route   GET /api/subject-teachers/subject/:subjectId
 * @desc    Get subject-teacher assignments by subject
 * @access  Private (admin, branch_admin, teacher)
 */
router.get(
  '/subject/:subjectId',
  authorize(['admin', 'branch_admin', 'teacher']),
  getSubjectTeachersBySubject
);

/**
 * @route   GET /api/subject-teachers/teacher/:teacherId
 * @desc    Get subject-teacher assignments by teacher
 * @access  Private (admin, branch_admin, teacher)
 */
router.get(
  '/teacher/:teacherId',
  authorize(['admin', 'branch_admin', 'teacher']),
  getSubjectTeachersByTeacher
);

/**
 * @route   GET /api/subject-teachers/:id
 * @desc    Get subject-teacher assignment by ID
 * @access  Private (admin, branch_admin, teacher)
 */
router.get('/:id', authorize(['admin', 'branch_admin', 'teacher']), getSubjectTeacherById);

/**
 * @route   PUT /api/subject-teachers/:id
 * @desc    Update subject-teacher assignment
 * @access  Private (admin, branch_admin)
 */
router.put(
  '/:id',
  authorize(['admin', 'branch_admin']),
  validate(updateSubjectTeacherValidator),
  updateSubjectTeacher
);

/**
 * @route   DELETE /api/subject-teachers/:id
 * @desc    Delete subject-teacher assignment
 * @access  Private (admin, branch_admin)
 */
router.delete('/:id', authorize(['admin', 'branch_admin']), deleteSubjectTeacher);

module.exports = router;
