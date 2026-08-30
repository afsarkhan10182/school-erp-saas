const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { ENTITIES, STAFF_ROLES } = require('~/config/school-ops-entities');
const controller = require('~/controllers/shared/school-ops.controller');

const entityModule = (req, res, next) => {
  const meta = ENTITIES[req.params.entity];
  if (!meta) {
    return res.status(404).json({ success: false, message: 'Unknown entity' });
  }
  return requireModuleAccess(meta.module)(req, res, next);
};

const staff = [verifyToken, setSchoolContext, authorize(STAFF_ROLES)];

const router = express.Router();

router.get('/reports/:type', ...staff, controller.studentReports);
router.post('/students/bulk-edit', ...staff, requireModuleAccess('students'), controller.bulkEditStudents);
router.post('/students/transfer', ...staff, requireModuleAccess('students'), controller.transferStudents);
router.get('/cards/:studentId', ...staff, requireModuleAccess('students'), controller.idCard);
router.post(
  '/students/:studentId/create-login',
  ...staff,
  requireModuleAccess('students'),
  controller.createStudentLogin
);
router.put(
  '/parents/:id/authentication',
  ...staff,
  requireModuleAccess('students'),
  controller.setParentAuthentication
);
router.post(
  '/parents/:id/create-login',
  ...staff,
  requireModuleAccess('students'),
  controller.createParentLogin
);

router.get('/:entity', ...staff, entityModule, controller.list);
router.post('/:entity', ...staff, entityModule, controller.create);
router.post('/:entity/bulk', ...staff, entityModule, controller.bulkCreate);
router.put('/:entity/:id', ...staff, entityModule, controller.update);
router.delete('/:entity/:id', ...staff, entityModule, controller.remove);
router.post('/:entity/:id/:action', ...staff, entityModule, controller.runAction);

module.exports = router;
