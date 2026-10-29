const express = require('express');
const multer = require('multer');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const controller = require('~/controllers/academic/study-material.controller');

const router = express.Router();
const staffRoles = ['super_admin', 'admin', 'branch_admin', 'teacher'];
const upload = require('~/middleware/shared/study-material-upload');

router.use(verifyToken, setSchoolContext, requireModuleAccess('attachments'));
router.get('/', authorize([...staffRoles, 'student']), controller.list);
router.get('/:id/file', authorize([...staffRoles, 'student']), controller.download);
router.post('/', authorize(staffRoles), (req, res, next) => {
  upload(req, res, error => {
    if (!error) return next();
    const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ success: false, message: error.message });
  });
}, controller.create);
router.delete('/:id', authorize(staffRoles), controller.remove);

module.exports = router;
