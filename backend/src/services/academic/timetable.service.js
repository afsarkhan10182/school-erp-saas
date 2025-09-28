const { Op, Sequelize } = require('sequelize');
const { Timetable, TimetableSlot, Class, Section, Subject, School, User } = require('~/models');
const BaseService = require('~/services/shared/base.service');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');

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
        throw new ApiError(
          400,
          'A timetable already exists for this class/section and academic year'
        );
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
      const {
        page = 1,
        limit = 10,
        search,
        class_id,
        section_id,
        academic_year,
        is_active,
        branch_id
      } = params;
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
      if (section_id !== undefined) {
        if (section_id === '' || section_id === null) {
          whereClause.section_id = null;
        } else {
          whereClause.section_id = section_id;
        }
      }
      if (academic_year) whereClause.academic_year = academic_year;
      if (is_active !== undefined && is_active !== '') whereClause.is_active = is_active === 'true';
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
          },
          {
            model: TimetableSlot,
            as: 'slots',
            attributes: [
              'id',
              'day_of_week',
              'period_number',
              'start_time',
              'end_time',
              'subject_id',
              'teacher_id',
              'room_number',
              'slot_type',
              'is_active',
              'notes'
            ],
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
            ]
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

      // Validate slot doesn't conflict with existing slots
      const existingSlots = await TimetableSlot.findAll({
        where: {
          timetable_id: timetableId,
          day_of_week: slotData.day_of_week
        }
      });

      // Sort existing slots by start_time to get chronological order
      const sortedSlots = existingSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));

      // Check if slot already exists for this day and period - if so, update it instead of creating new
      const existingSlot = existingSlots.find(
        slot => slot.period_number === slotData.period_number
      );

      if (existingSlot) {
        // Update existing slot instead of creating new one
        // Only update fields that are provided and not null (except for break slots)
        const updateData = {
          start_time: slotData.start_time,
          end_time: slotData.end_time,
          room_number: slotData.room_number,
          slot_type: slotData.slot_type,
          updated_by: user.id
        };

        // Only update subject/teacher if not a break
        if (slotData.slot_type !== 'break') {
          updateData.subject_id = slotData.subject_id;
          updateData.teacher_id = slotData.teacher_id;
        } else {
          // For break slots, set subject and teacher to null
          updateData.subject_id = null;
          updateData.teacher_id = null;
        }

        await existingSlot.update(updateData);
        return existingSlot;
      }

      // Helper function to normalize time format (HH:MM or HH:MM:SS -> HH:MM:SS)
      const normalizeTime = timeStr => {
        if (!timeStr) return timeStr;
        const parts = timeStr.split(':');
        if (parts.length === 2) {
          return `${parts[0]}:${parts[1]}:00`; // Add seconds if missing
        }
        return timeStr; // Already has seconds
      };

      // Check for time overlap conflicts
      const timeConflict = existingSlots.find(slot => {
        const newStart = normalizeTime(slotData.start_time);
        const newEnd = normalizeTime(slotData.end_time);
        const existingStart = normalizeTime(slot.start_time);
        const existingEnd = normalizeTime(slot.end_time);

        // Check if times overlap: (newStart < existingEnd) && (newEnd > existingStart)
        // Adjacent times should NOT conflict (e.g., 9:00:00-10:00:00 and 10:00:00-11:00:00)
        const hasOverlap = newStart < existingEnd && newEnd > existingStart;

        return hasOverlap;
      });

      if (timeConflict) {
        throw new ApiError(
          400,
          `Time conflict detected! Another slot exists from ${timeConflict.start_time} to ${timeConflict.end_time} on the same day`
        );
      }

      // Auto-assign period number based on chronological order
      const allSlotsForDay = [
        ...existingSlots,
        { start_time: slotData.start_time, end_time: slotData.end_time }
      ];
      const chronologicallySorted = allSlotsForDay.sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );
      const newSlotIndex = chronologicallySorted.findIndex(
        slot => slot.start_time === slotData.start_time && slot.end_time === slotData.end_time
      );
      const correctPeriodNumber = newSlotIndex + 1;

      const slot = await TimetableSlot.create({
        ...slotData,
        period_number: correctPeriodNumber, // Override with chronologically correct period number
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

      // If updating time-related fields, check for conflicts
      if (updateData.start_time || updateData.end_time || updateData.day_of_week) {
        const existingSlots = await TimetableSlot.findAll({
          where: {
            timetable_id: slot.timetable_id,
            day_of_week: updateData.day_of_week || slot.day_of_week,
            id: { [Op.ne]: slotId } // Exclude current slot
          }
        });

        // No need to check for period conflicts when updating - just update the slot

        // Helper function to normalize time format (HH:MM or HH:MM:SS -> HH:MM:SS)
        const normalizeTime = timeStr => {
          if (!timeStr) return timeStr;
          const parts = timeStr.split(':');
          if (parts.length === 2) {
            return `${parts[0]}:${parts[1]}:00`; // Add seconds if missing
          }
          return timeStr; // Already has seconds
        };

        // Check for time overlap conflicts
        const newStartTime = updateData.start_time || slot.start_time;
        const newEndTime = updateData.end_time || slot.end_time;

        const timeConflict = existingSlots.find(existingSlot => {
          const normalizedNewStart = normalizeTime(newStartTime);
          const normalizedNewEnd = normalizeTime(newEndTime);
          const normalizedExistingStart = normalizeTime(existingSlot.start_time);
          const normalizedExistingEnd = normalizeTime(existingSlot.end_time);

          // Check if times overlap: (newStart < existingEnd) && (newEnd > existingStart)
          const hasOverlap =
            normalizedNewStart < normalizedExistingEnd &&
            normalizedNewEnd > normalizedExistingStart;

          return hasOverlap;
        });

        if (timeConflict) {
          throw new ApiError(
            400,
            `Time conflict detected! Another slot exists from ${timeConflict.start_time} to ${timeConflict.end_time} on the same day`
          );
        }
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

      const [totalTimetables, activeTimetables, totalSlots, teacherAssignments] = await Promise.all(
        [
          Timetable.count({ where: whereClause }),
          Timetable.count({ where: { ...whereClause, is_active: true } }),
          TimetableSlot.count({
            include: [
              {
                model: Timetable,
                as: 'timetable',
                where: whereClause
              }
            ]
          }),
          TimetableSlot.count({
            where: { teacher_id: { [Op.ne]: null } },
            include: [
              {
                model: Timetable,
                as: 'timetable',
                where: whereClause
              }
            ]
          })
        ]
      );

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
