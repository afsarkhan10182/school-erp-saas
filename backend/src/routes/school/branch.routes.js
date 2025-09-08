const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('~/middleware/auth');
const { validate } = require('~/middleware/validate');
const BranchController = require('~/controllers/school/branch.controller');
const {
  createBranchValidator,
  updateBranchValidator,
} = require('~/validations/branch.validation');
const { uploadFields } = require('~/middleware/upload');
const { validateSubscriptionLimits, validateModuleAccess, checkSubscriptionStatus } = require('~/middleware/subscriptionValidation');

// All routes require authentication
router.use(verifyToken);

// Super Admin routes (can manage all branches)
router.post(
  '/',
  authorize(['super_admin']),
  checkSubscriptionStatus,
  validateModuleAccess('settings'),
  validateSubscriptionLimits,
  uploadFields([
    { name: 'system_logo', maxCount: 1 },
    { name: 'text_logo', maxCount: 1 },
    { name: 'printing_logo', maxCount: 1 },
    { name: 'report_card_design', maxCount: 1 },
  ]),
  validate(createBranchValidator),
  BranchController.createBranch
);

router.get(
  '/',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  BranchController.getAllBranches
);

// GET /api/branches/dropdown - Get branches for dropdown/select
router.get(
  '/dropdown',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  BranchController.getBranchesForDropdown
);

// Branch Admin routes (can view their own branch) - Must come before /:id
router.get(
  '/my-branch',
  authorize(['branch_admin']),
  BranchController.getMyBranch
);

// School Admin routes (can manage branches in their school) - Must come before /:id
router.get(
  '/school/:schoolId',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  BranchController.getBranchesBySchool
);

router.get(
  '/:id',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  BranchController.getBranchById
);

router.put(
  '/:id',
  authorize(['super_admin']),
  uploadFields([
    { name: 'system_logo', maxCount: 1 },
    { name: 'text_logo', maxCount: 1 },
    { name: 'printing_logo', maxCount: 1 },
    { name: 'report_card_design', maxCount: 1 },
  ]),
  validate(updateBranchValidator),
  BranchController.updateBranch
);

router.delete(
  '/:id',
  authorize(['super_admin']),
  BranchController.deleteBranch
);

module.exports = router; 