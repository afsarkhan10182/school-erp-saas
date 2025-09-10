const { ExamStatus } = require('~/models');
const BaseService = require('~/services/shared/base.service');
const ApiError = require('~/utils/ApiError');
const { Op } = require('sequelize');

class ExamStatusService extends BaseService {
  /**
   * Get active exam statuses
   */
  static async getActiveExamStatuses(user) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      const examStatuses = await ExamStatus.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'description', 'color'],
        order: [['name', 'ASC']]
      });

      return {
        success: true,
        data: examStatuses
      };
    }, 'Get Active Exam Statuses');
  }

  /**
   * Get exam statuses for dropdown
   */
  static async getExamStatusesForDropdown(user) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      const examStatuses = await ExamStatus.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code'],
        order: [['name', 'ASC']]
      });

      return {
        success: true,
        data: examStatuses
      };
    }, 'Get Exam Statuses For Dropdown');
  }

  /**
   * Get all exam statuses with pagination and filtering
   */
  static async getAllExamStatuses(params, user) {
    return this.executeWithErrorHandling(async () => {
      const { page = 1, limit = 10, search, is_active } = params;
      const offset = (page - 1) * limit;

      const whereClause = {
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (is_active !== undefined) {
        whereClause.is_active = is_active === 'true';
      }

      const { count, rows } = await ExamStatus.findAndCountAll({
        where: whereClause,
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return {
        success: true,
        data: {
          examStatuses: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages
          }
        }
      };
    }, 'Get All Exam Statuses');
  }

  /**
   * Get exam status by ID
   */
  static async getExamStatusById(id, user) {
    return this.executeWithErrorHandling(async () => {
      const examStatus = await ExamStatus.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!examStatus) {
        throw new ApiError(404, 'Exam status not found');
      }

      return {
        success: true,
        data: examStatus
      };
    }, 'Get Exam Status By ID');
  }

  /**
   * Create new exam status
   */
  static async createExamStatus(examStatusData, userId) {
    return this.executeWithErrorHandling(async () => {
      // Check for duplicate name/code in same school
      const existingStatus = await ExamStatus.findOne({
        where: {
          school_id: examStatusData.school_id,
          [Op.or]: [{ name: examStatusData.name }, { code: examStatusData.code }]
        }
      });

      if (existingStatus) {
        throw new ApiError(400, 'An exam status with this name or code already exists');
      }

      const examStatus = await ExamStatus.create({
        ...examStatusData,
        created_by: userId,
        updated_by: userId
      });

      return {
        success: true,
        data: examStatus
      };
    }, 'Create Exam Status');
  }

  /**
   * Update exam status
   */
  static async updateExamStatus(id, examStatusData, userId) {
    return this.executeWithErrorHandling(async () => {
      const examStatus = await ExamStatus.findOne({
        where: {
          id,
          school_id: examStatusData.school_id
        }
      });

      if (!examStatus) {
        throw new ApiError(404, 'Exam status not found');
      }

      // Check for duplicate name/code in same school (excluding current record)
      if (examStatusData.name || examStatusData.code) {
        const existingStatus = await ExamStatus.findOne({
          where: {
            school_id: examStatusData.school_id,
            id: { [Op.ne]: id },
            [Op.or]: [
              ...(examStatusData.name ? [{ name: examStatusData.name }] : []),
              ...(examStatusData.code ? [{ code: examStatusData.code }] : [])
            ]
          }
        });

        if (existingStatus) {
          throw new ApiError(400, 'An exam status with this name or code already exists');
        }
      }

      await examStatus.update({
        ...examStatusData,
        updated_by: userId
      });

      return {
        success: true,
        data: examStatus
      };
    }, 'Update Exam Status');
  }

  /**
   * Delete exam status
   */
  static async deleteExamStatus(id, user) {
    return this.executeWithErrorHandling(async () => {
      const examStatus = await ExamStatus.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!examStatus) {
        throw new ApiError(404, 'Exam status not found');
      }

      // Check if status is being used by any exams
      const { Exam } = require('~/models');
      const examCount = await Exam.count({
        where: { status_id: id }
      });

      if (examCount > 0) {
        throw new ApiError(400, 'Cannot delete exam status as it is being used by existing exams');
      }

      await examStatus.destroy();

      return {
        success: true,
        data: { message: 'Exam status deleted successfully' }
      };
    }, 'Delete Exam Status');
  }
}

module.exports = ExamStatusService;
