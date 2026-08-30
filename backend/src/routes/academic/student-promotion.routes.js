const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { validateModuleAccess } = require('~/middleware/administration/subscriptionValidation');
const { getPromotionStudents, promoteStudents } = require('~/controllers/academic/student-promotion.controller');

const router = express.Router();
router.use(verifyToken, setSchoolContext, authorize(['super_admin', 'admin', 'branch_admin']));
router.use(validateModuleAccess('students'));

router.get('/students', getPromotionStudents);
router.post('/', promoteStudents);

module.exports = router;
