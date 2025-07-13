const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User, School, Branch } = require('../../models');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');
const RedisUtils = require('../../utils/redis-utils');

class UserService {
  static async createUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new ApiError(400, 'User with this email already exists');
      }

      const user = await User.create(userData);
      
      // Clear user-related caches
      await RedisUtils.del('cache:users:list');
      await RedisUtils.del(`user:${user.id}`);
      if (user.school_id) {
        await RedisUtils.del(`school:${user.school_id}`);
        await RedisUtils.del('cache:schools:list');
      }

      return user;
    } catch (error) {
      logger.error('Error in UserService.createUser:', error);
      throw error;
    }
  }

  // Get all users with pagination and filtering
  static async getAllUsers({ page = 1, limit = 10, search, role, status, school_id }) {
    try {
      const cacheKey = `users:list:${page}:${limit}:${search || 'all'}:${role || 'all'}:${status || 'all'}:${school_id || 'all'}`;
      
      // Try to get from cache first
      const cached = await RedisUtils.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for users list');
        return cached;
      }

      const offset = (page - 1) * limit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (status) {
        where.status = status;
      }

      if (school_id) {
        where.school_id = school_id;
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
        ],
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      const result = {
        users: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };

      // Cache the result for 5 minutes
      await RedisUtils.set(cacheKey, result, 300);
      
      return result;
    } catch (error) {
      logger.error('Error in UserService.getAllUsers:', error);
      throw error;
    }
  }

  static async getUserById(id, currentUser) {
    try {
      const cacheKey = `user:${id}`;
      
      // Try to get from cache first
      const cached = await RedisUtils.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for user details');
        return cached;
      }

      const user = await User.findByPk(id, {
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code', 'status'],
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code', 'status'],
          },
        ],
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Access control
      if (currentUser.role === 'school_admin' && currentUser.school_id !== user.school_id) {
        throw new ApiError(403, 'Access denied');
      }

      // Cache the result for 10 minutes
      await RedisUtils.set(cacheKey, user, 600);
      
      return user;
    } catch (error) {
      logger.error('Error in UserService.getUserById:', error);
      throw error;
    }
  }

  static async updateUser(id, updateData, currentUser) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Access control
      if (currentUser.role === 'school_admin' && currentUser.school_id !== user.school_id) {
        throw new ApiError(403, 'Access denied');
      }

      await user.update(updateData);
      
      // Clear related caches
      await RedisUtils.del(`user:${id}`);
      await RedisUtils.del('cache:users:list');
      if (user.school_id) {
        await RedisUtils.del(`school:${user.school_id}`);
        await RedisUtils.del('cache:schools:list');
      }
      
      return user;
    } catch (error) {
      logger.error('Error in UserService.updateUser:', error);
      throw error;
    }
  }

  static async deleteUser(id, currentUser) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Access control
      if (currentUser.role === 'school_admin' && currentUser.school_id !== user.school_id) {
        throw new ApiError(403, 'Access denied');
      }

      await user.destroy();
      
      // Clear related caches
      await RedisUtils.del(`user:${id}`);
      await RedisUtils.del('cache:users:list');
      if (user.school_id) {
        await RedisUtils.del(`school:${user.school_id}`);
        await RedisUtils.del('cache:schools:list');
      }
      
      return true;
    } catch (error) {
      logger.error('Error in UserService.deleteUser:', error);
      throw error;
    }
  }

  static async getUsersBySchool(schoolId, { page = 1, limit = 10, search, role, status }) {
    try {
      const cacheKey = `users:school:${schoolId}:${page}:${limit}:${search || 'all'}:${role || 'all'}:${status || 'all'}`;
      
      // Try to get from cache first
      const cached = await RedisUtils.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for school users list');
        return cached;
      }

      const offset = (page - 1) * limit;
      const where = { school_id: schoolId };

      if (search) {
        where[Op.or] = [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (status) {
        where.status = status;
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
        ],
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      const result = {
        users: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };

      // Cache the result for 5 minutes
      await RedisUtils.set(cacheKey, result, 300);
      
      return result;
    } catch (error) {
      logger.error('Error in UserService.getUsersBySchool:', error);
      throw error;
    }
  }

  static async getUsersByBranch(branchId, { page = 1, limit = 10, search, role, status }, currentUser) {
    try {
      const cacheKey = `users:branch:${branchId}:${page}:${limit}:${search || 'all'}:${role || 'all'}:${status || 'all'}`;
      
      // Try to get from cache first
      const cached = await RedisUtils.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for branch users list');
        return cached;
      }

      const offset = (page - 1) * limit;
      const where = { branch_id: branchId };

      if (search) {
        where[Op.or] = [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (status) {
        where.status = status;
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      const result = {
        users: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };

      // Cache the result for 5 minutes
      await RedisUtils.set(cacheKey, result, 300);
      
      return result;
    } catch (error) {
      logger.error('Error in UserService.getUsersByBranch:', error);
      throw error;
    }
  }

  // Change user password
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Verify current password
      const isMatch = await user.isPasswordMatch(currentPassword);
      if (!isMatch) {
        throw new ApiError(400, 'Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await user.update({ password: hashedPassword });

      // Clear user cache
      await RedisUtils.del(`user:${userId}`);

      return true;
    } catch (error) {
      logger.error('Error in UserService.changePassword:', error);
      throw error;
    }
  }
}

module.exports = UserService;
