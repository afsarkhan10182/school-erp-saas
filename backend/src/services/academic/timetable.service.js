const { Op, Sequelize } = require('sequelize');
const { Timetable, TimetableSlot, Class, Section, Subject, School, User } = require('~/models');
const BaseService = require('~/services/shared/base.service');
const ApiError = require('~/utils/ApiError');
const { logger } = require('~/utils/logger');

class TimetableService extends BaseService {
  /**
   * Create a new timetable
   */
  static async createTimetable(timetableData, userId) {
    return this.executeWithErrorHandling(async () => {
      // Validate class exists
      await this.validateEntityExists(Class, timetableData.class_id, 'Class');
      
      if (timetableData.section_id) {
        await this.validateEntityExists(Section, timetableData.section_id, 'Section');
      }

      // Check for existing timetable for same class/section/academic year
      const existingTimetable = await Timetable.findOne({
        where: {
          school_id: timetableData.school_id,
          class_id: timetableData.class_id,
          section_id: timetableData.section_id || null,
          academic_year: timetableData.academic_year,
          is_active: true
        }
      });

      if (existingTimetable) {
        throw new ApiError(400, 'A timetable already exists for this class/section and academic year');
      }

      const timetable = await Timetable.create({
        ...timetableData,
        created_by: userId,
        updated_by: userId
      });

      return timetable;
    }, 'Create Timetable');
  }

  /**
   * Get all timetables with pagination and filtering
   */
  static async getAllTimetables(params, user) {
    return this.executeWithErrorHandling(async () => {
      const { page = 1, limit = 10, search, class_id, section_id, academic_year, is_active, branch_id } = params;
      const offset = (page - 1) * limit;

      const whereClause = {
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      // Add filters
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (class_id) whereClause.class_id = class_id;
      if (section_id) whereClause.section_id = section_id;
      if (academic_year) whereClause.academic_year = academic_year;
      if (is_active !== '') whereClause.is_active = is_active === 'true';
      if (branch_id) whereClause.branch_id = branch_id;

      const { count, rows } = await Timetable.findAndCountAll({
        where: whereClause,
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
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return {
        timetables: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages
        }
      };
    }, 'Get All Timetables');
  }

  /**
   * Get timetable by ID with slots
   */
  static async getTimetableById(id, user) {
    return this.executeWithErrorHandling(async () => {
      const timetable = await Timetable.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        },
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
            model: TimetableSlot,
            as: 'slots',
            include: [
              {
                model: Subject,
                as: 'subject',
                attributes: ['id', 'name', 'code']
              },
              {
                model: User,
                as: 'teacher',
                attributes: ['id', 'first_name', 'last_name', 'email']
              }
            ],
            order: [
              ['day_of_week', 'ASC'],
              ['period_number', 'ASC']
            ]
          }
        ]
      });

      if (!timetable) {
        throw new ApiError(404, 'Timetable not found');
      }

      return timetable;
    }, 'Get Timetable By ID');
  }

  /**
   * Update timetable
   */
  static async updateTimetable(id, updateData, user) {
    return this.executeWithErrorHandling(async () => {
      const timetable = await Timetable.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!timetable) {
        throw new ApiError(404, 'Timetable not found');
      }

      await timetable.update({
        ...updateData,
        updated_by: user.id
      });

      return timetable;
    }, 'Update Timetable');
  }

  /**
   * Delete timetable
   */
  static async deleteTimetable(id, user) {
    return this.executeWithErrorHandling(async () => {
      const timetable = await Timetable.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!timetable) {
        throw new ApiError(404, 'Timetable not found');
      }

      await timetable.destroy();

      return { message: 'Timetable deleted successfully' };
    }, 'Delete Timetable');
  }

  /**
   * Add timetable slot
   */
  static async addTimetableSlot(timetableId, slotData, user) {
    return this.executeWithErrorHandling(async () => {
      const timetable = await Timetable.findOne({
        where: {
          id: timetableId,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!timetable) {
        throw new ApiError(404, 'Timetable not found');
      }

      // Validate slot doesn't conflict
      const conflictingSlot = await TimetableSlot.findOne({
        where: {
          timetable_id: timetableId,
          day_of_week: slotData.day_of_week,
          period_number: slotData.period_number
        }
      });

      if (conflictingSlot) {
        throw new ApiError(400, 'A slot already exists for this day and period');
      }

      const slot = await TimetableSlot.create({
        ...slotData,
        timetable_id: timetableId,
        created_by: user.id,
        updated_by: user.id
      });

      return slot;
    }, 'Add Timetable Slot');
  }

  /**
   * Update timetable slot
   */
  static async updateTimetableSlot(slotId, updateData, user) {
    return this.executeWithErrorHandling(async () => {
      const slot = await TimetableSlot.findOne({
        where: { id: slotId },
        include: [
          {
            model: Timetable,
            as: 'timetable',
            where: {
              school_id: user.school_id,
              ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
            }
          }
        ]
      });

      if (!slot) {
        throw new ApiError(404, 'Timetable slot not found');
      }

      await slot.update({
        ...updateData,
        updated_by: user.id
      });

      return slot;
    }, 'Update Timetable Slot');
  }

  /**
   * Delete timetable slot
   */
  static async deleteTimetableSlot(slotId, user) {
    return this.executeWithErrorHandling(async () => {
      const slot = await TimetableSlot.findOne({
        where: { id: slotId },
        include: [
          {
            model: Timetable,
            as: 'timetable',
            where: {
              school_id: user.school_id,
              ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
            }
          }
        ]
      });

      if (!slot) {
        throw new ApiError(404, 'Timetable slot not found');
      }

      await slot.destroy();

      return { message: 'Timetable slot deleted successfully' };
    }, 'Delete Timetable Slot');
  }

  /**
   * Get timetable for a specific class/section
   */
  static async getTimetableForClass(classId, sectionId, academicYear, user) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        class_id: classId,
        academic_year: academicYear,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      if (sectionId) {
        whereClause.section_id = sectionId;
      }

      const timetable = await Timetable.findOne({
        where: whereClause,
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
            model: TimetableSlot,
            as: 'slots',
            include: [
              {
                model: Subject,
                as: 'subject',
                attributes: ['id', 'name', 'code']
              },
              {
                model: User,
                as: 'teacher',
                attributes: ['id', 'first_name', 'last_name', 'email']
              }
            ],
            order: [
              ['day_of_week', 'ASC'],
              ['period_number', 'ASC']
            ]
          }
        ]
      });

      if (!timetable) {
        throw new ApiError(404, 'No active timetable found for this class/section');
      }

      return timetable;
    }, 'Get Timetable For Class');
  }

  /**
   * Get teacher-wise timetable
   */
  static async getTeacherTimetable(teacherId, academicYear, user) {
    return this.executeWithErrorHandling(async () => {
      // Get all timetables where the teacher is assigned
      const timetables = await Timetable.findAll({
        where: {
          school_id: user.school_id,
          academic_year: academicYear,
          is_active: true,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        },
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
            model: TimetableSlot,
            as: 'slots',
            where: {
              teacher_id: teacherId,
              is_active: true
            },
            include: [
              {
                model: Subject,
                as: 'subject',
                attributes: ['id', 'name', 'code']
              },
              {
                model: User,
                as: 'teacher',
                attributes: ['id', 'first_name', 'last_name', 'email']
              }
            ],
            order: [
              ['day_of_week', 'ASC'],
              ['period_number', 'ASC']
            ]
          }
        ]
      });

      // Group slots by day for easier frontend consumption
      const teacherSchedule = {
        teacher_id: teacherId,
        academic_year: academicYear,
        schedule: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        }
      };

      timetables.forEach(timetable => {
        timetable.slots.forEach(slot => {
          teacherSchedule.schedule[slot.day_of_week].push({
            ...slot.toJSON(),
            class: timetable.class,
            section: timetable.section
          });
        });
      });

      return teacherSchedule;
    }, 'Get Teacher Timetable');
  }

  /**
   * Get all teacher timetables for admin view
   */
  static async getAllTeacherTimetables(params, user) {
    return this.executeWithErrorHandling(async () => {
      const { page = 1, limit = 10, teacher_id, academic_year } = params;
      const offset = (page - 1) * limit;

      // Get all teachers who have timetable assignments
      const whereClause = {
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      if (academic_year) {
        whereClause.academic_year = academic_year;
      }

      // Get unique teachers from timetable slots
      const teacherSlots = await TimetableSlot.findAll({
        where: {
          teacher_id: teacher_id ? { [Op.eq]: teacher_id } : { [Op.ne]: null },
          is_active: true
        },
        include: [
          {
            model: Timetable,
            as: 'timetable',
            where: whereClause,
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
              }
            ]
          },
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ],
        order: [
          ['teacher_id', 'ASC'],
          ['day_of_week', 'ASC'],
          ['period_number', 'ASC']
        ]
      });

      // Group by teacher
      const teacherTimetables = {};
      teacherSlots.forEach(slot => {
        const teacherId = slot.teacher_id;
        if (!teacherTimetables[teacherId]) {
          teacherTimetables[teacherId] = {
            teacher: slot.teacher,
            academic_year: slot.timetable.academic_year,
            schedule: {
              monday: [],
              tuesday: [],
              wednesday: [],
              thursday: [],
              friday: [],
              saturday: [],
              sunday: []
            }
          };
        }
        teacherTimetables[teacherId].schedule[slot.day_of_week].push({
          ...slot.toJSON(),
          class: slot.timetable.class,
          section: slot.timetable.section
        });
      });

      const teachers = Object.values(teacherTimetables);
      const total = teachers.length;
      const paginatedTeachers = teachers.slice(offset, offset + limit);

      return {
        teachers: paginatedTeachers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }, 'Get All Teacher Timetables');
  }

  /**
   * Get timetable statistics
   */
  static async getTimetableStats(user) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      const [
        totalTimetables,
        activeTimetables,
        totalSlots,
        teacherAssignments
      ] = await Promise.all([
        Timetable.count({ where: whereClause }),
        Timetable.count({ where: { ...whereClause, is_active: true } }),
        TimetableSlot.count({
          include: [{
            model: Timetable,
            as: 'timetable',
            where: whereClause
          }]
        }),
        TimetableSlot.count({
          where: { teacher_id: { [Op.ne]: null } },
          include: [{
            model: Timetable,
            as: 'timetable',
            where: whereClause
          }]
        })
      ]);

      return {
        total_timetables: totalTimetables,
        active_timetables: activeTimetables,
        total_slots: totalSlots,
        teacher_assignments: teacherAssignments,
        assignment_rate: totalSlots > 0 ? (teacherAssignments / totalSlots) * 100 : 0
      };
    }, 'Get Timetable Stats');
  }
}

module.exports = TimetableService;

