const { Op } = require('sequelize');
const { ExamHall, School, Branch, User } = require('~/models');
const BaseService = require('~/services/shared/base.service');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');

class ExamHallService extends BaseService {
  /**
   * Create exam hall
   */
  static async createExamHall(hallData, userId) {
    return this.executeWithErrorHandling(async () => {
      // Check for duplicate name in same school
      const existing = await ExamHall.findOne({
        where: {
          name: hallData.name,
          school_id: hallData.school_id
        }
      });

      if (existing) {
        throw new ApiError(400, 'Exam hall with this name already exists in this school');
      }

      const hall = await ExamHall.create({
        ...hallData,
        created_by: userId,
        updated_by: userId
      });

      return hall;
    }, 'Create Exam Hall');
  }

  /**
   * Get all exam halls with filtering
   */
  static async getAllExamHalls(params, user) {
    return this.executeWithErrorHandling(async () => {
      const { page = 1, limit = 10, search, branch_id, is_active } = params;
      const offset = (page - 1) * limit;

      const whereClause = {
        school_id: user.school_id
      };

      // Add filters
      if (is_active !== undefined) whereClause.is_active = is_active === 'true';

      if (search) {
        whereClause[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }];
      }

      const { count, rows } = await ExamHall.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name'],
            required: false // LEFT JOIN since branch_id can be null
          }
        ],
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return {
        halls: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      };
    }, 'Get All Exam Halls');
  }

  /**
   * Get exam hall by ID
   */
  static async getExamHallById(id, user) {
    return this.executeWithErrorHandling(async () => {
      const hall = await ExamHall.findOne({
        where: {
          id,
          school_id: user.school_id
        },
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
            required: false // LEFT JOIN since branch_id can be null
          }
        ]
      });

      if (!hall) {
        throw new ApiError(404, 'Exam hall not found');
      }

      return hall;
    }, 'Get Exam Hall By ID');
  }

  /**
   * Update exam hall
   */
  static async updateExamHall(id, updateData, user) {
    return this.executeWithErrorHandling(async () => {
      const hall = await ExamHall.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!hall) {
        throw new ApiError(404, 'Exam hall not found');
      }

      // Check for duplicate name if name is being updated
      if (updateData.name && updateData.name !== hall.name) {
        const existing = await ExamHall.findOne({
          where: {
            name: updateData.name,
            school_id: hall.school_id,
            id: { [Op.ne]: id }
          }
        });

        if (existing) {
          throw new ApiError(400, 'Exam hall with this name already exists in this school');
        }
      }

      await hall.update({
        ...updateData,
        updated_by: user.id
      });

      return hall;
    }, 'Update Exam Hall');
  }

  /**
   * Delete exam hall
   */
  static async deleteExamHall(id, user) {
    return this.executeWithErrorHandling(async () => {
      const hall = await ExamHall.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!hall) {
        throw new ApiError(404, 'Exam hall not found');
      }

      await hall.destroy();

      return { message: 'Exam hall deleted successfully' };
    }, 'Delete Exam Hall');
  }

  /**
   * Get exam halls for dropdown
   */
  static async getExamHallsForDropdown(user, branchId = null) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        is_active: true
      };

      const halls = await ExamHall.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'capacity'],
        order: [['name', 'ASC']]
      });

      return halls;
    }, 'Get Exam Halls For Dropdown');
  }

  /**
   * Check hall availability for a specific date and time
   */
  static async checkHallAvailability(
    hallId,
    examDate,
    startTime,
    endTime,
    excludeScheduleId = null
  ) {
    return this.executeWithErrorHandling(async () => {
      const { ExamSchedule } = require('~/models');

      const whereClause = {
        exam_hall_id: hallId,
        exam_date: examDate,
        is_active: true
      };

      if (excludeScheduleId) {
        whereClause.id = { [Op.ne]: excludeScheduleId };
      }

      if (startTime && endTime) {
        whereClause[Op.or] = [
          {
            start_time: {
              [Op.between]: [startTime, endTime]
            }
          },
          {
            end_time: {
              [Op.between]: [startTime, endTime]
            }
          },
          {
            [Op.and]: [{ start_time: { [Op.lte]: startTime } }, { end_time: { [Op.gte]: endTime } }]
          }
        ];
      }

      const conflictingSchedules = await ExamSchedule.findAll({
        where: whereClause,
        include: [
          {
            model: require('~/models').Exam,
            as: 'exam',
            attributes: ['id', 'name']
          }
        ]
      });

      return {
        available: conflictingSchedules.length === 0,
        conflicts: conflictingSchedules
      };
    }, 'Check Hall Availability');
  }
}

module.exports = ExamHallService;
