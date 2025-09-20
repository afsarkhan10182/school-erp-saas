const { Class, School, Branch, User, Section, Stream } = require('~/models');
const { logger } = require('~/utils/shared/logger');
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
          errors: errors.array()
        });
      }

      const {
        page = 1,
        limit = 10,
        search = '',
        is_active = '',
        branch_id = '',
        sort_by = 'sort_order',
        sort_order = 'ASC'
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
        logger.debug(
          'getAllClasses: Branch admin - filtering by school_id:',
          req.user.school_id,
          'and branch_id:',
          req.user.branch_id
        );
      } else {
        logger.warn('getAllClasses: Access denied for role:', req.user.role);
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } }
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

      // Include associations safely
      includeArray.push({
        model: School,
        as: 'school',
        attributes: ['id', 'name', 'code'],
        required: false
      });

      includeArray.push({
        model: Branch,
        as: 'branch',
        attributes: ['id', 'name', 'code'],
        required: false
      });

      includeArray.push({
        model: User,
        as: 'createdBy',
        attributes: ['id', 'first_name', 'last_name'],
        required: false
      });

      includeArray.push({
        model: Section,
        as: 'sections',
        attributes: ['id', 'name', 'capacity', 'current_strength'],
        required: false
      });

      includeArray.push({
        model: Stream,
        as: 'streams',
        attributes: ['id', 'name', 'code'],
        required: false
      });

      const { count, rows } = await Class.findAndCountAll({
        where: whereClause,
        include: includeArray,
        order: [
          [sort_by, sort_order.toUpperCase()],
          ['name', 'ASC'] // Secondary sort for consistency
        ],
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
            attributes: ['id', 'name', 'code']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name']
          },
          {
            model: User,
            as: 'updatedBy',
            attributes: ['id', 'first_name', 'last_name']
          },
          {
            model: Section,
            as: 'sections',
            attributes: ['id', 'name', 'capacity', 'current_strength']
          },
          {
            model: Stream,
            as: 'streams',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && classItem.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Branch admin can only see their branch's classes
      if (req.user.role === 'branch_admin' && classItem.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: classItem
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
          errors: errors.array()
        });
      }

      const {
        name,
        code,
        numeric_value,
        description,
        capacity,
        sort_order,
        is_active = true,
        has_stream = false,
        branch_id
      } = req.body;

      // Determine school_id and branch_id based on user role
      let school_id, final_branch_id;

      if (req.user.role === 'super_admin') {
        school_id = req.body.school_id;
        final_branch_id = branch_id;

        if (!school_id) {
          return res.status(400).json({
            success: false,
            message: 'School ID is required for super admin'
          });
        }
        if (!final_branch_id) {
          return res.status(400).json({
            success: false,
            message: 'Branch ID is required for super admin'
          });
        }
      } else if (req.user.role === 'school_admin') {
        school_id = req.user.school_id;
        final_branch_id = branch_id;

        if (!final_branch_id) {
          return res.status(400).json({
            success: false,
            message: 'Branch ID is required'
          });
        }
      } else if (req.user.role === 'branch_admin') {
        school_id = req.user.school_id;
        final_branch_id = req.user.branch_id; // Branch admin can only create for their branch
      } else {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create class'
        });
      }

      // Check if school exists
      const school = await School.findByPk(school_id);
      if (!school) {
        return res.status(404).json({
          success: false,
          message: 'School not found'
        });
      }

      // Check if branch exists and belongs to the school
      const branch = await Branch.findByPk(final_branch_id);
      if (!branch || branch.school_id !== school_id) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found or does not belong to the school'
        });
      }

      // Check if class name already exists for this school and branch
      const existingClassByName = await Class.findOne({
        where: { school_id, branch_id: final_branch_id, name }
      });

      if (existingClassByName) {
        return res.status(400).json({
          success: false,
          message: 'Class name already exists for this branch'
        });
      }

      // Check if class code already exists for this school and branch
      const existingClassByCode = await Class.findOne({
        where: { school_id, branch_id: final_branch_id, code }
      });

      if (existingClassByCode) {
        return res.status(400).json({
          success: false,
          message: 'Class code already exists for this branch'
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
        has_stream,
        school_id,
        branch_id: final_branch_id,
        created_by: req.user.id
      });

      // Fetch the created class with associations
      const createdClass = await Class.findByPk(classItem.id, {
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name']
          },
          {
            model: Stream,
            as: 'streams',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Class created successfully',
        data: createdClass
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
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const {
        name,
        code,
        numeric_value,
        description,
        capacity,
        sort_order,
        is_active,
        has_stream
      } = req.body;

      const classItem = await Class.findByPk(id);
      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && classItem.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Branch admin can only update their branch's classes
      if (req.user.role === 'branch_admin' && classItem.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if updated name conflicts with existing class in the same branch
      if (name && name !== classItem.name) {
        const existingClassByName = await Class.findOne({
          where: {
            school_id: classItem.school_id,
            branch_id: classItem.branch_id,
            name,
            id: { [Op.ne]: id }
          }
        });

        if (existingClassByName) {
          return res.status(400).json({
            success: false,
            message: 'Class name already exists for this branch'
          });
        }
      }

      // Check if updated code conflicts with existing class in the same branch
      if (code && code !== classItem.code) {
        const existingClassByCode = await Class.findOne({
          where: {
            school_id: classItem.school_id,
            branch_id: classItem.branch_id,
            code,
            id: { [Op.ne]: id }
          }
        });

        if (existingClassByCode) {
          return res.status(400).json({
            success: false,
            message: 'Class code already exists for this branch'
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
        has_stream: has_stream !== undefined ? has_stream : classItem.has_stream,
        updated_by: req.user.id
      });

      // Fetch updated class with associations
      const updatedClass = await Class.findByPk(id, {
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name']
          },
          {
            model: User,
            as: 'updatedBy',
            attributes: ['id', 'first_name', 'last_name']
          },
          {
            model: Section,
            as: 'sections',
            attributes: ['id', 'name', 'capacity', 'current_strength']
          },
          {
            model: Stream,
            as: 'streams',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Class updated successfully',
        data: updatedClass
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
            as: 'sections'
          },
          {
            model: Stream,
            as: 'streams'
          }
        ]
      });

      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && classItem.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Branch admin can only delete their branch's classes
      if (req.user.role === 'branch_admin' && classItem.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if class has sections
      if (classItem.sections && classItem.sections.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete class with existing sections. Please delete sections first.'
        });
      }

      // Check if class has streams
      if (classItem.streams && classItem.streams.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete class with existing streams. Please delete streams first.'
        });
      }

      // TODO: Add validation to check if class has associated students

      await classItem.destroy();

      res.json({
        success: true,
        message: 'Class deleted successfully'
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
            attributes: ['id', 'name']
          }
        ],
        order: [
          ['sort_order', 'ASC'],
          ['name', 'ASC']
        ]
      });

      res.json({
        success: true,
        data: classes
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
          [Class.sequelize.fn('COUNT', Class.sequelize.col('sections.id')), 'section_count'],
          [
            Class.sequelize.fn('SUM', Class.sequelize.col('sections.current_strength')),
            'total_students'
          ]
        ],
        include: [
          {
            model: Section,
            as: 'sections',
            attributes: []
          }
        ],
        group: ['Class.id'],
        order: [['sort_order', 'ASC']]
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in ClassController.getClassStats:', error);
      next(error);
    }
  }
}

module.exports = ClassController;
