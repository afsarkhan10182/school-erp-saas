/**
 * Query optimization service for the School ERP SaaS
 * Following Rule #5: Backend Optimization - Use Sequelize include/associations/joins
 */

const { Op } = require('sequelize');
const { logger } = require('~/utils/logger');

class QueryService {
  /**
   * Get optimized subject query with all associations
   * @param {Object} whereClause - Where conditions
   * @param {Object} options - Query options
   * @returns {Object} Optimized query configuration
   */
  static getSubjectQuery(whereClause = {}, options = {}) {
    const { limit = 10, offset = 0, order = [['name', 'ASC']] } = options;

    return {
      where: whereClause,
      include: [
        {
          model: require('~/models').School,
          as: 'school',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: require('~/models').Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: require('~/models').Class,
          as: 'class',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: require('~/models').User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name'],
          required: false
        },
        {
          model: require('~/models').User,
          as: 'updatedBy',
          attributes: ['id', 'first_name', 'last_name'],
          required: false
        }
      ],
      order,
      limit,
      offset,
      distinct: true
    };
  }

  /**
   * Get optimized subject-teacher query with all associations
   * @param {Object} whereClause - Where conditions
   * @param {Object} options - Query options
   * @returns {Object} Optimized query configuration
   */
  static getSubjectTeacherQuery(whereClause = {}, options = {}) {
    const { limit = 10, offset = 0, order = [['created_at', 'DESC']] } = options;

    return {
      where: whereClause,
      include: [
        {
          model: require('~/models').Subject,
          as: 'subject',
          attributes: ['id', 'name', 'code', 'category'],
          required: true
        },
        {
          model: require('~/models').User,
          as: 'teacher',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
          required: true
        },
        {
          model: require('~/models').Class,
          as: 'class',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: require('~/models').Section,
          as: 'section',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: require('~/models').School,
          as: 'school',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: require('~/models').Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      order,
      limit,
      offset,
      distinct: true
    };
  }

  /**
   * Get optimized student query with all associations
   * @param {Object} whereClause - Where conditions
   * @param {Object} options - Query options
   * @returns {Object} Optimized query configuration
   */
  static getStudentQuery(whereClause = {}, options = {}) {
    const { limit = 10, offset = 0, order = [['first_name', 'ASC']] } = options;

    return {
      where: whereClause,
      include: [
        {
          model: require('~/models').Class,
          as: 'class',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: require('~/models').Section,
          as: 'section',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: require('~/models').Stream,
          as: 'stream',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: require('~/models').School,
          as: 'school',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: require('~/models').Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: require('~/models').StudentParent,
          as: 'studentParents',
          attributes: ['id', 'relationship'],
          include: [{
            model: require('~/models').Parent,
            as: 'parent',
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
          }],
          required: false
        }
      ],
      order,
      limit,
      offset,
      distinct: true
    };
  }

  /**
   * Get optimized fee invoice query with all associations
   * @param {Object} whereClause - Where conditions
   * @param {Object} options - Query options
   * @returns {Object} Optimized query configuration
   */
  static getFeeInvoiceQuery(whereClause = {}, options = {}) {
    const { limit = 10, offset = 0, order = [['created_at', 'DESC']] } = options;

    return {
      where: whereClause,
      include: [
        {
          model: require('~/models').Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number'],
          include: [{
            model: require('~/models').Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }],
          required: true
        },
        {
          model: require('~/models').FeeStructure,
          as: 'feeStructure',
          attributes: ['id', 'name', 'academic_year'],
          include: [{
            model: require('~/models').FeeType,
            as: 'feeTypes',
            attributes: ['id', 'name', 'amount']
          }],
          required: false
        },
        {
          model: require('~/models').FeePayment,
          as: 'payments',
          attributes: ['id', 'amount', 'payment_date', 'payment_method', 'status'],
          required: false
        },
        {
          model: require('~/models').School,
          as: 'school',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: require('~/models').Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      order,
      limit,
      offset,
      distinct: true
    };
  }

  /**
   * Get optimized attendance query with all associations
   * @param {Object} whereClause - Where conditions
   * @param {Object} options - Query options
   * @returns {Object} Optimized query configuration
   */
  static getAttendanceQuery(whereClause = {}, options = {}) {
    const { limit = 10, offset = 0, order = [['date', 'DESC']] } = options;

    return {
      where: whereClause,
      include: [
        {
          model: require('~/models').Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number'],
          include: [{
            model: require('~/models').Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }],
          required: true
        },
        {
          model: require('~/models').AttendanceSession,
          as: 'attendanceSession',
          attributes: ['id', 'date', 'period', 'subject_id'],
          include: [{
            model: require('~/models').Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          }],
          required: true
        },
        {
          model: require('~/models').User,
          as: 'markedBy',
          attributes: ['id', 'first_name', 'last_name'],
          required: false
        }
      ],
      order,
      limit,
      offset,
      distinct: true
    };
  }

  /**
   * Get optimized exam query with all associations
   * @param {Object} whereClause - Where conditions
   * @param {Object} options - Query options
   * @returns {Object} Optimized query configuration
   */
  static getExamQuery(whereClause = {}, options = {}) {
    const { limit = 10, offset = 0, order = [['exam_date', 'DESC']] } = options;

    return {
      where: whereClause,
      include: [
        {
          model: require('~/models').Subject,
          as: 'subject',
          attributes: ['id', 'name', 'code'],
          required: true
        },
        {
          model: require('~/models').Class,
          as: 'class',
          attributes: ['id', 'name', 'code'],
          required: true
        },
        {
          model: require('~/models').ExamType,
          as: 'examType',
          attributes: ['id', 'name', 'description'],
          required: false
        },
        {
          model: require('~/models').User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name'],
          required: false
        },
        {
          model: require('~/models').School,
          as: 'school',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: require('~/models').Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      order,
      limit,
      offset,
      distinct: true
    };
  }

  /**
   * Get optimized user query with all associations
   * @param {Object} whereClause - Where conditions
   * @param {Object} options - Query options
   * @returns {Object} Optimized query configuration
   */
  static getUserQuery(whereClause = {}, options = {}) {
    const { limit = 10, offset = 0, order = [['first_name', 'ASC']] } = options;

    return {
      where: whereClause,
      include: [
        {
          model: require('~/models').School,
          as: 'school',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: require('~/models').Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      order,
      limit,
      offset,
      distinct: true
    };
  }

  /**
   * Build optimized search query with proper indexing
   * @param {string} searchTerm - Search term
   * @param {Array} searchFields - Fields to search in
   * @param {Object} additionalWhere - Additional where conditions
   * @returns {Object} Optimized search query
   */
  static buildOptimizedSearchQuery(searchTerm, searchFields = [], additionalWhere = {}) {
    if (!searchTerm || !searchFields.length) {
      return additionalWhere;
    }

    // Use full-text search for better performance on large datasets
    const searchConditions = searchFields.map(field => ({
      [field]: {
        [Op.iLike]: `%${searchTerm}%`
      }
    }));

    return {
      ...additionalWhere,
      [Op.or]: searchConditions
    };
  }

  /**
   * Build optimized date range query
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {string} dateField - Date field name
   * @param {Object} additionalWhere - Additional where conditions
   * @returns {Object} Optimized date range query
   */
  static buildOptimizedDateRangeQuery(startDate, endDate, dateField = 'created_at', additionalWhere = {}) {
    const dateConditions = {};

    if (startDate && endDate) {
      dateConditions[dateField] = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      dateConditions[dateField] = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      dateConditions[dateField] = {
        [Op.lte]: new Date(endDate)
      };
    }

    return {
      ...additionalWhere,
      ...dateConditions
    };
  }

  /**
   * Execute optimized query with error handling
   * @param {Object} Model - Sequelize model
   * @param {Object} queryConfig - Query configuration
   * @returns {Object} Query result
   */
  static async executeOptimizedQuery(Model, queryConfig) {
    try {
      const result = await Model.findAndCountAll(queryConfig);
      
      logger.debug(`Optimized query executed successfully for ${Model.name}`, {
        count: result.count,
        rows: result.rows.length
      });

      return result;
    } catch (error) {
      logger.error(`Error executing optimized query for ${Model.name}:`, error);
      throw error;
    }
  }
}

module.exports = QueryService;
