const { AcademicYear, School, User } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

class AcademicYearController {
  // Get all academic years with filtering and pagination
  static async getAllAcademicYears(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        is_current = '',
        sort_by = 'created_at',
        sort_order = 'DESC',
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause based on user role
      let whereClause = {};
      
      // Super admin can see all academic years
      if (req.user.role === 'super_admin') {
        // No additional constraints
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
        ];
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      // Add is_current filter
      if (is_current !== '') {
        whereClause.is_current = is_current === 'true';
      }

      const { count, rows } = await AcademicYear.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name'],
          },
        ],
        order: [[sort_by, sort_order.toUpperCase()]],
        limit: parseInt(limit),
        offset,
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.getAllAcademicYears:', error);
      next(error);
    }
  }

  // Get academic year by ID
  static async getAcademicYearById(req, res, next) {
    try {
      const { id } = req.params;

      const academicYear = await AcademicYear.findByPk(id, {
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name'],
          },
          {
            model: User,
            as: 'updatedBy',
            attributes: ['id', 'first_name', 'last_name'],
          },
        ],
      });

      if (!academicYear) {
        return res.status(404).json({
          success: false,
          message: 'Academic year not found',
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && academicYear.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      res.json({
        success: true,
        data: academicYear,
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.getAcademicYearById:', error);
      next(error);
    }
  }

  // Create new academic year
  static async createAcademicYear(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { name, code, start_date, end_date, description, is_current = false } = req.body;

      // Determine school_id based on user role
      let school_id;
      if (req.user.role === 'super_admin') {
        school_id = req.body.school_id;
        if (!school_id) {
          return res.status(400).json({
            success: false,
            message: 'School ID is required for super admin',
          });
        }
      } else if (req.user.role === 'school_admin') {
        school_id = req.user.school_id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create academic year',
        });
      }

      // Check if school exists
      const school = await School.findByPk(school_id);
      if (!school) {
        return res.status(404).json({
          success: false,
          message: 'School not found',
        });
      }

      // Check if academic year code already exists for this school
      const existingYear = await AcademicYear.findOne({
        where: { school_id, code },
      });

      if (existingYear) {
        return res.status(400).json({
          success: false,
          message: 'Academic year code already exists for this school',
        });
      }

      // Validate date range
      if (new Date(start_date) >= new Date(end_date)) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date',
        });
      }

      // Create academic year
      const academicYear = await AcademicYear.create({
        name,
        code,
        start_date,
        end_date,
        description,
        is_current,
        school_id,
        created_by: req.user.id,
        status: 'active',
      });

      // Fetch the created academic year with associations
      const createdYear = await AcademicYear.findByPk(academicYear.id, {
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name'],
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: 'Academic year created successfully',
        data: createdYear,
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.createAcademicYear:', error);
      next(error);
    }
  }

  // Update academic year
  static async updateAcademicYear(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { name, code, start_date, end_date, description, is_current, status } = req.body;

      const academicYear = await AcademicYear.findByPk(id);
      if (!academicYear) {
        return res.status(404).json({
          success: false,
          message: 'Academic year not found',
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && academicYear.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Check if updated code conflicts with existing year
      if (code && code !== academicYear.code) {
        const existingYear = await AcademicYear.findOne({
          where: { 
            school_id: academicYear.school_id, 
            code,
            id: { [Op.ne]: id }
          },
        });

        if (existingYear) {
          return res.status(400).json({
            success: false,
            message: 'Academic year code already exists for this school',
          });
        }
      }

      // Validate date range if dates are being updated
      if (start_date && end_date) {
        if (new Date(start_date) >= new Date(end_date)) {
          return res.status(400).json({
            success: false,
            message: 'End date must be after start date',
          });
        }
      }

      // Update academic year
      await academicYear.update({
        name: name || academicYear.name,
        code: code || academicYear.code,
        start_date: start_date || academicYear.start_date,
        end_date: end_date || academicYear.end_date,
        description: description !== undefined ? description : academicYear.description,
        is_current: is_current !== undefined ? is_current : academicYear.is_current,
        status: status || academicYear.status,
        updated_by: req.user.id,
      });

      // Fetch updated academic year with associations
      const updatedYear = await AcademicYear.findByPk(id, {
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name'],
          },
          {
            model: User,
            as: 'updatedBy',
            attributes: ['id', 'first_name', 'last_name'],
          },
        ],
      });

      res.json({
        success: true,
        message: 'Academic year updated successfully',
        data: updatedYear,
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.updateAcademicYear:', error);
      next(error);
    }
  }

  // Delete academic year (soft delete)
  static async deleteAcademicYear(req, res, next) {
    try {
      const { id } = req.params;

      const academicYear = await AcademicYear.findByPk(id);
      if (!academicYear) {
        return res.status(404).json({
          success: false,
          message: 'Academic year not found',
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && academicYear.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Check if academic year is currently active
      if (academicYear.is_current) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete current academic year. Please set another year as current first.',
        });
      }

      // TODO: Add validation to check if academic year has associated students, classes, etc.
      
      await academicYear.destroy();

      res.json({
        success: true,
        message: 'Academic year deleted successfully',
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.deleteAcademicYear:', error);
      next(error);
    }
  }

  // Set current academic year
  static async setCurrentAcademicYear(req, res, next) {
    try {
      const { id } = req.params;

      const academicYear = await AcademicYear.findByPk(id);
      if (!academicYear) {
        return res.status(404).json({
          success: false,
          message: 'Academic year not found',
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && academicYear.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Set as current (the model hook will handle unsetting other current years)
      await academicYear.update({
        is_current: true,
        updated_by: req.user.id,
      });

      const updatedYear = await AcademicYear.findByPk(id, {
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      res.json({
        success: true,
        message: 'Academic year set as current successfully',
        data: updatedYear,
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.setCurrentAcademicYear:', error);
      next(error);
    }
  }

  // Get current academic year for a school
  static async getCurrentAcademicYear(req, res, next) {
    try {
      let school_id;
      
      if (req.user.role === 'super_admin') {
        school_id = req.query.school_id;
        if (!school_id) {
          return res.status(400).json({
            success: false,
            message: 'School ID is required for super admin',
          });
        }
      } else {
        school_id = req.user.school_id;
      }

      const currentYear = await AcademicYear.findOne({
        where: { school_id, is_current: true },
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      if (!currentYear) {
        return res.status(404).json({
          success: false,
          message: 'No current academic year found',
        });
      }

      res.json({
        success: true,
        data: currentYear,
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.getCurrentAcademicYear:', error);
      next(error);
    }
  }

  // Get academic years for dropdown/select
  static async getAcademicYearsForDropdown(req, res, next) {
    try {
      let whereClause = { status: 'active' };
      
      if (req.user.role === 'super_admin') {
        if (req.query.school_id) {
          whereClause.school_id = req.query.school_id;
        }
      } else {
        whereClause.school_id = req.user.school_id;
      }

      const academicYears = await AcademicYear.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'is_current'],
        order: [['is_current', 'DESC'], ['start_date', 'DESC']],
      });

      res.json({
        success: true,
        data: academicYears,
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.getAcademicYearsForDropdown:', error);
      next(error);
    }
  }
}

module.exports = AcademicYearController;
