const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { list, create, update, remove } = require('~/controllers/academic/homework.controller');

const router = express.Router();
router.use(
  verifyToken,
  setSchoolContext,
  authorize(['super_admin', 'admin', 'branch_admin', 'teacher']),
  requireModuleAccess('homework')
);

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
