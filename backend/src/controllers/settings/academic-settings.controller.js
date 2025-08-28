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

    // For super_admin, allow access without school_id
    if (!schoolId && user.role !== 'super_admin') {
      throw new ApiError(400, 'No school assigned to user');
    }

    // If super_admin and no school_id, return empty settings
    if (!schoolId && user.role === 'super_admin') {
      return success(res, {
        academicYear: {
          name: '',
          startDate: '',
          endDate: '',
          status: 'active'
        },
        termSettings: {
          numberOfTerms: 3,
          termDuration: 12,
          enableMidTermExams: true,
          enableFinalExams: true
        },
        gradingSystem: {
          scale: 'percentage',
          passingPercentage: 40,
          enableGPA: true,
          showClassRank: false
        },
        attendanceSettings: {
          minimumPercentage: 75,
          trackingMethod: 'daily',
          autoMarkAbsent: true,
          sendAlerts: true
        }
      });
    }

    const school = await School.findByPk(schoolId, {
      attributes: ['id', 'settings']
    });

    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Get current academic year through school's current_academic_year_id
    let currentAcademicYear = null;
    if (school.current_academic_year_id) {
      currentAcademicYear = await AcademicYear.findByPk(school.current_academic_year_id, {
        attributes: ['id', 'name', 'start_date', 'end_date', 'status']
      });
    }

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
      timeSettings: {
        cutoffTime: settings.cutoff_time || '16:00'
      },
      validationRules: {
        enforceWorkingDays: settings.enforce_working_days === true,
        enforceCutoffTime: settings.enforce_cutoff_time === true
      },
      workingDays: {
        monday: settings.working_days?.monday !== false,
        tuesday: settings.working_days?.tuesday !== false,
        wednesday: settings.working_days?.wednesday !== false,
        thursday: settings.working_days?.thursday !== false,
        friday: settings.working_days?.friday !== false,
        saturday: settings.working_days?.saturday === true,
        sunday: settings.working_days?.sunday === true
      }
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

    // For super_admin, allow access without school_id but require school_id in request
    if (!schoolId && user.role !== 'super_admin') {
      throw new ApiError(400, 'No school assigned to user');
    }

    // If super_admin and no school_id in token, require school_id in request body
    const targetSchoolId = schoolId || req.body.school_id;
    if (!targetSchoolId && user.role === 'super_admin') {
      throw new ApiError(400, 'School ID is required for super admin');
    }

    const school = await School.findByPk(targetSchoolId);
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
      
      // Time settings
      if (attendanceSettings.timeSettings) {
        settingsUpdate.cutoff_time = attendanceSettings.timeSettings.cutoffTime;
      }
      
      // Validation rules (minimal & essential)
      if (attendanceSettings.validationRules) {
        settingsUpdate.enforce_working_days = attendanceSettings.validationRules.enforceWorkingDays;
        settingsUpdate.enforce_cutoff_time = attendanceSettings.validationRules.enforceCutoffTime;
      }
      
      // Working days configuration
      if (attendanceSettings.workingDays) {
        settingsUpdate.working_days = attendanceSettings.workingDays;
      }
    }

    // Update school settings
    await school.update({
      settings: settingsUpdate,
      updated_by: user.id
    });

    // Update academic year if provided
    if (academicYear && academicYear.name) {
      let currentAcademicYear = null;
      
      // Get current academic year through school's current_academic_year_id
      if (school.current_academic_year_id) {
        currentAcademicYear = await AcademicYear.findByPk(school.current_academic_year_id);
      }

      if (currentAcademicYear) {
        // Update existing academic year
        await currentAcademicYear.update({
          name: academicYear.name,
          start_date: academicYear.startDate || currentAcademicYear.start_date,
          end_date: academicYear.endDate || currentAcademicYear.end_date,
          status: academicYear.status,
          updated_by: user.id
        });
      } else {
        // Create new academic year and link it to the school
        const newAcademicYear = await AcademicYear.create({
          name: academicYear.name,
          code: academicYear.name.replace(/\s+/g, '').toUpperCase(), // Generate code from name
          start_date: academicYear.startDate || new Date().toISOString().split('T')[0], // Default to today if not provided
          end_date: academicYear.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 year from now
          status: academicYear.status,
          is_current: true,
          created_by: user.id,
          updated_by: user.id
        });
        
        // Update school to link to the new academic year
        await school.update({
          current_academic_year_id: newAcademicYear.id,
          updated_by: user.id
        });
      }
    }

    logger.info('Academic settings updated', {
      schoolId: targetSchoolId,
      updatedBy: user.id
    });

    success(res, { message: 'Academic settings updated successfully' });
  });
}

module.exports = AcademicSettingsController;
