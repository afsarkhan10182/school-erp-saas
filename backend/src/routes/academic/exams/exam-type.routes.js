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
const ExamTypeController = require('~/controllers/academic/exams/exam-type.controller');
const {
  createExamTypeValidator,
  updateExamTypeValidator
} = require('~/validations/academic/exam-type');

const router = express.Router();

// All exam type routes require auth, school context, and exam module access
router.use(verifyToken, setSchoolContext, requireModuleAccess('exams'));

// Exam type management routes (school admin and above)
router.post(
  '/',
  requireRole('admin', 'super_admin'),
  validate(createExamTypeValidator),
  ExamTypeController.createExamType
);
router.get('/', ExamTypeController.getAllExamTypes);
router.get('/active', ExamTypeController.getActiveExamTypes);

// Individual exam type routes
router.get('/:id', ExamTypeController.getExamTypeById);
router.put(
  '/:id',
  requireRole('admin', 'super_admin'),
  validate(updateExamTypeValidator),
  ExamTypeController.updateExamType
);
router.delete(
  '/:id',
  requireRole('admin', 'super_admin'),
  ExamTypeController.deleteExamType
);

module.exports = router;
