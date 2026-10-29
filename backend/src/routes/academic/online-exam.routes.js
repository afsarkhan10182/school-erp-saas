const express = require('express');
const { verifyToken, setSchoolContext, setBranchContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const controller = require('~/controllers/academic/online-exam.controller');

const router = express.Router();
const staff = [
  verifyToken,
  setSchoolContext,
  authorize(['super_admin', 'admin', 'branch_admin', 'teacher']),
  setBranchContext,
  requireModuleAccess('exams')
];
const anyAuth = [verifyToken, setSchoolContext, requireModuleAccess('exams')];
const setStaffBranchContext = (req, res, next) =>
  ['super_admin', 'admin', 'branch_admin', 'teacher'].includes(req.user?.role)
    ? setBranchContext(req, res, next)
    : next();

router.get('/', ...staff, controller.list);
router.post('/', ...staff, controller.create);
router.get('/available', ...anyAuth, authorize(['student', 'parent']), controller.available);
router.get('/parent/progress', ...anyAuth, authorize(['parent']), controller.parentProgress);
router.get('/:id', ...staff, controller.getOne);
router.put('/:id', ...staff, controller.update);
router.delete('/:id', ...staff, controller.remove);
router.post('/:id/questions', ...staff, controller.addQuestion);
router.delete('/:id/questions/:questionId', ...staff, controller.deleteQuestion);
router.get('/:id/take', ...anyAuth, setStaffBranchContext, controller.takePaper);
router.patch('/:id/attempt', ...anyAuth, setStaffBranchContext, controller.saveAnswers);
router.post('/:id/submit', ...anyAuth, setStaffBranchContext, controller.submit);
router.get('/:id/results', ...staff, controller.results);

module.exports = router;
