const express = require('express');
const router = express.Router();
const ExamHallController = require('~/controllers/academic/exams/exam-hall.controller');
const {
  createExamHallValidation,
  updateExamHallValidation,
  getExamHallValidation,
  deleteExamHallValidation,
  getAllExamHallsValidation,
  checkHallAvailabilityValidation
} = require('~/validations/academic/exam-hall');
const { validate } = require('~/middleware/shared/validate');
const { verifyToken: authenticate, authorize } = require('~/middleware/core/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/exam-halls
 * @desc    Get all exam halls
 * @access  Private (Admin, Branch Admin, Teacher)
 */
router.get(
  '/',
  authorize(['super_admin', 'school_admin', 'branch_admin', 'teacher']),
  getAllExamHallsValidation,
  validate,
  ExamHallController.getAllExamHalls
);

/**
 * @route   GET /api/exam-halls/dropdown
 * @desc    Get exam halls for dropdown
 * @access  Private (Admin, Branch Admin, Teacher)
 */
router.get(
  '/dropdown',
  authorize(['super_admin', 'school_admin', 'branch_admin', 'teacher']),
  ExamHallController.getExamHallsForDropdown
);

/**
 * @route   GET /api/exam-halls/availability
 * @desc    Check hall availability
 * @access  Private (Admin, Branch Admin)
 */
router.get(
  '/availability',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  checkHallAvailabilityValidation,
  validate,
  ExamHallController.checkHallAvailability
);

/**
 * @route   GET /api/exam-halls/:id
 * @desc    Get exam hall by ID
 * @access  Private (Admin, Branch Admin, Teacher)
 */
router.get(
  '/:id',
  authorize(['super_admin', 'school_admin', 'branch_admin', 'teacher']),
  getExamHallValidation,
  validate,
  ExamHallController.getExamHallById
);

/**
 * @route   POST /api/exam-halls
 * @desc    Create new exam hall
 * @access  Private (Admin, Branch Admin)
 */
router.post(
  '/',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  createExamHallValidation,
  validate,
  ExamHallController.createExamHall
);

/**
 * @route   PUT /api/exam-halls/:id
 * @desc    Update exam hall
 * @access  Private (Admin, Branch Admin)
 */
router.put(
  '/:id',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  updateExamHallValidation,
  validate,
  ExamHallController.updateExamHall
);

/**
 * @route   DELETE /api/exam-halls/:id
 * @desc    Delete exam hall
 * @access  Private (Admin, Branch Admin)
 */
router.delete(
  '/:id',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  deleteExamHallValidation,
  validate,
  ExamHallController.deleteExamHall
);

module.exports = router;
