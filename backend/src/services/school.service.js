const { School, User, Branch } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');

class SchoolService {
  // Create a new school
  static async createSchool(schoolData) {
    try {
      const school = await School.create(schoolData);
      
      logger.info(`School created: ${school.name} (${school.id})`);
      return school;
    } catch (error) {
      logger.error('Error in SchoolService.createSchool:', error);
      throw error;
    }
  }

  // Get all schools with pagination and filtering
  static async getAllSchools({ page = 1, limit = 10, search, status }) {
    try {
      const offset = (page - 1) * limit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status) {
        where.status = status;
      }

      const { count, rows } = await School.findAndCountAll({
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
        schools: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error in SchoolService.getAllSchools:', error);
      throw error;
    }
  }

  // Get school by ID with access control
  static async getSchoolById(id, user) {
    try {
      const school = await School.findByPk(id, {
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name', 'email'],
          },
          {
            model: Branch,
            as: 'branches',
            attributes: ['id', 'name', 'code', 'status'],
          },
        ],
      });

      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      // Access control: School Admin can only access their own school
      if (user.role === 'school_admin' && user.school_id !== id) {
        throw new ApiError(403, 'Access denied');
      }

      return school;
    } catch (error) {
      logger.error('Error in SchoolService.getSchoolById:', error);
      throw error;
    }
  }

  // Update school
  static async updateSchool(id, updateData) {
    try {
      const school = await School.findByPk(id);
      
      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      await school.update(updateData);
      
      logger.info(`School updated: ${school.name} (${school.id})`);
      return school;
    } catch (error) {
      logger.error('Error in SchoolService.updateSchool:', error);
      throw error;
    }
  }

  // Delete school (soft delete)
  static async deleteSchool(id) {
    try {
      const school = await School.findByPk(id);
      
      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      // Check if school has active users
      const activeUsers = await User.count({
        where: { school_id: id, status: 'active' },
      });

      if (activeUsers > 0) {
        throw new ApiError(400, 'Cannot delete school with active users');
      }

      // Soft delete by setting status to inactive
      await school.update({ status: 'inactive' });
      
      logger.info(`School deleted: ${school.name} (${school.id})`);
      return true;
    } catch (error) {
      logger.error('Error in SchoolService.deleteSchool:', error);
      throw error;
    }
  }

  // Get school statistics
  static async getSchoolStats(schoolId) {
    try {
      const [userCount, branchCount] = await Promise.all([
        User.count({ where: { school_id: schoolId } }),
        Branch.count({ where: { school_id: schoolId } }),
      ]);

      return {
        totalUsers: userCount,
        totalBranches: branchCount,
      };
    } catch (error) {
      logger.error('Error in SchoolService.getSchoolStats:', error);
      throw error;
    }
  }
}

module.exports = SchoolService; 