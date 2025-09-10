const { Op } = require('sequelize');
const { ExamType, Exam, School } = require('~/models');
const BaseService = require('~/services/shared/base.service');
const ApiError = require('~/utils/ApiError');
const { logger } = require('~/utils/logger');

class ExamTypeService extends BaseService {
  /**
   * Create a new exam type
   */
  static async createExamType(examTypeData, userId) {
    return this.executeWithErrorHandling(async () => {
      // Check for duplicate exam type code in the same school
      const existingExamType = await ExamType.findOne({
        where: {
          school_id: examTypeData.school_id,
          code: examTypeData.code,
          is_active: true
        }
      });

      if (existingExamType) {
        throw new ApiError(400, 'Exam type with this code already exists');
      }

      const examType = await ExamType.create({
        ...examTypeData,
        created_by: userId,
        updated_by: userId
      });

      return examType;
    }, 'Create Exam Type');
  }

  /**
   * Get all exam types with pagination and filtering
   */
  static async getAllExamTypes(params, user) {
    return this.executeWithErrorHandling(async () => {
      const { page = 1, limit = 10, search, is_active, branch_id } = params;
      const offset = (page - 1) * limit;

      const whereClause = {
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      // Add filters
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (is_active !== '') whereClause.is_active = is_active === 'true';
      if (branch_id) whereClause.branch_id = branch_id;

      const { count, rows } = await ExamType.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return {
        exam_types: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages
        }
      };
    }, 'Get All Exam Types');
  }

  /**
   * Get exam type by ID
   */
  static async getExamTypeById(id, user) {
    return this.executeWithErrorHandling(async () => {
      const examType = await ExamType.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        },
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      if (!examType) {
        throw new ApiError(404, 'Exam type not found');
      }

      return examType;
    }, 'Get Exam Type By ID');
  }

  /**
   * Update exam type
   */
  static async updateExamType(id, updateData, user) {
    return this.executeWithErrorHandling(async () => {
      const examType = await ExamType.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!examType) {
        throw new ApiError(404, 'Exam type not found');
      }

      // Check for duplicate exam type code if code is being updated
      if (updateData.code && updateData.code !== examType.code) {
        const existingExamType = await ExamType.findOne({
          where: {
            school_id: user.school_id,
            code: updateData.code,
            id: { [Op.ne]: id },
            is_active: true
          }
        });

        if (existingExamType) {
          throw new ApiError(400, 'Exam type with this code already exists');
        }
      }

      await examType.update({
        ...updateData,
        updated_by: user.id
      });

      return examType;
    }, 'Update Exam Type');
  }

  /**
   * Delete exam type
   */
  static async deleteExamType(id, user) {
    return this.executeWithErrorHandling(async () => {
      const examType = await ExamType.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!examType) {
        throw new ApiError(404, 'Exam type not found');
      }

      // Check if exam type is used in any exams
      const examUsage = await Exam.count({
        where: { exam_type_id: id }
      });

      if (examUsage > 0) {
        throw new ApiError(400, 'Cannot delete exam type as it is used in exams');
      }

      await examType.destroy();

      return { message: 'Exam type deleted successfully' };
    }, 'Delete Exam Type');
  }

  /**
   * Get exam types for dropdown (active exam types only)
   */
  static async getExamTypesForDropdown(user, filters = {}) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      // Apply additional filters
      if (filters.category) whereClause.category = filters.category;

      const examTypes = await ExamType.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'description', 'category'],
        order: [['name', 'ASC']]
      });

      return examTypes;
    }, 'Get Exam Types For Dropdown');
  }

  /**
   * Get active exam types
   */
  static async getActiveExamTypes(user) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      const examTypes = await ExamType.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'description'],
        order: [['name', 'ASC']]
      });

      return examTypes;
    }, 'Get Active Exam Types');
  }

  /**
   * Get exam type statistics
   */
  static async getExamTypeStats(user) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      const [totalExamTypes, activeExamTypes, examTypesByCategory] = await Promise.all([
        ExamType.count({ where: whereClause }),
        ExamType.count({ where: { ...whereClause, is_active: true } }),
        ExamType.findAll({
          where: whereClause,
          attributes: [[ExamType.sequelize.fn('COUNT', ExamType.sequelize.col('id')), 'count']],
          raw: true
        })
      ]);

      return {
        total_exam_types: totalExamTypes,
        active_exam_types: activeExamTypes,
        exam_types_by_category: examTypesByCategory
      };
    }, 'Get Exam Type Stats');
  }

  /**
   * Bulk create exam types
   */
  static async bulkCreateExamTypes(examTypesData, userId) {
    return this.executeWithErrorHandling(async () => {
      const results = [];

      for (const examTypeData of examTypesData) {
        try {
          const examType = await this.createExamType(examTypeData, userId);
          results.push({
            success: true,
            data: examType,
            name: examTypeData.name
          });
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            name: examTypeData.name
          });
        }
      }

      return results;
    }, 'Bulk Create Exam Types');
  }

  /**
   * Search exam types
   */
  static async searchExamTypes(searchTerm, user, limit = 10) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id }),
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { code: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      };

      const examTypes = await ExamType.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'description'],
        order: [['name', 'ASC']],
        limit: parseInt(limit)
      });

      return examTypes;
    }, 'Search Exam Types');
  }
}

module.exports = ExamTypeService;
