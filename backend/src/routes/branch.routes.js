const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const BranchController = require('../controllers/branch.controller');
const {
  createBranchValidator,
  updateBranchValidator,
} = require('../validations/branch.validation');

// All routes require authentication
router.use(verifyToken);

// Super Admin routes (can manage all branches)
router.get(
  '/',
  requireRole(['super_admin']),
  BranchController.getAllBranches
);

router.get(
  '/:id',
  requireRole(['super_admin', 'school_admin', 'branch_admin']),
  BranchController.getBranchById
);

router.put(
  '/:id',
  requireRole(['super_admin']),
  ...updateBranchValidator,
  BranchController.updateBranch
);

router.delete(
  '/:id',
  requireRole(['super_admin']),
  BranchController.deleteBranch
);

// School Admin routes (can manage branches in their school)
router.post(
  '/',
  requireRole(['super_admin', 'school_admin']),
  ...createBranchValidator,
  BranchController.createBranch
);

router.get(
  '/school/:schoolId',
  requireRole(['super_admin', 'school_admin']),
  BranchController.getBranchesBySchool
);

// Branch Admin routes (can view their own branch)
router.get(
  '/my-branch',
  requireRole(['branch_admin']),
  BranchController.getMyBranch
);

module.exports = router; 