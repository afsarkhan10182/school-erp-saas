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

    // Check if fee type already exists
    const existingFeeType = await FeeType.findOne({
      where: {
        code,
        school_id: req.schoolId,
      },
    });

    if (existingFeeType) {
      throw new ApiError(400, 'Fee type with this code already exists.');
    }

    // Create fee type
    const feeType = await FeeType.create({
      name,
      code,
      category,
      is_active,
      school_id: req.schoolId,
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
    const feeTypes = await FeeType.findAll({
      where: {
        school_id: req.schoolId,
        is_active: true,
      },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
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

    const feeType = await FeeType.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
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

    const feeType = await FeeType.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
    });

    if (!feeType) {
      throw new ApiError(404, 'Fee type not found.');
    }

    // Check if code is being updated and if it already exists
    if (code && code !== feeType.code) {
      const existingFeeType = await FeeType.findOne({
        where: {
          code: code,
          school_id: req.schoolId,
        },
      });

      if (existingFeeType) {
        throw new ApiError(400, 'Fee type with this code already exists.');
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

    const feeType = await FeeType.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
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

module.exports = {
  createFeeType,
  getFeeTypes,
  getFeeTypeById,
  updateFeeType,
  deleteFeeType,
};
