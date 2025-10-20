const express = require('express');
const {
  getAllTerms,
  getTermById,
  createTerm,
  updateTerm,
  deleteTerm,
  getCurrentTerm
} = require('~/controllers/academic/exam-term.controller');
const { verifyToken, authorize } = require('~/middleware/core/auth');
const { validate } = require('~/middleware/shared/validate');
const { createTermValidator, updateTermValidator } = require('~/validations/academic/term');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

/**
 * @route   GET /api/terms
 * @desc    Get all terms with filtering and pagination
 * @access  Private (admin, branch_admin, teacher)
 */
router.get('/', authorize(['admin', 'branch_admin', 'teacher']), getAllTerms);

/**
 * @route   GET /api/terms/current
 * @desc    Get current active term
 * @access  Private (admin, branch_admin, teacher)
 */
router.get('/current', authorize(['admin', 'branch_admin', 'teacher']), getCurrentTerm);

/**
 * @route   GET /api/terms/:id
 * @desc    Get term by ID
 * @access  Private (admin, branch_admin, teacher)
 */
router.get('/:id', authorize(['admin', 'branch_admin', 'teacher']), getTermById);

/**
 * @route   POST /api/terms
 * @desc    Create new term
 * @access  Private (admin, branch_admin)
 */
router.post('/', authorize(['admin', 'branch_admin']), validate(createTermValidator), createTerm);

/**
 * @route   PUT /api/terms/:id
 * @desc    Update term
 * @access  Private (admin, branch_admin)
 */
router.put('/:id', authorize(['admin', 'branch_admin']), validate(updateTermValidator), updateTerm);

/**
 * @route   DELETE /api/terms/:id
 * @desc    Delete term
 * @access  Private (admin, branch_admin)
 */
router.delete('/:id', authorize(['admin', 'branch_admin']), deleteTerm);

module.exports = router;
