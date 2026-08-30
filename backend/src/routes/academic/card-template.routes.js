const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const controller = require('~/controllers/academic/card-template.controller');

const router = express.Router();
router.use(
  verifyToken,
  setSchoolContext,
  authorize(['super_admin', 'admin', 'branch_admin', 'teacher']),
  requireModuleAccess('students')
);

router.get('/templates', controller.list);
router.post('/templates', controller.create);
router.put('/templates/:id', controller.update);
router.delete('/templates/:id', controller.remove);
router.post('/generate', controller.generate);

module.exports = router;
