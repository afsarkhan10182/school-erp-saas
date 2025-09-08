/**
 * Class-Subject Mapping Controller
 * Handles mapping of subjects to classes and managing subject groups
 */

const { Op } = require('sequelize');
const { Class, Subject, SubjectGroup, SubjectGroupSubject, School, Branch } = require('~/models');
const { logger } = require('~/utils/logger');
const ApiError = require('~/utils/ApiError');
const { apiResponse } = require('~/utils/apiResponse');
const CommonService = require('~/services/shared/common.service');
const QueryService = require('~/services/shared/query.service');

class ClassSubjectMappingController {
  /**
   * Get all class-subject mappings with filtering and pagination
   */
  static async getAllClassSubjectMappings(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        class_id = '',
        subject_id = '',
        academic_year = '',
        search = ''
      } = req.query;

      // Get pagination parameters using common service
      const { offset, limit: actualLimit } = CommonService.getPaginationParams({ page, limit });
      
      // Build role-based where clause using common service
      let whereClause = CommonService.buildRoleBasedWhere(req.user);

      // Add filters
      if (class_id) {
        whereClause.class_id = class_id;
      }

      if (subject_id) {
        whereClause.subject_id = subject_id;
      }

      if (academic_year) {
        whereClause.academic_year = academic_year;
      }

      // Build optimized search query
      if (search) {
        whereClause = QueryService.buildOptimizedSearchQuery(search, ['name', 'code'], whereClause);
      }

      // Get class-subject mappings through subject groups
      const { count, rows } = await SubjectGroup.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
            required: true
          },
          {
            model: Subject,
            as: 'subjects',
            through: {
              attributes: ['sort_order', 'is_required', 'weightage']
            },
            attributes: ['id', 'name', 'code', 'category', 'credit_hours'],
            required: false
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
        order: [['name', 'ASC']],
        limit: actualLimit,
        offset: offset,
        distinct: true
      });

      // Calculate pagination metadata using common service
      const paginationMeta = CommonService.calculatePaginationMeta(count, parseInt(page), actualLimit);

      logger.info(`getAllClassSubjectMappings: Retrieved ${rows.length} mappings out of ${count} total`);

      return res.status(200).json(
        CommonService.formatSuccessResponse('Class-subject mappings retrieved successfully', {
          mappings: rows,
          pagination: paginationMeta
        })
      );
    } catch (error) {
      logger.error('Error in getAllClassSubjectMappings:', error);
      return next(error);
    }
  }

  /**
   * Get class-subject mapping by ID
   */
  static async getClassSubjectMappingById(req, res, next) {
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

      const mapping = await SubjectGroup.findOne({
        where: whereClause,
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
            required: true
          },
          {
            model: Subject,
            as: 'subjects',
            through: {
              attributes: ['sort_order', 'is_required', 'weightage']
            },
            attributes: ['id', 'name', 'code', 'category', 'credit_hours'],
            required: false
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

      if (!mapping) {
        throw new ApiError(404, 'Class-subject mapping not found');
      }

      return res.status(200).json(
        CommonService.formatSuccessResponse('Class-subject mapping retrieved successfully', {
          mapping
        })
      );
    } catch (error) {
      logger.error('Error in getClassSubjectMappingById:', error);
      return next(error);
    }
  }

  /**
   * Create new class-subject mapping
   */
  static async createClassSubjectMapping(req, res, next) {
    try {
      const {
        name,
        code,
        description,
        class_id,
        subject_ids = [],
        academic_year,
        total_credit_hours
      } = req.body;

      // Validate required fields
      if (!name || !code || !class_id || !academic_year) {
        throw new ApiError(400, 'Name, code, class_id, and academic_year are required');
      }

      // Check if class exists and user has access
      let classWhereClause = { id: class_id };
      if (req.user.role === 'school_admin') {
        classWhereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        classWhereClause.school_id = req.user.school_id;
        classWhereClause.branch_id = req.user.branch_id;
      }

      const classRecord = await Class.findOne({ where: classWhereClause });
      if (!classRecord) {
        throw new ApiError(404, 'Class not found or access denied');
      }

      // Check if mapping already exists for this class and academic year
      const existingMapping = await SubjectGroup.findOne({
        where: {
          class_id,
          academic_year,
          school_id: req.user.school_id,
          branch_id: req.user.branch_id || null
        }
      });

      if (existingMapping) {
        throw new ApiError(400, 'Subject mapping already exists for this class and academic year');
      }

      // Create the subject group (mapping)
      const mapping = await SubjectGroup.create({
        name,
        code,
        description,
        class_id,
        academic_year,
        total_credit_hours: total_credit_hours || 0,
        school_id: req.user.school_id,
        branch_id: req.user.branch_id,
        created_by: req.user.id,
        updated_by: req.user.id
      });

      // Add subjects to the mapping if provided
      if (subject_ids.length > 0) {
        const subjectMappings = subject_ids.map((subjectId, index) => ({
          subject_group_id: mapping.id,
          subject_id,
          sort_order: index + 1,
          is_required: true,
          weightage: 100.00
        }));

        await SubjectGroupSubject.bulkCreate(subjectMappings);
      }

      // Log the operation
      CommonService.logOperation('create', 'class_subject_mapping', mapping.id, req.user, {
        name,
        code,
        class_id,
        subject_count: subject_ids.length
      });

      return res.status(201).json(
        CommonService.formatSuccessResponse('Class-subject mapping created successfully', {
          mapping
        })
      );
    } catch (error) {
      logger.error('Error in createClassSubjectMapping:', error);
      return next(error);
    }
  }

  /**
   * Update class-subject mapping
   */
  static async updateClassSubjectMapping(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name,
        code,
        description,
        subject_ids = [],
        total_credit_hours
      } = req.body;

      let whereClause = { id };
      
      // Add role-based access control
      if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      const mapping = await SubjectGroup.findOne({ where: whereClause });
      if (!mapping) {
        throw new ApiError(404, 'Class-subject mapping not found');
      }

      // Update the mapping
      await mapping.update({
        name: name || mapping.name,
        code: code || mapping.code,
        description: description !== undefined ? description : mapping.description,
        total_credit_hours: total_credit_hours !== undefined ? total_credit_hours : mapping.total_credit_hours,
        updated_by: req.user.id
      });

      // Update subjects if provided
      if (subject_ids.length > 0) {
        // Remove existing subject mappings
        await SubjectGroupSubject.destroy({
          where: { subject_group_id: id }
        });

        // Add new subject mappings
        const subjectMappings = subject_ids.map((subjectId, index) => ({
          subject_group_id: id,
          subject_id,
          sort_order: index + 1,
          is_required: true,
          weightage: 100.00
        }));

        await SubjectGroupSubject.bulkCreate(subjectMappings);
      }

      // Log the operation
      CommonService.logOperation('update', 'class_subject_mapping', id, req.user, {
        name,
        code,
        subject_count: subject_ids.length
      });

      return res.status(200).json(
        CommonService.formatSuccessResponse('Class-subject mapping updated successfully', {
          mapping
        })
      );
    } catch (error) {
      logger.error('Error in updateClassSubjectMapping:', error);
      return next(error);
    }
  }

  /**
   * Delete class-subject mapping
   */
  static async deleteClassSubjectMapping(req, res, next) {
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

      const mapping = await SubjectGroup.findOne({ where: whereClause });
      if (!mapping) {
        throw new ApiError(404, 'Class-subject mapping not found');
      }

      // Check if mapping is being used in any active academic year
      // This would require checking related tables like timetables, exams, etc.
      // For now, we'll allow deletion but log it

      // Delete the mapping (cascade will handle related records)
      await mapping.destroy();

      // Log the operation
      CommonService.logOperation('delete', 'class_subject_mapping', id, req.user);

      return res.status(200).json(
        CommonService.formatSuccessResponse('Class-subject mapping deleted successfully')
      );
    } catch (error) {
      logger.error('Error in deleteClassSubjectMapping:', error);
      return next(error);
    }
  }

  /**
   * Get subjects for a specific class
   */
  static async getSubjectsByClass(req, res, next) {
    try {
      const { class_id } = req.params;
      const { academic_year } = req.query;

      if (!class_id) {
        throw new ApiError(400, 'Class ID is required');
      }

      let whereClause = { class_id };
      
      // Add role-based access control
      if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      if (academic_year) {
        whereClause.academic_year = academic_year;
      }

      const mappings = await SubjectGroup.findAll({
        where: whereClause,
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code'],
            required: true
          },
          {
            model: Subject,
            as: 'subjects',
            through: {
              attributes: ['sort_order', 'is_required', 'weightage']
            },
            attributes: ['id', 'name', 'code', 'category', 'credit_hours'],
            required: false
          }
        ],
        order: [['name', 'ASC']]
      });

      return res.status(200).json(
        CommonService.formatSuccessResponse('Class subjects retrieved successfully', {
          mappings
        })
      );
    } catch (error) {
      logger.error('Error in getSubjectsByClass:', error);
      return next(error);
    }
  }

  /**
   * Get classes for a specific subject
   */
  static async getClassesBySubject(req, res, next) {
    try {
      const { subject_id } = req.params;
      const { academic_year } = req.query;

      if (!subject_id) {
        throw new ApiError(400, 'Subject ID is required');
      }

      let whereClause = { subject_id };
      
      // Add role-based access control
      if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      const mappings = await SubjectGroupSubject.findAll({
        where: whereClause,
        include: [
          {
            model: SubjectGroup,
            as: 'subjectGroup',
            attributes: ['id', 'name', 'code', 'academic_year'],
            include: [
              {
                model: Class,
                as: 'class',
                attributes: ['id', 'name', 'code'],
                required: true
              }
            ],
            required: true
          },
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code', 'category'],
            required: true
          }
        ],
        order: [['sort_order', 'ASC']]
      });

      return res.status(200).json(
        CommonService.formatSuccessResponse('Subject classes retrieved successfully', {
          mappings
        })
      );
    } catch (error) {
      logger.error('Error in getClassesBySubject:', error);
      return next(error);
    }
  }
}

module.exports = ClassSubjectMappingController;
