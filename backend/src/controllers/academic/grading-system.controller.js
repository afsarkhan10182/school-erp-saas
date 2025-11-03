const httpStatus = require('http-status');
const { Op } = require('sequelize');
const ApiError = require('~/utils/shared/ApiError');
const { success, error, asyncHandler } = require('~/utils/shared/apiResponse');
const { GradingSystem, GradeScale, Branch } = require('~/models');
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

    // Get total count separately to avoid issues with includes
    const count = await GradingSystem.count({
      where: whereClause
    });

    // Get the actual records with includes
    const rows = await GradingSystem.findAll({
      where: whereClause,
      include: [
        {
          model: GradeScale,
          as: 'gradeScales',
          order: [['sort_order', 'ASC']]
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
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
    // Check for duplicate name in same school and branch
    const existing = await GradingSystem.findOne({
      where: {
        name: req.body.name,
        school_id: req.schoolId,
        branch_id: req.body.branch_id
      }
    });

    if (existing) {
      throw new ApiError(
        409,
        'Grading system with this name already exists in the selected branch'
      );
    }

    // Only accept essential fields and set sensible defaults
    const gradingSystemData = {
      name: req.body.name,
      branch_id: req.body.branch_id,
      grade_point: req.body.grade_point,
      min_percentage: req.body.min_percentage,
      max_percentage: req.body.max_percentage,
      description: req.body.description || '',
      school_id: req.schoolId,
      created_by: req.user.id,
      updated_by: req.user.id,
      // Set sensible defaults for other fields
      code: `GS${Date.now()}`, // Auto-generate code
      grade_type: 'letter',
      passing_percentage: 35.0,
      max_grade_points: 4.0,
      is_active: true,
      is_default: false
    };

    const gradingSystem = await GradingSystem.create(gradingSystemData);

    // Fetch the created grading system with branch association
    const gradingSystemWithBranch = await GradingSystem.findByPk(gradingSystem.id, {
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    success(
      res,
      { gradingSystem: gradingSystemWithBranch },
      'Grading system created successfully',
      httpStatus.CREATED
    );
  });

  /**
   * Update grading system
   */
  static updateGradingSystem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Only accept essential fields for update
    const updateData = {
      name: req.body.name,
      branch_id: req.body.branch_id,
      grade_point: req.body.grade_point,
      min_percentage: req.body.min_percentage,
      max_percentage: req.body.max_percentage,
      description: req.body.description,
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

    // Check for duplicate name if name or branch is being updated
    if (
      (req.body.name && req.body.name !== gradingSystem.name) ||
      (req.body.branch_id && req.body.branch_id !== gradingSystem.branch_id)
    ) {
      const existing = await GradingSystem.findOne({
        where: {
          name: req.body.name,
          school_id: gradingSystem.school_id,
          branch_id: req.body.branch_id,
          id: { [Op.ne]: id } // Exclude current grading system
        }
      });

      if (existing) {
        throw new ApiError(
          409,
          'Grading system with this name already exists in the selected branch'
        );
      }
    }

    await gradingSystem.update(updateData);

    // Fetch the updated grading system with branch association
    const updatedGradingSystem = await GradingSystem.findByPk(id, {
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
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

    // Allow deletion of any grading system, including default ones
    // Users can delete any grading system they want
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
