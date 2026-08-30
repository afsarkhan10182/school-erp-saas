const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { validateModuleAccess } = require('~/middleware/administration/subscriptionValidation');
const { list, create, update, remove } = require('~/controllers/academic/student-category.controller');

const router = express.Router();
router.use(verifyToken, setSchoolContext, authorize(['super_admin', 'admin', 'branch_admin']));
router.use(validateModuleAccess('students'));

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
