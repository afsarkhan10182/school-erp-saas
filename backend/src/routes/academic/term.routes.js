const express = require('express');
const {
  getAllTerms,
  getTermById,
  createTerm,
  updateTerm,
  deleteTerm,
  getTermsByAcademicYear,
  getCurrentTerm
} = require('~/controllers/academic/term.controller');
const { verifyToken, authorize } = require('~/middleware/auth');
const { validate } = require('~/middleware/validate');
const {
  createTermValidator,
  updateTermValidator
} = require('~/validations/academic/term.validation');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

/**
 * @route   GET /api/terms
 * @desc    Get all terms with filtering and pagination
 * @access  Private (school_admin, branch_admin, teacher)
 */
router.get('/', authorize(['school_admin', 'branch_admin', 'teacher']), getAllTerms);

/**
 * @route   GET /api/terms/current
 * @desc    Get current active term
 * @access  Private (school_admin, branch_admin, teacher)
 */
router.get('/current', authorize(['school_admin', 'branch_admin', 'teacher']), getCurrentTerm);

/**
 * @route   GET /api/terms/academic-year/:academic_year_id
 * @desc    Get terms for a specific academic year
 * @access  Private (school_admin, branch_admin, teacher)
 */
router.get(
  '/academic-year/:academic_year_id',
  authorize(['school_admin', 'branch_admin', 'teacher']),
  getTermsByAcademicYear
);

/**
 * @route   GET /api/terms/:id
 * @desc    Get term by ID
 * @access  Private (school_admin, branch_admin, teacher)
 */
router.get('/:id', authorize(['school_admin', 'branch_admin', 'teacher']), getTermById);

/**
 * @route   POST /api/terms
 * @desc    Create new term
 * @access  Private (school_admin, branch_admin)
 */
router.post(
  '/',
  authorize(['school_admin', 'branch_admin']),
  validate(createTermValidator),
  createTerm
);

/**
 * @route   PUT /api/terms/:id
 * @desc    Update term
 * @access  Private (school_admin, branch_admin)
 */
router.put(
  '/:id',
  authorize(['school_admin', 'branch_admin']),
  validate(updateTermValidator),
  updateTerm
);

/**
 * @route   DELETE /api/terms/:id
 * @desc    Delete term
 * @access  Private (school_admin, branch_admin)
 */
router.delete('/:id', authorize(['school_admin', 'branch_admin']), deleteTerm);

module.exports = router;
