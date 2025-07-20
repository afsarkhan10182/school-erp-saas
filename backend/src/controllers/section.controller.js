const { Op } = require('sequelize');
const { Section, Class, Branch, User } = require('../models');
const { logger } = require('../utils/logger');
const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/ApiError');

class SectionController {
  // Get all sections with filtering and pagination
  static async getAllSections(req, res, next) {
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
        is_active = '',
        class_id = '',
        branch_id = '',
        sort_by = 'name',
        sort_order = 'ASC',
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause based on user role
      let whereClause = {};

      // Super admin can see all sections
      if (req.user.role === 'super_admin') {
        // No additional constraints
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        // For branch_admin, allow sections from their branch OR sections without branch_id (school-wide sections)
        whereClause[Op.or] = [
          { branch_id: req.user.branch_id },
          { branch_id: null }
        ];
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
        ];
      }

      // Add is_active filter
      if (is_active !== '') {
        whereClause.is_active = is_active === 'true';
      }

      // Add class_id filter
      if (class_id) {
        whereClause.class_id = class_id;
      }

      // Add branch_id filter
      if (branch_id) {
        whereClause.branch_id = branch_id;
      }

      const { count, rows } = await Section.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'classTeacher',
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
      logger.error('Error in SectionController.getAllSections:', error);
      next(error);
    }
  }

  // Get section by ID
  static async getSectionById(req, res, next) {
    try {
      const { id } = req.params;

      const section = await Section.findByPk(id, {
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'classTeacher',
            attributes: ['id', 'first_name', 'last_name'],
          },
        ],
      });

      if (!section) {
        return res.status(404).json({
          success: false,
          message: 'Section not found',
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && section.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Branch admin can only see their branch's sections
      if (req.user.role === 'branch_admin' && section.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      res.json({
        success: true,
        data: section,
      });
    } catch (error) {
      logger.error('Error in SectionController.getSectionById:', error);
      next(error);
    }
  }

  // Create new section
  static async createSection(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { name, capacity, class_teacher_id, is_active = true, class_id, branch_id } = req.body;

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
      } else if (req.user.role === 'branch_admin') {
        school_id = req.user.school_id;
        // Branch admin can only create sections for their branch
        if (branch_id && branch_id !== req.user.branch_id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Cannot create section for other branches',
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create section',
        });
      }

      // Check if class exists
      const classInstance = await Class.findByPk(class_id);
      if (!classInstance || classInstance.school_id !== school_id) {
        return res.status(404).json({
          success: false,
          message: 'Class not found or does not belong to the school',
        });
      }

      // Check if branch exists (if branch_id is provided)
      if (branch_id) {
        const branch = await Branch.findByPk(branch_id);
        if (!branch || branch.school_id !== school_id) {
          return res.status(404).json({
            success: false,
            message: 'Branch not found or does not belong to the school',
          });
        }
      }

      // Check if section name already exists for this class
      const existingSection = await Section.findOne({
        where: { class_id, name },
      });

      if (existingSection) {
        return res.status(400).json({
          success: false,
          message: 'Section name already exists for this class',
        });
      }

      // Create section
      const section = await Section.create({
        name,
        capacity: capacity || 30,
        current_strength: 0,
        is_active,
        class_id,
        branch_id,
        class_teacher_id,
        school_id,
        created_by: req.user.id,
      });

      // Fetch the created section with associations
      const createdSection = await Section.findByPk(section.id, {
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'classTeacher',
            attributes: ['id', 'first_name', 'last_name'],
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: 'Section created successfully',
        data: createdSection,
      });
    } catch (error) {
      logger.error('Error in SectionController.createSection:', error);
      next(error);
    }
  }

  // Update section
  static async updateSection(req, res, next) {
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
      const { name, capacity, class_teacher_id, is_active } = req.body;

      const section = await Section.findByPk(id);
      if (!section) {
        return res.status(404).json({
          success: false,
          message: 'Section not found',
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && section.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Branch admin can only update their branch's sections
      if (req.user.role === 'branch_admin' && section.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Check if updated name conflicts with existing section
      if (name && name !== section.name) {
        const existingSection = await Section.findOne({
          where: { 
            class_id: section.class_id, 
            name,
            id: { [Op.ne]: id }
          },
        });

        if (existingSection) {
          return res.status(400).json({
            success: false,
            message: 'Section name already exists for this class',
          });
        }
      }

      // Update section
      await section.update({
        name: name || section.name,
        capacity: capacity !== undefined ? capacity : section.capacity,
        class_teacher_id: class_teacher_id || section.class_teacher_id,
        is_active: is_active !== undefined ? is_active : section.is_active,
        updated_by: req.user.id,
      });

      // Fetch updated section with associations
      const updatedSection = await Section.findByPk(id, {
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'classTeacher',
            attributes: ['id', 'first_name', 'last_name'],
          },
        ],
      });

      res.json({
        success: true,
        message: 'Section updated successfully',
        data: updatedSection,
      });
    } catch (error) {
      logger.error('Error in SectionController.updateSection:', error);
      next(error);
    }
  }

  // Delete section (soft delete)
  static async deleteSection(req, res, next) {
    try {
      const { id } = req.params;

      const section = await Section.findByPk(id, {
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      if (!section) {
        return res.status(404).json({
          success: false,
          message: 'Section not found',
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && section.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Branch admin can only delete their branch's sections
      if (req.user.role === 'branch_admin' && section.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // TODO: Add validation to check if section has associated students
      
      await section.destroy();

      res.json({
        success: true,
        message: 'Section deleted successfully',
      });
    } catch (error) {
      logger.error('Error in SectionController.deleteSection:', error);
      next(error);
    }
  }

  // Get sections for dropdown/select
  static async getSectionsForDropdown(req, res, next) {
    try {
      console.log('🔍 getSectionsForDropdown called with user role:', req.user.role);
      console.log('🔍 Query parameters:', req.query);
      
      let whereClause = { is_active: true };

      if (req.user.role === 'super_admin') {
        console.log('🔍 Processing super_admin request');
        if (req.query.school_id) {
          whereClause.school_id = req.query.school_id;
          console.log('🔍 Added school_id filter:', req.query.school_id);
        }
        if (req.query.branch_id) {
          whereClause.branch_id = req.query.branch_id;
          console.log('🔍 Added branch_id filter:', req.query.branch_id);
        }
        if (req.query.class_id) {
          whereClause.class_id = req.query.class_id;
          console.log('🔍 Added class_id filter:', req.query.class_id);
        }
      } else if (req.user.role === 'school_admin') {
        console.log('🔍 Processing school_admin request');
        whereClause.school_id = req.user.school_id;
        if (req.query.branch_id) {
          // For school_admin, allow sections from the specified branch OR sections without branch_id (school-wide sections)
          whereClause[Op.or] = [
            { branch_id: req.query.branch_id },
            { branch_id: null }
          ];
        }
        if (req.query.class_id) {
          whereClause.class_id = req.query.class_id;
        }
      } else if (req.user.role === 'branch_admin') {
        console.log('🔍 Processing branch_admin request');
        whereClause.school_id = req.user.school_id;
        // For branch_admin, allow sections from their branch OR sections without branch_id (school-wide sections)
        if (req.query.branch_id) {
          whereClause.branch_id = req.query.branch_id;
        } else {
          whereClause[Op.or] = [
            { branch_id: req.user.branch_id },
            { branch_id: null }
          ];
        }
        if (req.query.class_id) {
          whereClause.class_id = req.query.class_id;
        }
      }

      console.log('🔍 Final whereClause:', JSON.stringify(whereClause, null, 2));

      const sections = await Section.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'capacity'],
        order: [['name', 'ASC']],
      });

      console.log('🔍 Found sections:', sections.length);
      console.log('🔍 Sections data:', sections.map(s => ({ id: s.id, name: s.name })));

      res.json({
        success: true,
        data: sections,
      });
    } catch (error) {
      logger.error('Error in SectionController.getSectionsForDropdown:', error);
      next(error);
    }
  }
}

module.exports = SectionController;

