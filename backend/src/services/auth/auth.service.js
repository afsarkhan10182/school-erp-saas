const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, School, Branch } = require('~/models');
const { logger } = require('~/utils/logger');
const ApiError = require('~/utils/ApiError');
const { getRedisClient } = require('~/config/redis');
const RedisUtils = require('~/utils/redis-utils');

const ROLES = User.ROLES;

class AuthService {
  static async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          email: userData.email
        }
      });

      if (existingUser) {
        throw new ApiError(400, 'User with this email already exists');
      }

      // Create user
      const user = await User.create(userData);

      // Clear user-related caches
      await RedisUtils.del('cache:users:list');
      await RedisUtils.del(`user:${user.id}`);

      return user;
    } catch (error) {
      logger.error('Error in AuthService.register:', error);
      throw error;
    }
  }

  static async registerSchoolAdmin(schoolAdminData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          email: schoolAdminData.email
        }
      });

      if (existingUser) {
        throw new ApiError(400, 'User with this email already exists');
      }

      // Create user
      const user = await User.create({
        ...schoolAdminData,
        role: 'school_admin',
        status: 'active'
      });

      // Clear user-related caches
      await RedisUtils.del('cache:users:list');
      await RedisUtils.del(`user:${user.id}`);

      return user;
    } catch (error) {
      logger.error('Error in AuthService.registerSchoolAdmin:', error);
      throw error;
    }
  }

  static async login(email, password, ip) {
    try {
      const user = await User.findOne({
        where: {
          email
        },
        include: [
          {
            model: School,
            as: 'school',
            attributes: [
              'id',
              'name',
              'code',
              'logo',
              'status',
              'subscription_plan',
              'subscription_end_date'
            ]
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'status']
          }
        ]
      });

      if (!user) {
        throw new ApiError(401, 'Invalid email or password');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new ApiError(403, 'Your account is not active. Please contact support.');
      }

      // Check if school is active (allow active, trial, and lifetime statuses)
      if (user.school && !['active', 'trial', 'lifetime'].includes(user.school.status)) {
        throw new ApiError(403, 'Your school account is not active. Please contact support.');
      }

      // Check if branch is active
      if (user.branch && user.branch.status !== 'active') {
        throw new ApiError(
          403,
          'Your branch is not active. Please contact your school administrator.'
        );
      }

      // Check password
      const isMatch = await user.isPasswordMatch(password);
      if (!isMatch) {
        throw new ApiError(401, 'Invalid email or password');
      }

      // Update last login and IP
      await user.update({
        last_login: new Date(),
        last_ip: ip
      });

      // Clear user cache after login
      await RedisUtils.del(`user:${user.id}`);

      // Generate tokens
      const tokens = await this.generateAuthTokens(user);

      // Remove sensitive data
      const userJson = user.toJSON();
      delete userJson.password;

      return { user: userJson, tokens };
    } catch (error) {
      logger.error('Error in AuthService.login:', error);
      throw error;
    }
  }

  static async generateAuthTokens(user) {
    // Debug logging
    logger.info('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    logger.info('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET');

    // Generate access token (1 minute for testing)
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
        branch_id: user.branch_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '60m' } // 60 minutes
    );

    // Generate refresh token
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d'
    });

    // Store refresh token in Redis with user ID as key (optional)
    try {
      const redisClient = await getRedisClient();
      await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
        EX: 60 * 60 * 24 * 7 // 7 days
      });
    } catch (error) {
      logger.warn('Redis not available, continuing without token storage:', error.message);
    }

    // Calculate expiry times correctly
    const accessTokenExpiry = new Date(Date.now() + 60 * 1000); // 1 minute
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      access: {
        token: accessToken,
        expires: accessTokenExpiry
      },
      refresh: {
        token: refreshToken,
        expires: refreshTokenExpiry
      }
    };
  }

  static async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Verify refresh token in Redis (optional - continue if Redis fails)
      try {
        const redisClient = await getRedisClient();

        if (redisClient) {
          const storedToken = await redisClient.get(`refresh_token:${decoded.id}`);

          if (!storedToken || storedToken !== refreshToken) {
            throw new ApiError(401, 'Invalid refresh token');
          }
        }
      } catch (redisError) {
        // Continue without Redis validation if Redis is not available
      }

      // Get user with school and branch associations
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: School,
            as: 'school',
            attributes: [
              'id',
              'name',
              'code',
              'status',
              'subscription_plan',
              'subscription_end_date'
            ]
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'status']
          }
        ]
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Generate new tokens
      const tokens = await this.generateAuthTokens(user);

      return { user, tokens };
    } catch (error) {
      logger.error('Error in AuthService.refreshToken:', error);
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  static async logout(userId, allDevices = false, currentToken = null) {
    try {
      // Blacklist the current token
      const redisClient = await getRedisClient();

      if (redisClient) {
        if (allDevices) {
          // Remove all refresh tokens for this user
          await redisClient.del(`refresh_token:${userId}`);
          logger.info(`Logged out user ${userId} from all devices`);
        } else {
          // For single device logout, blacklist the current access token
          if (currentToken) {
            try {
              // Blacklist the current access token with expiration matching the token's expiration
              const decoded = jwt.verify(currentToken, process.env.JWT_SECRET);
              const timeToExpiry = decoded.exp - Math.floor(Date.now() / 1000);

              if (timeToExpiry > 0) {
                await redisClient.set(`bl_${currentToken}`, '1', {
                  EX: timeToExpiry
                });
                logger.info(`Blacklisted access token for user ${userId}`);
              }
            } catch (tokenError) {
              logger.warn('Failed to blacklist token (token may be invalid):', tokenError.message);
            }
          }
        }
      } else {
        logger.warn('Redis not available, proceeding without token blacklisting');
      }

      // Clear user-related caches (these handle Redis unavailability internally)
      await RedisUtils.del(`user:${userId}`);
      await RedisUtils.del('cache:users:list');

      logger.info(`Logged out user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error in AuthService.logout:', error);
      throw error;
    }
  }

  static async forgotPassword(email) {
    try {
      const user = await User.findOne({
        where: {
          email
        }
      });
      if (!user) {
        // Don't reveal if user exists or not
        return { message: 'If the email exists, a password reset link has been sent.' };
      }

      // Generate reset token
      const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Store reset token in Redis
      try {
        const redisClient = await getRedisClient();
        await redisClient.set(`reset_token:${user.id}`, resetToken, {
          EX: 3600 // 1 hour
        });
      } catch (error) {
        logger.warn('Redis not available for reset token storage:', error.message);
      }

      // TODO: Send email with reset link
      logger.info(`Password reset token generated for user ${user.id}`);

      // Log reset token for testing purposes (remove in production)
      logger.info(`🔑 RESET TOKEN FOR TESTING: ${resetToken}`);
      logger.info(
        `🔗 Reset URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`
      );

      return { message: 'If the email exists, a password reset link has been sent.' };
    } catch (error) {
      logger.error('Error in AuthService.forgotPassword:', error);
      throw error;
    }
  }

  static async resetPassword(token, newPassword) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verify reset token in Redis (optional - continue if Redis fails)
      try {
        const redisClient = await getRedisClient();
        if (redisClient) {
          const storedToken = await redisClient.get(`reset_token:${decoded.id}`);

          if (!storedToken || storedToken !== token) {
            throw new ApiError(401, 'Invalid or expired reset token');
          }
        } else {
          logger.warn(
            'Redis not available for reset token validation, proceeding without validation'
          );
        }
      } catch (redisError) {
        logger.warn('Redis validation failed, continuing without Redis check:', redisError.message);
        // Continue without Redis validation if Redis is not available
      }

      // Update password
      const user = await User.findByPk(decoded.id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      user.password = newPassword;
      await user.save();

      // Remove reset token (optional - continue if Redis fails)
      try {
        const redisClient = await getRedisClient();
        if (redisClient) {
          await redisClient.del(`reset_token:${decoded.id}`);
        }
      } catch (redisError) {
        logger.warn('Failed to remove reset token from Redis:', redisError.message);
      }

      // Clear user cache
      await RedisUtils.del(`user:${user.id}`);

      return { message: 'Password reset successfully' };
    } catch (error) {
      logger.error('Error in AuthService.resetPassword:', error);
      throw error;
    }
  }
}

module.exports = AuthService;
