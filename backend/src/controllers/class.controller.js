const { Class, School, Branch, User, Section } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

class ClassController {
  // Get all classes with filtering and pagination
  static async getAllClasses(req, res, next) {
    try {
      logger.debug('getAllClasses: Request received', {
        userRole: req.user?.role,
        userSchoolId: req.user?.school_id,
        userBranchId: req.user?.branch_id,
        query: req.query
      });

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
        branch_id = '',
        sort_by = 'sort_order',
        sort_order = 'ASC',
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause based on user role
      let whereClause = {};
      
      // Super admin can see all classes
      if (req.user.role === 'super_admin') {
        logger.debug('getAllClasses: Super admin - no additional constraints');
        // No additional constraints
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
        logger.debug('getAllClasses: School admin - filtering by school_id:', req.user.school_id);
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
        logger.debug('getAllClasses: Branch admin - filtering by school_id:', req.user.school_id, 'and branch_id:', req.user.branch_id);
      } else {
        logger.warn('getAllClasses: Access denied for role:', req.user.role);
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

      // Add is_active filter
      if (is_active !== '') {
        whereClause.is_active = is_active === 'true';
      }

      // Add branch_id filter
      if (branch_id) {
        whereClause.branch_id = branch_id;
      }

      // Build include array with safe associations
      const includeArray = [];
      
      try {
        // Only include associations if they exist
        if (Class.associations && Class.associations.school) {
          includeArray.push({
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          });
        }
        
        if (Class.associations && Class.associations.branch) {
          includeArray.push({
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          });
        }
        
        if (Class.associations && Class.associations.createdBy) {
          includeArray.push({
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name'],
          });
        }
        
        if (Class.associations && Class.associations.sections) {
          includeArray.push({
            model: Section,
            as: 'sections',
            attributes: ['id', 'name', 'capacity', 'current_strength'],
          });
        }
      } catch (associationError) {
        logger.warn('Some associations not available, proceeding without them:', associationError.message);
      }

      const { count, rows } = await Class.findAndCountAll({
        where: whereClause,
        include: includeArray,
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
      logger.error('Error in ClassController.getAllClasses:', error);
      next(error);
    }
  }

  // Get class by ID
  static async getClassById(req, res, next) {
    try {
      const { id } = req.params;

      const classItem = await Class.findByPk(id, {
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Branch,
            as: 'branch',
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
          {
            model: Section,
            as: 'sections',
            attributes: ['id', 'name', 'capacity', 'current_strength'],
          },
        ],
      });

      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: 'Class not found',
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && classItem.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Branch admin can only see their branch's classes
      if (req.user.role === 'branch_admin' && classItem.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      res.json({
        success: true,
        data: classItem,
      });
    } catch (error) {
      logger.error('Error in ClassController.getClassById:', error);
      next(error);
    }
  }

  // Create new class
  static async createClass(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { name, code, numeric_value, description, capacity, sort_order, is_active = true, branch_id } = req.body;

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
        // Branch admin can only create classes for their branch
        if (branch_id && branch_id !== req.user.branch_id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Cannot create class for other branches',
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create class',
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

      // Check if class code already exists for this school
      const existingClass = await Class.findOne({
        where: { school_id, code },
      });

      if (existingClass) {
        return res.status(400).json({
          success: false,
          message: 'Class code already exists for this school',
        });
      }

      // Create class
      const classItem = await Class.create({
        name,
        code,
        numeric_value,
        description,
        capacity: capacity || 30,
        sort_order: sort_order || 0,
        is_active,
        school_id,
        branch_id,
        created_by: req.user.id,
      });

      // Fetch the created class with associations
      const createdClass = await Class.findByPk(classItem.id, {
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Branch,
            as: 'branch',
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
        message: 'Class created successfully',
        data: createdClass,
      });
    } catch (error) {
      logger.error('Error in ClassController.createClass:', error);
      next(error);
    }
  }

  // Update class
  static async updateClass(req, res, next) {
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
      const { name, code, numeric_value, description, capacity, sort_order, is_active } = req.body;

      const classItem = await Class.findByPk(id);
      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: 'Class not found',
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && classItem.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Branch admin can only update their branch's classes
      if (req.user.role === 'branch_admin' && classItem.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Check if updated code conflicts with existing class
      if (code && code !== classItem.code) {
        const existingClass = await Class.findOne({
          where: { 
            school_id: classItem.school_id, 
            code,
            id: { [Op.ne]: id }
          },
        });

        if (existingClass) {
          return res.status(400).json({
            success: false,
            message: 'Class code already exists for this school',
          });
        }
      }

      // Update class
      await classItem.update({
        name: name || classItem.name,
        code: code || classItem.code,
        numeric_value: numeric_value !== undefined ? numeric_value : classItem.numeric_value,
        description: description !== undefined ? description : classItem.description,
        capacity: capacity !== undefined ? capacity : classItem.capacity,
        sort_order: sort_order !== undefined ? sort_order : classItem.sort_order,
        is_active: is_active !== undefined ? is_active : classItem.is_active,
        updated_by: req.user.id,
      });

      // Fetch updated class with associations
      const updatedClass = await Class.findByPk(id, {
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Branch,
            as: 'branch',
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
          {
            model: Section,
            as: 'sections',
            attributes: ['id', 'name', 'capacity', 'current_strength'],
          },
        ],
      });

      res.json({
        success: true,
        message: 'Class updated successfully',
        data: updatedClass,
      });
    } catch (error) {
      logger.error('Error in ClassController.updateClass:', error);
      next(error);
    }
  }

  // Delete class (soft delete)
  static async deleteClass(req, res, next) {
    try {
      const { id } = req.params;

      const classItem = await Class.findByPk(id, {
        include: [
          {
            model: Section,
            as: 'sections',
          },
        ],
      });

      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: 'Class not found',
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && classItem.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Branch admin can only delete their branch's classes
      if (req.user.role === 'branch_admin' && classItem.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Check if class has sections
      if (classItem.sections && classItem.sections.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete class with existing sections. Please delete sections first.',
        });
      }

      // TODO: Add validation to check if class has associated students
      
      await classItem.destroy();

      res.json({
        success: true,
        message: 'Class deleted successfully',
      });
    } catch (error) {
      logger.error('Error in ClassController.deleteClass:', error);
      next(error);
    }
  }

  // Get classes for dropdown/select
  static async getClassesForDropdown(req, res, next) {
    try {
      let whereClause = { is_active: true };
      
      if (req.user.role === 'super_admin') {
        if (req.query.school_id) {
          whereClause.school_id = req.query.school_id;
        }
        if (req.query.branch_id) {
          whereClause.branch_id = req.query.branch_id;
        }
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
        if (req.query.branch_id) {
          whereClause.branch_id = req.query.branch_id;
        }
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      const classes = await Class.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'numeric_value'],
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name'],
          },
        ],
        order: [['sort_order', 'ASC'], ['name', 'ASC']],
      });

      res.json({
        success: true,
        data: classes,
      });
    } catch (error) {
      logger.error('Error in ClassController.getClassesForDropdown:', error);
      next(error);
    }
  }

  // Get class statistics
  static async getClassStats(req, res, next) {
    try {
      let whereClause = {};
      
      if (req.user.role === 'super_admin') {
        if (req.query.school_id) {
          whereClause.school_id = req.query.school_id;
        }
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      const stats = await Class.findAll({
        where: whereClause,
        attributes: [
          'id',
          'name',
          'capacity',
          [
            Class.sequelize.fn('COUNT', Class.sequelize.col('sections.id')),
            'section_count'
          ],
          [
            Class.sequelize.fn('SUM', Class.sequelize.col('sections.current_strength')),
            'total_students'
          ],
        ],
        include: [
          {
            model: Section,
            as: 'sections',
            attributes: [],
          },
        ],
        group: ['Class.id'],
        order: [['sort_order', 'ASC']],
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error in ClassController.getClassStats:', error);
      next(error);
    }
  }
}

module.exports = ClassController;
