const { User, School, Branch } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');

class UserService {
  // Create a new user
  static async createUser(userData) {
    try {
      // Hash password if provided
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      // Verify school exists if school_id is provided
      if (userData.school_id) {
        const school = await School.findByPk(userData.school_id);
        if (!school || school.status !== 'active') {
          throw new ApiError(400, 'Invalid or inactive school');
        }
      }

      // Verify branch exists if branch_id is provided
      if (userData.branch_id) {
        const branch = await Branch.findByPk(userData.branch_id);
        if (!branch || branch.status !== 'active') {
          throw new ApiError(400, 'Invalid or inactive branch');
        }
        
        // Ensure branch belongs to the same school
        if (userData.school_id && branch.school_id !== userData.school_id) {
          throw new ApiError(400, 'Branch does not belong to the specified school');
        }
      }

      const user = await User.create(userData);
      
      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      logger.info(`User created: ${user.email} (${user.id})`);
      return userResponse;
    } catch (error) {
      logger.error('Error in UserService.createUser:', error);
      throw error;
    }
  }

  // Get all users with pagination and filtering
  static async getAllUsers({ page = 1, limit = 10, search, role, status, school_id }) {
    try {
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

      return {
        users: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error in UserService.getAllUsers:', error);
      throw error;
    }
  }

  // Get user by ID with access control
  static async getUserById(id, currentUser) {
    try {
      const user = await User.findByPk(id, {
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
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Access control: School Admin can only access users in their school
      if (currentUser.role === 'school_admin' && currentUser.school_id !== user.school_id) {
        throw new ApiError(403, 'Access denied');
      }

      // Access control: Branch Admin can only access users in their branch
      if (currentUser.role === 'branch_admin' && currentUser.branch_id !== user.branch_id) {
        throw new ApiError(403, 'Access denied');
      }

      return user;
    } catch (error) {
      logger.error('Error in UserService.getUserById:', error);
      throw error;
    }
  }

  // Update user
  static async updateUser(id, updateData, currentUser) {
    try {
      const user = await User.findByPk(id);
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Access control: School Admin can only update users in their school
      if (currentUser.role === 'school_admin' && currentUser.school_id !== user.school_id) {
        throw new ApiError(403, 'Access denied');
      }

      // Access control: Branch Admin can only update users in their branch
      if (currentUser.role === 'branch_admin' && currentUser.branch_id !== user.branch_id) {
        throw new ApiError(403, 'Access denied');
      }

      // Hash password if provided
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }

      await user.update(updateData);
      
      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      logger.info(`User updated: ${user.email} (${user.id})`);
      return userResponse;
    } catch (error) {
      logger.error('Error in UserService.updateUser:', error);
      throw error;
    }
  }

  // Delete user (soft delete)
  static async deleteUser(id, currentUser) {
    try {
      const user = await User.findByPk(id);
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Access control: School Admin can only delete users in their school
      if (currentUser.role === 'school_admin' && currentUser.school_id !== user.school_id) {
        throw new ApiError(403, 'Access denied');
      }

      // Prevent self-deletion
      if (currentUser.id === id) {
        throw new ApiError(400, 'Cannot delete your own account');
      }

      // Soft delete by setting status to inactive
      await user.update({ status: 'inactive' });
      
      logger.info(`User deleted: ${user.email} (${user.id})`);
      return true;
    } catch (error) {
      logger.error('Error in UserService.deleteUser:', error);
      throw error;
    }
  }

  // Get users by school
  static async getUsersBySchool(schoolId, { page = 1, limit = 10, search, role, status }) {
    try {
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

      return {
        users: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error in UserService.getUsersBySchool:', error);
      throw error;
    }
  }

  // Get users by branch
  static async getUsersByBranch(branchId, { page = 1, limit = 10, search, role, status }, currentUser) {
    try {
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

      // Access control: Branch Admin can only access users in their branch
      if (currentUser.role === 'branch_admin' && currentUser.branch_id !== branchId) {
        throw new ApiError(403, 'Access denied');
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      return {
        users: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error in UserService.getUsersByBranch:', error);
      throw error;
    }
  }
}

module.exports = UserService; 