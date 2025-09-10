const httpStatus = require('http-status');
const { Op } = require('sequelize');
const ApiError = require('~/utils/ApiError');
const { logger } = require('~/utils/logger');
const { AcademicCalendar, School } = require('~/models');

// Check if a date is a working day
const checkWorkingDay = async (req, res, next) => {
  try {
    const { date, academic_year } = req.query;

    if (!date) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'Date is required');
    }

    // Validate and format the date
    let formattedDate;
    try {
      // If date is already a string, try to parse it
      if (typeof date === 'string') {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date format');
        }
        formattedDate = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      } else {
        throw new Error('Date must be a string');
      }
    } catch (error) {
      throw new ApiError(
        httpStatus.default.BAD_REQUEST,
        'Invalid date format. Please provide date in YYYY-MM-DD format'
      );
    }

    const where = {
      date: formattedDate
    };

    // Only add school_id if it exists (for super admins, it might be null)
    if (req.schoolId) {
      where.school_id = req.schoolId;
    }

    if (req.user.role === 'branch_admin') {
      where.branch_id = req.user.branch_id;
    } else if (req.branchId) {
      where.branch_id = req.branchId;
    }

    if (academic_year) {
      where.academic_year = academic_year;
    }

    const calendarEntry = await AcademicCalendar.findOne({ where });

    // If no specific calendar entry exists, check school's working days configuration
    if (!calendarEntry) {
      // Get school settings to determine working days
      let isWorkingDay = true;
      let dayType = 'working';
      let description = 'Working Day';

      if (req.schoolId) {
        try {
          const school = await School.findByPk(req.schoolId, {
            attributes: ['id', 'settings']
          });

          if (school && school.settings) {
            const settings = school.settings;
            const dayOfWeek = new Date(date).getDay();
            const dayNames = [
              'sunday',
              'monday',
              'tuesday',
              'wednesday',
              'thursday',
              'friday',
              'saturday'
            ];
            const dayName = dayNames[dayOfWeek];

            // Check if working days enforcement is enabled
            const enforceWorkingDays = settings.enforce_working_days === true;

            if (enforceWorkingDays) {
              // Use school's working days configuration
              const workingDays = settings.working_days || {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: false,
                sunday: false
              };

              isWorkingDay = workingDays[dayName] === true;
              dayType = isWorkingDay ? 'working' : 'non-working';
              description = isWorkingDay ? 'Working Day' : 'Non-Working Day';
            } else {
              // If enforcement is disabled, treat all days as working days
              isWorkingDay = true;
              dayType = 'working';
              description = 'Working Day (No restrictions)';
            }
          }
        } catch (error) {
          logger.error('Error getting school settings for working day check:', error);
          // Fallback to default weekend logic
          const dayOfWeek = new Date(date).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          isWorkingDay = !isWeekend;
          dayType = isWeekend ? 'weekend' : 'working';
          description = isWeekend ? 'Weekend' : 'Working Day';
        }
      } else {
        // For super admin without school context, use default weekend logic
        const dayOfWeek = new Date(date).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        isWorkingDay = !isWeekend;
        dayType = isWeekend ? 'weekend' : 'working';
        description = isWeekend ? 'Weekend' : 'Working Day';
      }

      return res.status(httpStatus.default.OK).json({
        success: true,
        data: {
          date,
          is_working_day: isWorkingDay,
          day_type: dayType,
          description: description
        }
      });
    }

    return res.status(httpStatus.default.OK).json({
      success: true,
      data: {
        date,
        is_working_day: calendarEntry.day_type === 'working',
        day_type: calendarEntry.day_type,
        description: calendarEntry.description
      }
    });
  } catch (error) {
    logger.error('Error checking working day:', error);
    return next(error);
  }
};

// Get academic calendar for a date range
const getCalendar = async (req, res, next) => {
  try {
    const {
      date_from,
      date_to,
      academic_year,
      day_type,
      start_date,
      end_date,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = {};

    // Date range handling
    if (start_date && end_date) {
      where.date = { [Op.between]: [start_date, end_date] };
    } else if (date_from && date_to) {
      where.date = { [Op.between]: [date_from, date_to] };
    }

    // Only add school_id if it exists (for super admins, it might be null)
    if (req.schoolId) {
      where.school_id = req.schoolId;
    }

    if (req.user.role === 'branch_admin') {
      where.branch_id = req.user.branch_id;
    } else if (req.branchId) {
      where.branch_id = req.branchId;
    }

    if (academic_year) {
      where.academic_year = academic_year;
    }

    if (day_type) {
      where.day_type = day_type;
    }

    const { count, rows: calendar } = await AcademicCalendar.findAndCountAll({
      where,
      order: [['date', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    return res.status(httpStatus.default.OK).json({
      success: true,
      data: {
        events: calendar,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error getting academic calendar:', error);
    return next(error);
  }
};

// Create or update calendar entry
const upsertCalendarEntry = async (req, res, next) => {
  try {
    const { date, day_type, description, academic_year } = req.body;

    if (!date || !day_type || !academic_year) {
      throw new ApiError(
        httpStatus.default.BAD_REQUEST,
        'date, day_type, and academic_year are required'
      );
    }

    // For super admins, school_id must be provided in the request
    if (!req.schoolId) {
      throw new ApiError(
        httpStatus.default.BAD_REQUEST,
        'school_id is required for creating calendar entries'
      );
    }

    const branchId = req.branchId || req.user.branch_id;
    if (!branchId) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'branch_id is required');
    }

    const [entry, created] = await AcademicCalendar.findOrCreate({
      where: {
        date,
        school_id: req.schoolId,
        branch_id: branchId,
        academic_year
      },
      defaults: {
        day_type,
        description,
        created_by: req.user.id,
        updated_by: req.user.id
      }
    });

    if (!created) {
      await entry.update({
        day_type,
        description,
        updated_by: req.user.id
      });
    }

    return res.status(created ? httpStatus.default.CREATED : httpStatus.default.OK).json({
      success: true,
      data: entry
    });
  } catch (error) {
    logger.error('Error upserting calendar entry:', error);
    return next(error);
  }
};

// Bulk create calendar entries
const bulkCreateCalendar = async (req, res, next) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'entries array is required');
    }

    // For super admins, school_id must be provided in the request
    if (!req.schoolId) {
      throw new ApiError(
        httpStatus.default.BAD_REQUEST,
        'school_id is required for creating calendar entries'
      );
    }

    const branchId = req.branchId || req.user.branch_id;
    if (!branchId) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'branch_id is required');
    }

    const calendarEntries = entries.map(entry => ({
      ...entry,
      school_id: req.schoolId,
      branch_id: branchId,
      created_by: req.user.id,
      updated_by: req.user.id
    }));

    const createdEntries = await AcademicCalendar.bulkCreate(calendarEntries, {
      updateOnDuplicate: ['day_type', 'description', 'updated_by', 'updated_at']
    });

    return res.status(httpStatus.default.CREATED).json({
      success: true,
      data: createdEntries
    });
  } catch (error) {
    logger.error('Error bulk creating calendar entries:', error);
    return next(error);
  }
};

// Get calendar event by ID
const getCalendarEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let where = { id };

    // Only add school_id if it exists (for super admins, it might be null)
    if (req.schoolId) {
      where.school_id = req.schoolId;
    }

    if (req.user.role === 'branch_admin') {
      where.branch_id = req.user.branch_id;
    } else if (req.branchId) {
      where.branch_id = req.branchId;
    }

    const event = await AcademicCalendar.findOne({ where });

    if (!event) {
      throw new ApiError(httpStatus.default.NOT_FOUND, 'Calendar event not found');
    }

    return res.status(httpStatus.default.OK).json({
      success: true,
      data: { event }
    });
  } catch (error) {
    logger.error('Error getting calendar event by ID:', error);
    return next(error);
  }
};

// Create new calendar event
const createCalendarEvent = async (req, res, next) => {
  try {
    const { date, day_type, description, academic_year } = req.body;

    if (!date || !day_type || !academic_year) {
      throw new ApiError(
        httpStatus.default.BAD_REQUEST,
        'date, day_type, and academic_year are required'
      );
    }

    // For super admins, school_id must be provided in the request
    if (!req.schoolId) {
      throw new ApiError(
        httpStatus.default.BAD_REQUEST,
        'school_id is required for creating calendar entries'
      );
    }

    const branchId = req.branchId || req.user.branch_id;
    if (!branchId) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'branch_id is required');
    }

    // Check if event already exists for this date
    const existingEvent = await AcademicCalendar.findOne({
      where: {
        date,
        school_id: req.schoolId,
        branch_id: branchId,
        academic_year
      }
    });

    if (existingEvent) {
      throw new ApiError(
        httpStatus.default.BAD_REQUEST,
        'Calendar event already exists for this date'
      );
    }

    const event = await AcademicCalendar.create({
      date,
      day_type,
      description,
      academic_year,
      school_id: req.schoolId,
      branch_id: branchId,
      created_by: req.user.id,
      updated_by: req.user.id
    });

    return res.status(httpStatus.default.CREATED).json({
      success: true,
      data: { event }
    });
  } catch (error) {
    logger.error('Error creating calendar event:', error);
    return next(error);
  }
};

// Update calendar event
const updateCalendarEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, day_type, description, academic_year } = req.body;

    let where = { id };

    // Only add school_id if it exists (for super admins, it might be null)
    if (req.schoolId) {
      where.school_id = req.schoolId;
    }

    if (req.user.role === 'branch_admin') {
      where.branch_id = req.user.branch_id;
    } else if (req.branchId) {
      where.branch_id = req.branchId;
    }

    const event = await AcademicCalendar.findOne({ where });

    if (!event) {
      throw new ApiError(httpStatus.default.NOT_FOUND, 'Calendar event not found');
    }

    // Check if updating date would create a duplicate
    if (date && date !== event.date) {
      const existingEvent = await AcademicCalendar.findOne({
        where: {
          date,
          school_id: event.school_id,
          branch_id: event.branch_id,
          academic_year: academic_year || event.academic_year,
          id: { [Op.ne]: id }
        }
      });

      if (existingEvent) {
        throw new ApiError(
          httpStatus.default.BAD_REQUEST,
          'Calendar event already exists for this date'
        );
      }
    }

    await event.update({
      date: date || event.date,
      day_type: day_type || event.day_type,
      description: description !== undefined ? description : event.description,
      academic_year: academic_year || event.academic_year,
      updated_by: req.user.id
    });

    return res.status(httpStatus.default.OK).json({
      success: true,
      data: { event }
    });
  } catch (error) {
    logger.error('Error updating calendar event:', error);
    return next(error);
  }
};

// Delete calendar event
const deleteCalendarEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    let where = { id };

    // Only add school_id if it exists (for super admins, it might be null)
    if (req.schoolId) {
      where.school_id = req.schoolId;
    }

    if (req.user.role === 'branch_admin') {
      where.branch_id = req.user.branch_id;
    } else if (req.branchId) {
      where.branch_id = req.branchId;
    }

    const event = await AcademicCalendar.findOne({ where });

    if (!event) {
      throw new ApiError(httpStatus.default.NOT_FOUND, 'Calendar event not found');
    }

    await event.destroy();

    return res.status(httpStatus.default.OK).json({
      success: true,
      message: 'Calendar event deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting calendar event:', error);
    return next(error);
  }
};

module.exports = {
  checkWorkingDay,
  getCalendar,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  upsertCalendarEntry,
  bulkCreateCalendar
};
