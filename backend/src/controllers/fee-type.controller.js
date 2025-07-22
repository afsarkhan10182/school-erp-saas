const { FeeType } = require('../models');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');

// Create a new fee type
const createFeeType = async (req, res, next) => {
  try {
    const {
      name,
      code,
      category,
      is_active = true,
    } = req.body;

    // For school admin, use their school_id from the token
    // For super admin, use the school_id from request body
    const schoolId = req.user.role === 'super_admin' ? req.body.school_id : req.user.school_id;
    const branchId = req.body.branch_id || req.user.branch_id;

    // Validate required fields
    if (!name || !code) {
      throw new ApiError(400, 'Name and code are required');
    }

    if (!schoolId) {
      throw new ApiError(400, 'School context is required');
    }

    // Check if fee type already exists within the school context (only active ones)
    const existingFeeType = await FeeType.findOne({
      where: {
        code,
        school_id: schoolId,
        is_active: true, // Only check active fee types
        // Only check branch_id if it's provided
        ...(branchId && { branch_id: branchId }),
      },
    });

    if (existingFeeType) {
      throw new ApiError(400, 'Fee type with this code already exists in this school/branch.');
    }

    // Check if there's a soft-deleted fee type with the same code
    const softDeletedFeeType = await FeeType.findOne({
      where: {
        code,
        school_id: schoolId,
        is_active: false, // Check for soft-deleted fee types
        // Only check branch_id if it's provided
        ...(branchId && { branch_id: branchId }),
      },
    });

    if (softDeletedFeeType) {
      throw new ApiError(400, `A fee type with code '${code}' was previously deleted. Please use a different code or contact support to restore the deleted fee type.`);
    }

    // Create fee type
    const feeType = await FeeType.create({
      name,
      code,
      category,
      is_active,
      school_id: schoolId,
      branch_id: branchId,
      created_by: req.user.id,
    });

    logger.info(`Fee type created: ${feeType.name} (${feeType.code})`);
    return res.status(201).json({ success: true, data: feeType });
  } catch (error) {
    logger.error('Error creating fee type:', error);
    return next(error);
  }
};

// Get all fee types
const getFeeTypes = async (req, res, next) => {
  try {
    const whereClause = {
      school_id: req.schoolId,
      is_active: true,
    };

    // Add branch filter if branch context is set and not super admin
    if (req.branchId && req.user.role !== 'super_admin') {
      whereClause.branch_id = req.branchId;
    }

    const feeTypes = await FeeType.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
    });

    return res.status(200).json({ success: true, data: feeTypes });
  } catch (error) {
    logger.error('Error fetching fee types:', error);
    return next(error);
  }
};

// Get fee type by ID
const getFeeTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // For school admin, use their school_id from the token
    // For super admin, use the school_id from query params or their context
    const schoolId = req.user.role === 'super_admin' ? (req.query.school_id || req.schoolId) : req.user.school_id;
    const branchId = req.query.branch_id || req.user.branch_id;

    const whereClause = {
      id,
      school_id: schoolId,
    };

    // Add branch filter if branch context is set
    if (branchId) {
      whereClause.branch_id = branchId;
    }

    const feeType = await FeeType.findOne({
      where: whereClause,
    });

    if (!feeType) {
      throw new ApiError(404, 'Fee type not found.');
    }

    return res.status(200).json({ success: true, data: feeType });
  } catch (error) {
    logger.error('Error fetching fee type:', error);
    return next(error);
  }
};

// Update fee type
const updateFeeType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, category, is_active } = req.body;

    // For school admin, use their school_id from the token
    // For super admin, use the school_id from request body or existing fee type
    const schoolId = req.user.role === 'super_admin' ? (req.body.school_id || req.schoolId) : req.user.school_id;
    const branchId = req.body.branch_id || req.user.branch_id;

    const whereClause = {
      id,
      school_id: schoolId,
    };

    // Add branch filter if branch context is set
    if (branchId) {
      whereClause.branch_id = branchId;
    }

    const feeType = await FeeType.findOne({
      where: whereClause,
    });

    if (!feeType) {
      throw new ApiError(404, 'Fee type not found.');
    }

    // Check if code is being updated and if it already exists (only active ones)
    if (code && code !== feeType.code) {
      const existingFeeType = await FeeType.findOne({
        where: {
          code: code,
          school_id: schoolId,
          is_active: true, // Only check active fee types
          // Only check branch_id if it's provided
          ...(branchId && { branch_id: branchId }),
        },
      });

      if (existingFeeType) {
        throw new ApiError(400, 'Fee type with this code already exists in this school/branch.');
      }
    }

    await feeType.update({
      name,
      code,
      category,
      is_active,
      updated_by: req.user.id,
    });

    logger.info(`Fee type updated: ${feeType.name} (${feeType.code})`);
    return res.status(200).json({ success: true, data: feeType });
  } catch (error) {
    logger.error('Error updating fee type:', error);
    return next(error);
  }
};

// Delete fee type (soft delete)
const deleteFeeType = async (req, res, next) => {
  try {
    const { id } = req.params;

    // For school admin, use their school_id from the token
    // For super admin, use the school_id from query params or their context
    const schoolId = req.user.role === 'super_admin' ? (req.query.school_id || req.schoolId) : req.user.school_id;
    const branchId = req.query.branch_id || req.user.branch_id;

    const whereClause = {
      id,
      school_id: schoolId,
    };

    // Add branch filter if branch context is set
    if (branchId) {
      whereClause.branch_id = branchId;
    }

    const feeType = await FeeType.findOne({
      where: whereClause,
    });

    if (!feeType) {
      throw new ApiError(404, 'Fee type not found.');
    }

    await feeType.update({
      is_active: false,
      updated_by: req.user.id,
    });

    logger.info(`Fee type deleted: ${feeType.name} (${feeType.code})`);
    return res.status(200).json({ success: true, message: 'Fee type deleted successfully.' });
  } catch (error) {
    logger.error('Error deleting fee type:', error);
    return next(error);
  }
};

// Restore fee type (reactivate soft-deleted fee type)
const restoreFeeType = async (req, res, next) => {
  try {
    const { id } = req.params;

    // For school admin, use their school_id from the token
    // For super admin, use the school_id from query params or their context
    const schoolId = req.user.role === 'super_admin' ? (req.query.school_id || req.schoolId) : req.user.school_id;
    const branchId = req.query.branch_id || req.user.branch_id;

    const whereClause = {
      id,
      school_id: schoolId,
      is_active: false, // Only restore soft-deleted fee types
    };

    // Add branch filter if branch context is set
    if (branchId) {
      whereClause.branch_id = branchId;
    }

    const feeType = await FeeType.findOne({
      where: whereClause,
    });

    if (!feeType) {
      throw new ApiError(404, 'Fee type not found or already active.');
    }

    // Check if there's already an active fee type with the same code
    const existingActiveFeeType = await FeeType.findOne({
      where: {
        code: feeType.code,
        school_id: schoolId,
        is_active: true,
        // Only check branch_id if it's provided
        ...(branchId && { branch_id: branchId }),
      },
    });

    if (existingActiveFeeType) {
      throw new ApiError(400, `Cannot restore fee type. An active fee type with code '${feeType.code}' already exists.`);
    }

    await feeType.update({
      is_active: true,
      updated_by: req.user.id,
    });

    logger.info(`Fee type restored: ${feeType.name} (${feeType.code})`);
    return res.status(200).json({ success: true, message: 'Fee type restored successfully.', data: feeType });
  } catch (error) {
    logger.error('Error restoring fee type:', error);
    return next(error);
  }
};

module.exports = {
  createFeeType,
  getFeeTypes,
  getFeeTypeById,
  updateFeeType,
  deleteFeeType,
  restoreFeeType,
};
