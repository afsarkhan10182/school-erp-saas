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
      const { class_id, section_id, stream_id, teacher_id, academic_year } = req.body;

      // Validate unique class teacher assignment
      const existingAllocation = await ClassTeacher.findOne({
        where: {
          class_id,
          section_id: section_id || null,
          stream_id: stream_id || null,
          academic_year,
          school_id: req.user.school_id,
          branch_id: req.user.branch_id,
          is_active: true
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

      // Optional: Check if teacher is already assigned to the SAME class-section-stream combination
      // This allows teachers to be assigned to multiple different classes
      // Remove this validation if you want to allow multiple assignments per teacher

      const allocation = await ClassTeacher.create({
        class_id,
        section_id: section_id || null,
        stream_id: stream_id || null,
        teacher_id,
        academic_year,
        school_id: req.user.school_id,
        branch_id: req.user.branch_id,
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
