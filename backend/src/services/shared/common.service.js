/**
 * Common service for shared operations across the School ERP SaaS
 * Following Rule #2: Move all common/repeated logic into services
 * Following Rule #6: Small, focused functions with single responsibility
 */

const { Op } = require('sequelize');
const { logger } = require('~/utils/shared/logger');

class CommonService {
  /**
   * Generic pagination helper
   * @param {Object} options - Pagination options
   * @returns {Object} Pagination parameters
   */
  static getPaginationParams(options = {}) {
    const { page = 1, limit = 10, maxLimit = 100 } = options;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const actualLimit = Math.min(parseInt(limit), maxLimit);

    return {
      offset,
      limit: actualLimit,
      page: parseInt(page)
    };
  }

  /**
   * Build where clause for role-based access control
   * @param {Object} user - User object
   * @param {Object} additionalWhere - Additional where conditions
   * @returns {Object} Where clause
   */
  static buildRoleBasedWhere(user, additionalWhere = {}) {
    let whereClause = { ...additionalWhere };

    switch (user.role) {
      case 'super_admin':
        // Super admin can see all data
        break;
      case 'admin':
        whereClause.school_id = user.school_id;
        break;
      case 'branch_admin':
        whereClause.school_id = user.school_id;
        whereClause.branch_id = user.branch_id;
        break;
      default:
        // For other roles, add appropriate restrictions
        whereClause.school_id = user.school_id;
        if (user.branch_id) {
          whereClause.branch_id = user.branch_id;
        }
    }

    return whereClause;
  }

  /**
   * Build search conditions for text fields
   * @param {string} searchTerm - Search term
   * @param {Array} fields - Fields to search in
   * @returns {Object} Search conditions
   */
  static buildSearchConditions(searchTerm, fields = []) {
    if (!searchTerm || !fields.length) {
      return {};
    }

    return {
      [Op.or]: fields.map(field => ({
        [field]: {
          [Op.iLike]: `%${searchTerm}%`
        }
      }))
    };
  }

  /**
   * Build date range conditions
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {string} field - Date field name
   * @returns {Object} Date range conditions
   */
  static buildDateRangeConditions(startDate, endDate, field = 'created_at') {
    const conditions = {};

    if (startDate && endDate) {
      conditions[field] = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      conditions[field] = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      conditions[field] = {
        [Op.lte]: endDate
      };
    }

    return conditions;
  }

  /**
   * Calculate pagination metadata
   * @param {number} total - Total count
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Object} Pagination metadata
   */
  static calculatePaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Generate unique code
   * @param {string} prefix - Code prefix
   * @param {number} length - Code length (excluding prefix)
   * @returns {string} Generated code
   */
  static generateUniqueCode(prefix = '', length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * Validate date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Object} Validation result
   */
  static validateDateRange(startDate, endDate) {
    const errors = [];

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime())) {
        errors.push('Invalid start date format');
      }

      if (isNaN(end.getTime())) {
        errors.push('Invalid end date format');
      }

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start >= end) {
        errors.push('Start date must be before end date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format error response
   * @param {string} message - Error message
   * @param {Array} errors - Detailed errors
   * @param {number} statusCode - HTTP status code
   * @returns {Object} Formatted error response
   */
  static formatErrorResponse(message, errors = [], statusCode = 400) {
    return {
      success: false,
      message,
      errors,
      statusCode
    };
  }

  /**
   * Format success response
   * @param {string} message - Success message
   * @param {any} data - Response data
   * @param {Object} meta - Additional metadata
   * @returns {Object} Formatted success response
   */
  static formatSuccessResponse(message, data = null, meta = {}) {
    return {
      success: true,
      message,
      data,
      ...meta
    };
  }

  /**
   * Check if user has permission for action
   * @param {Object} user - User object
   * @param {string} action - Action to check
   * @param {string} resource - Resource type
   * @returns {boolean} Has permission
   */
  static hasPermission(user, action, resource) {
    const permissions = {
      super_admin: ['*'], // All permissions
      admin: ['read', 'create', 'update', 'delete'],
      branch_admin: ['read', 'create', 'update'],
      teacher: ['read'],
      student: ['read'],
      parent: ['read']
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(action);
  }

  /**
   * Sanitize input data
   * @param {Object} data - Input data
   * @param {Array} allowedFields - Allowed fields
   * @returns {Object} Sanitized data
   */
  static sanitizeInput(data, allowedFields = []) {
    if (!allowedFields.length) {
      return data;
    }

    const sanitized = {};
    allowedFields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        sanitized[field] = data[field];
      }
    });

    return sanitized;
  }

  /**
   * Calculate academic year from date
   * @param {Date|string} date - Date to calculate from
   * @param {number} startMonth - Academic year start month (1-12)
   * @returns {string} Academic year in YYYY-YYYY format
   */
  static calculateAcademicYear(date, startMonth = 6) {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // getMonth() returns 0-11

    if (month >= startMonth) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  /**
   * Get current academic year
   * @param {number} startMonth - Academic year start month
   * @returns {string} Current academic year
   */
  static getCurrentAcademicYear(startMonth = 6) {
    return this.calculateAcademicYear(new Date(), startMonth);
  }

  /**
   * Log operation for audit trail
   * @param {string} operation - Operation type
   * @param {string} resource - Resource type
   * @param {string} resourceId - Resource ID
   * @param {Object} user - User performing operation
   * @param {Object} changes - Changes made (for updates)
   */
  static logOperation(operation, resource, resourceId, user, changes = null) {
    const logData = {
      operation,
      resource,
      resourceId,
      userId: user.id,
      userRole: user.role,
      schoolId: user.school_id,
      branchId: user.branch_id,
      timestamp: new Date().toISOString(),
      changes
    };

    logger.info('Operation logged', logData);
  }
}

module.exports = CommonService;
