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
    const gradingSystemData = {
      ...req.body,
      school_id: req.schoolId,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    // Validate grade scales if provided
    if (gradingSystemData.gradeScales && gradingSystemData.gradeScales.length > 0) {
      // Validate grade scale ranges don't overlap
      const scales = gradingSystemData.gradeScales.sort(
        (a, b) => a.min_percentage - b.min_percentage
      );
      for (let i = 0; i < scales.length - 1; i++) {
        if (scales[i].max_percentage >= scales[i + 1].min_percentage) {
          throw new ApiError(400, 'Grade scale ranges cannot overlap');
        }
      }
    }

    const gradingSystem = await GradingSystem.create(gradingSystemData, {
      include: [
        {
          model: GradeScale,
          as: 'gradeScales'
        }
      ]
    });

    // If grade scales are provided, create them
    if (gradingSystemData.gradeScales && gradingSystemData.gradeScales.length > 0) {
      const gradeScalesData = gradingSystemData.gradeScales.map((scale, index) => ({
        ...scale,
        grading_system_id: gradingSystem.id,
        sort_order: index + 1,
        created_by: req.user.id,
        updated_by: req.user.id
      }));

      await GradeScale.bulkCreate(gradeScalesData);
    }

    // Reload with grade scales
    const createdGradingSystem = await GradingSystem.findByPk(gradingSystem.id, {
      include: [
        {
          model: GradeScale,
          as: 'gradeScales',
          order: [['sort_order', 'ASC']]
        }
      ]
    });

    success(
      res,
      { gradingSystem: createdGradingSystem },
      'Grading system created successfully',
      httpStatus.CREATED
    );
  });

  /**
   * Update grading system
   */
  static updateGradingSystem = asyncHandler(async (req, res) => {
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

    // If grade scales are being updated, validate them
    if (updateData.gradeScales && updateData.gradeScales.length > 0) {
      const scales = updateData.gradeScales.sort((a, b) => a.min_percentage - b.min_percentage);
      for (let i = 0; i < scales.length - 1; i++) {
        if (scales[i].max_percentage >= scales[i + 1].min_percentage) {
          throw new ApiError(400, 'Grade scale ranges cannot overlap');
        }
      }
    }

    await gradingSystem.update(updateData);

    // Update grade scales if provided
    if (updateData.gradeScales) {
      // Delete existing grade scales
      await GradeScale.destroy({
        where: { grading_system_id: id }
      });

      // Create new grade scales
      const gradeScalesData = updateData.gradeScales.map((scale, index) => ({
        ...scale,
        grading_system_id: id,
        sort_order: index + 1,
        created_by: req.user.id,
        updated_by: req.user.id
      }));

      await GradeScale.bulkCreate(gradeScalesData);
    }

    // Reload with grade scales
    const updatedGradingSystem = await GradingSystem.findByPk(id, {
      include: [
        {
          model: GradeScale,
          as: 'gradeScales',
          order: [['sort_order', 'ASC']]
        }
      ]
    });

    success(res, { gradingSystem: updatedGradingSystem }, 'Grading system updated successfully');
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
