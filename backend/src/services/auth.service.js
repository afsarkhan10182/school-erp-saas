const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, School, Branch } = require('../models');
const { logger } = require('../utils/logger');
const { getRedisClient } = require('../config/redis');
const ApiError = require('../utils/ApiError');

const ROLES = User.ROLES;

class AuthService {
  static async register(userData) {
    try {
      // Check if email already exists
      const existingUser = await User.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new ApiError(400, 'Email already in use');
      }

      // For school registration
      if (userData.role === ROLES.SCHOOL_ADMIN) {
        return this.registerSchoolAdmin(userData);
      }

      // For other user types
      const user = await User.create({
        ...userData,
        status: 'active', // or 'pending' if email verification is required
      });

      // Remove password from the response
      const userJson = user.toJSON();
      delete userJson.password;

      return userJson;
    } catch (error) {
      logger.error('Error in AuthService.register:', error);
      throw error;
    }
  }

  static async registerSchoolAdmin(schoolAdminData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Create school
      const school = await School.create(
        {
          name: schoolAdminData.schoolName,
          email: schoolAdminData.email,
          phone: schoolAdminData.phone,
          address: schoolAdminData.address,
          city: schoolAdminData.city,
          state: schoolAdminData.state,
          country: schoolAdminData.country || 'India',
          postal_code: schoolAdminData.postalCode,
          subscription_plan: 'trial',
          subscription_start_date: new Date(),
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
          status: 'active',
        },
        { transaction }
      );

      // Create main branch
      const branch = await Branch.create(
        {
          name: 'Main Campus',
          code: 'MAIN',
          email: schoolAdminData.email,
          phone: schoolAdminData.phone,
          address: schoolAdminData.address,
          city: schoolAdminData.city,
          state: schoolAdminData.state,
          country: schoolAdminData.country || 'India',
          postal_code: schoolAdminData.postalCode,
          is_main_branch: true,
          status: 'active',
          school_id: school.id,
        },
        { transaction }
      );

      // Create school admin user
      const user = await User.create(
        {
          ...schoolAdminData,
          role: ROLES.SCHOOL_ADMIN,
          school_id: school.id,
          branch_id: branch.id,
          status: 'active',
        },
        { transaction }
      );

      await transaction.commit();

      // Remove sensitive data
      const userJson = user.toJSON();
      delete userJson.password;

      return {
        user: userJson,
        school,
        branch,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in AuthService.registerSchoolAdmin:', error);
      throw error;
    }
  }

  static async login(email, password, ip) {
    try {
      const user = await User.findOne({
        where: { email },
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'status', 'subscription_plan', 'subscription_end_date'],
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'status'],
          },
        ],
      });

      if (!user) {
        throw new ApiError(401, 'Invalid email or password');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new ApiError(403, 'Your account is not active. Please contact support.');
      }

      // Check if school is active
      if (user.school && user.school.status !== 'active') {
        throw new ApiError(403, 'Your school account is not active. Please contact support.');
      }

      // Check if branch is active
      if (user.branch && user.branch.status !== 'active') {
        throw new ApiError(403, 'Your branch is not active. Please contact your school administrator.');
      }

      // Check password
      const isMatch = await user.isPasswordMatch(password);
      if (!isMatch) {
        throw new ApiError(401, 'Invalid email or password');
      }

      // Update last login and IP
      await user.update({
        last_login: new Date(),
        last_ip: ip,
      });

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
    
    // Generate access token
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
        branch_id: user.branch_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token in Redis with user ID as key (optional)
    try {
      const redisClient = await getRedisClient();
      await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
        EX: 60 * 60 * 24 * 7, // 7 days
      });
    } catch (error) {
      logger.warn('Redis not available, continuing without token storage:', error.message);
    }

    return {
      access: {
        token: accessToken,
        expires: new Date(
          Date.now() + parseInt(process.env.JWT_EXPIRES_IN || 3600) * 1000
        ),
      },
      refresh: {
        token: refreshToken,
        expires: new Date(
          Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_IN || 604800) * 1000
        ),
      },
    };
  }

  static async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Verify refresh token in Redis
      const redisClient = await getRedisClient();
      const storedToken = await redisClient.get(`refresh_token:${decoded.id}`);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      // Get user
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
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

  static async logout(userId, allDevices = false) {
    try {
      const redisClient = await getRedisClient();
      
      if (allDevices) {
        // Delete all refresh tokens for the user
        const keys = await redisClient.keys(`refresh_token:${userId}:*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } else {
        // Delete the current refresh token
        await redisClient.del(`refresh_token:${userId}`);
      }
      
      return true;
    } catch (error) {
      logger.error('Error in AuthService.logout:', error);
      throw error;
    }
  }

  static async forgotPassword(email) {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        // For security, don't reveal if the email exists or not
        return { success: true };
      }
      
      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET + user.password,
        { expiresIn: '1h' }
      );
      
      // Save reset token to database
      await user.update({
        reset_password_token: resetToken,
        reset_password_expires: new Date(Date.now() + 3600000), // 1 hour from now
      });
      
      // TODO: Send email with reset link
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      logger.info(`Password reset link for ${user.email}: ${resetUrl}`);
      
      return { success: true };
    } catch (error) {
      logger.error('Error in AuthService.forgotPassword:', error);
      throw error;
    }
  }

  static async resetPassword(token, newPassword) {
    try {
      // Find user by reset token
      const user = await User.findOne({
        where: {
          reset_password_token: token,
          reset_password_expires: { [Op.gt]: new Date() },
        },
      });

      if (!user) {
        throw new ApiError(400, 'Invalid or expired reset token');
      }

      // Verify the token
      try {
        jwt.verify(token, process.env.JWT_SECRET + user.password);
      } catch (err) {
        throw new ApiError(400, 'Invalid or expired reset token');
      }

      // Update password and clear reset token
      await user.update({
        password: newPassword,
        reset_password_token: null,
        reset_password_expires: null,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error in AuthService.resetPassword:', error);
      throw error;
    }
  }
}

module.exports = AuthService;
