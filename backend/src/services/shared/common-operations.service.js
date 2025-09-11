const { Op } = require('sequelize');
const { logger } = require('~/utils/logger');
const ApiError = require('~/utils/ApiError');

/**
 * Common Operations Service
 * Provides reusable utility functions for common database operations
 */
class CommonOperationsService {
  /**
   * Generic pagination helper
   */
  static getPaginationParams({ page = 1, limit = 10 }) {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    return {
      offset,
      limit: parseInt(limit),
      page: parseInt(page)
    };
  }

  /**
   * Build role-based where clause
   */
  static buildRoleBasedWhere(user) {
    const whereClause = {
      school_id: user.school_id
    };

    if (user.role === 'branch_admin') {
      whereClause.branch_id = user.branch_id;
    }

    return whereClause;
  }

  /**
   * Build search query with multiple fields
   */
  static buildSearchQuery(search, fields, baseWhere = {}) {
    if (!search || !fields || fields.length === 0) {
      return baseWhere;
    }

    const searchConditions = fields.map(field => ({
      [field]: { [Op.iLike]: `%${search}%` }
    }));

    return {
      ...baseWhere,
      [Op.or]: searchConditions
    };
  }

  /**
   * Build date range filter
   */
  static buildDateRangeFilter(startDate, endDate, fieldName = 'created_at') {
    const filter = {};

    if (startDate && endDate) {
      filter[fieldName] = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      filter[fieldName] = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      filter[fieldName] = {
        [Op.lte]: new Date(endDate)
      };
    }

    return filter;
  }

  /**
   * Build status filter
   */
  static buildStatusFilter(status, fieldName = 'status') {
    if (!status) return {};

    return {
      [fieldName]: status
    };
  }

  /**
   * Build class/section filter
   */
  static buildClassSectionFilter(classId, sectionId) {
    const filter = {};

    if (classId) {
      filter.class_id = classId;
    }

    if (sectionId) {
      filter.section_id = sectionId;
    }

    return filter;
  }

  /**
   * Build academic year filter
   */
  static buildAcademicYearFilter(academicYear, fieldName = 'academic_year') {
    if (!academicYear) return {};

    return {
      [fieldName]: academicYear
    };
  }

  /**
   * Generic find and count with pagination
   */
  static async findAndCountWithPagination(model, whereClause, options = {}) {
    const {
      page = 1,
      limit = 10,
      order = [['created_at', 'DESC']],
      include = [],
      attributes = null
    } = options;

    const { offset, limit: actualLimit } = this.getPaginationParams({
      page,
      limit
    });

    const queryOptions = {
      where: whereClause,
      limit: actualLimit,
      offset,
      order,
      include
    };

    if (attributes) {
      queryOptions.attributes = attributes;
    }

    const { count, rows } = await model.findAndCountAll(queryOptions);

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: actualLimit,
        totalPages: Math.ceil(count / actualLimit),
        hasNext: page < Math.ceil(count / actualLimit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Generic bulk create with validation
   */
  static async bulkCreateWithValidation(model, dataArray, validationFn = null, options = {}) {
    const { transaction = null, validateUnique = false, uniqueFields = [] } = options;

    const results = [];
    const errors = [];

    for (let i = 0; i < dataArray.length; i++) {
      try {
        const data = dataArray[i];

        // Run custom validation if provided
        if (validationFn) {
          await validationFn(data, i);
        }

        // Check for duplicates if required
        if (validateUnique && uniqueFields.length > 0) {
          const whereClause = {};
          uniqueFields.forEach(field => {
            whereClause[field] = data[field];
          });

          const existing = await model.findOne({
            where: whereClause,
            transaction
          });

          if (existing) {
            errors.push({
              index: i,
              data,
              error: `Duplicate entry found for fields: ${uniqueFields.join(', ')}`
            });
            continue;
          }
        }

        const created = await model.create(data, { transaction });
        results.push(created);
      } catch (error) {
        errors.push({
          index: i,
          data: dataArray[i],
          error: error.message
        });
      }
    }

    return {
      created: results,
      errors,
      successCount: results.length,
      errorCount: errors.length
    };
  }

  /**
   * Generic bulk update with validation
   */
  static async bulkUpdateWithValidation(model, updatesArray, validationFn = null, options = {}) {
    const { transaction = null, idField = 'id' } = options;

    const results = [];
    const errors = [];

    for (let i = 0; i < updatesArray.length; i++) {
      try {
        const updateData = updatesArray[i];
        const id = updateData[idField];

        if (!id) {
          errors.push({
            index: i,
            data: updateData,
            error: `Missing ${idField} field`
          });
          continue;
        }

        // Run custom validation if provided
        if (validationFn) {
          await validationFn(updateData, i);
        }

        // Remove id from update data
        const { [idField]: _, ...updateFields } = updateData;

        const updated = await model.update(updateFields, {
          where: { [idField]: id },
          returning: true,
          transaction
        });

        if (updated[0] === 0) {
          errors.push({
            index: i,
            data: updateData,
            error: 'Record not found or no changes made'
          });
        } else {
          results.push(updated[1][0]);
        }
      } catch (error) {
        errors.push({
          index: i,
          data: updatesArray[i],
          error: error.message
        });
      }
    }

    return {
      updated: results,
      errors,
      successCount: results.length,
      errorCount: errors.length
    };
  }

  /**
   * Generic soft delete
   */
  static async softDelete(model, ids, options = {}) {
    const {
      transaction = null,
      deletedBy = null,
      deletedAtField = 'deleted_at',
      deletedByField = 'deleted_by'
    } = options;

    const updateData = {
      [deletedAtField]: new Date()
    };

    if (deletedBy && deletedByField) {
      updateData[deletedByField] = deletedBy;
    }

    const whereClause = Array.isArray(ids) ? { id: { [Op.in]: ids } } : { id: ids };

    const result = await model.update(updateData, {
      where: whereClause,
      transaction
    });

    return {
      affectedRows: result[0],
      message: `${result[0]} record(s) deleted successfully`
    };
  }

  /**
   * Generic restore (undo soft delete)
   */
  static async restore(model, ids, options = {}) {
    const {
      transaction = null,
      deletedAtField = 'deleted_at',
      deletedByField = 'deleted_by'
    } = options;

    const updateData = {
      [deletedAtField]: null
    };

    if (deletedByField) {
      updateData[deletedByField] = null;
    }

    const whereClause = Array.isArray(ids) ? { id: { [Op.in]: ids } } : { id: ids };

    const result = await model.update(updateData, {
      where: whereClause,
      transaction
    });

    return {
      affectedRows: result[0],
      message: `${result[0]} record(s) restored successfully`
    };
  }

  /**
   * Generic export data to CSV
   */
  static async exportToCSV(model, whereClause, options = {}) {
    const {
      include = [],
      attributes = null,
      order = [['created_at', 'DESC']],
      filename = 'export',
      headers = [],
      fieldMappings = {}
    } = options;

    const queryOptions = {
      where: whereClause,
      include,
      order
    };

    if (attributes) {
      queryOptions.attributes = attributes;
    }

    const records = await model.findAll(queryOptions);

    if (records.length === 0) {
      return {
        csv: '',
        filename: `${filename}.csv`,
        recordCount: 0
      };
    }

    // Generate CSV headers
    const csvHeaders = headers.length > 0 ? headers : Object.keys(records[0].dataValues);

    // Generate CSV rows
    const csvRows = records.map(record => {
      return csvHeaders.map(header => {
        const fieldName = fieldMappings[header] || header;
        const value = this.getNestedValue(record.dataValues, fieldName);
        return this.escapeCSVValue(value);
      });
    });

    // Combine headers and rows
    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    return {
      csv: csvContent,
      filename: `${filename}-${new Date().toISOString().split('T')[0]}.csv`,
      recordCount: records.length
    };
  }

  /**
   * Get nested object value by path
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  /**
   * Escape CSV value
   */
  static escapeCSVValue(value) {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // If value contains comma, newline, or quote, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Generate unique code
   */
  static generateUniqueCode(prefix = '', length = 8) {
    const timestamp = Date.now().toString(36);
    const random = Math.random()
      .toString(36)
      .substr(2, length - timestamp.length);
    return `${prefix}${timestamp}${random}`.toUpperCase();
  }

  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Format currency
   */
  static formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Format date
   */
  static formatDate(date, format = 'YYYY-MM-DD', locale = 'en-US') {
    if (!date) return '';

    const d = new Date(date);

    switch (format) {
      case 'YYYY-MM-DD':
        return d.toISOString().split('T')[0];
      case 'DD/MM/YYYY':
        return d.toLocaleDateString(locale);
      case 'MM/DD/YYYY':
        return d.toLocaleDateString('en-US');
      case 'DD-MM-YYYY':
        return d.toLocaleDateString(locale).replace(/\//g, '-');
      default:
        return d.toLocaleDateString(locale);
    }
  }

  /**
   * Calculate age from date of birth
   */
  static calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Generate random password
   */
  static generatePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }

  /**
   * Convert bytes to human readable format
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Deep clone object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * Merge objects deeply
   */
  static deepMerge(target, source) {
    const result = this.deepClone(target);

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof result[key] === 'object' &&
          result[key] !== null &&
          !Array.isArray(result[key])
        ) {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * Retry function with exponential backoff
   */
  static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000, maxDelay = 10000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Debounce function
   */
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  /**
   * Throttle function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

module.exports = CommonOperationsService;
