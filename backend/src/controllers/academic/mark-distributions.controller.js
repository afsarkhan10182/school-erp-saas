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

    success(res, rows, 'Mark distributions retrieved successfully');
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
    const distributionData = {
      ...req.body,
      school_id: req.schoolId,
      branch_id: req.branchId || req.user.branch_id,
      created_by: req.user.id
    };

    const distribution = await MarkDistribution.create(distributionData);

    success(res, distribution, 'Mark distribution created successfully', httpStatus.CREATED);
  });

  /**
   * Update mark distribution
   */
  static updateMarkDistribution = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    const distribution = await MarkDistribution.findByPk(id);

    if (!distribution) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Mark distribution not found');
    }

    await distribution.update(updateData);

    success(res, distribution, 'Mark distribution updated successfully');
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
