const express = require('express');
const router = express.Router();
const MarkDistributionController = require('~/controllers/academic/mark-distributions.controller');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');

/**
 * @route   GET /api/mark-distributions
 * @desc    Get all mark distributions
 * @access  Private (Admin, Teacher)
 */
router.get(
  '/',
  verifyToken,
  setSchoolContext,
  authorize(['admin', 'teacher']),
  MarkDistributionController.getAllMarkDistributions
);

/**
 * @route   GET /api/mark-distributions/:id
 * @desc    Get mark distribution by ID
 * @access  Private (Admin, Teacher)
 */
router.get(
  '/:id',
  verifyToken,
  setSchoolContext,
  authorize(['admin', 'teacher']),
  MarkDistributionController.getMarkDistributionById
);

/**
 * @route   POST /api/mark-distributions
 * @desc    Create new mark distribution
 * @access  Private (Admin)
 */
router.post(
  '/',
  verifyToken,
  setSchoolContext,
  authorize(['admin']),
  MarkDistributionController.createMarkDistribution
);

/**
 * @route   PUT /api/mark-distributions/:id
 * @desc    Update mark distribution
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  verifyToken,
  setSchoolContext,
  authorize(['admin']),
  MarkDistributionController.updateMarkDistribution
);

/**
 * @route   DELETE /api/mark-distributions/:id
 * @desc    Delete mark distribution
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  verifyToken,
  setSchoolContext,
  authorize(['admin']),
  MarkDistributionController.deleteMarkDistribution
);

/**
 * @route   GET /api/mark-distributions/type/:type
 * @desc    Get mark distributions by type
 * @access  Private (Admin, Teacher)
 */
router.get(
  '/type/:type',
  verifyToken,
  setSchoolContext,
  authorize(['admin', 'teacher']),
  MarkDistributionController.getMarkDistributionsByType
);

/**
 * @route   GET /api/mark-distributions/active
 * @desc    Get active mark distributions
 * @access  Private (Admin, Teacher)
 */
router.get(
  '/active',
  verifyToken,
  setSchoolContext,
  authorize(['admin', 'teacher']),
  MarkDistributionController.getActiveMarkDistributions
);

/**
 * @route   PATCH /api/mark-distributions/:id/toggle-active
 * @desc    Toggle active status
 * @access  Private (Admin)
 */
router.patch(
  '/:id/toggle-active',
  verifyToken,
  setSchoolContext,
  authorize(['admin']),
  MarkDistributionController.toggleActiveStatus
);

module.exports = router;
