const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { validateModuleAccess } = require('~/middleware/administration/subscriptionValidation');
const { list, create, update } = require('~/controllers/academic/parent.controller');

const router = express.Router();
router.use(verifyToken, setSchoolContext, authorize(['super_admin', 'admin', 'branch_admin', 'receptionist']));
router.use(validateModuleAccess('students'));

router.get('/', list);
router.post('/', create);
router.put('/:id', update);

module.exports = router;
