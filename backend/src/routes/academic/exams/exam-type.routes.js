const express = require('express');
const { verifyToken, setSchoolContext, setBranchContext, requireRole, authorize } = require('~/middleware/auth');
const { requireModuleAccess } = require('~/middleware/moduleAccess');
const { validate } = require('~/middleware/validate');
const ExamTypeController = require('~/controllers/academic/exams/exam-type.controller');
const { createExamTypeValidator, updateExamTypeValidator } = require('~/validations/academic/exam-type.validation');

const router = express.Router();

// All exam type routes require auth, school context, and exam module access
router.use(verifyToken, setSchoolContext, requireModuleAccess('exams'));

// Exam type management routes (school admin and above)
router.post('/', requireRole('school_admin', 'super_admin'), ExamTypeController.createExamType);
router.get('/', ExamTypeController.getAllExamTypes);
router.get('/active', ExamTypeController.getActiveExamTypes);

// Individual exam type routes
router.get('/:id', ExamTypeController.getExamTypeById);
router.put('/:id', requireRole('school_admin', 'super_admin'), ExamTypeController.updateExamType);
router.delete('/:id', requireRole('school_admin', 'super_admin'), ExamTypeController.deleteExamType);

module.exports = router;
