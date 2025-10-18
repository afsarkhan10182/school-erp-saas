const { Op, Sequelize } = require('sequelize');
const {
  ExamSchedule,
  Exam,
  ExamHall,
  ExamStatus,
  User,
  Class,
  Section,
  Subject,
  ExamType
} = require('~/models');
const BaseService = require('~/services/shared/base.service');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');

class ExamScheduleService extends BaseService {
  /**
   * Create exam schedule
   */
  static async createExamSchedule(scheduleData, userId) {
    return this.executeWithErrorHandling(async () => {
      // Validate exam exists
      const exam = await Exam.findByPk(scheduleData.exam_id);
      if (!exam) {
        throw new ApiError(404, 'Exam not found');
      }

      // Validate exam hall if provided
      if (scheduleData.exam_hall_id) {
        await this.validateEntityExists(ExamHall, scheduleData.exam_hall_id, 'Exam Hall');
      }

      // Validate invigilator if provided
      if (scheduleData.invigilator_id) {
        await this.validateEntityExists(User, scheduleData.invigilator_id, 'Invigilator');
      }

      // Validate class if provided
      if (scheduleData.class_id) {
        await this.validateEntityExists(Class, scheduleData.class_id, 'Class');
      }

      // Validate section if provided
      if (scheduleData.section_id) {
        await this.validateEntityExists(Section, scheduleData.section_id, 'Section');
      }

      // Validate subject if provided
      if (scheduleData.subject_id) {
        await this.validateEntityExists(Subject, scheduleData.subject_id, 'Subject');
      }

      // Validate status
      await this.validateEntityExists(ExamStatus, scheduleData.status_id, 'Exam Status');

      // Check for scheduling conflicts (same hall, overlapping time)
      if (scheduleData.exam_hall_id && scheduleData.start_time && scheduleData.end_time) {
        const conflict = await ExamSchedule.findOne({
          where: {
            exam_hall_id: scheduleData.exam_hall_id,
            exam_date: scheduleData.exam_date,
            is_active: true,
            [Op.or]: [
              {
                start_time: {
                  [Op.between]: [scheduleData.start_time, scheduleData.end_time]
                }
              },
              {
                end_time: {
                  [Op.between]: [scheduleData.start_time, scheduleData.end_time]
                }
              },
              {
                [Op.and]: [
                  { start_time: { [Op.lte]: scheduleData.start_time } },
                  { end_time: { [Op.gte]: scheduleData.end_time } }
                ]
              }
            ]
          }
        });

        if (conflict) {
          throw new ApiError(400, 'Exam hall is already booked for this time slot');
        }
      }

      // Calculate duration if start and end time provided
      if (scheduleData.start_time && scheduleData.end_time && !scheduleData.duration_minutes) {
        const start = new Date(`2000-01-01 ${scheduleData.start_time}`);
        const end = new Date(`2000-01-01 ${scheduleData.end_time}`);
        scheduleData.duration_minutes = Math.round((end - start) / 60000);
      }

      const schedule = await ExamSchedule.create({
        ...scheduleData,
        created_by: userId,
        updated_by: userId
      });

      return await this.getExamScheduleById(schedule.id);
    }, 'Create Exam Schedule');
  }

  /**
   * Get all exam schedules with filtering
   */
  static async getAllExamSchedules(params, user) {
    return this.executeWithErrorHandling(async () => {
      const {
        page = 1,
        limit = 10,
        search,
        exam_id,
        branch_id,
        exam_hall_id,
        status_id,
        date_from,
        date_to,
        invigilator_id
      } = params;
      const offset = (page - 1) * limit;

      const whereClause = {
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      // Add filters
      if (exam_id) whereClause.exam_id = exam_id;
      if (branch_id) whereClause.branch_id = branch_id;
      if (exam_hall_id) whereClause.exam_hall_id = exam_hall_id;
      if (status_id) whereClause.status_id = status_id;
      if (invigilator_id) whereClause.invigilator_id = invigilator_id;

      if (date_from && date_to) {
        whereClause.exam_date = {
          [Op.between]: [date_from, date_to]
        };
      } else if (date_from) {
        whereClause.exam_date = { [Op.gte]: date_from };
      } else if (date_to) {
        whereClause.exam_date = { [Op.lte]: date_to };
      }

      if (search) {
        whereClause[Op.or] = [
          { '$exam.name$': { [Op.iLike]: `%${search}%` } },
          { '$class.name$': { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await ExamSchedule.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Exam,
            as: 'exam',
            attributes: ['id', 'name', 'description', 'academic_year']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Section,
            as: 'section',
            attributes: ['id', 'name']
          },
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: ExamHall,
            as: 'examHall',
            attributes: ['id', 'name', 'code', 'capacity']
          },
          {
            model: User,
            as: 'invigilator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: ExamStatus,
            as: 'status',
            attributes: ['id', 'name', 'code', 'color']
          }
        ],
        order: [
          ['exam_date', 'ASC'],
          ['start_time', 'ASC']
        ],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return {
        schedules: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages
        }
      };
    }, 'Get All Exam Schedules');
  }

  /**
   * Get exam schedule by ID
   */
  static async getExamScheduleById(id, user = null) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = { id };
      if (user) {
        whereClause.school_id = user.school_id;
        if (user.role === 'branch_admin') {
          whereClause.branch_id = user.branch_id;
        }
      }

      const schedule = await ExamSchedule.findOne({
        where: whereClause,
        include: [
          {
            model: Exam,
            as: 'exam',
            include: [
              {
                model: Class,
                as: 'class',
                attributes: ['id', 'name', 'code']
              },
              {
                model: Section,
                as: 'section',
                attributes: ['id', 'name']
              },
              {
                model: Subject,
                as: 'subject',
                attributes: ['id', 'name', 'code']
              },
              {
                model: ExamType,
                as: 'examType',
                attributes: ['id', 'name', 'code']
              }
            ]
          },
          {
            model: ExamHall,
            as: 'examHall'
          },
          {
            model: User,
            as: 'invigilator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: ExamStatus,
            as: 'status'
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Section,
            as: 'section',
            attributes: ['id', 'name']
          },
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      if (!schedule) {
        throw new ApiError(404, 'Exam schedule not found');
      }

      return schedule;
    }, 'Get Exam Schedule By ID');
  }

  /**
   * Update exam schedule
   */
  static async updateExamSchedule(id, updateData, user) {
    return this.executeWithErrorHandling(async () => {
      const schedule = await ExamSchedule.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!schedule) {
        throw new ApiError(404, 'Exam schedule not found');
      }

      // Check for conflicts if updating hall or time
      if (
        (updateData.exam_hall_id || updateData.start_time || updateData.end_time) &&
        updateData.exam_hall_id &&
        updateData.start_time &&
        updateData.end_time
      ) {
        const hallId = updateData.exam_hall_id || schedule.exam_hall_id;
        const startTime = updateData.start_time || schedule.start_time;
        const endTime = updateData.end_time || schedule.end_time;
        const examDate = updateData.exam_date || schedule.exam_date;

        const conflict = await ExamSchedule.findOne({
          where: {
            id: { [Op.ne]: id },
            exam_hall_id: hallId,
            exam_date: examDate,
            is_active: true,
            [Op.or]: [
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
                [Op.and]: [
                  { start_time: { [Op.lte]: startTime } },
                  { end_time: { [Op.gte]: endTime } }
                ]
              }
            ]
          }
        });

        if (conflict) {
          throw new ApiError(400, 'Exam hall is already booked for this time slot');
        }
      }

      // If rescheduling, store original date
      if (updateData.exam_date && updateData.exam_date !== schedule.exam_date) {
        if (!schedule.is_rescheduled) {
          updateData.is_rescheduled = true;
          updateData.original_date = schedule.exam_date;
        }
      }

      // Recalculate duration if times are updated
      if (updateData.start_time && updateData.end_time) {
        const start = new Date(`2000-01-01 ${updateData.start_time}`);
        const end = new Date(`2000-01-01 ${updateData.end_time}`);
        updateData.duration_minutes = Math.round((end - start) / 60000);
      }

      await schedule.update({
        ...updateData,
        updated_by: user.id
      });

      return await this.getExamScheduleById(id, user);
    }, 'Update Exam Schedule');
  }

  /**
   * Delete exam schedule
   */
  static async deleteExamSchedule(id, user) {
    return this.executeWithErrorHandling(async () => {
      const schedule = await ExamSchedule.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!schedule) {
        throw new ApiError(404, 'Exam schedule not found');
      }

      await schedule.destroy();

      return { message: 'Exam schedule deleted successfully' };
    }, 'Delete Exam Schedule');
  }

  /**
   * Get schedules for a specific exam across all branches
   */
  static async getSchedulesForExam(examId, user) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        exam_id: examId,
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      const schedules = await ExamSchedule.findAll({
        where: whereClause,
        include: [
          {
            model: ExamHall,
            as: 'examHall'
          },
          {
            model: User,
            as: 'invigilator',
            attributes: ['id', 'first_name', 'last_name']
          },
          {
            model: ExamStatus,
            as: 'status'
          }
        ],
        order: [
          ['exam_date', 'ASC'],
          ['start_time', 'ASC']
        ]
      });

      return schedules;
    }, 'Get Schedules For Exam');
  }
}

module.exports = ExamScheduleService;
