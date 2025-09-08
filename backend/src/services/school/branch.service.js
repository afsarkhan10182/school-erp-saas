const { Branch, School, User } = require('~/models');
const { Op } = require('sequelize');
const ApiError = require('~/utils/ApiError');
const { logger } = require('~/utils/logger');
const { RoleManager, ROLES } = require('~/utils/roleManager');
const BaseService = require('~/services/shared/base.service');

class BranchService {
  // Create a new branch
  static async createBranch(branchData) {
    return BaseService.executeWithErrorHandling(async () => {
      // Handle file uploads and settings using base service
      const { system_logo, text_logo, printing_logo, report_card_design, currency, currency_symbol, ...basicData } = branchData;
      
      const settings = BaseService.createSettingsFromFiles({ system_logo, text_logo, printing_logo, report_card_design });

      const branch = await Branch.create({
        ...basicData,
        currency: currency || 'INR',
        currency_symbol: currency_symbol || '₹',
        settings
      });

      logger.info(`Branch created: ${branch.name} (${branch.id})`);
      return branch;
    }, 'BranchService.createBranch');
  }

  // Get all branches with pagination and filtering
  static async getAllBranches({ page = 1, limit = 10, search, status, school_id }) {
    return BaseService.executeWithErrorHandling(async () => {
      const { offset } = BaseService.sanitizePaginationParams({ page, limit });
      const where = {};

      // Use base service for search filter
      Object.assign(where, BaseService.buildSearchFilter(search, ['name', 'code']));

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

      // Use base service for pagination response
      return BaseService.buildPaginationResponse(rows, count, page, limit, 'branches');
    }, 'BranchService.getAllBranches');
  }

  // Get branch by ID with access control
  static async getBranchById(id, user) {
    return BaseService.executeWithErrorHandling(async () => {
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
    }, 'BranchService.getBranchById');
  }

  // Update branch
  static async updateBranch(id, updateData, user) {
    return BaseService.executeWithErrorHandling(async () => {
      const branch = await BaseService.validateEntityExists(Branch, id, 'Branch');

      // Use RoleManager for access control
      if (!RoleManager.canAccessBranch(user.role, user.school_id, user.branch_id, branch.school_id, branch.id)) {
        throw new ApiError(403, 'Access denied - You can only update branches you have access to');
      }

      // Handle file uploads and settings using base service
      const { system_logo, text_logo, printing_logo, report_card_design, currency, currency_symbol, ...basicData } = updateData;
      
      // Update settings if new values are provided
      const currentSettings = branch.settings || {};
      const newSettings = {
        ...currentSettings,
        ...(currency && { currency }),
        ...(currency_symbol && { currency_symbol }),
        ...BaseService.createSettingsFromFiles({ system_logo, text_logo, printing_logo, report_card_design })
      };

      await branch.update({
        ...basicData,
        settings: newSettings
      });
      
      logger.info(`Branch updated: ${branch.name} (${branch.id})`);
      return branch;
    }, 'BranchService.updateBranch');
  }

  // Delete branch (soft delete)
  static async deleteBranch(id) {
    return BaseService.executeWithErrorHandling(async () => {
      const branch = await BaseService.validateEntityExists(Branch, id, 'Branch');

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
    }, 'BranchService.deleteBranch');
  }

  // Get branches by school
  static async getBranchesBySchool(schoolId, { page = 1, limit = 10, search, status }) {
    return BaseService.executeWithErrorHandling(async () => {
      const { offset } = BaseService.sanitizePaginationParams({ page, limit });
      const where = { school_id: schoolId };

      // Use base service for search filter
      Object.assign(where, BaseService.buildSearchFilter(search, ['name', 'code']));

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

      // Use base service for pagination response
      return BaseService.buildPaginationResponse(rows, count, page, limit, 'branches');
    }, 'BranchService.getBranchesBySchool');
  }

  // Get branch statistics
  static async getBranchStats(branchId) {
    return BaseService.executeWithErrorHandling(async () => {
      const userCount = await User.count({ where: { branch_id: branchId } });

      return {
        totalUsers: userCount,
      };
    }, 'BranchService.getBranchStats');
  }

  // Get branches for dropdown/select
  static async getBranchesForDropdown(whereClause) {
    return BaseService.executeWithErrorHandling(async () => {
      const branches = await Branch.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'school_id'],
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          },
        ],
        order: [['name', 'ASC']],
      });

      return branches;
    }, 'BranchService.getBranchesForDropdown');
  }
}

module.exports = BranchService; 