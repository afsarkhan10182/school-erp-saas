const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const UserController = require('../controllers/user.controller');
const {
  createUserValidator,
  updateUserValidator,
} = require('../validations/user.validation');

// All routes require authentication
router.use(verifyToken);



// User profile management (specific routes first)
router.get(
  '/profile/me',
  requireRole('super_admin', 'school_admin', 'branch_admin', 'teacher', 'student', 'parent'),
  UserController.getMyProfile
);

router.put(
  '/profile/me',
  requireRole('super_admin', 'school_admin', 'branch_admin', 'teacher', 'student', 'parent'),
  ...updateUserValidator,
  UserController.updateMyProfile
);

// School-specific routes
router.get(
  '/school/:schoolId',
  requireRole('super_admin', 'school_admin'),
  UserController.getUsersBySchool
);

router.get(
  '/branch/:branchId',
  requireRole('super_admin', 'school_admin', 'branch_admin'),
  UserController.getUsersByBranch
);

// Super Admin routes (can manage all users)
router.get(
  '/',
  requireRole('super_admin'),
  UserController.getAllUsers
);

router.get(
  '/:id',
  requireRole('super_admin', 'school_admin'),
  UserController.getUserById
);

router.put(
  '/:id',
  requireRole('super_admin'),
  ...updateUserValidator,
  UserController.updateUser
);

router.delete(
  '/:id',
  requireRole('super_admin'),
  UserController.deleteUser
);

// School Admin routes (can manage users in their school)
router.post(
  '/',
  requireRole('super_admin', 'school_admin'),
  ...createUserValidator,
  UserController.createUser
);

module.exports = router; 