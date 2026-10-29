const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const controller = require('~/controllers/shared/gate-pass.controller');

const managers = ['super_admin', 'admin', 'branch_admin'];
const reception = [...managers, 'receptionist'];
const router = express.Router();
router.use(verifyToken, setSchoolContext, requireModuleAccess('reception'), authorize(reception));

router.get('/terminal/:code', controller.terminalLookup);
router.get('/students', controller.studentChoices);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.post('/:id/approve', authorize(managers), controller.approve);
router.post('/:id/reject', authorize(managers), controller.reject);
router.post('/:id/out', controller.markOut);
router.post('/:id/return', controller.markReturned);
router.post('/:id/cancel', controller.cancel);

module.exports = router;
