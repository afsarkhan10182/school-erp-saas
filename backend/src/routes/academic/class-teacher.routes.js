const express = require('express');
const { verifyToken, authorize } = require('~/middleware/core/auth');
const { validate } = require('~/middleware/shared/validate');
const {
  createClassTeacherValidator,
  updateClassTeacherValidator
} = require('~/validations/academic/class-teacher');
const {
  getAllClassTeachers,
  createClassTeacher,
  updateClassTeacher,
  deleteClassTeacher
} = require('~/controllers/academic/class-teacher.controller');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

/**
 * @route   GET /api/class-teachers
 * @desc    Get all class teachers
 * @access  Private (admin, branch_admin, teacher)
 */
router.get('/', authorize(['admin', 'branch_admin', 'teacher']), getAllClassTeachers);

/**
 * @route   POST /api/class-teachers
 * @desc    Create class teacher assignment
 * @access  Private (admin, branch_admin)
 */
router.post(
  '/',
  authorize(['admin', 'branch_admin']),
  validate(createClassTeacherValidator),
  createClassTeacher
);

/**
 * @route   PUT /api/class-teachers/:id
 * @desc    Update class teacher assignment
 * @access  Private (admin, branch_admin)
 */
router.put(
  '/:id',
  authorize(['admin', 'branch_admin']),
  validate(updateClassTeacherValidator),
  updateClassTeacher
);

/**
 * @route   DELETE /api/class-teachers/:id
 * @desc    Delete class teacher assignment
 * @access  Private (admin, branch_admin)
 */
router.delete('/:id', authorize(['admin', 'branch_admin']), deleteClassTeacher);

module.exports = router;
