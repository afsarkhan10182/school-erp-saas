const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('~/middleware/core/auth');
const { validate } = require('~/middleware/shared/validate');
const BranchController = require('~/controllers/administration/schools/branch.controller');
const {
  createBranchValidator,
  updateBranchValidator
} = require('~/validations/administration/branch');
const { uploadFields } = require('~/middleware/shared/upload');
const {
  validateSubscriptionLimits,
  validateModuleAccess,
  checkSubscriptionStatus
} = require('~/middleware/administration/subscriptionValidation');

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
    { name: 'report_card_design', maxCount: 1 }
  ]),
  validate(createBranchValidator),
  BranchController.createBranch
);

router.get(
  '/',
  authorize(['super_admin', 'admin', 'branch_admin']),
  BranchController.getAllBranches
);

// GET /api/branches/dropdown - Get branches for dropdown/select
router.get(
  '/dropdown',
  authorize(['super_admin', 'admin', 'branch_admin']),
  BranchController.getBranchesForDropdown
);

// Branch Admin routes (can view their own branch) - Must come before /:id
router.get('/my-branch', authorize(['branch_admin']), BranchController.getMyBranch);

// Admin routes (can manage branches in their school) - Must come before /:id
router.get(
  '/school/:schoolId',
  authorize(['super_admin', 'admin', 'branch_admin']),
  BranchController.getBranchesBySchool
);

router.get(
  '/:id',
  authorize(['super_admin', 'admin', 'branch_admin']),
  BranchController.getBranchById
);

router.put(
  '/:id',
  authorize(['super_admin']),
  uploadFields([
    { name: 'system_logo', maxCount: 1 },
    { name: 'text_logo', maxCount: 1 },
    { name: 'printing_logo', maxCount: 1 },
    { name: 'report_card_design', maxCount: 1 }
  ]),
  validate(updateBranchValidator),
  BranchController.updateBranch
);

router.delete('/:id', authorize(['super_admin']), BranchController.deleteBranch);

module.exports = router;
