const { Branch, School, User } = require('../../models');
const { Op } = require('sequelize');
const ApiError = require('../../utils/ApiError');
const { logger } = require('../../utils/logger');
const { RoleManager, ROLES } = require('../../utils/roleManager');

class BranchService {
  // Create a new branch
  static async createBranch(branchData) {
    try {
      // Handle file uploads and settings
      const { system_logo, text_logo, printing_logo, report_card_design, currency, currency_symbol, ...basicData } = branchData;
      
      // Prepare settings object
      const settings = {
        currency: currency || 'INR',
        currency_symbol: currency_symbol || '₹',
        system_logo: system_logo ? `/uploads/${system_logo.filename}` : null,
        text_logo: text_logo ? `/uploads/${text_logo.filename}` : null,
        printing_logo: printing_logo ? `/uploads/${printing_logo.filename}` : null,
        report_card_design: report_card_design ? `/uploads/${report_card_design.filename}` : null
      };

      const branch = await Branch.create({
        ...basicData,
        settings
      });

      logger.info(`Branch created: ${branch.name} (${branch.id})`);
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

      // Use RoleManager for access control
      if (!RoleManager.canAccessBranch(user.role, user.school_id, user.branch_id, branch.school_id, branch.id)) {
        throw new ApiError(403, 'Access denied');
      }

      return branch;
    } catch (error) {
      logger.error('Error in BranchService.getBranchById:', error);
      throw error;
    }
  }

  // Update branch
  static async updateBranch(id, updateData, user) {
    try {
      const branch = await Branch.findByPk(id);
      
      if (!branch) {
        throw new ApiError(404, 'Branch not found');
      }

      // Use RoleManager for access control
      if (!RoleManager.canAccessBranch(user.role, user.school_id, user.branch_id, branch.school_id, branch.id)) {
        throw new ApiError(403, 'Access denied - You can only update branches you have access to');
      }

      // Handle file uploads and settings
      const { system_logo, text_logo, printing_logo, report_card_design, currency, currency_symbol, ...basicData } = updateData;
      
      // Update settings if new values are provided
      const currentSettings = branch.settings || {};
      const newSettings = {
        ...currentSettings,
        ...(currency && { currency }),
        ...(currency_symbol && { currency_symbol }),
        ...(system_logo && { system_logo: `/uploads/${system_logo.filename}` }),
        ...(text_logo && { text_logo: `/uploads/${text_logo.filename}` }),
        ...(printing_logo && { printing_logo: `/uploads/${printing_logo.filename}` }),
        ...(report_card_design && { report_card_design: `/uploads/${report_card_design.filename}` })
      };

      await branch.update({
        ...basicData,
        settings: newSettings
      });
      
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