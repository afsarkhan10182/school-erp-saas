const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { uploadSingle } = require('~/middleware/shared/upload');
const {
  list,
  create,
  update,
  remove,
  getMySubmission,
  submitWork,
  listSubmissions,
  gradeSubmission,
  getPlacementOptions
} = require('~/controllers/academic/homework.controller');

const router = express.Router();
router.use(
  verifyToken,
  setSchoolContext,
  requireModuleAccess('homework')
);

router.get('/:id/my-submission', authorize(['student']), getMySubmission);
router.post('/:id/submission', authorize(['student']), submitWork);
router.get('/:id/submissions', authorize(['super_admin', 'admin', 'branch_admin', 'teacher']), listSubmissions);
router.put('/submissions/:submissionId/grade', authorize(['super_admin', 'admin', 'branch_admin', 'teacher']), gradeSubmission);
router.get(
  '/placement-options',
  authorize(['super_admin', 'admin', 'branch_admin', 'teacher']),
  getPlacementOptions
);

router.use(authorize(['super_admin', 'admin', 'branch_admin', 'teacher']));
router.get('/', list);
router.post('/', uploadSingle('attachment'), create);
router.put('/:id', uploadSingle('attachment'), update);
router.delete('/:id', remove);

module.exports = router;
