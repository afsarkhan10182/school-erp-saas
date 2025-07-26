const { Op } = require('sequelize');
const { Stream, Class, School, Branch, User } = require('../models');
const { logger } = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const { apiResponse } = require('../utils/apiResponse');

class StreamController {
  static async getAllStreams(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        is_active = '',
        class_id = '',
        school_id = '',
        branch_id = '',
        sort_by = 'sort_order',
        sort_order = 'ASC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let whereClause = {};

      // Role-based access control
      if (req.user.role === 'super_admin') {
        // Super admin can see all streams
        logger.debug('getAllStreams: Super admin - no additional constraints');
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
        logger.debug('getAllStreams: School admin - filtering by school_id:', req.user.school_id);
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
        logger.debug('getAllStreams: Branch admin - filtering by school_id:', req.user.school_id, 'and branch_id:', req.user.branch_id);
      } else {
        logger.warn('getAllStreams: Access denied for role:', req.user.role);
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

      // Add class_id filter
      if (class_id) {
        whereClause.class_id = class_id;
      }

      // Add school_id filter
      if (school_id) {
        whereClause.school_id = school_id;
      }

      // Add branch_id filter
      if (branch_id) {
        whereClause.branch_id = branch_id;
      }

      // Build include array with safe associations
      const includeArray = [];
      
      includeArray.push({
        model: Class,
        as: 'class',
        attributes: ['id', 'name', 'code'],
        required: false,
      });
      
      includeArray.push({
        model: School,
        as: 'school',
        attributes: ['id', 'name', 'code'],
        required: false,
      });
      
      includeArray.push({
        model: Branch,
        as: 'branch',
        attributes: ['id', 'name', 'code'],
        required: false,
      });
      
      includeArray.push({
        model: User,
        as: 'createdBy',
        attributes: ['id', 'first_name', 'last_name'],
        required: false,
      });

      const { count, rows } = await Stream.findAndCountAll({
        where: whereClause,
        include: includeArray,
        order: [
          [sort_by, sort_order.toUpperCase()],
          ['name', 'ASC'] // Secondary sort for consistency
        ],
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
      logger.error('Error in StreamController.getAllStreams:', error);
      next(error);
    }
  }

  static async getStreamById(req, res, next) {
    try {
      const { id } = req.params;
      let whereClause = { id };

      // Role-based access control
      if (req.user.role === 'super_admin') {
        // Super admin can access any stream
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const stream = await Stream.findOne({
        where: whereClause,
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
          },
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
        ],
      });

      if (!stream) {
        return res.status(404).json({
          success: false,
          message: 'Stream not found',
        });
      }

      res.json({
        success: true,
        data: stream,
      });
    } catch (error) {
      logger.error('Error in StreamController.getStreamById:', error);
      next(error);
    }
  }

  static async createStream(req, res, next) {
    try {
      const {
        name,
        code,
        description,
        class_id,
        is_active = true,
        sort_order = 0
      } = req.body;

      // Validate required fields
      if (!name || !class_id) {
        return res.status(400).json({
          success: false,
          message: 'Name and class_id are required',
        });
      }

      // Check if class exists and has streams enabled
      const classInstance = await Class.findByPk(class_id);
      if (!classInstance) {
        return res.status(400).json({
          success: false,
          message: 'Class not found',
        });
      }

      // Check if class has streams enabled
      if (!classInstance.has_stream) {
        return res.status(400).json({
          success: false,
          message: 'This class does not have streams enabled. Please enable streams for this class first.',
        });
      }

      logger.debug(`Creating stream for class: ${classInstance.name} (${classInstance.code}) - has_stream: ${classInstance.has_stream}`);

      // Set school_id and branch_id based on user role
      let school_id, branch_id;

      if (req.user.role === 'super_admin') {
        // Super admin must provide school_id and branch_id
        if (!req.body.school_id || !req.body.branch_id) {
          return res.status(400).json({
            success: false,
            message: 'school_id and branch_id are required for super admin',
          });
        }
        school_id = req.body.school_id;
        branch_id = req.body.branch_id;
      } else if (req.user.role === 'school_admin') {
        school_id = req.user.school_id;
        branch_id = req.body.branch_id || req.user.branch_id;
      } else if (req.user.role === 'branch_admin') {
        school_id = req.user.school_id;
        branch_id = req.user.branch_id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Auto-generate stream code if not provided
      let finalCode = code;
      if (!code || code.trim() === '') {
        // Generate code from name: "Science IT" -> "SCI-IT"
        const words = name.split(' ').filter(word => word.length > 0);
        if (words.length >= 2) {
          const firstWord = words[0].substring(0, 3).toUpperCase();
          const secondWord = words[1].substring(0, 2).toUpperCase();
          finalCode = `${firstWord}-${secondWord}`;
        } else if (words.length === 1) {
          finalCode = words[0].substring(0, 6).toUpperCase();
        } else {
          finalCode = 'STREAM';
        }
        
        // Add number suffix if code already exists
        let counter = 1;
        let uniqueCode = finalCode;
        while (true) {
          const existingCode = await Stream.findOne({
            where: {
              school_id,
              branch_id,
              code: uniqueCode,
            },
          });
          if (!existingCode) break;
          uniqueCode = `${finalCode}-${counter}`;
          counter++;
        }
        finalCode = uniqueCode;
      }

      // Check if stream with same name already exists in the same school/branch
      const existingStream = await Stream.findOne({
        where: {
          school_id,
          branch_id,
          name,
        },
      });

      if (existingStream) {
        return res.status(400).json({
          success: false,
          message: 'A stream with this name already exists in this branch',
        });
      }

      // Check if stream with same code already exists in the same school/branch
      const existingCodeStream = await Stream.findOne({
        where: {
          school_id,
          branch_id,
          code: finalCode,
        },
      });

      if (existingCodeStream) {
        return res.status(400).json({
          success: false,
          message: 'A stream with this code already exists in this branch',
        });
      }

      // Create the stream
      const stream = await Stream.create({
        name,
        code: finalCode,
        description,
        class_id,
        school_id,
        branch_id,
        is_active,
        sort_order,
        created_by: req.user.id,
        updated_by: req.user.id,
      });

      // Fetch the created stream with associations
      const createdStream = await Stream.findByPk(stream.id, {
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
          },
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
        ],
      });

      res.status(201).json({
        success: true,
        message: 'Stream created successfully',
        data: createdStream,
      });
    } catch (error) {
      logger.error('Error in StreamController.createStream:', error);
      next(error);
    }
  }

  static async updateStream(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name,
        code,
        description,
        is_active,
        sort_order
      } = req.body;

      // Find the stream with role-based access control
      let whereClause = { id };

      if (req.user.role === 'super_admin') {
        // Super admin can update any stream
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const stream = await Stream.findOne({
        where: whereClause,
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      if (!stream) {
        return res.status(404).json({
          success: false,
          message: 'Stream not found',
        });
      }

      // Check if name is being changed and if it conflicts with existing stream
      if (name && name !== stream.name) {
        const existingStream = await Stream.findOne({
          where: {
            school_id: stream.school_id,
            branch_id: stream.branch_id,
            name,
            id: { [Op.ne]: id }, // Exclude current stream
          },
        });

        if (existingStream) {
          return res.status(400).json({
            success: false,
            message: 'A stream with this name already exists in this branch',
          });
        }
      }

      // Update the stream
      const updateData = {
        updated_by: req.user.id,
      };

      if (name !== undefined) updateData.name = name;
      if (code !== undefined) updateData.code = code;
      if (description !== undefined) updateData.description = description;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (sort_order !== undefined) updateData.sort_order = sort_order;

      await stream.update(updateData);

      // Fetch the updated stream with associations
      const updatedStream = await Stream.findByPk(id, {
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
          },
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
        ],
      });

      res.json({
        success: true,
        message: 'Stream updated successfully',
        data: updatedStream,
      });
    } catch (error) {
      logger.error('Error in StreamController.updateStream:', error);
      next(error);
    }
  }

  static async deleteStream(req, res, next) {
    try {
      const { id } = req.params;

      // Find the stream with role-based access control
      let whereClause = { id };

      if (req.user.role === 'super_admin') {
        // Super admin can delete any stream
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const stream = await Stream.findOne({ where: whereClause });

      if (!stream) {
        return res.status(404).json({
          success: false,
          message: 'Stream not found',
        });
      }

      // Check if stream has sections
      const sectionCount = await stream.countSections();
      if (sectionCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete stream. It has ${sectionCount} section(s) associated with it.`,
        });
      }

      await stream.destroy();

      res.json({
        success: true,
        message: 'Stream deleted successfully',
      });
    } catch (error) {
      logger.error('Error in StreamController.deleteStream:', error);
      next(error);
    }
  }

  // Get streams for dropdown/select
  static async getStreamsForDropdown(req, res, next) {
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
      } else if (req.user.role === 'school_admin') {
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

      const streams = await Stream.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'description'],
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
          },
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
        data: streams,
      });
    } catch (error) {
      logger.error('Error in StreamController.getStreamsForDropdown:', error);
      next(error);
    }
  }
}

module.exports = StreamController; 