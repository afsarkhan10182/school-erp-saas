const express = require('express');
const { verifyToken, setSchoolContext, requireRole } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { validate } = require('~/middleware/shared/validate');
const ExamStatusController = require('~/controllers/academic/exams/exam-status.controller');
const {
  createExamStatusValidator,
  updateExamStatusValidator
} = require('~/validations/academic/exam-status');

const router = express.Router();

// All exam status routes require auth, school context, and exam module access
router.use(verifyToken, setSchoolContext, requireModuleAccess('exams'));

// Get active exam statuses
router.get('/active', ExamStatusController.getActiveExamStatuses);

// Get exam statuses for dropdown
router.get('/dropdown', ExamStatusController.getExamStatusesForDropdown);

// Get all exam statuses with pagination and filtering
router.get('/', ExamStatusController.getAllExamStatuses);

// Get exam status by ID
router.get('/:id', ExamStatusController.getExamStatusById);

// Create new exam status
router.post(
  '/',
  requireRole('admin', 'super_admin'),
  validate(createExamStatusValidator),
  ExamStatusController.createExamStatus
);

// Update exam status
router.put(
  '/:id',
  requireRole('admin', 'super_admin'),
  validate(updateExamStatusValidator),
  ExamStatusController.updateExamStatus
);

// Delete exam status
router.delete(
  '/:id',
  requireRole('admin', 'super_admin'),
  ExamStatusController.deleteExamStatus
);

module.exports = router;
