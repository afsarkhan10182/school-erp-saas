const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const controller = require('~/controllers/academic/syllabus.controller');

const router = express.Router();
router.use(
  verifyToken,
  setSchoolContext,
  requireModuleAccess('attachments'),
  authorize(['super_admin', 'admin', 'branch_admin', 'teacher'])
);
router.get('/classes', controller.classes);
router.get('/', controller.list);
router.get('/subjects', controller.subjects);
router.post('/', controller.create);

module.exports = router;
