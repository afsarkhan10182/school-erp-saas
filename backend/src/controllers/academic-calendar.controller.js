const httpStatus = require('http-status');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');
const { AcademicCalendar, School } = require('../models');

// Check if a date is a working day
const checkWorkingDay = async (req, res, next) => {
  try {
    const { date, academic_year } = req.query;
    
    if (!date) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'Date is required');
    }

    const where = {
      date,
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
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[dayOfWeek];
            
            // Check if working days enforcement is enabled
            const enforceWorkingDays = settings.enforce_working_days === true;
            
            if (enforceWorkingDays) {
              // Use school's working days configuration
              const workingDays = settings.working_days || {
                monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
                saturday: false, sunday: false
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
    const { date_from, date_to, academic_year } = req.query;
    
    if (!date_from || !date_to) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'date_from and date_to are required');
    }

    const where = {
      date: { [Op.between]: [date_from, date_to] },
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

    const calendar = await AcademicCalendar.findAll({
      where,
      order: [['date', 'ASC']]
    });

    return res.status(httpStatus.default.OK).json({
      success: true,
      data: calendar
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
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'date, day_type, and academic_year are required');
    }

    // For super admins, school_id must be provided in the request
    if (!req.schoolId) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'school_id is required for creating calendar entries');
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
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'school_id is required for creating calendar entries');
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

module.exports = {
  checkWorkingDay,
  getCalendar,
  upsertCalendarEntry,
  bulkCreateCalendar,
};
