const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');

class BaseService {
  /**
   * Execute service method with error handling
   */
  static async executeWithErrorHandling(operation, operationName = 'Operation') {
    try {
      return await operation();
    } catch (error) {
      logger.error(`${operationName} failed:`, error);

      if (error instanceof ApiError) {
        throw error;
      }

      // Handle Sequelize errors
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message).join(', ');
        throw new ApiError(400, `Validation failed: ${validationErrors}`);
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path || 'field';
        throw new ApiError(400, `${field} already exists`);
      }

      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new ApiError(400, 'Referenced record does not exist');
      }

      // Handle other database errors
      if (error.name === 'SequelizeDatabaseError') {
        logger.error('Database error:', error);
        throw new ApiError(500, 'Database operation failed');
      }

      // Default error handling
      logger.error('Unexpected error:', error);
      throw new ApiError(500, 'Internal server error');
    }
  }

  /**
   * Validate entity exists
   */
  static async validateEntityExists(model, id, entityName) {
    if (!id) return;

    const entity = await model.findByPk(id);
    if (!entity) {
      throw new ApiError(404, `${entityName} not found`);
    }
    return entity;
  }

  /**
   * Validate multiple entities exist
   */
  static async validateEntitiesExist(model, ids, entityName) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return;

    const entities = await model.findAll({
      where: { id: { [require('sequelize').Op.in]: ids } }
    });

    if (entities.length !== ids.length) {
      throw new ApiError(404, `One or more ${entityName} not found`);
    }

    return entities;
  }

  /**
   * Build pagination response
   */
  static buildPaginationResponse(data, page, limit, total, dataKey = null) {
    const response = {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };

    // If dataKey is provided, wrap data in an object with that key
    if (dataKey) {
      response[dataKey] = data;
    } else {
      // Default behavior - data directly in response
      response.data = data;
    }

    return response;
  }

  /**
   * Build search filter
   */
  static buildSearchFilter(searchTerm, searchFields) {
    if (!searchTerm || !searchFields || !Array.isArray(searchFields)) {
      return {};
    }

    const { Op } = require('sequelize');
    const searchConditions = searchFields.map(field => ({
      [field]: { [Op.iLike]: `%${searchTerm}%` }
    }));

    return { [Op.or]: searchConditions };
  }

  /**
   * Build date range filter
   */
  static buildDateRangeFilter(startDate, endDate, dateField = 'created_at') {
    if (!startDate && !endDate) return {};

    const { Op } = require('sequelize');
    const filter = {};

    if (startDate) {
      filter[Op.gte] = new Date(startDate);
    }

    if (endDate) {
      filter[Op.lte] = new Date(endDate);
    }

    return { [dateField]: filter };
  }

  /**
   * Sanitize pagination parameters
   */
  static sanitizePaginationParams(params) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 10));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Validate required fields
   */
  static validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter(
      field => data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missingFields.length > 0) {
      throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Validate data types
   */
  static validateDataTypes(data, typeValidations) {
    const errors = [];

    Object.keys(typeValidations).forEach(field => {
      const value = data[field];
      const expectedType = typeValidations[field];

      if (value !== undefined && value !== null) {
        if (expectedType === 'number' && isNaN(Number(value))) {
          errors.push(`${field} must be a number`);
        } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${field} must be a boolean`);
        } else if (expectedType === 'date' && isNaN(Date.parse(value))) {
          errors.push(`${field} must be a valid date`);
        } else if (expectedType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${field} must be a valid email`);
        }
      }
    });

    if (errors.length > 0) {
      throw new ApiError(400, `Validation errors: ${errors.join(', ')}`);
    }
  }

  /**
   * Format response data
   */
  static formatResponseData(data, includeFields = null, excludeFields = null) {
    if (Array.isArray(data)) {
      return data.map(item => this.formatResponseData(item, includeFields, excludeFields));
    }

    if (data && typeof data === 'object') {
      const formatted = {};

      Object.keys(data).forEach(key => {
        // Skip if field should be excluded
        if (excludeFields && excludeFields.includes(key)) {
          return;
        }

        // Include only specified fields
        if (includeFields && !includeFields.includes(key)) {
          return;
        }

        // Format nested objects
        if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
          formatted[key] = this.formatResponseData(data[key], includeFields, excludeFields);
        } else {
          formatted[key] = data[key];
        }
      });

      return formatted;
    }

    return data;
  }

  /**
   * Generate audit trail data
   */
  static generateAuditData(user, action) {
    return {
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date(),
      updated_at: new Date(),
      action,
      user_id: user.id,
      user_role: user.role,
      school_id: user.school_id,
      branch_id: user.branch_id
    };
  }

  /**
   * Check user permissions
   */
  static checkUserPermissions(user, requiredPermissions = []) {
    if (!user) {
      throw new ApiError(401, 'User not authenticated');
    }

    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(
        permission => user.permissions && user.permissions.includes(permission)
      );

      if (!hasPermission) {
        throw new ApiError(403, 'Insufficient permissions');
      }
    }
  }

  /**
   * Validate school/branch access
   */
  static validateSchoolBranchAccess(user, schoolId, branchId = null) {
    if (user.role === 'super_admin') {
      return true; // Super admin has access to everything
    }

    if (user.school_id !== schoolId) {
      throw new ApiError(403, 'Access denied to this school');
    }

    if (user.role === 'branch_admin' && branchId && user.branch_id !== branchId) {
      throw new ApiError(403, 'Access denied to this branch');
    }

    return true;
  }

  /**
   * Build where clause for school/branch filtering
   */
  static buildSchoolBranchWhereClause(user, additionalFilters = {}) {
    const whereClause = { ...additionalFilters };

    if (user.role === 'admin') {
      whereClause.school_id = user.school_id;
    } else if (user.role === 'branch_admin') {
      whereClause.school_id = user.school_id;
      whereClause.branch_id = user.branch_id;
    }

    return whereClause;
  }

  /**
   * Log service operation
   */
  static logOperation(operation, details = {}) {
    logger.info(`Service operation: ${operation}`, {
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Handle bulk operations with error tracking
   */
  static async executeBulkOperation(operation, items, operationName = 'Bulk Operation') {
    const results = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const result = await operation(items[i], i);
        results.push({
          index: i,
          success: true,
          data: result
        });
      } catch (error) {
        errors.push({
          index: i,
          success: false,
          error: error.message,
          item: items[i]
        });
      }
    }

    this.logOperation(operationName, {
      total: items.length,
      success: results.length,
      errors: errors.length
    });

    return {
      success_count: results.length,
      error_count: errors.length,
      results,
      errors
    };
  }

  /**
   * Get data from cache or execute function and cache result
   */
  static async getFromCache(cacheKey, fetchFunction, ttl = 600) {
    try {
      const RedisUtils = require('~/utils/shared/redis-utils');
      const cachedData = await RedisUtils.get(cacheKey);

      if (cachedData) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return cachedData;
      }

      logger.debug(`Cache miss for key: ${cacheKey}, executing function`);
      const data = await fetchFunction();

      if (data) {
        await RedisUtils.set(cacheKey, data, ttl);
        logger.debug(`Cached data for key: ${cacheKey}`);
      }

      return data;
    } catch (error) {
      logger.warn(`Cache operation failed for key: ${cacheKey}`, error.message);
      // Fallback to executing function without caching
      return await fetchFunction();
    }
  }

  /**
   * Clear cache for given keys
   */
  static async clearCache(keys) {
    try {
      const RedisUtils = require('~/utils/shared/redis-utils');

      if (Array.isArray(keys)) {
        for (const key of keys) {
          await RedisUtils.del(key);
          logger.debug(`Cleared cache key: ${key}`);
        }
      } else {
        await RedisUtils.del(keys);
        logger.debug(`Cleared cache key: ${keys}`);
      }
    } catch (error) {
      logger.warn(`Failed to clear cache for keys: ${keys}`, error.message);
    }
  }

  /**
   * Create settings object from uploaded files
   */
  static createSettingsFromFiles(files, additionalSettings = {}) {
    const settings = { ...additionalSettings };

    if (files) {
      Object.keys(files).forEach(key => {
        if (files[key] && files[key][0]) {
          settings[key] = files[key][0].filename || files[key][0].path;
        }
      });
    }

    return settings;
  }

  /**
   * Generate random password
   */
  static generateRandomPassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Build role-based where clause (from common-operations.service.js)
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
   * Build search query with multiple fields (from common-operations.service.js)
   */
  static buildSearchQuery(search, fields, baseWhere = {}) {
    if (!search || !fields || fields.length === 0) {
      return baseWhere;
    }

    const { Op } = require('sequelize');
    const searchConditions = fields.map(field => ({
      [field]: { [Op.iLike]: `%${search}%` }
    }));

    return {
      ...baseWhere,
      [Op.or]: searchConditions
    };
  }
}

module.exports = BaseService;
