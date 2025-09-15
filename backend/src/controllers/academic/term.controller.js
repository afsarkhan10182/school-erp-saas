/**
 * Term Controller
 * Handles academic term/semester management
 */

const { Op } = require('sequelize');
const { Term, AcademicYear, School, Branch } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const { apiResponse } = require('~/utils/shared/apiResponse');
const CommonService = require('~/services/shared/common.service');
const QueryService = require('~/services/shared/query.service');

class TermController {
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
            model: AcademicYear,
            as: 'academicYear',
            attributes: ['id', 'name', 'start_date', 'end_date'],
            required: true
          },
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
        order: [['start_date', 'ASC']],
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
      if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      const term = await Term.findOne({
        where: whereClause,
        include: [
          {
            model: AcademicYear,
            as: 'academicYear',
            attributes: ['id', 'name', 'start_date', 'end_date'],
            required: true
          },
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
      const {
        name,
        description,
        start_date,
        end_date,
        academic_year_id,
        status = 'upcoming'
      } = req.body;

      // Validate required fields
      if (!name || !start_date || !end_date || !academic_year_id) {
        throw new ApiError(400, 'Name, start_date, end_date, and academic_year_id are required');
      }

      // Validate date range
      const dateValidation = CommonService.validateDateRange(start_date, end_date);
      if (!dateValidation.isValid) {
        throw new ApiError(400, dateValidation.errors.join(', '));
      }

      // Check if academic year exists and user has access
      let academicYearWhereClause = { id: academic_year_id };
      if (req.user.role === 'school_admin') {
        academicYearWhereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        academicYearWhereClause.school_id = req.user.school_id;
        academicYearWhereClause.branch_id = req.user.branch_id;
      }

      const academicYear = await AcademicYear.findOne({ where: academicYearWhereClause });
      if (!academicYear) {
        throw new ApiError(404, 'Academic year not found or access denied');
      }

      // Check if term dates are within academic year
      const termStartDate = new Date(start_date);
      const termEndDate = new Date(end_date);
      const academicStartDate = new Date(academicYear.start_date);
      const academicEndDate = new Date(academicYear.end_date);

      if (termStartDate < academicStartDate || termEndDate > academicEndDate) {
        throw new ApiError(400, 'Term dates must be within the academic year period');
      }

      // Check for overlapping terms
      const overlappingTerm = await Term.findOne({
        where: {
          academic_year_id,
          school_id: req.user.school_id,
          branch_id: req.user.branch_id || null,
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

      // Create the term
      const term = await Term.create({
        name,
        description,
        start_date,
        end_date,
        academic_year_id,
        status,
        school_id: req.user.school_id,
        branch_id: req.user.branch_id,
        created_by: req.user.id,
        updated_by: req.user.id
      });

      // Log the operation
      CommonService.logOperation('create', 'term', term.id, req.user, {
        name,
        start_date,
        end_date,
        academic_year_id
      });

      return res.status(201).json(
        CommonService.formatSuccessResponse('Term created successfully', {
          term
        })
      );
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
      if (req.user.role === 'school_admin') {
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
      if (req.user.role === 'school_admin') {
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

      let whereClause = { academic_year_id };

      // Add role-based access control
      if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      const terms = await Term.findAll({
        where: whereClause,
        include: [
          {
            model: AcademicYear,
            as: 'academicYear',
            attributes: ['id', 'name', 'start_date', 'end_date'],
            required: true
          }
        ],
        order: [['start_date', 'ASC']]
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

      let whereClause = { status: 'active' };

      // Add role-based access control
      if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      if (academic_year_id) {
        whereClause.academic_year_id = academic_year_id;
      }

      const term = await Term.findOne({
        where: whereClause,
        include: [
          {
            model: AcademicYear,
            as: 'academicYear',
            attributes: ['id', 'name', 'start_date', 'end_date'],
            required: true
          }
        ],
        order: [['start_date', 'DESC']]
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

module.exports = TermController;
