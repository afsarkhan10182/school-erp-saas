const { School, User, Branch } = require('../models');
const { Op, Sequelize } = require('sequelize');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');
const sequelize = require('../config/database'); // Update the path to the database config

class SchoolService {
  // Utility: Check if a module is enabled for a school
  static isModuleEnabled(school, moduleName) {
    if (!school || !Array.isArray(school.modules)) return false;
    return school.modules.includes(moduleName);
  }

  // Create a new school
  static async createSchool(schoolData) {
    logger.info('Creating school with data:', JSON.stringify(schoolData, null, 2));
    try {
      // Check if school with same code or email already exists
      const existingSchool = await School.findOne({
        where: {
          [Op.or]: [
            { code: schoolData.code },
            { email: schoolData.email }
          ]
        }
      });

      if (existingSchool) {
        if (existingSchool.code === schoolData.code) {
          throw new ApiError(400, 'School with this code already exists');
        }
        if (existingSchool.email === schoolData.email) {
          throw new ApiError(400, 'School with this email already exists');
        }
      }

      // Create the school within a transaction
      const transaction = await sequelize.transaction();
      
      try {
        logger.debug('Starting transaction for school creation');
        const school = await School.create(schoolData, { 
          transaction,
          logging: (sql) => logger.debug('Executing SQL:', sql)
        });
        
        await transaction.commit();
        logger.info(`School created successfully: ${school.name} (${school.id})`);
        return school;
      } catch (error) {
        logger.error('Error during school creation transaction:', {
          error: error.message,
          name: error.name,
          stack: error.stack,
          ...(error.errors && { errors: error.errors }),
          ...(error.original && { original: error.original })
        });
        
        if (transaction.finished !== 'commit') {
          await transaction.rollback();
          logger.info('Transaction rolled back');
        }
        
        // Re-throw the error with more context
        const enhancedError = new Error(`Failed to create school: ${error.message}`);
        enhancedError.original = error;
        throw enhancedError;
      }
    } catch (error) {
      // Enhanced error logging with complete error object
      const errorContext = {
        message: error.message,
        name: error.name,
        code: error.code,
        sql: error.sql,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        ...(error.errors && { 
          errors: error.errors.map(e => ({
            message: e.message,
            type: e.type,
            path: e.path,
            value: e.value,
            instance: e.instance,
            validatorKey: e.validatorKey,
            validatorName: e.validatorName,
            validatorArgs: e.validatorArgs
          }))
        }),
        ...(error.original && { 
          original: {
            message: error.original.message,
            code: error.original.code,
            sql: error.original.sql,
            sqlState: error.original.sqlState,
            sqlMessage: error.original.sqlMessage
          } 
        }),
        stack: error.stack
      };
      
      // Log the complete error object
      logger.error('Error in SchoolService.createSchool:', {
        ...errorContext,
        // Stringify the entire error object to catch any non-enumerable properties
        completeError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle database validation errors
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors?.map(err => ({
          field: err.path,
          message: err.message,
          type: err.type,
          value: err.value
        })) || [{ message: 'Database validation error' }];
        
        const errorMessage = messages.map(m => `${m.field}: ${m.message}`).join(', ');
        const apiError = new ApiError(400, errorMessage);
        apiError.errors = messages;
        throw apiError;
      }
      
      // Handle database connection errors
      if (error.name === 'SequelizeConnectionError') {
        throw new ApiError(503, 'Database connection error. Please try again later.');
      }
      
      // Handle other database errors
      if (error.name && error.name.startsWith('Sequelize')) {
        throw new ApiError(500, 'Database operation failed');
      }
      
      // Default error
      throw new ApiError(500, 'Failed to create school', { originalError: error });
    }
  }

  // Get all schools with pagination and filtering
  static async getAllSchools({ page = 1, limit = 10, search, status }) {
    try {
      const offset = (page - 1) * limit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status) {
        where.status = status;
      }

      const { count, rows } = await School.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name', 'email'],
            required: false, // Make this a left join instead of inner join
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
        distinct: true, // Ensure correct count when using includes
      });

      return {
        schools: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error in SchoolService.getAllSchools:', error);
      throw error;
    }
  }

  // Get school by ID with access control
  static async getSchoolById(id, user) {
    try {
      const school = await School.findByPk(id, {
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name', 'email'],
          },
          {
            model: Branch,
            as: 'branches',
            attributes: ['id', 'name', 'code', 'status'],
          },
        ],
      });

      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      // Access control: School Admin can only access their own school
      if (user.role === 'school_admin' && user.school_id !== id) {
        throw new ApiError(403, 'Access denied');
      }

      return school;
    } catch (error) {
      logger.error('Error in SchoolService.getSchoolById:', error);
      throw error;
    }
  }

  // Update school
  static async updateSchool(id, updateData) {
    try {
      const school = await School.findByPk(id);
      
      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      await school.update(updateData);
      
      logger.info(`School updated: ${school.name} (${school.id})`);
      return school;
    } catch (error) {
      logger.error('Error in SchoolService.updateSchool:', error);
      throw error;
    }
  }

  // Delete school (soft delete)
  static async deleteSchool(id) {
    try {
      const school = await School.findByPk(id);
      
      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      // Check if school has active users
      const activeUsers = await User.count({
        where: { school_id: id, status: 'active' },
      });

      if (activeUsers > 0) {
        throw new ApiError(400, 'Cannot delete school with active users');
      }

      // Soft delete by setting status to inactive
      await school.update({ status: 'inactive' });
      
      logger.info(`School deleted: ${school.name} (${school.id})`);
      return true;
    } catch (error) {
      logger.error('Error in SchoolService.deleteSchool:', error);
      throw error;
    }
  }

  // Get school statistics
  static async getSchoolStats(schoolId) {
    try {
      const [userCount, branchCount] = await Promise.all([
        User.count({ where: { school_id: schoolId } }),
        Branch.count({ where: { school_id: schoolId } }),
      ]);

      return {
        totalUsers: userCount,
        totalBranches: branchCount,
      };
    } catch (error) {
      logger.error('Error in SchoolService.getSchoolStats:', error);
      throw error;
    }
  }
}

module.exports = SchoolService; 