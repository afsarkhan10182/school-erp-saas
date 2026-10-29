const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const controller = require('~/controllers/administration/audit-trail.controller');

const router = express.Router();
router.use(verifyToken, setSchoolContext, authorize(['admin', 'super_admin']));
router.get('/export', controller.exportEvents);
router.get('/', controller.list);

module.exports = router;
