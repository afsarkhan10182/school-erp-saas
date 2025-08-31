const { Op } = require('sequelize');
const { SubjectTeacher, Subject, User, Class, School } = require('~/models');
const BaseService = require('../shared/base.service');
const ApiError = require('~/utils/ApiError');
const { logger } = require('~/utils/logger');

class SubjectTeacherService extends BaseService {
  /**
   * Create a new subject-teacher assignment
   */
  static async createSubjectTeacher(assignmentData, userId) {
    return this.executeWithErrorHandling(async () => {
      // Validate entities exist
      await this.validateEntityExists(Subject, assignmentData.subject_id, 'Subject');
      await this.validateEntityExists(User, assignmentData.teacher_id, 'Teacher');
      if (assignmentData.class_id) {
        await this.validateEntityExists(Class, assignmentData.class_id, 'Class');
      }

      // Check for duplicate assignment
      const existingAssignment = await SubjectTeacher.findOne({
        where: {
          school_id: assignmentData.school_id,
          subject_id: assignmentData.subject_id,
          teacher_id: assignmentData.teacher_id,
          class_id: assignmentData.class_id || null,
          is_active: true
        }
      });

      if (existingAssignment) {
        throw new ApiError(400, 'This teacher is already assigned to this subject for this class');
      }

      const assignment = await SubjectTeacher.create({
        ...assignmentData,
        created_by: userId,
        updated_by: userId
      });

      return assignment;
    }, 'Create Subject Teacher Assignment');
  }

  /**
   * Get all subject-teacher assignments with pagination and filtering
   */
  static async getAllSubjectTeachers(params, user) {
    return this.executeWithErrorHandling(async () => {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        subject_id, 
        teacher_id, 
        class_id, 
        is_active, 
        branch_id 
      } = params;
      const offset = (page - 1) * limit;

      const whereClause = {
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      // Add filters
      if (search) {
        whereClause[Op.or] = [
          { '$subject.name$': { [Op.iLike]: `%${search}%` } },
          { '$teacher.first_name$': { [Op.iLike]: `%${search}%` } },
          { '$teacher.last_name$': { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (subject_id) whereClause.subject_id = subject_id;
      if (teacher_id) whereClause.teacher_id = teacher_id;
      if (class_id) whereClause.class_id = class_id;
      if (is_active !== '') whereClause.is_active = is_active === 'true';
      if (branch_id) whereClause.branch_id = branch_id;

      const { count, rows } = await SubjectTeacher.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code', 'category']
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return {
        subject_teachers: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages
        }
      };
    }, 'Get All Subject Teachers');
  }

  /**
   * Get subject-teacher assignment by ID
   */
  static async getSubjectTeacherById(id, user) {
    return this.executeWithErrorHandling(async () => {
      const assignment = await SubjectTeacher.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        },
        include: [
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code', 'category', 'description']
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'role']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      if (!assignment) {
        throw new ApiError(404, 'Subject-teacher assignment not found');
      }

      return assignment;
    }, 'Get Subject Teacher By ID');
  }

  /**
   * Update subject-teacher assignment
   */
  static async updateSubjectTeacher(id, updateData, user) {
    return this.executeWithErrorHandling(async () => {
      const assignment = await SubjectTeacher.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!assignment) {
        throw new ApiError(404, 'Subject-teacher assignment not found');
      }

      // Check for duplicate assignment if subject/teacher/class is being updated
      if (updateData.subject_id || updateData.teacher_id || updateData.class_id) {
        const checkData = {
          school_id: user.school_id,
          subject_id: updateData.subject_id || assignment.subject_id,
          teacher_id: updateData.teacher_id || assignment.teacher_id,
          class_id: updateData.class_id || assignment.class_id,
          id: { [Op.ne]: id },
          is_active: true
        };

        const existingAssignment = await SubjectTeacher.findOne({
          where: checkData
        });

        if (existingAssignment) {
          throw new ApiError(400, 'This teacher is already assigned to this subject for this class');
        }
      }

      await assignment.update({
        ...updateData,
        updated_by: user.id
      });

      return assignment;
    }, 'Update Subject Teacher');
  }

  /**
   * Delete subject-teacher assignment
   */
  static async deleteSubjectTeacher(id, user) {
    return this.executeWithErrorHandling(async () => {
      const assignment = await SubjectTeacher.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!assignment) {
        throw new ApiError(404, 'Subject-teacher assignment not found');
      }

      await assignment.destroy();

      return { message: 'Subject-teacher assignment deleted successfully' };
    }, 'Delete Subject Teacher');
  }

  /**
   * Get teachers for a specific subject
   */
  static async getTeachersForSubject(subjectId, user, filters = {}) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        subject_id: subjectId,
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      if (filters.class_id) whereClause.class_id = filters.class_id;

      const assignments = await SubjectTeacher.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['teacher', 'first_name', 'ASC']]
      });

      return assignments;
    }, 'Get Teachers For Subject');
  }

  /**
   * Get subjects for a specific teacher
   */
  static async getSubjectsForTeacher(teacherId, user, filters = {}) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        teacher_id: teacherId,
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      if (filters.class_id) whereClause.class_id = filters.class_id;

      const assignments = await SubjectTeacher.findAll({
        where: whereClause,
        include: [
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code', 'category', 'description']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['subject', 'name', 'ASC']]
      });

      return assignments;
    }, 'Get Subjects For Teacher');
  }

  /**
   * Get subject-teacher assignments for dropdown
   */
  static async getSubjectTeachersForDropdown(user, filters = {}) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      // Apply filters
      if (filters.subject_id) whereClause.subject_id = filters.subject_id;
      if (filters.teacher_id) whereClause.teacher_id = filters.teacher_id;
      if (filters.class_id) whereClause.class_id = filters.class_id;

      const assignments = await SubjectTeacher.findAll({
        where: whereClause,
        include: [
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['subject', 'name', 'ASC']]
      });

      return assignments;
    }, 'Get Subject Teachers For Dropdown');
  }

  /**
   * Get subject-teacher statistics
   */
  static async getSubjectTeacherStats(user) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      const [
        totalAssignments,
        activeAssignments,
        assignmentsBySubject,
        assignmentsByTeacher
      ] = await Promise.all([
        SubjectTeacher.count({ where: whereClause }),
        SubjectTeacher.count({ where: { ...whereClause, is_active: true } }),
        SubjectTeacher.findAll({
          where: whereClause,
          attributes: [
            'subject_id',
            [SubjectTeacher.sequelize.fn('COUNT', SubjectTeacher.sequelize.col('id')), 'count']
          ],
          group: ['subject_id'],
          include: [
            {
              model: Subject,
              as: 'subject',
              attributes: ['id', 'name']
            }
          ],
          raw: true
        }),
        SubjectTeacher.findAll({
          where: whereClause,
          attributes: [
            'teacher_id',
            [SubjectTeacher.sequelize.fn('COUNT', SubjectTeacher.sequelize.col('id')), 'count']
          ],
          group: ['teacher_id'],
          include: [
            {
              model: User,
              as: 'teacher',
              attributes: ['id', 'first_name', 'last_name']
            }
          ],
          raw: true
        })
      ]);

      return {
        total_assignments: totalAssignments,
        active_assignments: activeAssignments,
        assignments_by_subject: assignmentsBySubject,
        assignments_by_teacher: assignmentsByTeacher
      };
    }, 'Get Subject Teacher Stats');
  }

  /**
   * Bulk create subject-teacher assignments
   */
  static async bulkCreateSubjectTeachers(assignmentsData, userId) {
    return this.executeWithErrorHandling(async () => {
      const results = [];
      
      for (const assignmentData of assignmentsData) {
        try {
          const assignment = await this.createSubjectTeacher(assignmentData, userId);
          results.push({
            success: true,
            data: assignment,
            subject_id: assignmentData.subject_id,
            teacher_id: assignmentData.teacher_id
          });
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            subject_id: assignmentData.subject_id,
            teacher_id: assignmentData.teacher_id
          });
        }
      }

      return results;
    }, 'Bulk Create Subject Teachers');
  }

  /**
   * Search subject-teacher assignments
   */
  static async searchSubjectTeachers(searchTerm, user, limit = 10) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id }),
        [Op.or]: [
          { '$subject.name$': { [Op.iLike]: `%${searchTerm}%` } },
          { '$subject.code$': { [Op.iLike]: `%${searchTerm}%` } },
          { '$teacher.first_name$': { [Op.iLike]: `%${searchTerm}%` } },
          { '$teacher.last_name$': { [Op.iLike]: `%${searchTerm}%` } }
        ]
      };

      const assignments = await SubjectTeacher.findAll({
        where: whereClause,
        include: [
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code', 'category']
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['subject', 'name', 'ASC']],
        limit: parseInt(limit)
      });

      return assignments;
    }, 'Search Subject Teachers');
  }
}

module.exports = SubjectTeacherService;
