const { Op } = require('sequelize');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');
const RedisUtils = require('../../utils/redis-utils');

class BaseService {
  // Common file upload handling
  static handleFileUploads(uploadedFiles = {}, fileFields = ['system_logo', 'text_logo', 'printing_logo', 'report_card_design']) {
    const fileData = {};
    fileFields.forEach(field => {
      if (uploadedFiles[field]) {
        fileData[field] = uploadedFiles[field].filename;
      }
    });
    return fileData;
  }

  // Common settings object creation from file uploads
  static createSettingsFromFiles(uploadedFiles = {}, additionalSettings = {}) {
    const settings = {
      ...additionalSettings
    };

    if (uploadedFiles.system_logo) {
      settings.system_logo = `/uploads/${uploadedFiles.system_logo.filename}`;
    }
    if (uploadedFiles.text_logo) {
      settings.text_logo = `/uploads/${uploadedFiles.text_logo.filename}`;
    }
    if (uploadedFiles.printing_logo) {
      settings.printing_logo = `/uploads/${uploadedFiles.printing_logo.filename}`;
    }
    if (uploadedFiles.report_card_design) {
      settings.report_card_design = `/uploads/${uploadedFiles.report_card_design.filename}`;
    }

    return settings;
  }

  // Common pagination logic
  static buildPaginationParams({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    return { page: parseInt(page), limit: parseInt(limit), offset };
  }

  // Common search filter builder
  static buildSearchFilter(search, searchFields) {
    if (!search) return {};
    
    const searchConditions = searchFields.map(field => ({
      [field]: { [Op.iLike]: `%${search}%` }
    }));
    
    return { [Op.or]: searchConditions };
  }

  // Common pagination response builder
  static buildPaginationResponse(rows, count, page, limit, dataKey = 'items') {
    return {
      [dataKey]: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    };
  }

  // Common cache management
  static async clearCache(keys) {
    try {
      if (Array.isArray(keys)) {
        await RedisUtils.del(...keys);
      } else {
        await RedisUtils.del(keys);
      }
      logger.debug(`Cache cleared for keys: ${Array.isArray(keys) ? keys.join(', ') : keys}`);
    } catch (error) {
      logger.warn('Failed to clear cache:', error.message);
    }
  }

  // Common cache get with fallback
  static async getFromCache(cacheKey, fetchFunction, ttl = 600) {
    try {
      const cached = await RedisUtils.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return cached;
      }

      logger.debug(`Cache miss for key: ${cacheKey}`);
      const data = await fetchFunction();
      
      if (data) {
        await RedisUtils.set(cacheKey, data, ttl);
      }
      
      return data;
    } catch (error) {
      logger.warn(`Cache operation failed for key: ${cacheKey}`, error.message);
      return await fetchFunction();
    }
  }

  // Common entity validation
  static async validateEntityExists(model, id, entityName = 'Entity') {
    const entity = await model.findByPk(id);
    if (!entity) {
      throw new ApiError(404, `${entityName} not found`);
    }
    return entity;
  }

  // Common email validation
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new ApiError(400, 'Please provide a valid email address');
    }
  }

  // Common email uniqueness check
  static async validateEmailUniqueness(model, email, excludeId = null, additionalWhere = {}) {
    const whereClause = { email, ...additionalWhere };
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const existingUser = await model.findOne({ where: whereClause });
    if (existingUser) {
      throw new ApiError(400, 'Email already exists');
    }
  }

  // Common error wrapper
  static async executeWithErrorHandling(operation, operationName) {
    try {
      return await operation();
    } catch (error) {
      logger.error(`Error in ${operationName}:`, error);
      throw error;
    }
  }

  // Common transaction wrapper
  static async executeInTransaction(sequelize, operation, operationName) {
    const transaction = await sequelize.transaction();
    try {
      const result = await operation(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      logger.error(`Error in ${operationName} transaction:`, error);
      throw error;
    }
  }

  // Common soft delete logic
  static async softDelete(model, id, entityName = 'Entity') {
    const entity = await this.validateEntityExists(model, id, entityName);
    await entity.update({ 
      status: 'inactive',
      deleted_at: new Date()
    });
    return true;
  }

  // Common status validation
  static validateStatus(status, allowedStatuses = ['active', 'inactive']) {
    if (status && !allowedStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`);
    }
  }

  // Common role validation
  static validateRole(role, allowedRoles) {
    if (role && !allowedRoles.includes(role)) {
      throw new ApiError(400, `Invalid role. Allowed values: ${allowedRoles.join(', ')}`);
    }
  }

  // Common date validation
  static validateDate(dateString, fieldName = 'Date') {
    if (dateString) {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new ApiError(400, `Invalid ${fieldName.toLowerCase()} format`);
      }
    }
  }

  // Common phone validation
  static validatePhone(phone) {
    if (phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(phone)) {
        throw new ApiError(400, 'Please provide a valid phone number');
      }
    }
  }

  // Common password generation
  static generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}

module.exports = BaseService;
