const { ClassTeacher, Class, Section, Stream, User, School, Branch } = require('~/models');
const apiResponse = require('~/utils/shared/apiResponse');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');

class ClassTeacherController {
  // Get all class teachers
  static async getAllClassTeachers(req, res, next) {
    try {
      const { class_id, section_id, academic_year, branch_id, page = 1, limit = 10 } = req.query;

      const whereClause = {
        school_id: req.user.school_id,
        is_active: true
      };

      // Use branch_id from query if provided, otherwise use user's branch_id
      if (branch_id) {
        whereClause.branch_id = branch_id;
      } else {
        whereClause.branch_id = req.user.branch_id;
      }

      if (class_id) whereClause.class_id = class_id;
      if (section_id) whereClause.section_id = section_id;
      if (academic_year) whereClause.academic_year = academic_year;

      const allocations = await ClassTeacher.findAndCountAll({
        where: whereClause,
        include: [
          { model: Class, as: 'class', attributes: ['id', 'name', 'code'] },
          { model: Section, as: 'section', attributes: ['id', 'name'] },
          { model: Stream, as: 'stream', attributes: ['id', 'name', 'code'] },
          { model: User, as: 'teacher', attributes: ['id', 'first_name', 'last_name', 'email'] }
        ],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      return apiResponse.success(
        res,
        {
          classTeachers: allocations.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: allocations.count,
            totalPages: Math.ceil(allocations.count / parseInt(limit))
          }
        },
        'Class teachers retrieved successfully'
      );
    } catch (error) {
      logger.error('Error in getAllClassTeachers:', error);
      next(new ApiError(500, 'Failed to retrieve teacher allocations'));
    }
  }

  // Create class teacher assignment
  static async createClassTeacher(req, res, next) {
    try {
      const { class_id, section_id, stream_id, teacher_id, academic_year, branch_id } = req.body;

      // Determine school_id and branch_id based on user role (following class controller pattern)
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
      } else if (req.user.role === 'admin') {
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
          message: 'Insufficient permissions to create class teacher assignment'
        });
      }

      // Validate that teacher exists and belongs to the correct school/branch
      const teacher = await User.findByPk(teacher_id);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Check if teacher belongs to the correct school
      if (teacher.school_id !== school_id) {
        return res.status(400).json({
          success: false,
          message: 'Teacher does not belong to the selected school'
        });
      }

      // For branch admin, also check if teacher belongs to the same branch
      if (req.user.role === 'branch_admin' && teacher.branch_id !== final_branch_id) {
        return res.status(400).json({
          success: false,
          message: 'Teacher does not belong to your branch'
        });
      }

      // Validate that class exists and belongs to the correct school/branch
      const classRecord = await Class.findByPk(class_id);
      if (!classRecord) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Check if class belongs to the correct school
      if (classRecord.school_id !== school_id) {
        return res.status(400).json({
          success: false,
          message: 'Class does not belong to the selected school'
        });
      }

      // Check if class belongs to the correct branch
      if (classRecord.branch_id !== final_branch_id) {
        return res.status(400).json({
          success: false,
          message: 'Class does not belong to the selected branch'
        });
      }

      // Validate unique class teacher assignment
      const existingAllocation = await ClassTeacher.findOne({
        where: {
          class_id,
          section_id: section_id || null,
          stream_id: stream_id || null,
          academic_year,
          school_id: school_id,
          branch_id: final_branch_id,
          is_active: true
        },
        include: [
          { model: Class, as: 'class' },
          { model: Section, as: 'section' },
          { model: Stream, as: 'stream' },
          { model: User, as: 'teacher' }
        ]
      });

      if (existingAllocation) {
        // Build a more descriptive error message
        let errorMessage = 'Class teacher already assigned';
        if (section_id) {
          errorMessage += ` to section ${existingAllocation.section?.name || 'Unknown'}`;
        } else {
          errorMessage += ' to this class';
        }
        if (stream_id) {
          errorMessage += ` in stream ${existingAllocation.stream?.name || 'Unknown'}`;
        }
        errorMessage += ` for academic year ${academic_year}`;
        errorMessage += ` (Currently assigned to: ${existingAllocation.teacher?.first_name || 'Unknown'} ${existingAllocation.teacher?.last_name || ''})`;

        return res.status(400).json({
          success: false,
          message: errorMessage
        });
      }

      // Check if the same teacher is already assigned to this exact class-section-stream combination
      const teacherAlreadyAssigned = await ClassTeacher.findOne({
        where: {
          teacher_id,
          class_id,
          section_id: section_id || null,
          stream_id: stream_id || null,
          academic_year,
          school_id: school_id,
          branch_id: final_branch_id,
          is_active: true
        }
      });

      if (teacherAlreadyAssigned) {
        return res.status(400).json({
          success: false,
          message: 'This teacher is already assigned to this class for the same academic year'
        });
      }

      const allocation = await ClassTeacher.create({
        class_id,
        section_id: section_id || null,
        stream_id: stream_id || null,
        teacher_id,
        academic_year,
        school_id: school_id,
        branch_id: final_branch_id,
        created_by: req.user.id,
        updated_by: req.user.id
      });

      return apiResponse.created(res, { allocation }, 'Class teacher assigned successfully');
    } catch (error) {
      logger.error('Error in createClassTeacher:', error);
      next(new ApiError(500, 'Failed to create teacher allocation'));
    }
  }

  // Update class teacher assignment
  static async updateClassTeacher(req, res, next) {
    try {
      const { id } = req.params;
      const { class_id, section_id, stream_id, teacher_id, academic_year } = req.body;

      const allocation = await ClassTeacher.findByPk(id);
      if (!allocation) {
        throw new ApiError(404, 'Class teacher assignment not found');
      }

      // Validate unique class teacher assignment (excluding current record)
      const existingAllocation = await ClassTeacher.findOne({
        where: {
          class_id,
          section_id: section_id || null,
          stream_id: stream_id || null,
          academic_year,
          school_id: req.user.school_id,
          branch_id: req.user.branch_id,
          is_active: true,
          id: { [require('sequelize').Op.ne]: id } // Exclude current record
        }
      });

      if (existingAllocation) {
        // Build a more descriptive error message
        let errorMessage = 'Class teacher already assigned';
        if (section_id) {
          errorMessage += ` to section ${existingAllocation.section?.name || 'Unknown'}`;
        } else {
          errorMessage += ' to this class';
        }
        if (stream_id) {
          errorMessage += ` in stream ${existingAllocation.stream?.name || 'Unknown'}`;
        }
        errorMessage += ` for academic year ${academic_year}`;

        throw new ApiError(400, errorMessage);
      }

      // Optional: Check if teacher is already assigned to another class
      // This allows teachers to be assigned to multiple different classes
      // Remove this validation if you want to allow multiple assignments per teacher

      await allocation.update({
        class_id,
        section_id: section_id || null,
        stream_id: stream_id || null,
        teacher_id,
        academic_year,
        updated_by: req.user.id
      });

      return apiResponse.success(res, { allocation }, 'Class teacher updated successfully');
    } catch (error) {
      logger.error('Error in updateClassTeacher:', error);
      next(new ApiError(500, 'Failed to update teacher allocation'));
    }
  }

  // Delete class teacher assignment
  static async deleteClassTeacher(req, res, next) {
    try {
      const { id } = req.params;

      const allocation = await ClassTeacher.findByPk(id);
      if (!allocation) {
        throw new ApiError(404, 'Class teacher assignment not found');
      }

      await allocation.update({ is_active: false, updated_by: req.user.id });

      return apiResponse.success(res, {}, 'Class teacher removed successfully');
    } catch (error) {
      logger.error('Error in deleteClassTeacher:', error);
      next(new ApiError(500, 'Failed to delete teacher allocation'));
    }
  }
}

module.exports = ClassTeacherController;
