const express = require('express');
const router = express.Router();
const { checkSchema } = require('express-validator');
const AuthController = require('~/controllers/core/auth/auth.controller');
const { verifyToken } = require('~/middleware/core/auth');
const { validate } = require('~/middleware/shared/validate');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  schoolAdminRegisterValidator
} = require('~/validations/core/auth');

// Public routes
router.post('/register', validate(registerValidator), AuthController.register);

router.post(
  '/register/school-admin',
  validate(schoolAdminRegisterValidator),
  AuthController.register
);

router.post('/login', validate(loginValidator), AuthController.login);

router.post('/refresh-token', AuthController.refreshToken);

router.post('/forgot-password', validate(forgotPasswordValidator), AuthController.forgotPassword);

router.post('/reset-password', validate(resetPasswordValidator), AuthController.resetPassword);

// Protected routes (require authentication)
router.get('/me', verifyToken, AuthController.getCurrentUser);

// Logout route - can work with expired/invalid tokens
router.post('/logout', AuthController.logout);

module.exports = router;
