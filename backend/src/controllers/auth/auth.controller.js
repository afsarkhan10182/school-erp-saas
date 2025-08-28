const { validationResult } = require('express-validator');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');
const AuthService = require('../../services/auth/auth.service');
const jwt = require('jsonwebtoken');

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
      
      // Set HTTP-only cookies for both tokens
      res.cookie('accessToken', tokens.access.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Allow cross-origin requests
        maxAge: 60 * 60 * 1000, // 60 minutes
        path: '/',
      });
      
      res.cookie('refreshToken', tokens.refresh.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Allow cross-origin requests
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          // Don't return tokens in response body for security
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      
      if (!refreshToken) {
        throw new ApiError(401, 'Refresh token is required');
      }
      
      // Get new tokens
      const { user, tokens } = await AuthService.refreshToken(refreshToken);
      
      // Set HTTP-only cookies for both new tokens
      res.cookie('accessToken', tokens.access.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Allow cross-origin requests
        maxAge: 60 * 60 * 1000, // 60 minutes
        path: '/',
      });
      
      res.cookie('refreshToken', tokens.refresh.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Allow cross-origin requests
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
      
      res.json({
        success: true,
        data: {
          user,
          // Don't return tokens in response body for security
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const { allDevices = false } = req.body || {};
      
      // Get the current token from cookies
      const currentToken = req.cookies?.accessToken;
      
      // Try to get user from request (might be null if token is expired/invalid)
      const userId = req.user?.id;
      
      if (userId) {
        // User is authenticated, perform full logout
        await AuthService.logout(userId, allDevices, currentToken);
      } else if (currentToken) {
        // User has a token but it's expired/invalid, just blacklist it
        try {
          const decoded = jwt.verify(currentToken, process.env.JWT_SECRET);
          await AuthService.logout(decoded.id, allDevices, currentToken);
        } catch (tokenError) {
          // Token is invalid, just clear cookies
        }
      }
      
      // Always clear both token cookies regardless of authentication status
      res.clearCookie('accessToken', { path: '/' });
      res.clearCookie('refreshToken', { path: '/' });
      
      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      // Even if logout fails, clear cookies to ensure user is logged out
      res.clearCookie('accessToken', { path: '/' });
      res.clearCookie('refreshToken', { path: '/' });
      
      res.json({
        success: true,
        message: 'Logout successful',
      });
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
      // Return full user profile instead of just JWT claims
      const fullUser = await require('../../services/user/user.service').getUserById(req.user.id, req.user);
      res.json({
        success: true,
        data: fullUser,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
