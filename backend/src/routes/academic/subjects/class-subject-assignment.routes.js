const express = require('express');
const {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  bulkCreateAssignments,
  deleteAssignment
} = require('~/controllers/academic/subjects/class-subject-assignment.controller');
const {
  verifyToken,
  authorize,
  setSchoolContext,
  setBranchContext
} = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { validate } = require('~/middleware/shared/validate');
const {
  createAssignmentValidator,
  bulkCreateAssignmentsValidator
} = require('~/validations/academic/class-subject-assignment');

const router = express.Router();

// Apply authentication, school/branch context, and academic_management module access to all routes
router.use(
  verifyToken,
  setSchoolContext,
  setBranchContext,
  requireModuleAccess('academic_management')
);

/**
 * @route   GET /api/class-subject-assignments
 * @desc    Get all class-subject assignments with filtering and pagination
 * @access  Private (school_admin, branch_admin)
 */
router.get('/', authorize(['school_admin', 'branch_admin']), getAllAssignments);

/**
 * @route   GET /api/class-subject-assignments/:id
 * @desc    Get class-subject assignment by ID
 * @access  Private (school_admin, branch_admin)
 */
router.get('/:id', authorize(['school_admin', 'branch_admin']), getAssignmentById);

/**
 * @route   POST /api/class-subject-assignments
 * @desc    Create new class-subject assignment
 * @access  Private (school_admin, branch_admin)
 */
router.post(
  '/',
  authorize(['school_admin', 'branch_admin']),
  validate(createAssignmentValidator),
  createAssignment
);

/**
 * @route   POST /api/class-subject-assignments/bulk
 * @desc    Bulk create class-subject assignments
 * @access  Private (school_admin, branch_admin)
 */
router.post(
  '/bulk',
  authorize(['school_admin', 'branch_admin']),
  validate(bulkCreateAssignmentsValidator),
  bulkCreateAssignments
);

/**
 * @route   DELETE /api/class-subject-assignments/:id
 * @desc    Delete class-subject assignment
 * @access  Private (school_admin, branch_admin)
 */
router.delete('/:id', authorize(['school_admin', 'branch_admin']), deleteAssignment);

module.exports = router;
