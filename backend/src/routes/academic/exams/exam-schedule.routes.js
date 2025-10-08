const express = require('express');
const router = express.Router();
const ExamScheduleController = require('~/controllers/academic/exams/exam-schedule.controller');
const {
  createExamScheduleValidation,
  updateExamScheduleValidation,
  getExamScheduleValidation,
  deleteExamScheduleValidation,
  getAllExamSchedulesValidation
} = require('~/validations/academic/exam-schedule');
const { validate } = require('~/middleware/shared/validate');
const { verifyToken: authenticate, authorize } = require('~/middleware/core/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/exam-schedules
 * @desc    Get all exam schedules
 * @access  Private (Admin, Branch Admin, Teacher)
 */
router.get(
  '/',
  authorize(['super_admin', 'school_admin', 'branch_admin', 'teacher']),
  getAllExamSchedulesValidation,
  validate,
  ExamScheduleController.getAllExamSchedules
);

/**
 * @route   GET /api/exam-schedules/:id
 * @desc    Get exam schedule by ID
 * @access  Private (Admin, Branch Admin, Teacher)
 */
router.get(
  '/:id',
  authorize(['super_admin', 'school_admin', 'branch_admin', 'teacher']),
  getExamScheduleValidation,
  validate,
  ExamScheduleController.getExamScheduleById
);

/**
 * @route   GET /api/exam-schedules/exam/:examId
 * @desc    Get all schedules for a specific exam
 * @access  Private (Admin, Branch Admin, Teacher)
 */
router.get(
  '/exam/:examId',
  authorize(['super_admin', 'school_admin', 'branch_admin', 'teacher']),
  ExamScheduleController.getSchedulesForExam
);

/**
 * @route   POST /api/exam-schedules
 * @desc    Create new exam schedule
 * @access  Private (Admin, Branch Admin)
 */
router.post(
  '/',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  createExamScheduleValidation,
  validate,
  ExamScheduleController.createExamSchedule
);

/**
 * @route   PUT /api/exam-schedules/:id
 * @desc    Update exam schedule
 * @access  Private (Admin, Branch Admin)
 */
router.put(
  '/:id',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  updateExamScheduleValidation,
  validate,
  ExamScheduleController.updateExamSchedule
);

/**
 * @route   DELETE /api/exam-schedules/:id
 * @desc    Delete exam schedule
 * @access  Private (Admin, Branch Admin)
 */
router.delete(
  '/:id',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  deleteExamScheduleValidation,
  validate,
  ExamScheduleController.deleteExamSchedule
);

module.exports = router;
