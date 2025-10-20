const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { success, asyncHandler } = require('~/utils/shared/apiResponse');
const { MarkDistribution } = require('~/models');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');

class MarkDistributionController {
  /**
   * Get all mark distributions
   */
  static getAllMarkDistributions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, type, is_active, school_id, branch_id } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      school_id: school_id || req.schoolId
    };

    if (branch_id || req.branchId) {
      whereClause.branch_id = branch_id || req.branchId;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (type) {
      whereClause.type = type;
    }

    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const { count, rows } = await MarkDistribution.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          association: 'school',
          attributes: ['id', 'name', 'code']
        },
        {
          association: 'branch',
          attributes: ['id', 'name', 'code']
        },
        {
          association: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    // Format response to match other APIs
    return res.status(200).json({
      success: true,
      message: 'Mark distributions retrieved successfully',
      data: {
        distributions: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: totalPages
        }
      }
    });
  });

  /**
   * Get mark distribution by ID
   */
  static getMarkDistributionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const distribution = await MarkDistribution.findByPk(id, {
      include: [
        {
          association: 'school',
          attributes: ['id', 'name', 'code']
        },
        {
          association: 'branch',
          attributes: ['id', 'name', 'code']
        },
        {
          association: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!distribution) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Mark distribution not found');
    }

    success(res, distribution, 'Mark distribution retrieved successfully');
  });

  /**
   * Create new mark distribution
   */
  static createMarkDistribution = asyncHandler(async (req, res) => {
    // Check for duplicate name in same school and branch
    const existing = await MarkDistribution.findOne({
      where: {
        name: req.body.name,
        school_id: req.schoolId,
        branch_id: req.body.branch_id
      }
    });

    if (existing) {
      throw new ApiError(
        409,
        'Mark distribution with this name already exists in the selected branch'
      );
    }

    // Only accept essential fields and set sensible defaults
    const distributionData = {
      name: req.body.name,
      branch_id: req.body.branch_id,
      school_id: req.schoolId,
      created_by: req.user.id,
      // Set sensible defaults for other fields
      type: 'theory_practical',
      description: '',
      theory_marks: 0,
      practical_marks: 0,
      viva_marks: 0,
      assignment_marks: 0,
      total_marks: 100,
      pass_marks: 35,
      is_active: true
    };

    const distribution = await MarkDistribution.create(distributionData);

    // Fetch the created distribution with associations
    const createdDistribution = await MarkDistribution.findByPk(distribution.id, {
      include: [
        {
          association: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    success(res, createdDistribution, 'Mark distribution created successfully', httpStatus.CREATED);
  });

  /**
   * Update mark distribution
   */
  static updateMarkDistribution = asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Only accept essential fields for update
    const updateData = {
      name: req.body.name,
      branch_id: req.body.branch_id,
      updated_by: req.user.id
    };

    const distribution = await MarkDistribution.findByPk(id);

    if (!distribution) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Mark distribution not found');
    }

    // Check for duplicate name if name or branch is being updated
    if (
      (req.body.name && req.body.name !== distribution.name) ||
      (req.body.branch_id && req.body.branch_id !== distribution.branch_id)
    ) {
      const existing = await MarkDistribution.findOne({
        where: {
          name: req.body.name,
          school_id: distribution.school_id,
          branch_id: req.body.branch_id,
          id: { [Op.ne]: id } // Exclude current distribution
        }
      });

      if (existing) {
        throw new ApiError(
          409,
          'Mark distribution with this name already exists in the selected branch'
        );
      }
    }

    await distribution.update(updateData);

    // Fetch the updated distribution with associations
    const updatedDistribution = await MarkDistribution.findByPk(id, {
      include: [
        {
          association: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    success(res, updatedDistribution, 'Mark distribution updated successfully');
  });

  /**
   * Delete mark distribution
   */
  static deleteMarkDistribution = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const distribution = await MarkDistribution.findByPk(id);

    if (!distribution) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Mark distribution not found');
    }

    await distribution.destroy();

    success(res, null, 'Mark distribution deleted successfully');
  });

  /**
   * Get mark distributions by type
   */
  static getMarkDistributionsByType = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { school_id, branch_id } = req.query;

    const whereClause = {
      type,
      school_id: school_id || req.schoolId,
      is_active: true
    };

    if (branch_id || req.branchId) {
      whereClause.branch_id = branch_id || req.branchId;
    }

    const distributions = await MarkDistribution.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    success(res, distributions, 'Mark distributions by type retrieved successfully');
  });

  /**
   * Get active mark distributions
   */
  static getActiveMarkDistributions = asyncHandler(async (req, res) => {
    const { school_id, branch_id } = req.query;

    const whereClause = {
      school_id: school_id || req.schoolId,
      is_active: true
    };

    if (branch_id || req.branchId) {
      whereClause.branch_id = branch_id || req.branchId;
    }

    const distributions = await MarkDistribution.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    success(res, distributions, 'Active mark distributions retrieved successfully');
  });

  /**
   * Toggle active status
   */
  static toggleActiveStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const distribution = await MarkDistribution.findByPk(id);

    if (!distribution) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Mark distribution not found');
    }

    await distribution.update({
      is_active: !distribution.is_active,
      updated_by: req.user.id
    });

    success(res, distribution, 'Mark distribution status updated successfully');
  });
}

module.exports = MarkDistributionController;
