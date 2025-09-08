/**
 * Configuration service for the School ERP SaaS
 * Following Rule #7: Industry Standard & Configurable - No hardcoded values
 */

const { School, Branch } = require('~/models');
const { logger } = require('~/utils/logger');

class ConfigService {
  /**
   * Get school configuration
   * @param {string} schoolId - School ID
   * @returns {Object} School configuration
   */
  static async getSchoolConfig(schoolId) {
    try {
      const school = await School.findByPk(schoolId, {
        attributes: ['id', 'name', 'settings', 'current_academic_year_id']
      });

      if (!school) {
        throw new Error('School not found');
      }

      return {
        schoolId: school.id,
        schoolName: school.name,
        currentAcademicYearId: school.current_academic_year_id,
        settings: school.settings || {}
      };
    } catch (error) {
      logger.error('Error getting school config:', error);
      throw error;
    }
  }

  /**
   * Get academic year configuration
   * @param {string} schoolId - School ID
   * @returns {Object} Academic year configuration
   */
  static async getAcademicYearConfig(schoolId) {
    try {
      const school = await School.findByPk(schoolId, {
        attributes: ['starting_month', 'academic_year_start', 'current_academic_year_id'],
        include: [{
          model: require('~/models').AcademicYear,
          as: 'currentAcademicYear',
          attributes: ['id', 'name', 'start_date', 'end_date']
        }]
      });

      if (!school) {
        throw new Error('School not found');
      }

      return {
        startingMonth: school.starting_month || 6, // Default to June
        academicYearStart: school.academic_year_start || 'academic',
        currentAcademicYear: school.currentAcademicYear
      };
    } catch (error) {
      logger.error('Error getting academic year config:', error);
      throw error;
    }
  }

  /**
   * Get grading system configuration
   * @param {string} schoolId - School ID
   * @returns {Object} Grading system configuration
   */
  static async getGradingConfig(schoolId) {
    try {
      const { GradingSystem, GradeScale } = require('~/models');
      
      const gradingSystem = await GradingSystem.findOne({
        where: { school_id: schoolId, is_active: true },
        include: [{
          model: GradeScale,
          as: 'gradeScales',
          where: { is_active: true },
          required: false,
          order: [['min_marks', 'DESC']]
        }]
      });

      if (!gradingSystem) {
        // Return default grading system
        return this.getDefaultGradingConfig();
      }

      return {
        id: gradingSystem.id,
        name: gradingSystem.name,
        type: gradingSystem.type,
        gradeScales: gradingSystem.gradeScales || []
      };
    } catch (error) {
      logger.error('Error getting grading config:', error);
      return this.getDefaultGradingConfig();
    }
  }

  /**
   * Get default grading configuration
   * @returns {Object} Default grading configuration
   */
  static getDefaultGradingConfig() {
    return {
      id: null,
      name: 'Default Grading System',
      type: 'percentage',
      gradeScales: [
        { grade: 'A+', min_marks: 90, max_marks: 100, description: 'Excellent' },
        { grade: 'A', min_marks: 80, max_marks: 89, description: 'Very Good' },
        { grade: 'B+', min_marks: 70, max_marks: 79, description: 'Good' },
        { grade: 'B', min_marks: 60, max_marks: 69, description: 'Satisfactory' },
        { grade: 'C+', min_marks: 50, max_marks: 59, description: 'Average' },
        { grade: 'C', min_marks: 40, max_marks: 49, description: 'Below Average' },
        { grade: 'F', min_marks: 0, max_marks: 39, description: 'Fail' }
      ]
    };
  }

  /**
   * Get fee configuration
   * @param {string} schoolId - School ID
   * @returns {Object} Fee configuration
   */
  static async getFeeConfig(schoolId) {
    try {
      const { FeeType } = require('~/models');
      
      const feeTypes = await FeeType.findAll({
        where: { school_id: schoolId, is_active: true },
        order: [['name', 'ASC']]
      });

      return {
        feeTypes: feeTypes || [],
        currency: 'INR', // This should come from school settings
        dueDateGracePeriod: 7, // Days after due date before late fee
        lateFeePercentage: 5 // Percentage of late fee
      };
    } catch (error) {
      logger.error('Error getting fee config:', error);
      return {
        feeTypes: [],
        currency: 'INR',
        dueDateGracePeriod: 7,
        lateFeePercentage: 5
      };
    }
  }

  /**
   * Get attendance configuration
   * @param {string} schoolId - School ID
   * @returns {Object} Attendance configuration
   */
  static async getAttendanceConfig(schoolId) {
    try {
      const school = await School.findByPk(schoolId, {
        attributes: ['settings']
      });

      const settings = school?.settings || {};
      
      return {
        workingDays: settings.working_days || {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },
        enforceWorkingDays: settings.enforce_working_days || false,
        attendancePercentage: settings.attendance_percentage || 75,
        autoMarkAbsent: settings.auto_mark_absent || true
      };
    } catch (error) {
      logger.error('Error getting attendance config:', error);
      return {
        workingDays: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },
        enforceWorkingDays: false,
        attendancePercentage: 75,
        autoMarkAbsent: true
      };
    }
  }

  /**
   * Get notification configuration
   * @param {string} schoolId - School ID
   * @returns {Object} Notification configuration
   */
  static async getNotificationConfig(schoolId) {
    try {
      const school = await School.findByPk(schoolId, {
        attributes: ['settings']
      });

      const settings = school?.settings || {};
      
      return {
        emailEnabled: settings.email_notifications !== false,
        smsEnabled: settings.sms_notifications || false,
        pushEnabled: settings.push_notifications !== false,
        defaultLanguage: settings.default_language || 'en',
        timezone: settings.timezone || 'Asia/Kolkata',
        notificationTemplates: settings.notification_templates || {}
      };
    } catch (error) {
      logger.error('Error getting notification config:', error);
      return {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        defaultLanguage: 'en',
        timezone: 'Asia/Kolkata',
        notificationTemplates: {}
      };
    }
  }

  /**
   * Get subject categories configuration
   * @returns {Array} Subject categories
   */
  static getSubjectCategories() {
    return [
      { value: 'core', label: 'Core', description: 'Core academic subjects' },
      { value: 'elective', label: 'Elective', description: 'Optional subjects' },
      { value: 'extra_curricular', label: 'Extra Curricular', description: 'Non-academic activities' },
      { value: 'language', label: 'Language', description: 'Language subjects' },
      { value: 'science', label: 'Science', description: 'Science subjects' },
      { value: 'arts', label: 'Arts', description: 'Arts and humanities' },
      { value: 'commerce', label: 'Commerce', description: 'Commerce subjects' }
    ];
  }

  /**
   * Get day types configuration
   * @returns {Array} Day types
   */
  static getDayTypes() {
    return [
      { value: 'working', label: 'Working Day', description: 'Regular working day' },
      { value: 'holiday', label: 'Holiday', description: 'Public or school holiday' },
      { value: 'weekend', label: 'Weekend', description: 'Weekend day' },
      { value: 'exam', label: 'Exam Day', description: 'Examination day' },
      { value: 'event', label: 'Event', description: 'Special event day' }
    ];
  }

  /**
   * Get user roles configuration
   * @returns {Array} User roles
   */
  static getUserRoles() {
    return [
      { value: 'super_admin', label: 'Super Admin', description: 'System administrator' },
      { value: 'school_admin', label: 'School Admin', description: 'School administrator' },
      { value: 'branch_admin', label: 'Branch Admin', description: 'Branch administrator' },
      { value: 'teacher', label: 'Teacher', description: 'Teaching staff' },
      { value: 'student', label: 'Student', description: 'Student' },
      { value: 'parent', label: 'Parent', description: 'Parent/Guardian' }
    ];
  }

  /**
   * Get status options configuration
   * @param {string} type - Status type
   * @returns {Array} Status options
   */
  static getStatusOptions(type = 'general') {
    const statusOptions = {
      general: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'red' },
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'completed', label: 'Completed', color: 'blue' },
        { value: 'cancelled', label: 'Cancelled', color: 'gray' }
      ],
      academic: [
        { value: 'passed', label: 'Passed', color: 'green' },
        { value: 'failed', label: 'Failed', color: 'red' },
        { value: 'absent', label: 'Absent', color: 'gray' },
        { value: 'present', label: 'Present', color: 'green' }
      ],
      financial: [
        { value: 'paid', label: 'Paid', color: 'green' },
        { value: 'unpaid', label: 'Unpaid', color: 'red' },
        { value: 'partial', label: 'Partial', color: 'yellow' },
        { value: 'overdue', label: 'Overdue', color: 'red' }
      ]
    };

    return statusOptions[type] || statusOptions.general;
  }

  /**
   * Update school configuration
   * @param {string} schoolId - School ID
   * @param {Object} config - Configuration to update
   * @returns {Object} Updated configuration
   */
  static async updateSchoolConfig(schoolId, config) {
    try {
      const school = await School.findByPk(schoolId);
      
      if (!school) {
        throw new Error('School not found');
      }

      const currentSettings = school.settings || {};
      const updatedSettings = { ...currentSettings, ...config };

      await school.update({ settings: updatedSettings });

      logger.info(`School configuration updated for school ${schoolId}`);

      return updatedSettings;
    } catch (error) {
      logger.error('Error updating school config:', error);
      throw error;
    }
  }
}

module.exports = ConfigService;
