/**
 * Class-Subject Assignment Controller
 * Handles simple class-subject assignments without complex groups
 */

const { Op } = require('sequelize');
const {
  Class,
  Subject,
  Section,
  Stream,
  School,
  Branch,
  ClassSubjectAssignment
} = require('~/models');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const apiResponse = require('~/utils/shared/apiResponse');
const CommonService = require('~/services/shared/common.service');
const QueryService = require('~/services/shared/query.service');

class ClassSubjectAssignmentController {
  /**
   * Get all class-subject assignments with filtering and pagination
   */
  static async getAllAssignments(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        class_id = '',
        subject_id = '',
        section_id = '',
        stream_id = '',
        academic_year = '',
        search = ''
      } = req.query;

      // Get pagination parameters
      const { offset, limit: actualLimit } = CommonService.getPaginationParams({ page, limit });

      // Build role-based where clause
      let whereClause = CommonService.buildRoleBasedWhere(req.user);

      // Add filters
      if (class_id) whereClause.class_id = class_id;
      if (subject_id) whereClause.subject_id = subject_id;
      if (section_id) whereClause.section_id = section_id;
      if (stream_id) whereClause.stream_id = stream_id;
      if (academic_year) whereClause.academic_year = academic_year;

      // Build search query
      if (search) {
        whereClause = QueryService.buildOptimizedSearchQuery(
          search,
          ['academic_year'],
          whereClause
        );
      }

      const { count, rows } = await ClassSubjectAssignment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code', 'category']
          },
          {
            model: Section,
            as: 'section',
            attributes: ['id', 'name', 'capacity'],
            required: false
          },
          {
            model: Stream,
            as: 'stream',
            attributes: ['id', 'name', 'code'],
            required: false
          },
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        limit: actualLimit,
        offset: offset
      });

      const totalPages = Math.ceil(count / actualLimit);

      return apiResponse.success(
        res,
        {
          assignments: rows,
          pagination: {
            page: parseInt(page),
            limit: actualLimit,
            total: count,
            totalPages
          }
        },
        'Class-subject assignments retrieved successfully'
      );
    } catch (error) {
      logger.error('Error in getAllAssignments:', error);
      return next(new ApiError(500, 'Failed to retrieve assignments'));
    }
  }

  /**
   * Get assignment by ID
   */
  static async getAssignmentById(req, res, next) {
    try {
      const { id } = req.params;

      let whereClause = { id };
      if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      const assignment = await ClassSubjectAssignment.findOne({
        where: whereClause,
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code', 'category']
          },
          {
            model: Section,
            as: 'section',
            attributes: ['id', 'name', 'capacity'],
            required: false
          },
          {
            model: Stream,
            as: 'stream',
            attributes: ['id', 'name', 'code'],
            required: false
          }
        ]
      });

      if (!assignment) {
        throw new ApiError(404, 'Assignment not found');
      }

      return apiResponse.success(res, { assignment }, 'Assignment retrieved successfully');
    } catch (error) {
      logger.error('Error in getAssignmentById:', error);
      return next(error);
    }
  }

  /**
   * Create new class-subject assignment
   */
  static async createAssignment(req, res, next) {
    try {
      const { class_id, subject_id, section_id = null, stream_id = null, academic_year } = req.body;

      // Validate required fields
      if (!class_id || !subject_id || !academic_year) {
        throw new ApiError(400, 'Class ID, Subject ID, and Academic Year are required');
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

      // Check if subject exists
      const subjectRecord = await Subject.findOne({
        where: {
          id: subject_id,
          school_id: req.user.school_id
        }
      });
      if (!subjectRecord) {
        throw new ApiError(404, 'Subject not found or access denied');
      }

      // Check if assignment already exists
      const existingAssignment = await ClassSubjectAssignment.findOne({
        where: {
          class_id,
          subject_id,
          section_id: section_id || null,
          stream_id: stream_id || null,
          academic_year,
          school_id: req.user.school_id,
          branch_id: req.user.branch_id || null
        }
      });

      if (existingAssignment) {
        throw new ApiError(
          400,
          'Assignment already exists for this class, subject, and academic year'
        );
      }

      // Create the assignment
      const assignment = await ClassSubjectAssignment.create({
        class_id,
        subject_id,
        section_id,
        stream_id,
        academic_year,
        school_id: req.user.school_id,
        branch_id: req.user.branch_id,
        created_by: req.user.id,
        updated_by: req.user.id
      });

      // Load the created assignment with relations
      const createdAssignment = await ClassSubjectAssignment.findByPk(assignment.id, {
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code', 'category']
          },
          {
            model: Section,
            as: 'section',
            attributes: ['id', 'name', 'capacity'],
            required: false
          },
          {
            model: Stream,
            as: 'stream',
            attributes: ['id', 'name', 'code'],
            required: false
          }
        ]
      });

      return apiResponse.created(
        res,
        { assignment: createdAssignment },
        'Assignment created successfully'
      );
    } catch (error) {
      logger.error('Error in createAssignment:', error);
      return next(error);
    }
  }

  /**
   * Bulk create class-subject assignments
   */
  static async bulkCreateAssignments(req, res, next) {
    try {
      console.log('🔍 Bulk create request body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 apiResponse type:', typeof apiResponse);
      console.log('🔍 apiResponse.success type:', typeof apiResponse?.success);
      const { assignments } = req.body;

      if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
        throw new ApiError(400, 'Assignments array is required');
      }

      console.log('🔍 Assignments array:', JSON.stringify(assignments, null, 2));

      const results = [];
      const errors = [];

      for (const assignmentData of assignments) {
        try {
          const {
            class_id,
            subject_id,
            section_id = null,
            stream_id = null,
            academic_year
          } = assignmentData;

          // Validate required fields
          if (!class_id || !subject_id || !academic_year) {
            errors.push({
              assignment: assignmentData,
              error: 'Class ID, Subject ID, and Academic Year are required'
            });
            continue;
          }

          // Check if assignment already exists
          const existingAssignment = await ClassSubjectAssignment.findOne({
            where: {
              class_id,
              subject_id,
              section_id: section_id || null,
              stream_id: stream_id || null,
              academic_year,
              school_id: req.user.school_id,
              branch_id: req.user.branch_id || null
            }
          });

          if (existingAssignment) {
            errors.push({
              assignment: assignmentData,
              error: 'Assignment already exists'
            });
            continue;
          }

          // Create the assignment
          const assignment = await ClassSubjectAssignment.create({
            class_id,
            subject_id,
            section_id,
            stream_id,
            academic_year,
            school_id: req.user.school_id,
            branch_id: req.user.branch_id,
            created_by: req.user.id,
            updated_by: req.user.id
          });

          results.push({
            success: true,
            assignment: assignment,
            class_id,
            subject_id
          });
        } catch (error) {
          errors.push({
            assignment: assignmentData,
            error: error.message
          });
        }
      }

      return apiResponse.success(
        res,
        {
          successful: results.length,
          failed: errors.length,
          results,
          errors
        },
        'Bulk assignments processed',
        201
      );
    } catch (error) {
      logger.error('Error in bulkCreateAssignments:', error);
      return next(error);
    }
  }

  /**
   * Delete class-subject assignment
   */
  static async deleteAssignment(req, res, next) {
    try {
      const { id } = req.params;

      let whereClause = { id };
      if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      const assignment = await ClassSubjectAssignment.findOne({ where: whereClause });
      if (!assignment) {
        throw new ApiError(404, 'Assignment not found');
      }

      await assignment.destroy();

      return apiResponse.success(res, null, 'Assignment deleted successfully');
    } catch (error) {
      logger.error('Error in deleteAssignment:', error);
      return next(error);
    }
  }
}

module.exports = ClassSubjectAssignmentController;
