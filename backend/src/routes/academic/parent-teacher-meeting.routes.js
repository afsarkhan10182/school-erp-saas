const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const {
  list,
  create,
  recordAttendance,
  listForParent,
  submitFeedback,
  updateStatus
} = require('~/controllers/academic/parent-teacher-meeting.controller');

const router = express.Router();
router.use(verifyToken, setSchoolContext, requireModuleAccess('academic_management'));

router.get('/parent', authorize(['parent']), listForParent);
router.post('/:id/feedback', authorize(['parent']), submitFeedback);
router.get('/', authorize(['super_admin', 'admin', 'branch_admin', 'teacher']), list);
router.post('/', authorize(['super_admin', 'admin', 'branch_admin']), create);
router.patch('/:id/status', authorize(['super_admin', 'admin', 'branch_admin']), updateStatus);
router.put(
  '/:id/attendance',
  authorize(['super_admin', 'admin', 'branch_admin', 'teacher']),
  recordAttendance
);

module.exports = router;
