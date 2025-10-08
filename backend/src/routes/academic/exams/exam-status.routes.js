const express = require('express');
const router = express.Router();
const ExamStatusController = require('~/controllers/academic/exams/exam-status.controller');
const { verifyToken, setSchoolContext } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const {
  createExamStatusValidator,
  updateExamStatusValidator
} = require('~/validations/academic/exam-status');
const { validate } = require('~/middleware/shared/validate');

// Apply authentication and module access middleware to all routes
router.use(verifyToken);
router.use(setSchoolContext);
router.use(requireModuleAccess('academic_management'));

// Get active exam statuses
router.get('/active', ExamStatusController.getActiveExamStatuses);

// Get exam statuses for dropdown
router.get('/dropdown', ExamStatusController.getExamStatusesForDropdown);

// Get all exam statuses with pagination and filtering
router.get('/', ExamStatusController.getAllExamStatuses);

// Get exam status by ID
router.get('/:id', ExamStatusController.getExamStatusById);

// Create new exam status
router.post('/', validate(createExamStatusValidator), ExamStatusController.createExamStatus);

// Update exam status
router.put('/:id', validate(updateExamStatusValidator), ExamStatusController.updateExamStatus);

// Delete exam status
router.delete('/:id', ExamStatusController.deleteExamStatus);

module.exports = router;
