const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const BranchController = require('../../controllers/school/branch.controller');
const {
  createBranchValidator,
  updateBranchValidator,
} = require('../../validations/branch.validation');
const { uploadFields } = require('../../middleware/upload');

// All routes require authentication
router.use(verifyToken);

// Super Admin routes (can manage all branches)
router.post(
  '/',
  authorize('super_admin'),
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

router.get(
  '/:id',
  authorize('super_admin'),
  BranchController.getBranchById
);

router.put(
  '/:id',
  authorize('super_admin'),
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
  authorize('super_admin'),
  BranchController.deleteBranch
);

// School Admin routes (can manage branches in their school)
router.get(
  '/school/:schoolId',
  authorize(['super_admin', 'school_admin']),
  BranchController.getBranchesBySchool
);

// Branch Admin routes (can view their own branch)
router.get(
  '/my-branch',
  authorize('branch_admin'),
  BranchController.getMyBranch
);

module.exports = router; 