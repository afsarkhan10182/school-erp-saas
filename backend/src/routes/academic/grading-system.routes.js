const express = require('express');
const {
  verifyToken,
  setSchoolContext,
  setBranchContext,
  requireRole
} = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { validate } = require('~/middleware/shared/validate');
const GradingSystemController = require('~/controllers/academic/grading-system.controller');
const {
  createGradingSystemValidator,
  updateGradingSystemValidator
} = require('~/validations/academic/grading-system');
const { EXAM_ROLES, EXAM_ADMIN_ROLES } = require('~/constants/roles');

const router = express.Router();

/**
 * @route /api/grading-systems
 * @desc Grading system management routes
 * @access Private (authenticated users with exam module access)
 */

// All grading system routes require auth, school/branch context, and exam module access
router.use(verifyToken, setSchoolContext, setBranchContext, requireModuleAccess('exams'));

// ===== GRADING SYSTEM MANAGEMENT ROUTES =====

/**
 * @route GET /api/grading-systems
 * @desc Get all grading systems for a school
 * @access Private (EXAM_ROLES)
 * @query {number} page, {number} limit, {string} search, {boolean} is_active
 */
router.get('/', GradingSystemController.getAllGradingSystems);

/**
 * @route GET /api/grading-systems/default
 * @desc Get default grading system
 * @access Private (EXAM_ROLES)
 */
router.get('/default', GradingSystemController.getDefaultGradingSystem);

/**
 * @route GET /api/grading-systems/test-calculation
 * @desc Test grade calculation
 * @access Private (EXAM_ROLES)
 * @query {number} percentage - Percentage to calculate grade for
 */
router.get('/test-calculation', GradingSystemController.testGradeCalculation);

/**
 * @route GET /api/grading-systems/:id
 * @desc Get grading system by ID
 * @access Private (EXAM_ROLES)
 * @param {string} id - Grading system ID
 */
router.get('/:id', GradingSystemController.getGradingSystemById);

/**
 * @route POST /api/grading-systems
 * @desc Create a new grading system
 * @access Private (EXAM_ROLES)
 * @body {string} name, {string} code, {string} description, {string} grade_type, {number} passing_percentage, {Array} gradeScales
 */
router.post(
  '/',
  requireRole(...EXAM_ROLES),
  validate(createGradingSystemValidator),
  GradingSystemController.createGradingSystem
);

/**
 * @route PUT /api/grading-systems/:id
 * @desc Update grading system
 * @access Private (EXAM_ROLES)
 * @param {string} id - Grading system ID
 * @body {string} name, {string} code, {string} description, {string} grade_type, {number} passing_percentage, {Array} gradeScales
 */
router.put(
  '/:id',
  requireRole(...EXAM_ROLES),
  validate(updateGradingSystemValidator),
  GradingSystemController.updateGradingSystem
);

/**
 * @route PUT /api/grading-systems/:id/set-default
 * @desc Set grading system as default
 * @access Private (EXAM_ROLES)
 * @param {string} id - Grading system ID
 */
router.put(
  '/:id/set-default',
  requireRole(...EXAM_ROLES),
  GradingSystemController.setDefaultGradingSystem
);

/**
 * @route DELETE /api/grading-systems/:id
 * @desc Delete grading system
 * @access Private (EXAM_ADMIN_ROLES)
 * @param {string} id - Grading system ID
 */
router.delete(
  '/:id',
  requireRole(...EXAM_ADMIN_ROLES),
  GradingSystemController.deleteGradingSystem
);

module.exports = router;
