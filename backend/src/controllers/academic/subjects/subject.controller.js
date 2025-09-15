const { Op } = require('sequelize');
const { Subject, Class, School, Branch, User } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const { apiResponse } = require('~/utils/shared/apiResponse');
const SubjectService = require('~/services/academic/subject.service');
const CommonService = require('~/services/shared/common.service');
const QueryService = require('~/services/shared/query.service');

class SubjectController {
  // Get all subjects with filtering and pagination
  static async getAllSubjects(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        is_active = '',
        class_id = '',
        school_id = '',
        branch_id = '',
        category = '',
        sort_by = 'name',
        sort_order = 'ASC'
      } = req.query;

      // Get pagination parameters using common service
      const { offset, limit: actualLimit } = CommonService.getPaginationParams({ page, limit });

      // Build role-based where clause using common service
      let whereClause = CommonService.buildRoleBasedWhere(req.user);

      // Add filters
      if (is_active !== '') {
        whereClause.is_active = is_active === 'true';
      }

      if (class_id) {
        whereClause.class_id = class_id;
      }

      if (school_id) {
        whereClause.school_id = school_id;
      }

      if (branch_id) {
        whereClause.branch_id = branch_id;
      }

      if (category) {
        whereClause.category = category;
      }

      // Build optimized search query
      if (search) {
        whereClause = QueryService.buildOptimizedSearchQuery(
          search,
          ['name', 'code', 'description'],
          whereClause
        );
      }

      // Get optimized query configuration
      const queryConfig = QueryService.getSubjectQuery(whereClause, {
        limit: actualLimit,
        offset: offset,
        order: [[sort_by, sort_order.toUpperCase()]]
      });

      // Execute optimized query
      const { count, rows } = await QueryService.executeOptimizedQuery(Subject, queryConfig);

      // Calculate pagination metadata using common service
      const paginationMeta = CommonService.calculatePaginationMeta(
        count,
        parseInt(page),
        actualLimit
      );

      logger.info(`getAllSubjects: Retrieved ${rows.length} subjects out of ${count} total`);

      return res.status(200).json(
        CommonService.formatSuccessResponse('Subjects retrieved successfully', {
          subjects: rows,
          pagination: paginationMeta
        })
      );
    } catch (error) {
      logger.error('Error in getAllSubjects:', error);
      return next(error);
    }
  }

  // Get subject by ID
  static async getSubjectById(req, res, next) {
    try {
      const { id } = req.params;

      let whereClause = { id };

      // Role-based access control
      if (req.user.role === 'super_admin') {
        // Super admin can access any subject
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const subject = await Subject.findOne({
        where: whereClause,
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
            model: Class,
            as: 'class',
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
          }
        ]
      });

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Subject retrieved successfully',
        data: { subject }
      });
    } catch (error) {
      logger.error('Error in getSubjectById:', error);
      return next(error);
    }
  }

  // Create new subject
  static async createSubject(req, res, next) {
    try {
      const {
        name,
        code,
        description,
        category = 'core',
        credit_hours = 1,
        is_active = true,
        class_id,
        branch_id
      } = req.body;

      // Role-based access control
      if (req.user.role === 'super_admin') {
        // Super admin can create subjects for any school
        if (!req.body.school_id) {
          return res.status(400).json({
            success: false,
            message: 'school_id is required for super admin'
          });
        }
      } else if (req.user.role === 'school_admin') {
        // School admin can only create subjects for their school
        req.body.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        // Branch admin can only create subjects for their branch
        req.body.school_id = req.user.school_id;
        req.body.branch_id = req.user.branch_id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if subject code already exists for the school/branch
      const existingSubject = await Subject.findOne({
        where: {
          school_id: req.body.school_id,
          branch_id: req.body.branch_id || null,
          code: code
        }
      });

      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'Subject code already exists for this school/branch'
        });
      }

      const subjectData = {
        name,
        code,
        description,
        category,
        credit_hours,
        is_active,
        class_id: class_id || null,
        school_id: req.body.school_id,
        branch_id: req.body.branch_id || null,
        created_by: req.user.id,
        updated_by: req.user.id
      };

      const subject = await Subject.create(subjectData);

      // Fetch the created subject with associations
      const createdSubject = await Subject.findByPk(subject.id, {
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
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      logger.info(`Subject created: ${subject.name} (${subject.code}) by user ${req.user.id}`);

      return res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: { subject: createdSubject }
      });
    } catch (error) {
      logger.error('Error in createSubject:', error);
      return next(error);
    }
  }

  // Update subject
  static async updateSubject(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      let whereClause = { id };

      // Role-based access control
      if (req.user.role === 'super_admin') {
        // Super admin can update any subject
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const subject = await Subject.findOne({ where: whereClause });

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      // Check if subject code already exists for the school/branch (if code is being updated)
      if (updateData.code && updateData.code !== subject.code) {
        const existingSubject = await Subject.findOne({
          where: {
            school_id: subject.school_id,
            branch_id: subject.branch_id,
            code: updateData.code,
            id: { [Op.ne]: id }
          }
        });

        if (existingSubject) {
          return res.status(400).json({
            success: false,
            message: 'Subject code already exists for this school/branch'
          });
        }
      }

      // Add updated_by
      updateData.updated_by = req.user.id;

      await subject.update(updateData);

      // Fetch the updated subject with associations
      const updatedSubject = await Subject.findByPk(id, {
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
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      logger.info(`Subject updated: ${subject.name} (${subject.code}) by user ${req.user.id}`);

      return res.status(200).json({
        success: true,
        message: 'Subject updated successfully',
        data: { subject: updatedSubject }
      });
    } catch (error) {
      logger.error('Error in updateSubject:', error);
      return next(error);
    }
  }

  // Delete subject
  static async deleteSubject(req, res, next) {
    try {
      const { id } = req.params;

      let whereClause = { id };

      // Role-based access control
      if (req.user.role === 'super_admin') {
        // Super admin can delete any subject
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const subject = await Subject.findOne({ where: whereClause });

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      // Check if subject is being used in exams or attendance sessions
      const { Exam, AttendanceSession } = require('~/models');

      const examCount = await Exam.count({ where: { subject_id: id } });
      const attendanceCount = await AttendanceSession.count({ where: { subject_id: id } });

      if (examCount > 0 || attendanceCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete subject. It is being used in ${examCount} exam(s) and ${attendanceCount} attendance session(s).`
        });
      }

      await subject.destroy();

      logger.info(`Subject deleted: ${subject.name} (${subject.code}) by user ${req.user.id}`);

      return res.status(200).json({
        success: true,
        message: 'Subject deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteSubject:', error);
      return next(error);
    }
  }

  // Get subjects for dropdown
  static async getSubjectsForDropdown(req, res, next) {
    try {
      const { class_id, branch_id, category } = req.query;
      let whereClause = { is_active: true };

      // Role-based access control
      if (req.user.role === 'super_admin') {
        // Super admin can see all subjects
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Add filters
      if (class_id) {
        whereClause.class_id = class_id;
      }
      if (branch_id) {
        whereClause.branch_id = branch_id;
      }
      if (category) {
        whereClause.category = category;
      }

      const subjects = await Subject.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'category', 'credit_hours'],
        order: [['name', 'ASC']]
      });

      return res.status(200).json({
        success: true,
        message: 'Subjects retrieved successfully',
        data: { subjects }
      });
    } catch (error) {
      logger.error('Error in getSubjectsForDropdown:', error);
      return next(error);
    }
  }

  // Get subject statistics
  static async getSubjectStats(req, res, next) {
    try {
      let whereClause = {};

      // Role-based access control
      if (req.user.role === 'super_admin') {
        // Super admin can see all subjects
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const totalSubjects = await Subject.count({ where: whereClause });
      const activeSubjects = await Subject.count({ where: { ...whereClause, is_active: true } });
      const inactiveSubjects = await Subject.count({ where: { ...whereClause, is_active: false } });

      // Count by category
      const categoryStats = await Subject.findAll({
        where: whereClause,
        attributes: [
          'category',
          [Subject.sequelize.fn('COUNT', Subject.sequelize.col('id')), 'count']
        ],
        group: ['category'],
        raw: true
      });

      return res.status(200).json({
        success: true,
        message: 'Subject statistics retrieved successfully',
        data: {
          stats: {
            total: totalSubjects,
            active: activeSubjects,
            inactive: inactiveSubjects,
            byCategory: categoryStats
          }
        }
      });
    } catch (error) {
      logger.error('Error in getSubjectStats:', error);
      return next(error);
    }
  }
}

module.exports = SubjectController;
