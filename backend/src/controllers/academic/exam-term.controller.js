/**
 * Term Controller
 * Handles academic term/semester management
 */

const { Op } = require('sequelize');
const { Term, School, Branch } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const { apiResponse } = require('~/utils/shared/apiResponse');
const CommonService = require('~/services/shared/common.service');
const QueryService = require('~/services/shared/query.service');

class ExamTermController {
  /**
   * Get all terms with filtering and pagination
   */
  static async getAllTerms(req, res, next) {
    try {
      const { page = 1, limit = 10, academic_year_id = '', status = '', search = '' } = req.query;

      // Get pagination parameters using common service
      const { offset, limit: actualLimit } = CommonService.getPaginationParams({ page, limit });

      // Build role-based where clause using common service
      let whereClause = CommonService.buildRoleBasedWhere(req.user);

      // Add filters
      if (academic_year_id) {
        whereClause.academic_year_id = academic_year_id;
      }

      if (status) {
        whereClause.status = status;
      }

      // Build optimized search query
      if (search) {
        whereClause = QueryService.buildOptimizedSearchQuery(
          search,
          ['name', 'description'],
          whereClause
        );
      }

      const { count, rows } = await Term.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
            required: false
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        limit: actualLimit,
        offset: offset,
        distinct: true
      });

      // Calculate pagination metadata using common service
      const paginationMeta = CommonService.calculatePaginationMeta(
        count,
        parseInt(page),
        actualLimit
      );

      logger.info(`getAllTerms: Retrieved ${rows.length} terms out of ${count} total`);

      return res.status(200).json(
        CommonService.formatSuccessResponse('Terms retrieved successfully', {
          terms: rows,
          pagination: paginationMeta
        })
      );
    } catch (error) {
      logger.error('Error in getAllTerms:', error);
      return next(error);
    }
  }

  /**
   * Get term by ID
   */
  static async getTermById(req, res, next) {
    try {
      const { id } = req.params;

      let whereClause = { id };

      // Add role-based access control
      if (req.user.role === 'admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      const term = await Term.findOne({
        where: whereClause,
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
            required: false
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
            required: false
          }
        ]
      });

      if (!term) {
        throw new ApiError(404, 'Term not found');
      }

      return res.status(200).json(
        CommonService.formatSuccessResponse('Term retrieved successfully', {
          term
        })
      );
    } catch (error) {
      logger.error('Error in getTermById:', error);
      return next(error);
    }
  }

  /**
   * Create new term
   */
  static async createTerm(req, res, next) {
    try {
      // Handle simplified payload
      const termData = {
        ...req.body,
        school_id: req.user.school_id,
        created_by: req.user.id,
        updated_by: req.user.id
      };

      // Check for duplicate term name within the same branch
      const existingTerm = await Term.findOne({
        where: {
          name: termData.name,
          branch_id: termData.branch_id,
          school_id: req.user.school_id
        }
      });

      if (existingTerm) {
        throw new ApiError(409, 'A term with this name already exists in the selected branch');
      }

      // Set defaults for optional fields if not provided
      if (!termData.code) {
        termData.code = null;
      }
      if (!termData.description) {
        termData.description = '';
      }
      if (!termData.start_date) {
        termData.start_date = null;
      }
      if (!termData.end_date) {
        termData.end_date = null;
      }
      if (!termData.academic_year) {
        termData.academic_year = null;
      }
      if (!termData.is_active) {
        termData.is_active = true;
      }

      const term = await Term.create(termData);

      return res
        .status(201)
        .json(CommonService.formatSuccessResponse('Exam term created successfully', { term }));
    } catch (error) {
      logger.error('Error in createTerm:', error);
      return next(error);
    }
  }

  /**
   * Update term
   */
  static async updateTerm(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, start_date, end_date, status } = req.body;

      let whereClause = { id };

      // Add role-based access control
      if (req.user.role === 'admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      const term = await Term.findOne({ where: whereClause });
      if (!term) {
        throw new ApiError(404, 'Term not found');
      }

      // Validate date range if dates are being updated
      if (start_date && end_date) {
        const dateValidation = CommonService.validateDateRange(start_date, end_date);
        if (!dateValidation.isValid) {
          throw new ApiError(400, dateValidation.errors.join(', '));
        }

        // Check for overlapping terms (excluding current term)
        const overlappingTerm = await Term.findOne({
          where: {
            academic_year_id: term.academic_year_id,
            school_id: req.user.school_id,
            branch_id: req.user.branch_id || null,
            id: { [Op.ne]: id },
            [Op.or]: [
              {
                start_date: { [Op.between]: [start_date, end_date] }
              },
              {
                end_date: { [Op.between]: [start_date, end_date] }
              },
              {
                [Op.and]: [
                  { start_date: { [Op.lte]: start_date } },
                  { end_date: { [Op.gte]: end_date } }
                ]
              }
            ]
          }
        });

        if (overlappingTerm) {
          throw new ApiError(400, 'Term dates overlap with existing term');
        }
      }

      // Check for duplicate term name if name is being updated
      if (name && name !== term.name) {
        const existingTerm = await Term.findOne({
          where: {
            name: name,
            branch_id: term.branch_id,
            school_id: req.user.school_id,
            id: { [Op.ne]: id } // Exclude current term
          }
        });

        if (existingTerm) {
          throw new ApiError(409, 'A term with this name already exists in the selected branch');
        }
      }

      // Update the term
      await term.update({
        name: name || term.name,
        description: description !== undefined ? description : term.description,
        start_date: start_date || term.start_date,
        end_date: end_date || term.end_date,
        status: status || term.status,
        updated_by: req.user.id
      });

      // Log the operation
      CommonService.logOperation('update', 'term', id, req.user, {
        name,
        start_date,
        end_date,
        status
      });

      return res.status(200).json(
        CommonService.formatSuccessResponse('Term updated successfully', {
          term
        })
      );
    } catch (error) {
      logger.error('Error in updateTerm:', error);
      return next(error);
    }
  }

  /**
   * Delete term
   */
  static async deleteTerm(req, res, next) {
    try {
      const { id } = req.params;

      let whereClause = { id };

      // Add role-based access control
      if (req.user.role === 'admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      const term = await Term.findOne({ where: whereClause });
      if (!term) {
        throw new ApiError(404, 'Term not found');
      }

      // Check if term is currently active
      if (term.status === 'active') {
        throw new ApiError(400, 'Cannot delete an active term');
      }

      // Check if term has associated data (exams, attendance, etc.)
      // This would require checking related tables
      // For now, we'll allow deletion but log it

      // Delete the term
      await term.destroy();

      // Log the operation
      CommonService.logOperation('delete', 'term', id, req.user);

      return res.status(200).json(CommonService.formatSuccessResponse('Term deleted successfully'));
    } catch (error) {
      logger.error('Error in deleteTerm:', error);
      return next(error);
    }
  }

  /**
   * Get terms for a specific academic year
   */
  static async getTermsByAcademicYear(req, res, next) {
    try {
      const { academic_year_id } = req.params;

      if (!academic_year_id) {
        throw new ApiError(400, 'Academic year ID is required');
      }

      let whereClause = { academic_year: academic_year_id };

      // Add role-based access control
      if (req.user.role === 'admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      const terms = await Term.findAll({
        where: whereClause,
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
            required: false
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json(
        CommonService.formatSuccessResponse('Terms retrieved successfully', {
          terms
        })
      );
    } catch (error) {
      logger.error('Error in getTermsByAcademicYear:', error);
      return next(error);
    }
  }

  /**
   * Get current active term
   */
  static async getCurrentTerm(req, res, next) {
    try {
      const { academic_year_id } = req.query;

      let whereClause = { is_active: true };

      // Add role-based access control
      if (req.user.role === 'admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      if (academic_year_id) {
        whereClause.academic_year = academic_year_id;
      }

      const term = await Term.findOne({
        where: whereClause,
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
            required: false
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json(
        CommonService.formatSuccessResponse('Current term retrieved successfully', {
          term
        })
      );
    } catch (error) {
      logger.error('Error in getCurrentTerm:', error);
      return next(error);
    }
  }
}

module.exports = ExamTermController;
