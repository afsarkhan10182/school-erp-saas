const { Section, Class, School, Branch, User, Stream } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

class SectionController {
  // Get all sections with role-based access control
  static async getAllSections(req, res, next) {
    try {
      logger.debug('getAllSections: Request received', {
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
        class_id = '',
        branch_id = '',
        sort_by = 'sort_order',
        sort_order = 'ASC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause based on user role only
      let whereClause = {};

      // Super admin can see all sections
      if (req.user.role === 'super_admin') {
        logger.debug('getAllSections: Super admin - no additional constraints');
        // No additional constraints
      } else if (req.user.role === 'admin') {
        whereClause.school_id = req.user.school_id;
        logger.debug('getAllSections: School admin - filtering by school_id:', req.user.school_id);
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
        logger.debug(
          'getAllSections: Branch admin - filtering by school_id:',
          req.user.school_id,
          'and branch_id:',
          req.user.branch_id
        );
      } else {
        logger.warn('getAllSections: Access denied for role:', req.user.role);
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

      // Add class_id filter
      if (class_id) {
        whereClause.class_id = class_id;
      }

      // Add branch_id filter
      if (branch_id) {
        whereClause.branch_id = branch_id;
      }

      // Build include array with safe associations
      const includeArray = [];

      // Include associations safely
      includeArray.push({
        model: Class,
        as: 'class',
        attributes: ['id', 'name', 'code'],
        required: false
      });

      includeArray.push({
        model: Stream,
        as: 'stream',
        attributes: ['id', 'name', 'code'],
        required: false
      });

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
        as: 'classTeacher',
        attributes: ['id', 'first_name', 'last_name'],
        required: false
      });

      includeArray.push({
        model: User,
        as: 'createdBy',
        attributes: ['id', 'first_name', 'last_name'],
        required: false
      });

      const { count, rows } = await Section.findAndCountAll({
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
            attributes: ['id', 'name', 'code']
          },
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
            as: 'classTeacher',
            attributes: ['id', 'first_name', 'last_name']
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
          }
        ]
      });

      if (!section) {
        return res.status(404).json({
          success: false,
          message: 'Section not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && section.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Branch admin can only see their branch's sections
      if (req.user.role === 'branch_admin' && section.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: section
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
          errors: errors.array()
        });
      }

      const {
        name,
        capacity,
        current_strength,
        is_active = true,
        class_id,
        stream_id,
        class_teacher_id
      } = req.body;

      // Determine school_id and branch_id based on user role
      let school_id, branch_id;

      if (req.user.role === 'super_admin') {
        // Super admin must provide class_id, and we'll get school_id and branch_id from the class
        if (!class_id) {
          return res.status(400).json({
            success: false,
            message: 'Class ID is required for super admin'
          });
        }
      } else if (req.user.role === 'admin') {
        school_id = req.user.school_id;
        // School admin must provide class_id, and we'll get branch_id from the class
        if (!class_id) {
          return res.status(400).json({
            success: false,
            message: 'Class ID is required'
          });
        }
      } else if (req.user.role === 'branch_admin') {
        school_id = req.user.school_id;
        branch_id = req.user.branch_id; // Branch admin can only create for their branch
        if (!class_id) {
          return res.status(400).json({
            success: false,
            message: 'Class ID is required'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create section'
        });
      }

      // Get class details to validate and get school_id/branch_id
      const classItem = await Class.findByPk(class_id, {
        include: [
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Set school_id and branch_id from class if not already set
      if (!school_id) {
        school_id = classItem.school_id;
      }
      if (!branch_id) {
        branch_id = classItem.branch_id;
      }

      // Validate permissions
      if (req.user.role === 'admin' && classItem.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Class does not belong to your school'
        });
      }

      if (req.user.role === 'branch_admin' && classItem.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Class does not belong to your branch'
        });
      }

      // Validate stream_id if class has streams enabled
      if (classItem.has_stream) {
        if (!stream_id) {
          return res.status(400).json({
            success: false,
            message: 'Stream is required for this class. Please select a stream.'
          });
        }

        // Check if stream exists and belongs to the class
        const stream = await Stream.findByPk(stream_id);
        if (!stream || stream.class_id !== class_id) {
          return res.status(400).json({
            success: false,
            message: 'Invalid stream selected. Please choose a valid stream for this class.'
          });
        }
      } else {
        // If class doesn't have streams, stream_id should be null
        if (stream_id) {
          return res.status(400).json({
            success: false,
            message: 'This class does not have streams. Please remove stream selection.'
          });
        }
      }

      // Check if section name already exists for this class, branch, and stream
      const existingSection = await Section.findOne({
        where: {
          class_id,
          branch_id,
          stream_id: req.body.stream_id || null,
          name: name.trim()
        }
      });

      if (existingSection) {
        return res.status(400).json({
          success: false,
          message: 'Section name already exists for this class and stream in this branch'
        });
      }

      // Calculate the next sort_order for this class
      const maxSortOrder = await Section.max('sort_order', {
        where: { class_id }
      });
      const nextSortOrder = (maxSortOrder || 0) + 1;

      // Validate class teacher if provided
      if (class_teacher_id) {
        const teacher = await User.findByPk(class_teacher_id);
        if (!teacher || teacher.school_id !== school_id) {
          return res.status(400).json({
            success: false,
            message: 'Class teacher not found or does not belong to the school'
          });
        }
      }

      // Create section
      const section = await Section.create({
        name: name.trim(),
        capacity: capacity || 30,
        current_strength: current_strength || 0,
        is_active,
        sort_order: nextSortOrder,
        class_id,
        stream_id: req.body.stream_id || null,
        class_teacher_id,
        school_id,
        branch_id,
        created_by: req.user.id
      });

      // Fetch the created section with associations
      const createdSection = await Section.findByPk(section.id, {
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
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
            as: 'classTeacher',
            attributes: ['id', 'first_name', 'last_name']
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'first_name', 'last_name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Section created successfully',
        data: createdSection
      });
    } catch (error) {
      logger.error('Error in SectionController.createSection:', error);

      // Handle unique constraint violations specifically
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Section name already exists for this class and stream in this branch'
        });
      }

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
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { name, capacity, current_strength, is_active, class_teacher_id, sort_order } =
        req.body;

      const section = await Section.findByPk(id, {
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      if (!section) {
        return res.status(404).json({
          success: false,
          message: 'Section not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && section.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Branch admin can only update their branch's sections
      if (req.user.role === 'branch_admin' && section.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if updated name conflicts with existing section in the same class, branch, and stream
      if (name && name !== section.name) {
        const existingSection = await Section.findOne({
          where: {
            class_id: section.class_id,
            branch_id: section.branch_id,
            stream_id: section.stream_id,
            name,
            id: { [Op.ne]: id }
          }
        });

        if (existingSection) {
          return res.status(400).json({
            success: false,
            message: 'Section name already exists for this class and stream in this branch'
          });
        }
      }

      // Validate class teacher if provided
      if (class_teacher_id && class_teacher_id !== section.class_teacher_id) {
        const teacher = await User.findByPk(class_teacher_id);
        if (!teacher || teacher.school_id !== section.school_id) {
          return res.status(400).json({
            success: false,
            message: 'Class teacher not found or does not belong to the school'
          });
        }
      }

      // Update section
      await section.update({
        name: name || section.name,
        capacity: capacity !== undefined ? capacity : section.capacity,
        current_strength:
          current_strength !== undefined ? current_strength : section.current_strength,
        is_active: is_active !== undefined ? is_active : section.is_active,
        sort_order: sort_order !== undefined ? sort_order : section.sort_order,
        class_teacher_id:
          class_teacher_id !== undefined ? class_teacher_id : section.class_teacher_id,
        updated_by: req.user.id
      });

      // Fetch updated section with associations
      const updatedSection = await Section.findByPk(id, {
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
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
            as: 'classTeacher',
            attributes: ['id', 'first_name', 'last_name']
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
          }
        ]
      });

      res.json({
        success: true,
        message: 'Section updated successfully',
        data: updatedSection
      });
    } catch (error) {
      logger.error('Error in SectionController.updateSection:', error);

      // Handle unique constraint violations specifically
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Section name already exists for this class and stream in this branch'
        });
      }

      next(error);
    }
  }

  // Delete section (soft delete)
  static async deleteSection(req, res, next) {
    try {
      const { id } = req.params;

      const section = await Section.findByPk(id);

      if (!section) {
        return res.status(404).json({
          success: false,
          message: 'Section not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && section.school_id !== req.user.school_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Branch admin can only delete their branch's sections
      if (req.user.role === 'branch_admin' && section.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // TODO: Add validation to check if section has associated students

      await section.destroy();

      res.json({
        success: true,
        message: 'Section deleted successfully'
      });
    } catch (error) {
      logger.error('Error in SectionController.deleteSection:', error);
      next(error);
    }
  }

  // Get sections for dropdown/select
  static async getSectionsForDropdown(req, res, next) {
    try {
      let whereClause = { is_active: true };

      if (req.user.role === 'super_admin') {
        if (req.query.school_id) {
          whereClause.school_id = req.query.school_id;
        }
        if (req.query.branch_id) {
          whereClause.branch_id = req.query.branch_id;
        }
        if (req.query.class_id) {
          whereClause.class_id = req.query.class_id;
        }
      } else if (req.user.role === 'admin') {
        whereClause.school_id = req.user.school_id;
        if (req.query.branch_id) {
          whereClause.branch_id = req.query.branch_id;
        }
        if (req.query.class_id) {
          whereClause.class_id = req.query.class_id;
        }
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
        if (req.query.class_id) {
          whereClause.class_id = req.query.class_id;
        }
      }

      const sections = await Section.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'capacity', 'current_strength', 'stream_id', 'class_id'],
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name']
          }
        ],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: sections
      });
    } catch (error) {
      logger.error('Error in SectionController.getSectionsForDropdown:', error);
      next(error);
    }
  }
}

module.exports = SectionController;
