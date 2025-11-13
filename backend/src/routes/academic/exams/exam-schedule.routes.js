const express = require('express');
const {
  verifyToken,
  setSchoolContext,
  setBranchContext,
  requireRole
} = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { validate } = require('~/middleware/shared/validate');
const ExamScheduleController = require('~/controllers/academic/exams/exam-schedule.controller');
const {
  createExamScheduleValidation,
  updateExamScheduleValidation,
  getExamScheduleValidation,
  deleteExamScheduleValidation,
  getAllExamSchedulesValidation,
  createQuickScheduleValidation
} = require('~/validations/academic/exam-schedule');

const router = express.Router();

// All exam schedule routes require auth, school/branch context, and exam module access
router.use(verifyToken, setSchoolContext, setBranchContext, requireModuleAccess('exams'));

/**
 * @route   GET /api/exam-schedules
 * @desc    Get all exam schedules
 * @access  Private (Admin, Branch Admin, Teacher)
 */
router.get(
  '/',
  validate(getAllExamSchedulesValidation),
  ExamScheduleController.getAllExamSchedules
);

/**
 * @route   GET /api/exam-schedules/:id
 * @desc    Get exam schedule by ID
 * @access  Private (Admin, Branch Admin, Teacher)
 */
router.get('/:id', validate(getExamScheduleValidation), ExamScheduleController.getExamScheduleById);

/**
 * @route   GET /api/exam-schedules/exam/:examId
 * @desc    Get all schedules for a specific exam
 * @access  Private (Admin, Branch Admin, Teacher)
 */
router.get('/exam/:examId', ExamScheduleController.getSchedulesForExam);

/**
 * @route   POST /api/exam-schedules
 * @desc    Create new exam schedule
 * @access  Private (Admin, Branch Admin)
 */
router.post(
  '/',
  requireRole('admin', 'super_admin'),
  validate(createExamScheduleValidation),
  ExamScheduleController.createExamSchedule
);

/**
 * @route   POST /api/exam-schedules/bulk
 * @desc    Bulk create exam schedules
 * @access  Private (Admin, Branch Admin)
 */
router.post(
  '/bulk',
  requireRole('admin', 'super_admin'),
  ExamScheduleController.bulkCreateExamSchedules
);

/**
 * @route   POST /api/exam-schedules/quick
 * @desc    Create quick exam schedule ()
 * @access  Private (Admin, Branch Admin)
 */
router.post(
  '/quick',
  requireRole('admin', 'super_admin'),
  validate(createQuickScheduleValidation),
  ExamScheduleController.createQuickSchedule
);

/**
 * @route   PUT /api/exam-schedules/:id
 * @desc    Update exam schedule
 * @access  Private (Admin, Branch Admin)
 */
router.put(
  '/:id',
  requireRole('admin', 'super_admin'),
  validate(updateExamScheduleValidation),
  ExamScheduleController.updateExamSchedule
);

/**
 * @route   DELETE /api/exam-schedules/:id
 * @desc    Delete exam schedule
 * @access  Private (Admin, Branch Admin)
 */
router.delete(
  '/:id',
  requireRole('admin', 'super_admin'),
  ExamScheduleController.deleteExamSchedule
);

module.exports = router;
