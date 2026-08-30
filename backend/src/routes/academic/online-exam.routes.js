const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const controller = require('~/controllers/academic/online-exam.controller');

const router = express.Router();
const staff = [
  verifyToken,
  setSchoolContext,
  authorize(['super_admin', 'admin', 'branch_admin', 'teacher']),
  requireModuleAccess('exams')
];
const anyAuth = [verifyToken, setSchoolContext, requireModuleAccess('exams')];

router.get('/', ...staff, controller.list);
router.post('/', ...staff, controller.create);
router.get('/available', ...anyAuth, controller.available);
router.get('/:id', ...anyAuth, controller.getOne);
router.put('/:id', ...staff, controller.update);
router.delete('/:id', ...staff, controller.remove);
router.post('/:id/questions', ...staff, controller.addQuestion);
router.delete('/:id/questions/:questionId', ...staff, controller.deleteQuestion);
router.get('/:id/take', ...anyAuth, controller.takePaper);
router.post('/:id/submit', ...anyAuth, controller.submit);
router.get('/:id/results', ...staff, controller.results);

module.exports = router;
