const express = require('express');
const {
  getStudentAllocationList,
  saveFeeAllocation
} = require('~/controllers/financial/fee-allocation.controller');
const { verifyToken, setSchoolContext, requireRole } = require('~/middleware/core/auth');
const {
  validateModuleAccess,
  checkSubscriptionStatus
} = require('~/middleware/administration/subscriptionValidation');

const router = express.Router();

router.use(verifyToken);
router.use(setSchoolContext);
router.use(checkSubscriptionStatus);
router.use(validateModuleAccess('fees'));

router.get(
  '/students',
  requireRole('super_admin', 'admin', 'branch_admin', 'accountant'),
  getStudentAllocationList
);

router.post(
  '/save',
  requireRole('super_admin', 'admin', 'branch_admin', 'accountant'),
  saveFeeAllocation
);

module.exports = router;
