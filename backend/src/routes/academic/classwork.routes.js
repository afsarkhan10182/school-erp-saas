const express = require('express');
const multer = require('multer');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const controller = require('~/controllers/academic/classwork.controller');
const upload = require('~/middleware/shared/study-material-upload');

const router = express.Router();
const staffRoles = ['super_admin', 'admin', 'branch_admin', 'teacher'];
router.use(verifyToken, setSchoolContext, requireModuleAccess('attachments'));
router.get('/:id/file', authorize(staffRoles), controller.download);
router.use(authorize(staffRoles));
router.get('/', controller.list);
const uploadFile = (req, res, next) => upload(req, res, error => {
  if (!error) return next();
  const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
  return res.status(status).json({ success: false, message: error.message });
});
router.post('/', uploadFile, controller.create);
router.put('/:id', uploadFile, controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
