const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const controller = require('~/controllers/academic/live-class.controller');

const router = express.Router();
const staff = ['super_admin', 'admin', 'branch_admin', 'teacher'];
router.use(verifyToken, setSchoolContext, requireModuleAccess('liveclass'), authorize(staff));
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id/attendance/export.csv', controller.exportAttendance);
router.get('/:id/attendance', controller.getAttendance);
router.patch('/:id/attendance/:studentId', controller.updateAttendance);
router.put('/:id', controller.update);
router.patch('/:id/cancel', controller.cancel);

module.exports = router;
