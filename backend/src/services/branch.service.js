const { Branch, School, User } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');

class BranchService {
  // Create a new branch
  static async createBranch(branchData) {
    try {
      // Verify school exists and is active
      const school = await School.findByPk(branchData.school_id);
      if (!school || school.status !== 'active') {
        throw new ApiError(400, 'Invalid or inactive school');
      }

      // ENFORCE max_branches
      const activeBranchCount = await Branch.count({
        where: { school_id: school.id, status: 'active' }
      });
      if (activeBranchCount >= school.max_branches) {
        throw new ApiError(400, `Branch limit reached for this school (max: ${school.max_branches})`);
      }

      const branch = await Branch.create(branchData);
      
      logger.info(`Branch created: ${branch.name} (${branch.id}) for school: ${school.name}`);
      return branch;
    } catch (error) {
      logger.error('Error in BranchService.createBranch:', error);
      throw error;
    }
  }

  // Get all branches with pagination and filtering
  static async getAllBranches({ page = 1, limit = 10, search, status, school_id }) {
    try {
      const offset = (page - 1) * limit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (school_id) {
        where.school_id = school_id;
      }

      const { count, rows } = await Branch.findAndCountAll({
        where,
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name', 'email'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      return {
        branches: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error in BranchService.getAllBranches:', error);
      throw error;
    }
  }

  // Get branch by ID with access control
  static async getBranchById(id, user) {
    try {
      const branch = await Branch.findByPk(id, {
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code', 'status'],
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name', 'email'],
          },
        ],
      });

      if (!branch) {
        throw new ApiError(404, 'Branch not found');
      }

      // Access control: School Admin can only access branches in their school
      if (user.role === 'school_admin' && user.school_id !== branch.school_id) {
        throw new ApiError(403, 'Access denied');
      }

      // Access control: Branch Admin can only access their own branch
      if (user.role === 'branch_admin' && user.branch_id !== id) {
        throw new ApiError(403, 'Access denied');
      }

      return branch;
    } catch (error) {
      logger.error('Error in BranchService.getBranchById:', error);
      throw error;
    }
  }

  // Update branch
  static async updateBranch(id, updateData) {
    try {
      const branch = await Branch.findByPk(id);
      
      if (!branch) {
        throw new ApiError(404, 'Branch not found');
      }

      await branch.update(updateData);
      
      logger.info(`Branch updated: ${branch.name} (${branch.id})`);
      return branch;
    } catch (error) {
      logger.error('Error in BranchService.updateBranch:', error);
      throw error;
    }
  }

  // Delete branch (soft delete)
  static async deleteBranch(id) {
    try {
      const branch = await Branch.findByPk(id);
      
      if (!branch) {
        throw new ApiError(404, 'Branch not found');
      }

      // Check if branch has active users
      const activeUsers = await User.count({
        where: { branch_id: id, status: 'active' },
      });

      if (activeUsers > 0) {
        throw new ApiError(400, 'Cannot delete branch with active users');
      }

      // Soft delete by setting status to inactive
      await branch.update({ status: 'inactive' });
      
      logger.info(`Branch deleted: ${branch.name} (${branch.id})`);
      return true;
    } catch (error) {
      logger.error('Error in BranchService.deleteBranch:', error);
      throw error;
    }
  }

  // Get branches by school
  static async getBranchesBySchool(schoolId, { page = 1, limit = 10, search, status }) {
    try {
      const offset = (page - 1) * limit;
      const where = { school_id: schoolId };

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status) {
        where.status = status;
      }

      const { count, rows } = await Branch.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name', 'email'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      return {
        branches: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error in BranchService.getBranchesBySchool:', error);
      throw error;
    }
  }

  // Get branch statistics
  static async getBranchStats(branchId) {
    try {
      const userCount = await User.count({ where: { branch_id: branchId } });

      return {
        totalUsers: userCount,
      };
    } catch (error) {
      logger.error('Error in BranchService.getBranchStats:', error);
      throw error;
    }
  }
}

module.exports = BranchService; 