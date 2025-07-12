const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../../middleware/auth');
// const { validate } = require('../../middleware/validate');
const UserController = require('../../controllers/user/user.controller');
const {
  createUserValidator,
  updateUserValidator,
} = require('../../validations/user.validation');

// All routes require authentication
router.use(verifyToken);

// User profile management (specific routes first)
router.get(
  '/profile/me',
  authorize('super_admin', 'school_admin', 'branch_admin', 'teacher', 'student', 'parent'),
  UserController.getMyProfile
);

router.put(
  '/profile/me',
  authorize('super_admin', 'school_admin', 'branch_admin', 'teacher', 'student', 'parent'),
  UserController.updateMyProfile
);

// School-specific routes
router.get(
  '/school/:schoolId',
  authorize('super_admin', 'school_admin'),
  UserController.getUsersBySchool
);

router.get(
  '/branch/:branchId',
  authorize('super_admin', 'school_admin', 'branch_admin'),
  UserController.getUsersByBranch
);

// Super Admin routes (can manage all users)
router.get(
  '/',
  authorize('super_admin'),
  UserController.getAllUsers
);

router.get(
  '/:id',
  authorize('super_admin', 'school_admin'),
  UserController.getUserById
);

router.put(
  '/:id',
  authorize('super_admin'),
  UserController.updateUser
);

router.delete(
  '/:id',
  authorize('super_admin'),
  UserController.deleteUser
);

// School Admin routes (can manage users in their school)
router.post(
  '/',
  authorize('super_admin', 'school_admin'),
  UserController.createUser
);

module.exports = router; 