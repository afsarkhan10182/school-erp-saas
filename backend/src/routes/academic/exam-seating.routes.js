const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const controller = require('~/controllers/academic/exam-seating.controller');

const router = express.Router();
router.use(
  verifyToken,
  setSchoolContext,
  authorize(['super_admin', 'admin', 'branch_admin', 'teacher']),
  requireModuleAccess('exams')
);

router.get('/', controller.list);
router.post('/preview', controller.preview);
router.post('/apply', controller.apply);
router.get('/:id/overview', controller.overview);
router.post('/:id/reset', controller.reset);

module.exports = router;
