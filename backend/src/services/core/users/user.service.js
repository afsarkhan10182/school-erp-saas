const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const User = require('~/models/core/user.model');
const School = require('~/models/administration/school.model');
const Branch = require('~/models/administration/branch.model');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const RedisUtils = require('~/utils/shared/redis-utils');
const { RoleManager, ROLES } = require('~/utils/core/roleManager');
const BaseService = require('~/services/shared/base.service');

class UserService {
  static async createUser(userData) {
    return BaseService.executeWithErrorHandling(async () => {
      let generatedPassword = null;

      // Auto-generate password if not provided
      if (!userData.password || userData.password.trim() === '') {
        generatedPassword = BaseService.generateRandomPassword();
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

      // Clear user-related caches using base service
      await BaseService.clearCache([
        'cache:users:list',
        `user:${user.id}`,
        ...(user.school_id ? [`school:${user.school_id}`, 'cache:schools:list'] : [])
      ]);

      // Clear all user list caches to ensure new users appear
      const keys = await RedisUtils.keys('users:list:*');
      if (keys && keys.length > 0) {
        await BaseService.clearCache(keys);
      }

      // Return the user data along with the generated password if it was auto-generated
      const userResponse = user.toJSON();
      if (generatedPassword) {
        userResponse.generatedPassword = generatedPassword;
      }

      return userResponse;
    }, 'UserService.createUser');
  }

  // Get all users with pagination and filtering
  static async getAllUsers({ page = 1, limit = 10, search, role, status, school_id, branch_id }) {
    const cacheKey = `users:list:${page}:${limit}:${search || 'all'}:${role || 'all'}:${status || 'all'}:${school_id || 'all'}:${branch_id || 'all'}`;

    return BaseService.getFromCache(
      cacheKey,
      async () => {
        const { offset } = BaseService.sanitizePaginationParams({
          page,
          limit
        });
        const where = {};

        // Only include non-deleted users
        where.deleted_at = null;

        // Apply search filter using base service
        if (search) {
          where[Op.or] = [
            { first_name: { [Op.iLike]: `%${search}%` } },
            { last_name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
            { phone: { [Op.iLike]: `%${search}%` } },
            { '$school.name$': { [Op.iLike]: `%${search}%` } },
            { '$branch.name$': { [Op.iLike]: `%${search}%` } }
          ];
        }

        // Apply role filter
        if (role) {
          where.role = role;
        } else if (school_id) {
          // If filtering by school (Admin view), exclude super_admin and admin users
          // But include branch_admin users
          where.role = { [Op.notIn]: ['super_admin', 'admin'] };
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

        // Apply branch filter if provided
        if (branch_id) {
          where.branch_id = branch_id;
        }

        const { count, rows } = await User.findAndCountAll({
          where,
          include: [
            {
              model: School,
              as: 'school',
              attributes: ['id', 'name', 'code', 'logo']
            },
            {
              model: Branch,
              as: 'branch',
              attributes: ['id', 'name', 'code']
            }
          ],
          attributes: { exclude: ['password'] },
          order: [['created_at', 'DESC']],
          limit,
          offset
        });

        // Use base service for pagination response
        return BaseService.buildPaginationResponse(rows, page, limit, count, 'users');
      },
      300
    );
  }

  static async getUserById(id, currentUser) {
    const cacheKey = `user:${id}`;

    return BaseService.getFromCache(
      cacheKey,
      async () => {
        const user = await User.findByPk(id, {
          include: [
            {
              model: School,
              as: 'school',
              attributes: ['id', 'name', 'code', 'status', 'logo']
            },
            {
              model: Branch,
              as: 'branch',
              attributes: ['id', 'name', 'code', 'status']
            }
          ],
          attributes: { exclude: ['password'] }
        });

        if (!user) {
          throw new ApiError(404, 'User not found');
        }

        // Use RoleManager for access control
        if (!RoleManager.canAccessUser(currentUser, user)) {
          throw new ApiError(403, 'Access denied');
        }

        return user;
      },
      600
    );
  }

  static async updateUser(id, updateData, currentUser) {
    return BaseService.executeWithErrorHandling(async () => {
      const user = await BaseService.validateEntityExists(User, id, 'User');

      // Use RoleManager for access control
      if (!RoleManager.canAccessUser(currentUser, user)) {
        throw new ApiError(403, 'Access denied');
      }

      await user.update(updateData);

      // Clear related caches using base service
      const cacheKeys = [`user:${id}`, 'cache:users:list'];

      // Clear all user list caches to ensure updated users appear
      const keys = await RedisUtils.keys('users:list:*');
      if (keys && keys.length > 0) {
        cacheKeys.push(...keys);
      }

      // Clear school-specific user caches
      const schoolKeys = await RedisUtils.keys('users:school:*');
      if (schoolKeys && schoolKeys.length > 0) {
        cacheKeys.push(...schoolKeys);
      }

      // Clear branch-specific user caches
      const branchKeys = await RedisUtils.keys('users:branch:*');
      if (branchKeys && branchKeys.length > 0) {
        cacheKeys.push(...branchKeys);
      }

      if (user.school_id) {
        cacheKeys.push(`school:${user.school_id}`, 'cache:schools:list');
      }

      await BaseService.clearCache(cacheKeys);

      return user;
    }, 'UserService.updateUser');
  }

  static async deleteUser(id, currentUser) {
    return BaseService.executeWithErrorHandling(async () => {
      const user = await BaseService.validateEntityExists(User, id, 'User');

      // Use RoleManager for access control
      if (!RoleManager.canAccessUser(currentUser, user)) {
        throw new ApiError(403, 'Access denied');
      }

      await user.destroy();

      // Clear related caches using base service
      const cacheKeys = [`user:${id}`, 'cache:users:list'];

      // Clear all user list caches to ensure deleted users are removed
      const keys = await RedisUtils.keys('users:list:*');
      if (keys && keys.length > 0) {
        cacheKeys.push(...keys);
      }

      // Clear school-specific user caches
      const schoolKeys = await RedisUtils.keys('users:school:*');
      if (schoolKeys && schoolKeys.length > 0) {
        cacheKeys.push(...schoolKeys);
      }

      // Clear branch-specific user caches
      const branchKeys = await RedisUtils.keys('users:branch:*');
      if (branchKeys && branchKeys.length > 0) {
        cacheKeys.push(...branchKeys);
      }

      if (user.school_id) {
        cacheKeys.push(`school:${user.school_id}`, 'cache:schools:list');
      }

      await BaseService.clearCache(cacheKeys);

      return true;
    }, 'UserService.deleteUser');
  }

  static async getUsersBySchool(schoolId, { page = 1, limit = 10, search, role, status }) {
    const cacheKey = `users:school:${schoolId}:${page}:${limit}:${search || 'all'}:${role || 'all'}:${status || 'all'}`;

    return BaseService.getFromCache(
      cacheKey,
      async () => {
        const { offset } = BaseService.sanitizePaginationParams({
          page,
          limit
        });
        const where = { school_id: schoolId };

        // Use base service for search filter
        if (search) {
          where[Op.or] = [
            { first_name: { [Op.iLike]: `%${search}%` } },
            { last_name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
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
              attributes: ['id', 'name', 'code']
            }
          ],
          attributes: { exclude: ['password'] },
          order: [['created_at', 'DESC']],
          limit,
          offset
        });

        // Use base service for pagination response
        return BaseService.buildPaginationResponse(rows, page, limit, count, 'users');
      },
      300
    );
  }

  static async getUsersByBranch(
    branchId,
    { page = 1, limit = 10, search, role, status },
    currentUser
  ) {
    const cacheKey = `users:branch:${branchId}:${page}:${limit}:${search || 'all'}:${role || 'all'}:${status || 'all'}`;

    return BaseService.getFromCache(
      cacheKey,
      async () => {
        const { offset } = BaseService.sanitizePaginationParams({
          page,
          limit
        });
        const where = { branch_id: branchId };

        // Use base service for search filter
        if (search) {
          where[Op.or] = [
            { first_name: { [Op.iLike]: `%${search}%` } },
            { last_name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
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
          offset
        });

        // Use base service for pagination response
        return BaseService.buildPaginationResponse(rows, page, limit, count, 'users');
      },
      300
    );
  }

  // Change user password
  static async changePassword(userId, currentPassword, newPassword) {
    return BaseService.executeWithErrorHandling(async () => {
      const user = await BaseService.validateEntityExists(User, userId, 'User');

      // Verify current password
      const isMatch = await user.isPasswordMatch(currentPassword);
      if (!isMatch) {
        throw new ApiError(400, 'Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await user.update({ password: hashedPassword });

      // Clear user cache using base service
      await BaseService.clearCache(`user:${userId}`);

      return true;
    }, 'UserService.changePassword');
  }
}

module.exports = UserService;
