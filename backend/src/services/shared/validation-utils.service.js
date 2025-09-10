/**
 * Validation Utils Service - Essential validations only
 * No over-engineering, just what you need
 */
class ValidationUtilsService {
  /**
   * Validate required fields
   */
  static validateRequired(data, requiredFields) {
    const errors = [];
    requiredFields.forEach(field => {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push(`${field} is required`);
      }
    });
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate email
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate marks
   */
  static validateMarks(marks, maxMarks = 100) {
    const num = parseFloat(marks);
    if (isNaN(num) || num < 0 || num > maxMarks) {
      return false;
    }
    return true;
  }

  /**
   * Validate exam result data
   */
  static validateExamResult(data) {
    const errors = [];

    if (!data.student_id) {
      errors.push('Student ID is required');
    }

    if (data.marks_obtained !== undefined && data.marks_obtained !== null) {
      if (!this.validateMarks(data.marks_obtained)) {
        errors.push('Invalid marks value');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/<[^>]*>/g, ''); // Remove HTML tags
  }

  /**
   * Validate bulk exam results
   */
  static validateBulkExamResults(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return { isValid: false, errors: ['Data must be a non-empty array'] };
    }

    const errors = [];
    data.forEach((item, index) => {
      const validation = this.validateExamResult(item);
      if (!validation.isValid) {
        errors.push(`Item ${index + 1}: ${validation.errors.join(', ')}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }
}

module.exports = ValidationUtilsService;
