const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User, School, Branch } = require('../../models');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');
const RedisUtils = require('../../utils/redis-utils');
const { RoleManager, ROLES } = require('../../utils/roleManager');

class UserService {
  static async createUser(userData) {
    try {
      let generatedPassword = null;
      
      // Auto-generate password if not provided
      if (!userData.password || userData.password.trim() === '') {
        generatedPassword = UserService.generateRandomPassword();
        userData.password = generatedPassword;
        logger.info('Auto-generated password for user:', userData.email);
      }
      
      // Check if user already exists within the same school and branch
      const existingUser = await User.findOne({
        where: { 
          email: userData.email,
          school_id: userData.school_id,
          branch_id: userData.branch_id
        }
      });

      if (existingUser) {
        throw new ApiError(400, 'User with this email already exists in this branch');
      }

      const user = await User.create(userData);
      
      // Clear user-related caches
      await RedisUtils.del('cache:users:list');
      await RedisUtils.del(`user:${user.id}`);
      if (user.school_id) {
        await RedisUtils.del(`school:${user.school_id}`);
        await RedisUtils.del('cache:schools:list');
      }
      
      // Clear all user list caches to ensure new users appear
      const keys = await RedisUtils.keys('users:list:*');
      if (keys && keys.length > 0) {
        await RedisUtils.del(...keys);
      }

      // Return the user data along with the generated password if it was auto-generated
      const userResponse = user.toJSON();
      if (generatedPassword) {
        userResponse.generatedPassword = generatedPassword;
      }
      
      return userResponse;
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

      // Only include non-deleted users
      where.deleted_at = null;

      // Apply search filter
      if (search) {
        where[Op.or] = [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { '$school.name$': { [Op.iLike]: `%${search}%` } },
          { '$branch.name$': { [Op.iLike]: `%${search}%` } },
        ];
      }

      // Apply role filter
      if (role) {
        where.role = role;
      } else if (school_id) {
        // If filtering by school (School Admin view), exclude super_admin and school_admin users
        // But include branch_admin users
        where.role = { [Op.notIn]: ['super_admin', 'school_admin'] };
      }

      // Apply status filter
      if (status) {
        where.status = status;
      } else {
        // Only show active users by default
        where.status = 'active';
      }

      // Apply school filter if provided
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

      // Use RoleManager for access control
      if (!RoleManager.canAccessUser(currentUser, user)) {
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

      // Use RoleManager for access control
      if (!RoleManager.canAccessUser(currentUser, user)) {
        throw new ApiError(403, 'Access denied');
      }

      await user.update(updateData);
      
      // Clear related caches
      await RedisUtils.del(`user:${id}`);
      await RedisUtils.del('cache:users:list');
      
      // Clear all user list caches to ensure updated users appear
      const keys = await RedisUtils.keys('users:list:*');
      if (keys && keys.length > 0) {
        await RedisUtils.del(...keys);
      }
      
      // Clear school-specific user caches
      const schoolKeys = await RedisUtils.keys('users:school:*');
      if (schoolKeys && schoolKeys.length > 0) {
        await RedisUtils.del(...schoolKeys);
      }
      
      // Clear branch-specific user caches
      const branchKeys = await RedisUtils.keys('users:branch:*');
      if (branchKeys && branchKeys.length > 0) {
        await RedisUtils.del(...branchKeys);
      }
      
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

      // Use RoleManager for access control
      if (!RoleManager.canAccessUser(currentUser, user)) {
        throw new ApiError(403, 'Access denied');
      }

      await user.destroy();
      
      // Clear related caches
      await RedisUtils.del(`user:${id}`);
      await RedisUtils.del('cache:users:list');
      
      // Clear all user list caches to ensure deleted users are removed
      const keys = await RedisUtils.keys('users:list:*');
      if (keys && keys.length > 0) {
        await RedisUtils.del(...keys);
      }
      
      // Clear school-specific user caches
      const schoolKeys = await RedisUtils.keys('users:school:*');
      if (schoolKeys && schoolKeys.length > 0) {
        await RedisUtils.del(...schoolKeys);
      }
      
      // Clear branch-specific user caches
      const branchKeys = await RedisUtils.keys('users:branch:*');
      if (branchKeys && branchKeys.length > 0) {
        await RedisUtils.del(...branchKeys);
      }
      
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

  // Generate a random password that meets validation requirements
  static generateRandomPassword() {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    // Ensure at least one character from each required category
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest with random characters
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < 10; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

module.exports = UserService;
