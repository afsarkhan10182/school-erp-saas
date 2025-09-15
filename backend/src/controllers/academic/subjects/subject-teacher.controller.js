const { Op } = require('sequelize');
const { SubjectTeacher, Subject, User, Class, School, Branch } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const { apiResponse } = require('~/utils/shared/apiResponse');
const SubjectTeacherService = require('~/services/academic/subject-teacher.service');

class SubjectTeacherController {
  // Get all subject-teacher assignments with filtering and pagination
  static async getAllSubjectTeachers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        subject_id = '',
        teacher_id = '',
        class_id = '',
        school_id = '',
        branch_id = '',
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let whereClause = {};

      // Role-based access control
      if (req.user.role === 'super_admin') {
        // Super admin can see all assignments
      } else if (req.user.role === 'school_admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      } else if (req.user.role === 'teacher') {
        whereClause.teacher_id = req.user.id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Add filters
      if (subject_id) whereClause.subject_id = subject_id;
      if (teacher_id) whereClause.teacher_id = teacher_id;
      if (class_id) whereClause.class_id = class_id;
      if (school_id) whereClause.school_id = school_id;
      if (branch_id) whereClause.branch_id = branch_id;

      const includeArray = [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
          required: false
        }
      ];

      const { count, rows } = await SubjectTeacher.findAndCountAll({
        where: whereClause,
        include: includeArray,
        order: [[sort_by, sort_order]],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return apiResponse(res, 200, 'Subject teachers retrieved successfully', {
        subjectTeachers: rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_records: count,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Error in getAllSubjectTeachers:', error);
      next(new ApiError(500, 'Failed to retrieve subject teachers'));
    }
  }

  // Get subject-teacher assignment by ID
  static async getSubjectTeacherById(req, res, next) {
    try {
      const { id } = req.params;

      const subjectTeacher = await SubjectTeacher.findByPk(id, {
        include: [
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code', 'description']
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name']
          },
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

      if (!subjectTeacher) {
        return res.status(404).json({
          success: false,
          message: 'Subject teacher assignment not found'
        });
      }

      return apiResponse(res, 200, 'Subject teacher assignment retrieved successfully', {
        subjectTeacher
      });
    } catch (error) {
      logger.error('Error in getSubjectTeacherById:', error);
      next(new ApiError(500, 'Failed to retrieve subject teacher assignment'));
    }
  }

  // Create new subject-teacher assignment
  static async createSubjectTeacher(req, res, next) {
    try {
      const assignmentData = {
        ...req.body,
        school_id: req.user.school_id,
        branch_id: req.user.branch_id,
        created_by: req.user.id
      };

      const subjectTeacher = await SubjectTeacher.create(assignmentData);

      const createdAssignment = await SubjectTeacher.findByPk(subjectTeacher.id, {
        include: [
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name']
          }
        ]
      });

      return apiResponse(res, 201, 'Subject teacher assignment created successfully', {
        subjectTeacher: createdAssignment
      });
    } catch (error) {
      logger.error('Error in createSubjectTeacher:', error);
      next(new ApiError(500, 'Failed to create subject teacher assignment'));
    }
  }

  // Update subject-teacher assignment
  static async updateSubjectTeacher(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updated_by: req.user.id
      };

      const subjectTeacher = await SubjectTeacher.findByPk(id);

      if (!subjectTeacher) {
        return res.status(404).json({
          success: false,
          message: 'Subject teacher assignment not found'
        });
      }

      await subjectTeacher.update(updateData);

      const updatedAssignment = await SubjectTeacher.findByPk(id, {
        include: [
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name']
          }
        ]
      });

      return apiResponse(res, 200, 'Subject teacher assignment updated successfully', {
        subjectTeacher: updatedAssignment
      });
    } catch (error) {
      logger.error('Error in updateSubjectTeacher:', error);
      next(new ApiError(500, 'Failed to update subject teacher assignment'));
    }
  }

  // Delete subject-teacher assignment
  static async deleteSubjectTeacher(req, res, next) {
    try {
      const { id } = req.params;

      const subjectTeacher = await SubjectTeacher.findByPk(id);

      if (!subjectTeacher) {
        return res.status(404).json({
          success: false,
          message: 'Subject teacher assignment not found'
        });
      }

      await subjectTeacher.destroy();

      return apiResponse(res, 200, 'Subject teacher assignment deleted successfully');
    } catch (error) {
      logger.error('Error in deleteSubjectTeacher:', error);
      next(new ApiError(500, 'Failed to delete subject teacher assignment'));
    }
  }

  // Get subject teachers by subject
  static async getSubjectTeachersBySubject(req, res, next) {
    try {
      const { subjectId } = req.params;

      const subjectTeachers = await SubjectTeacher.findAll({
        where: { subject_id: subjectId },
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name']
          }
        ]
      });

      return apiResponse(res, 200, 'Subject teachers retrieved successfully', { subjectTeachers });
    } catch (error) {
      logger.error('Error in getSubjectTeachersBySubject:', error);
      next(new ApiError(500, 'Failed to retrieve subject teachers'));
    }
  }

  // Get subject teachers by teacher
  static async getSubjectTeachersByTeacher(req, res, next) {
    try {
      const { teacherId } = req.params;

      const subjectTeachers = await SubjectTeacher.findAll({
        where: { teacher_id: teacherId },
        include: [
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name']
          }
        ]
      });

      return apiResponse(res, 200, 'Subject teachers retrieved successfully', { subjectTeachers });
    } catch (error) {
      logger.error('Error in getSubjectTeachersByTeacher:', error);
      next(new ApiError(500, 'Failed to retrieve subject teachers'));
    }
  }

  // Get subject teachers for dropdown
  static async getSubjectTeachersForDropdown(req, res, next) {
    try {
      const { class_id, subject_id } = req.query;
      let whereClause = {};

      if (class_id) whereClause.class_id = class_id;
      if (subject_id) whereClause.subject_id = subject_id;

      const subjectTeachers = await SubjectTeacher.findAll({
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
            attributes: ['id', 'name']
          }
        ],
        attributes: ['id']
      });

      return apiResponse(res, 200, 'Subject teachers for dropdown retrieved successfully', {
        subjectTeachers
      });
    } catch (error) {
      logger.error('Error in getSubjectTeachersForDropdown:', error);
      next(new ApiError(500, 'Failed to retrieve subject teachers for dropdown'));
    }
  }

  // Get teacher workload data
  static async getTeacherWorkload(req, res, next) {
    try {
      const {
        teacher_id = '',
        academic_year = '',
        class_id = '',
        page = 1,
        limit = 10
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let whereClause = {};

      // Role-based access control
      if (req.user.role === 'super_admin') {
        // Super admin can see all assignments
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
      if (teacher_id) {
        whereClause.teacher_id = teacher_id;
      }
      if (academic_year) {
        whereClause.academic_year = academic_year;
      }
      if (class_id) {
        whereClause.class_id = class_id;
      }

      // Get all assignments with associations
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
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name']
          }
        ],
        order: [['teacher_id', 'ASC']]
      });

      // Group by teacher and calculate workload
      const teacherWorkload = {};
      assignments.forEach(assignment => {
        const teacherId = assignment.teacher_id;
        if (!teacherWorkload[teacherId]) {
          teacherWorkload[teacherId] = {
            teacher_id: teacherId,
            teacher_name: `${assignment.teacher.first_name} ${assignment.teacher.last_name}`,
            teacher_email: assignment.teacher.email,
            total_subjects: 0,
            primary_subjects: 0,
            classes: new Set(),
            assignments: []
          };
        }

        teacherWorkload[teacherId].total_subjects++;
        if (assignment.is_primary) {
          teacherWorkload[teacherId].primary_subjects++;
        }
        if (assignment.class) {
          teacherWorkload[teacherId].classes.add(assignment.class.name);
        }
        teacherWorkload[teacherId].assignments.push({
          id: assignment.id,
          subject_name: assignment.subject.name,
          class_name: assignment.class?.name,
          is_primary: assignment.is_primary
        });
      });

      // Convert to array and add workload status
      const workloadData = Object.values(teacherWorkload).map(teacher => {
        teacher.classes = Array.from(teacher.classes);

        // Determine workload status
        if (teacher.total_subjects <= 2) {
          teacher.workload_status = 'light';
        } else if (teacher.total_subjects <= 4) {
          teacher.workload_status = 'balanced';
        } else if (teacher.total_subjects <= 6) {
          teacher.workload_status = 'moderate';
        } else {
          teacher.workload_status = 'heavy';
        }

        return teacher;
      });

      // Calculate stats
      const stats = {
        totalTeachers: workloadData.length,
        totalAssignments: assignments.length,
        primaryAssignments: assignments.filter(a => a.is_primary).length,
        averageWorkload:
          workloadData.length > 0
            ? Math.round(
                (workloadData.reduce((sum, t) => sum + t.total_subjects, 0) / workloadData.length) *
                  10
              ) / 10
            : 0
      };

      return res.status(200).json({
        success: true,
        data: {
          workload: workloadData,
          stats
        }
      });
    } catch (error) {
      logger.error('Error in getTeacherWorkload:', error);
      next(new ApiError(500, 'Failed to get teacher workload data'));
    }
  }
}

module.exports = SubjectTeacherController;
