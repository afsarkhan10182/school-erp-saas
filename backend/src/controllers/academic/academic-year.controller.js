const { AcademicYear, User } = require('~/models');
const { logger } = require('~/utils/shared/logger');
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
          errors: errors.array()
        });
      }

      const {
        page = 1,
        limit = 10,
        search = '',
        is_current = '',
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      let whereClause = {};

      // Add search filter
      if (search) {
        whereClause[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }];
      }

      // Add is_current filter
      if (is_current !== '') {
        whereClause.is_current = is_current === 'true';
      }

      const { count, rows } = await AcademicYear.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name']
          }
        ],
        order: [[sort_by, sort_order.toUpperCase()]],
        limit: parseInt(limit),
        offset
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
          hasPrevPage: parseInt(page) > 1
        }
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
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name']
          },
          {
            model: User,
            as: 'updatedBy',
            attributes: ['id', 'first_name', 'last_name']
          }
        ]
      });

      if (!academicYear) {
        return res.status(404).json({
          success: false,
          message: 'Academic year not found'
        });
      }

      res.json({
        success: true,
        data: academicYear
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.getAcademicYearById:', error);
      next(error);
    }
  }

  // Create new academic year (super admin only)
  static async createAcademicYear(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { name, is_current = false } = req.body;

      // Only super admin can create global academic years
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can create global academic years'
        });
      }

      // Check if academic year name already exists
      const existingYear = await AcademicYear.findOne({
        where: { name }
      });

      if (existingYear) {
        return res.status(400).json({
          success: false,
          message: 'Academic year already exists'
        });
      }

      // Generate code, start_date, and end_date from name (format: "2024-2025")
      const [startYear, endYear] = name.split('-').map(Number);
      const code = name; // Use the same format as name
      const start_date = `${startYear}-04-01`; // Academic year starts in April
      const end_date = `${endYear}-03-31`; // Academic year ends in March of next year

      // Create academic year
      const academicYear = await AcademicYear.create({
        name,
        code,
        start_date,
        end_date,
        is_current,
        status: 'active',
        created_by: req.user.id
      });

      // Fetch the created academic year with associations
      const createdYear = await AcademicYear.findByPk(academicYear.id, {
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Academic year created successfully',
        data: createdYear
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.createAcademicYear:', error);
      next(error);
    }
  }

  // Update academic year (super admin only)
  static async updateAcademicYear(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { name, is_current } = req.body;

      // Only super admin can update global academic years
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can update global academic years'
        });
      }

      const academicYear = await AcademicYear.findByPk(id);
      if (!academicYear) {
        return res.status(404).json({
          success: false,
          message: 'Academic year not found'
        });
      }

      // Check if updated name conflicts with existing year
      if (name && name !== academicYear.name) {
        const existingYear = await AcademicYear.findOne({
          where: {
            name,
            id: { [Op.ne]: id }
          }
        });

        if (existingYear) {
          return res.status(400).json({
            success: false,
            message: 'Academic year name already exists'
          });
        }
      }

      // Prepare update data
      const updateData = {
        updated_by: req.user.id
      };

      // If name is being updated, also update related fields
      if (name && name !== academicYear.name) {
        const [startYear, endYear] = name.split('-').map(Number);
        updateData.name = name;
        updateData.code = name; // Use the same format as name
        updateData.start_date = `${startYear}-04-01`; // Academic year starts in April
        updateData.end_date = `${endYear}-03-31`; // Academic year ends in March of next year
      }

      // Update is_current if provided
      if (is_current !== undefined) {
        updateData.is_current = is_current;
      }

      // Update academic year
      await academicYear.update(updateData);

      // Fetch updated academic year with associations
      const updatedYear = await AcademicYear.findByPk(id, {
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name']
          },
          {
            model: User,
            as: 'updatedBy',
            attributes: ['id', 'first_name', 'last_name']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Academic year updated successfully',
        data: updatedYear
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.updateAcademicYear:', error);
      next(error);
    }
  }

  // Delete academic year (super admin only)
  static async deleteAcademicYear(req, res, next) {
    try {
      const { id } = req.params;

      // Only super admin can delete global academic years
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can delete global academic years'
        });
      }

      const academicYear = await AcademicYear.findByPk(id);
      if (!academicYear) {
        return res.status(404).json({
          success: false,
          message: 'Academic year not found'
        });
      }

      // Check if academic year is currently active
      if (academicYear.is_current) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete current academic year. Please set another year as current first.'
        });
      }

      // TODO: Add validation to check if academic year is referenced by any schools

      await academicYear.destroy();

      res.json({
        success: true,
        message: 'Academic year deleted successfully'
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.deleteAcademicYear:', error);
      next(error);
    }
  }

  // Set current academic year (super admin only)
  static async setCurrentAcademicYear(req, res, next) {
    try {
      const { id } = req.params;

      // Only super admin can set current global academic year
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can set current global academic year'
        });
      }

      const academicYear = await AcademicYear.findByPk(id);
      if (!academicYear) {
        return res.status(404).json({
          success: false,
          message: 'Academic year not found'
        });
      }

      // Set as current (the model hook will handle unsetting other current years)
      await academicYear.update({
        is_current: true,
        updated_by: req.user.id
      });

      const updatedYear = await AcademicYear.findByPk(id);

      res.json({
        success: true,
        message: 'Academic year set as current successfully',
        data: updatedYear
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.setCurrentAcademicYear:', error);
      next(error);
    }
  }

  // Get current academic year (accessible to all authenticated users)
  static async getCurrentAcademicYear(req, res, next) {
    try {
      const currentYear = await AcademicYear.findOne({
        where: { is_current: true },
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name']
          }
        ]
      });

      if (!currentYear) {
        return res.status(404).json({
          success: false,
          message: 'No current academic year found'
        });
      }

      // Get count of schools linked to this academic year
      const { School } = require('~/models');
      const schoolsCount = await School.count({
        where: { current_academic_year_id: currentYear.id }
      });

      res.json({
        success: true,
        data: {
          ...currentYear.toJSON(),
          schools_count: schoolsCount
        }
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.getCurrentAcademicYear:', error);
      next(error);
    }
  }

  // Sync all schools to current academic year (super admin only)
  static async syncSchoolsToCurrentAcademicYear(req, res, next) {
    try {
      // Only super admin can sync schools to current academic year
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can sync schools to current academic year'
        });
      }

      const { syncSchoolsToCurrentAcademicYear } = require('~/utils/academic/academicYearUtils');
      const result = await syncSchoolsToCurrentAcademicYear();

      res.json({
        success: true,
        message: `Successfully synced ${result.updated_count} schools to current academic year: ${result.academic_year}`,
        data: result
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.syncSchoolsToCurrentAcademicYear:', error);
      next(error);
    }
  }

  // Get academic years for dropdown/select (accessible to all authenticated users)
  static async getAcademicYearsForDropdown(req, res, next) {
    try {
      const academicYears = await AcademicYear.findAll({
        attributes: ['id', 'name', 'code', 'is_current'],
        order: [
          ['is_current', 'DESC'],
          ['name', 'DESC']
        ]
      });

      res.json({
        success: true,
        data: academicYears
      });
    } catch (error) {
      logger.error('Error in AcademicYearController.getAcademicYearsForDropdown:', error);
      next(error);
    }
  }
}

module.exports = AcademicYearController;
