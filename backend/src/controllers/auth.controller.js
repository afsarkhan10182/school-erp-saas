const { validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');
const AuthService = require('../services/auth.service');

class AuthController {
  static async register(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const userData = req.body;
      
      // Register user
      const result = await AuthService.register(userData);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const { email, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      
      // Authenticate user
      const { user, tokens } = await AuthService.login(email, password, ip);
      
      // Set HTTP-only cookie for refresh token
      res.cookie('refreshToken', tokens.refresh.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          tokens: {
            access: tokens.access,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        throw new ApiError(401, 'Refresh token is required');
      }
      
      // Get new tokens
      const { user, tokens } = await AuthService.refreshToken(refreshToken);
      
      // Set HTTP-only cookie for new refresh token
      res.cookie('refreshToken', tokens.refresh.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      res.json({
        success: true,
        data: {
          user,
          tokens: {
            access: tokens.access,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const { allDevices } = req.body;
      
      // Logout user
      await AuthService.logout(req.user.id, allDevices);
      
      // Clear refresh token cookie
      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const { email } = req.body;
      
      // Send password reset email
      await AuthService.forgotPassword(email);
      
      res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const { token, password } = req.body;
      
      // Reset password
      await AuthService.resetPassword(token, password);
      
      res.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req, res, next) {
    try {
      // Get current user from request (added by auth middleware)
      const user = req.user;
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
