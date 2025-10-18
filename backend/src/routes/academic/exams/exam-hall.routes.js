const express = require('express');
const {
  verifyToken,
  setSchoolContext,
  setBranchContext,
  requireRole,
  authorize
} = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { validate } = require('~/middleware/shared/validate');
const ExamHallController = require('~/controllers/academic/exams/exam-hall.controller');
const {
  createExamHallValidation,
  updateExamHallValidation,
  getExamHallValidation,
  deleteExamHallValidation,
  getAllExamHallsValidation,
  checkHallAvailabilityValidation
} = require('~/validations/academic/exam-hall');

const router = express.Router();

// All exam hall routes require auth, school context, and exam module access
router.use(verifyToken, setSchoolContext, requireModuleAccess('exams'));

/**
 * @route   GET /api/exam-halls
 * @desc    Get all exam halls
 * @access  Private (Admin, Branch Admin, Teacher)
 */
router.get('/', ExamHallController.getAllExamHalls);

/**
 * @route   GET /api/exam-halls/dropdown
 * @desc    Get exam halls for dropdown
 * @access  Private (Admin, Branch Admin, Teacher)
 */
router.get('/dropdown', ExamHallController.getExamHallsForDropdown);

/**
 * @route   GET /api/exam-halls/availability
 * @desc    Check hall availability
 * @access  Private (Admin, Branch Admin)
 */
router.get(
  '/availability',
  validate(checkHallAvailabilityValidation),
  ExamHallController.checkHallAvailability
);

/**
 * @route   GET /api/exam-halls/:id
 * @desc    Get exam hall by ID
 * @access  Private (Admin, Branch Admin, Teacher)
 */
router.get('/:id', ExamHallController.getExamHallById);

/**
 * @route   POST /api/exam-halls
 * @desc    Create new exam hall
 * @access  Private (Admin, Branch Admin)
 */
router.post(
  '/',
  requireRole('admin', 'super_admin'),
  validate(createExamHallValidation),
  ExamHallController.createExamHall
);

/**
 * @route   PUT /api/exam-halls/:id
 * @desc    Update exam hall
 * @access  Private (Admin, Branch Admin)
 */
router.put(
  '/:id',
  requireRole('admin', 'super_admin'),
  validate(updateExamHallValidation),
  ExamHallController.updateExamHall
);

/**
 * @route   DELETE /api/exam-halls/:id
 * @desc    Delete exam hall
 * @access  Private (Admin, Branch Admin)
 */
router.delete(
  '/:id',
  requireRole('admin', 'super_admin'),
  ExamHallController.deleteExamHall
);

module.exports = router;
