const { AcademicYear, School } = require('../../models');
const { logger } = require('../../utils/logger');
const { success, error, asyncHandler } = require('../../utils/apiResponse');
const ApiError = require('../../utils/ApiError');
const { verifyToken, authorize } = require('../../middleware/auth');

class AcademicSettingsController {
  // Get academic settings
  static getAcademicSettings = asyncHandler(async (req, res) => {
    const user = req.user;
    const schoolId = user.school_id;

    if (!schoolId) {
      throw new ApiError(400, 'No school assigned to user');
    }

    const school = await School.findByPk(schoolId, {
      attributes: ['id', 'settings']
    });

    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Get current academic year
    const currentAcademicYear = await AcademicYear.findOne({
      where: { 
        school_id: schoolId,
        is_current: true 
      },
      attributes: ['id', 'name', 'start_date', 'end_date', 'status']
    });

    // Get settings from JSONB field with defaults
    const settings = school.settings || {};

    // Organize data into sections
    const academicYear = currentAcademicYear ? {
      name: currentAcademicYear.name,
      startDate: currentAcademicYear.start_date,
      endDate: currentAcademicYear.end_date,
      status: currentAcademicYear.status
    } : {
      name: '',
      startDate: '',
      endDate: '',
      status: 'active'
    };

    const termSettings = {
      numberOfTerms: settings.number_of_terms || 3,
      termDuration: settings.term_duration || 12,
      enableMidTermExams: settings.enable_mid_term_exams !== false,
      enableFinalExams: settings.enable_final_exams !== false
    };

    const gradingSystem = {
      scale: settings.grading_scale || 'percentage',
      passingPercentage: settings.passing_percentage || 40,
      enableGPA: settings.enable_gpa !== false,
      showClassRank: settings.show_class_rank === true
    };

    const attendanceSettings = {
      minimumPercentage: settings.minimum_attendance_percentage || 75,
      trackingMethod: settings.attendance_tracking_method || 'daily',
      autoMarkAbsent: settings.auto_mark_absent !== false,
      sendAlerts: settings.send_attendance_alerts !== false
    };

    success(res, {
      academicYear,
      termSettings,
      gradingSystem,
      attendanceSettings
    });
  });

  // Update academic settings
  static updateAcademicSettings = asyncHandler(async (req, res) => {
    const user = req.user;
    const schoolId = user.school_id;
    const { academicYear, termSettings, gradingSystem, attendanceSettings } = req.body;

    if (!schoolId) {
      throw new ApiError(400, 'No school assigned to user');
    }

    const school = await School.findByPk(schoolId);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Prepare settings update
    const settingsUpdate = { ...school.settings };

    if (termSettings) {
      settingsUpdate.number_of_terms = termSettings.numberOfTerms;
      settingsUpdate.term_duration = termSettings.termDuration;
      settingsUpdate.enable_mid_term_exams = termSettings.enableMidTermExams;
      settingsUpdate.enable_final_exams = termSettings.enableFinalExams;
    }

    if (gradingSystem) {
      settingsUpdate.grading_scale = gradingSystem.scale;
      settingsUpdate.passing_percentage = gradingSystem.passingPercentage;
      settingsUpdate.enable_gpa = gradingSystem.enableGPA;
      settingsUpdate.show_class_rank = gradingSystem.showClassRank;
    }

    if (attendanceSettings) {
      settingsUpdate.minimum_attendance_percentage = attendanceSettings.minimumPercentage;
      settingsUpdate.attendance_tracking_method = attendanceSettings.trackingMethod;
      settingsUpdate.auto_mark_absent = attendanceSettings.autoMarkAbsent;
      settingsUpdate.send_attendance_alerts = attendanceSettings.sendAlerts;
    }

    // Update school settings
    await school.update({
      settings: settingsUpdate,
      updated_by: user.id
    });

    // Update academic year if provided
    if (academicYear && academicYear.name) {
      const currentAcademicYear = await AcademicYear.findOne({
        where: { 
          school_id: schoolId,
          is_current: true 
        }
      });

      if (currentAcademicYear) {
        await currentAcademicYear.update({
          name: academicYear.name,
          start_date: academicYear.startDate,
          end_date: academicYear.endDate,
          status: academicYear.status,
          updated_by: user.id
        });
      } else {
        // Create new academic year if none exists
        await AcademicYear.create({
          school_id: schoolId,
          name: academicYear.name,
          start_date: academicYear.startDate,
          end_date: academicYear.endDate,
          status: academicYear.status,
          is_current: true,
          created_by: user.id,
          updated_by: user.id
        });
      }
    }

    logger.info('Academic settings updated', {
      schoolId,
      updatedBy: user.id
    });

    success(res, { message: 'Academic settings updated successfully' });
  });
}

module.exports = AcademicSettingsController;
