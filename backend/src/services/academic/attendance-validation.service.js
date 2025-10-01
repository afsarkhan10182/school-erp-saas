const { School, AcademicCalendar } = require('~/models');
const ApiError = require('~/utils/shared/ApiError');

/**
 * Default Attendance Configuration Example
 *
 * This is the default configuration that provides maximum flexibility
 * while maintaining audit trails. Schools can enable specific rules
 * as needed for compliance.
 *
 * {
 *   "enforceWorkingDays": false,
 *   "enforceCutoffTime": false,
 *   "cutoffTime": "23:59",
 *   "enforceEditTimeLimit": false,
 *   "editTimeLimitHours": 24,
 *   "enforceRemarksForAbsent": false,
 *   "enforceRemarksForLate": false,
 *   "enforceLateThreshold": false,
 *   "lateThresholdMinutes": 0,
 *   "enforceHolidayRules": false,
 *
 *   "logAllChanges": true,
 *   "logLateSubmissions": true,
 *   "logRuleViolations": true,
 *   "requireApprovalForLateChanges": false,
 *   "notifyAdminOnViolations": false,
 *   "graceMode": false,
 *   "gracePeriodDays": 30
 * }
 */

class AttendanceValidationService {
  static async validateAttendanceDate(schoolId, date, settings) {
    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Only enforce if explicitly configured
    if (settings.attendanceSettings?.validationRules?.enforceWorkingDays === true) {
      const workingDays = settings.attendanceSettings?.workingDays || {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      };

      if (!workingDays[dayName]) {
        throw new ApiError(400, `Attendance cannot be marked on ${dayName}`);
      }
    }

    const calendarEntry = await AcademicCalendar.findOne({
      where: { date, school_id: schoolId }
    });

    if (calendarEntry && calendarEntry.day_type !== 'working') {
      const enforceHolidayRules =
        settings.attendanceSettings?.validationRules?.enforceHolidayRules === true;
      if (enforceHolidayRules) {
        throw new ApiError(400, `Attendance cannot be marked on ${calendarEntry.day_type} days`);
      }
    }

    return true;
  }

  static validateAttendanceTime(currentTime, settings) {
    const enforceCutoff = settings.attendanceSettings?.validationRules?.enforceCutoffTime === true;
    if (!enforceCutoff) return true;

    const cutoffTime = settings.attendanceSettings?.timeSettings?.cutoffTime || '16:00';
    const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    if (currentHour > cutoffHour || (currentHour === cutoffHour && currentMinute > cutoffMinute)) {
      throw new ApiError(400, `Attendance cannot be marked after ${cutoffTime}`);
    }

    return true;
  }

  static validateEditTimeLimit(sessionDate, settings) {
    const enforceEditLimit =
      settings.attendanceSettings?.validationRules?.enforceEditTimeLimit === true;
    if (!enforceEditLimit) return true;

    const editTimeLimit = settings.attendanceSettings?.timeSettings?.editTimeLimit || 24;
    const currentTime = new Date();
    const sessionDateTime = new Date(sessionDate);
    const timeDiffHours = (currentTime - sessionDateTime) / (1000 * 60 * 60);

    if (timeDiffHours > editTimeLimit) {
      throw new ApiError(400, `Attendance cannot be edited after ${editTimeLimit} hours`);
    }

    return true;
  }

  static validateAttendanceStatus(status, remarks, settings) {
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid attendance status: ${status}`);
    }

    const validationRules = settings.attendanceSettings?.validationRules || {};

    // Only enforce remarks if explicitly configured
    if (
      status === 'absent' &&
      validationRules.enforceRemarksForAbsent === true &&
      (!remarks || remarks.trim() === '')
    ) {
      throw new ApiError(400, 'Remarks are required for absent students');
    }

    if (
      status === 'late' &&
      validationRules.enforceRemarksForLate === true &&
      (!remarks || remarks.trim() === '')
    ) {
      throw new ApiError(400, 'Remarks are required for late students');
    }

    return true;
  }

  static validateLateThreshold(attendanceTime, settings) {
    const enforceLateThreshold =
      settings.attendanceSettings?.validationRules?.enforceLateThreshold === true;
    if (!enforceLateThreshold) return 'present';

    const lateThreshold = settings.attendanceSettings?.timeSettings?.lateThreshold || '08:15';
    const [thresholdHour, thresholdMinute] = lateThreshold.split(':').map(Number);

    const attendanceHour = attendanceTime.getHours();
    const attendanceMinute = attendanceTime.getMinutes();

    if (
      attendanceHour > thresholdHour ||
      (attendanceHour === thresholdHour && attendanceMinute > thresholdMinute)
    ) {
      return 'late';
    }

    return 'present';
  }

  static async getSchoolSettings(schoolId) {
    const school = await School.findByPk(schoolId, {
      attributes: ['id', 'settings']
    });

    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    const settings = school.settings || {};

    return {
      attendanceSettings: {
        minimumPercentage: settings.minimum_attendance_percentage || 75,
        trackingMethod: settings.attendance_tracking_method || 'daily',
        autoMarkAbsent: settings.auto_mark_absent !== false,
        sendAlerts: settings.send_attendance_alerts !== false,
        workingDays: {
          monday: settings.working_days?.monday !== false,
          tuesday: settings.working_days?.tuesday !== false,
          wednesday: settings.working_days?.wednesday !== false,
          thursday: settings.working_days?.thursday !== false,
          friday: settings.working_days?.friday !== false,
          saturday: settings.working_days?.saturday === true,
          sunday: settings.working_days?.sunday === true
        },
        timeSettings: {
          schoolStartTime: settings.school_start_time || '08:00',
          schoolEndTime: settings.school_end_time || '15:00',
          lateThreshold: settings.late_threshold || '08:15',
          cutoffTime: settings.cutoff_time || '23:59', // Default: basically no cutoff
          editTimeLimit: settings.edit_time_limit || 24
        },
        validationRules: {
          // Soft defaults - all rules are optional
          enforceWorkingDays: settings.enforce_working_days === true,
          enforceHolidayRules: settings.enforce_holiday_rules === true,
          enforceCutoffTime: settings.enforce_cutoff_time === true,
          cutoffTime: settings.cutoff_time || '23:59', // Default: basically no cutoff
          enforceEditTimeLimit: settings.enforce_edit_time_limit === true,
          editTimeLimitHours: settings.edit_time_limit || 24,
          enforceRemarksForAbsent: settings.enforce_remarks_for_absent === true,
          enforceRemarksForLate: settings.enforce_remarks_for_late === true,
          enforceLateThreshold: settings.enforce_late_threshold === true,
          lateThresholdMinutes: settings.late_threshold_minutes || 0,
          allowWeekendAttendance: settings.allow_weekend_attendance === true,
          allowHolidayAttendance: settings.allow_holiday_attendance === true,
          maxLateMinutes: settings.max_late_minutes || 30,
          autoMarkAbsentAfterMinutes: settings.auto_mark_absent_after_minutes || 60
        },
        notificationSettings: {
          sendAbsentNotifications: settings.send_absent_notifications !== false,
          sendLateNotifications: settings.send_late_notifications === true,
          notificationDelay: settings.notification_delay || 30,
          notifyParents: settings.notify_parents !== false,
          notifyTeachers: settings.notify_teachers === true
        },
        auditSettings: {
          logAllChanges: settings.log_attendance_changes !== false, // Always on by default
          logLateSubmissions: settings.log_late_submissions === true,
          logRuleViolations: settings.log_rule_violations === true,
          requireApprovalForLateChanges: settings.require_approval_late_changes === true,
          notifyAdminOnViolations: settings.notify_admin_violations === true,
          graceMode: settings.grace_mode === true, // New: grace period for new rules
          gracePeriodDays: settings.grace_period_days || 30 // Default 30-day grace period
        }
      }
    };
  }

  static async validateAttendanceSubmission(schoolId, date, records, publish = false) {
    const settings = await this.getSchoolSettings(schoolId);

    // Always validate date (but with soft enforcement)
    await this.validateAttendanceDate(schoolId, date, settings);

    // Only validate time if enforcement is enabled
    if (publish && settings.attendanceSettings?.validationRules?.enforceCutoffTime === true) {
      this.validateAttendanceTime(new Date(), settings);
    }

    // Validate records with soft enforcement
    for (const record of records) {
      this.validateAttendanceStatus(record.status, record.remarks, settings);
    }

    return settings;
  }

  static async logAttendanceAction(action, data, settings) {
    const auditSettings = settings.attendanceSettings?.auditSettings || {};

    // Always log if logAllChanges is enabled (default: true)
    if (auditSettings.logAllChanges === false) return;

    const logData = {
      action,
      timestamp: new Date(),
      data,
      settings: {
        enforceWorkingDays: settings.attendanceSettings?.validationRules?.enforceWorkingDays,
        enforceCutoffTime: settings.attendanceSettings?.validationRules?.enforceCutoffTime,
        enforceEditTimeLimit: settings.attendanceSettings?.validationRules?.enforceEditTimeLimit,
        graceMode: auditSettings.graceMode
      }
    };

    // Log to database or external audit system
    // This is where you'd implement your audit logging
    // Audit log data processed
  }

  static async checkGraceMode(ruleName, settings) {
    const auditSettings = settings.attendanceSettings?.auditSettings || {};

    if (!auditSettings.graceMode) return false;

    // Check if rule was recently enabled (within grace period)
    const gracePeriodDays = auditSettings.gracePeriodDays || 30;
    const ruleEnabledDate =
      settings.attendanceSettings?.validationRules?.[`${ruleName}EnabledDate`];

    if (ruleEnabledDate) {
      const enabledDate = new Date(ruleEnabledDate);
      const currentDate = new Date();
      const daysDiff = (currentDate - enabledDate) / (1000 * 60 * 60 * 24);

      return daysDiff <= gracePeriodDays;
    }

    return true; // If no enabled date, assume grace mode
  }

  static async validateWithGraceMode(validationFunction, ruleName, ...args) {
    try {
      return await validationFunction(...args);
    } catch (error) {
      // Check if we're in grace mode for this rule
      const settings = args[args.length - 1]; // Last argument is usually settings
      const inGraceMode = await this.checkGraceMode(ruleName, settings);

      if (inGraceMode) {
        // Log the violation but don't throw error
        await this.logAttendanceAction(
          'grace_mode_violation',
          {
            rule: ruleName,
            error: error.message,
            action: 'logged_but_allowed'
          },
          settings
        );

        return true; // Allow the action
      }

      throw error; // Re-throw if not in grace mode
    }
  }
}

module.exports = AttendanceValidationService;
