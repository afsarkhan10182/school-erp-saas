const express = require('express');
const {
  getAllSubjectGroups,
  getSubjectGroupById,
  createSubjectGroup,
  updateSubjectGroup,
  deleteSubjectGroup,
  addSubjectsToGroup,
  removeSubjectsFromGroup,
  getSubjectGroupsForDropdown
} = require('~/controllers/academic/subjects/subject-group.controller');
const { verifyToken, authorize } = require('~/middleware/core/auth');
const { validate } = require('~/middleware/shared/validate');
const {
  createSubjectGroupValidator,
  updateSubjectGroupValidator
} = require('~/validations/academic/subject-group');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

/**
 * @route   GET /api/subject-groups
 * @desc    Get all subject groups with filtering and pagination
 * @access  Private (admin, branch_admin)
 */
router.get('/', authorize(['admin', 'branch_admin']), getAllSubjectGroups);

/**
 * @route   GET /api/subject-groups/dropdown
 * @desc    Get subject groups for dropdown
 * @access  Private (admin, branch_admin, teacher)
 */
router.get(
  '/dropdown',
  authorize(['admin', 'branch_admin', 'teacher']),
  getSubjectGroupsForDropdown
);

/**
 * @route   GET /api/subject-groups/:id
 * @desc    Get subject group by ID
 * @access  Private (admin, branch_admin, teacher)
 */
router.get('/:id', authorize(['admin', 'branch_admin', 'teacher']), getSubjectGroupById);

/**
 * @route   POST /api/subject-groups
 * @desc    Create new subject group
 * @access  Private (admin, branch_admin)
 */
router.post(
  '/',
  authorize(['admin', 'branch_admin']),
  validate(createSubjectGroupValidator),
  createSubjectGroup
);

/**
 * @route   PUT /api/subject-groups/:id
 * @desc    Update subject group
 * @access  Private (admin, branch_admin)
 */
router.put(
  '/:id',
  authorize(['admin', 'branch_admin']),
  validate(updateSubjectGroupValidator),
  updateSubjectGroup
);

/**
 * @route   DELETE /api/subject-groups/:id
 * @desc    Delete subject group
 * @access  Private (admin, branch_admin)
 */
router.delete('/:id', authorize(['admin', 'branch_admin']), deleteSubjectGroup);

/**
 * @route   POST /api/subject-groups/:id/subjects
 * @desc    Add subjects to a subject group
 * @access  Private (admin, branch_admin)
 */
router.post('/:id/subjects', authorize(['admin', 'branch_admin']), addSubjectsToGroup);

/**
 * @route   DELETE /api/subject-groups/:id/subjects
 * @desc    Remove subjects from a subject group
 * @access  Private (admin, branch_admin)
 */
router.delete(
  '/:id/subjects',
  authorize(['admin', 'branch_admin']),
  removeSubjectsFromGroup
);

module.exports = router;
