const httpStatus = require('http-status');
const ApiError = require('~/utils/shared/ApiError');
const { success, error, asyncHandler } = require('~/utils/shared/apiResponse');
const { GradingSystem, GradeScale } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const GradingService = require('~/services/academic/grading.service');

class GradingSystemController {
  /**
   * Get all grading systems for a school
   */
  static getAllGradingSystems = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, is_active } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      school_id: req.schoolId
    };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const { count, rows } = await GradingSystem.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: GradeScale,
          as: 'gradeScales',
          order: [['sort_order', 'ASC']]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    success(
      res,
      {
        gradingSystems: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages
        }
      },
      'Grading systems retrieved successfully'
    );
  });

  /**
   * Get grading system by ID
   */
  static getGradingSystemById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const gradingSystem = await GradingSystem.findOne({
      where: {
        id,
        school_id: req.schoolId
      },
      include: [
        {
          model: GradeScale,
          as: 'gradeScales',
          order: [['sort_order', 'ASC']]
        }
      ]
    });

    if (!gradingSystem) {
      throw new ApiError(404, 'Grading system not found');
    }

    success(res, { gradingSystem }, 'Grading system retrieved successfully');
  });

  /**
   * Create a new grading system
   */
  static createGradingSystem = asyncHandler(async (req, res) => {
    // CodeIgniter Style - Handle simplified payload
    const gradingSystemData = {
      ...req.body,
      school_id: req.schoolId,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    // Set defaults for optional fields if not provided
    if (!gradingSystemData.description) {
      gradingSystemData.description = '';
    }
    if (!gradingSystemData.grade_type) {
      gradingSystemData.grade_type = 'letter';
    }
    if (!gradingSystemData.passing_percentage) {
      gradingSystemData.passing_percentage = 35.0;
    }
    if (!gradingSystemData.max_grade_points) {
      gradingSystemData.max_grade_points = 4.0;
    }
    if (!gradingSystemData.is_active) {
      gradingSystemData.is_active = true;
    }
    if (!gradingSystemData.is_default) {
      gradingSystemData.is_default = false;
    }

    const gradingSystem = await GradingSystem.create(gradingSystemData);

    success(res, { gradingSystem }, 'Grading system created successfully', httpStatus.CREATED);
  });

  /**
   * Update grading system
   */
  static updateGradingSystem = asyncHandler(async (req, res) => {
    // CodeIgniter Style - Handle simplified payload
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    const gradingSystem = await GradingSystem.findOne({
      where: {
        id,
        school_id: req.schoolId
      }
    });

    if (!gradingSystem) {
      throw new ApiError(404, 'Grading system not found');
    }

    await gradingSystem.update(updateData);

    success(res, { gradingSystem }, 'Grading system updated successfully');
  });

  /**
   * Delete grading system
   */
  static deleteGradingSystem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const gradingSystem = await GradingSystem.findOne({
      where: {
        id,
        school_id: req.schoolId
      }
    });

    if (!gradingSystem) {
      throw new ApiError(404, 'Grading system not found');
    }

    // Check if it's the default grading system
    if (gradingSystem.is_default) {
      throw new ApiError(400, 'Cannot delete the default grading system');
    }

    // Check if it's being used by any exams
    // This would require checking exam results or other references
    // For now, we'll allow deletion

    await gradingSystem.destroy();

    success(
      res,
      { message: 'Grading system deleted successfully' },
      'Grading system deleted successfully'
    );
  });

  /**
   * Set default grading system
   */
  static setDefaultGradingSystem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const gradingSystem = await GradingSystem.findOne({
      where: {
        id,
        school_id: req.schoolId
      }
    });

    if (!gradingSystem) {
      throw new ApiError(404, 'Grading system not found');
    }

    // Unset other defaults
    await GradingSystem.update(
      { is_default: false },
      {
        where: {
          school_id: req.schoolId,
          is_default: true
        }
      }
    );

    // Set this as default
    await gradingSystem.update({ is_default: true });

    success(res, { gradingSystem }, 'Default grading system updated successfully');
  });

  /**
   * Get default grading system
   */
  static getDefaultGradingSystem = asyncHandler(async (req, res) => {
    const gradingSystem = await GradingService.getDefaultGradingSystem(req.schoolId);
    success(res, { gradingSystem }, 'Default grading system retrieved successfully');
  });

  /**
   * Test grade calculation
   */
  static testGradeCalculation = asyncHandler(async (req, res) => {
    const { percentage } = req.query;

    if (!percentage || isNaN(parseFloat(percentage))) {
      throw new ApiError(400, 'Valid percentage is required');
    }

    const gradeData = await GradingService.calculateGrade(parseFloat(percentage), req.schoolId);
    success(res, gradeData, 'Grade calculated successfully');
  });
}

module.exports = GradingSystemController;
