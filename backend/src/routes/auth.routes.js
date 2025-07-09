const express = require('express');
const router = express.Router();
const { checkSchema } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  schoolAdminRegisterValidator,
} = require('../validations/auth.validation');

// Public routes
router.post(
  '/register',
  ...registerValidator,
  AuthController.register
);

router.post(
  '/register/school-admin',
  ...schoolAdminRegisterValidator,
  AuthController.register
);

router.post(
  '/login',
  ...loginValidator,
  AuthController.login
);

router.post(
  '/refresh-token',
  AuthController.refreshToken
);

router.post(
  '/forgot-password',
  ...forgotPasswordValidator,
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  ...resetPasswordValidator,
  AuthController.resetPassword
);

// Protected routes (require authentication)
router.use(verifyToken);

router.get('/me', AuthController.getCurrentUser);
router.post('/logout', AuthController.logout);

module.exports = router;
