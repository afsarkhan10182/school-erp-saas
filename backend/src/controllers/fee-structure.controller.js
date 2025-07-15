const { FeeStructure, FeeType } = require('../models');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');

// Create a new fee structure
const createFeeStructure = async (req, res, next) => {
  try {
    const {
      name,
      academic_year,
      class_name,
      section,
      fee_type_id,
      amount,
      installment_type,
      installment_count,
      due_month,
      due_day,
      discount_applicable,
      discount_amount,
      discount_type,
      notes,
    } = req.body;

    // Check if fee structure already exists for this class and fee type
    const existingFeeStructure = await FeeStructure.findOne({
      where: {
        school_id: req.schoolId,
        academic_year,
        class_name,
        fee_type_id,
      },
    });

    if (existingFeeStructure) {
      throw new ApiError(400, 'Fee structure already exists for this class and fee type in this academic year.');
    }

    // Verify fee type exists
    const feeType = await FeeType.findOne({
      where: {
        id: fee_type_id,
        school_id: req.schoolId,
        is_active: true,
      },
    });

    if (!feeType) {
      throw new ApiError(404, 'Fee type not found.');
    }

    // Create fee structure
    const feeStructure = await FeeStructure.create({
      name,
      academic_year,
      class_name,
      section,
      fee_type_id,
      amount,
      installment_type,
      installment_count,
      due_month,
      due_day,
      discount_applicable,
      discount_amount,
      discount_type,
      notes,
      school_id: req.schoolId,
      branch_id: req.branchId,
      created_by: req.user.id,
    });

    // Include fee type in response
    const feeStructureWithType = await FeeStructure.findByPk(feeStructure.id, {
      include: [
        {
          model: FeeType,
          as: 'feeType',
        },
      ],
    });

    logger.info(`Fee structure created: ${feeStructure.name} - ${feeStructure.class_name} (${feeStructure.academic_year})`);
    return res.status(201).json({ success: true, data: feeStructureWithType });
  } catch (error) {
    logger.error('Error creating fee structure:', error);
    return next(error);
  }
};

// Get all fee structures
const getFeeStructures = async (req, res, next) => {
  try {
    const { academic_year, class_name, fee_type_id } = req.query;
    
    const whereClause = {
      school_id: req.schoolId,
      is_active: true,
    };

    if (academic_year) whereClause.academic_year = academic_year;
    if (class_name) whereClause.class_name = class_name;
    if (fee_type_id) whereClause.fee_type_id = fee_type_id;

    const feeStructures = await FeeStructure.findAll({
      where: whereClause,
      include: [
        {
          model: FeeType,
          as: 'feeType',
        },
      ],
      order: [['academic_year', 'DESC'], ['class_name', 'ASC']],
    });

    return res.status(200).json({ success: true, data: feeStructures });
  } catch (error) {
    logger.error('Error fetching fee structures:', error);
    return next(error);
  }
};

// Get fee structure by ID
const getFeeStructureById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const feeStructure = await FeeStructure.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
      include: [
        {
          model: FeeType,
          as: 'feeType',
        },
      ],
    });

    if (!feeStructure) {
      throw new ApiError(404, 'Fee structure not found.');
    }

    return res.status(200).json({ success: true, data: feeStructure });
  } catch (error) {
    logger.error('Error fetching fee structure:', error);
    return next(error);
  }
};

// Update fee structure
const updateFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const feeStructure = await FeeStructure.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
    });

    if (!feeStructure) {
      throw new ApiError(404, 'Fee structure not found.');
    }

    // If fee_type_id is being updated, verify it exists
    if (updates.fee_type_id && updates.fee_type_id !== feeStructure.fee_type_id) {
      const feeType = await FeeType.findOne({
        where: {
          id: updates.fee_type_id,
          school_id: req.schoolId,
          is_active: true,
        },
      });

      if (!feeType) {
        throw new ApiError(404, 'Fee type not found.');
      }
    }

    await feeStructure.update({
      ...updates,
      updated_by: req.user.id,
    });

    const updatedFeeStructure = await FeeStructure.findByPk(feeStructure.id, {
      include: [
        {
          model: FeeType,
          as: 'feeType',
        },
      ],
    });

    logger.info(`Fee structure updated: ${feeStructure.name} - ${feeStructure.class_name} (${feeStructure.academic_year})`);
    return res.status(200).json({ success: true, data: updatedFeeStructure });
  } catch (error) {
    logger.error('Error updating fee structure:', error);
    return next(error);
  }
};

// Delete fee structure (soft delete)
const deleteFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;

    const feeStructure = await FeeStructure.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
    });

    if (!feeStructure) {
      throw new ApiError(404, 'Fee structure not found.');
    }

    await feeStructure.update({
      is_active: false,
      updated_by: req.user.id,
    });

    logger.info(`Fee structure deleted: ${feeStructure.name} - ${feeStructure.class_name} (${feeStructure.academic_year})`);
    return res.status(200).json({ success: true, message: 'Fee structure deleted successfully.' });
  } catch (error) {
    logger.error('Error deleting fee structure:', error);
    return next(error);
  }
};

// Clone fee structure
const cloneFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      new_name, 
      new_academic_year, 
      new_class_name, 
      new_section,
      clone_to_multiple_classes = false,
      target_classes = []
    } = req.body;

    // Get original fee structure
    const originalStructure = await FeeStructure.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
      include: [
        {
          model: FeeType,
          as: 'feeType',
        },
      ],
    });

    if (!originalStructure) {
      throw new ApiError(404, 'Fee structure not found');
    }

    const clonedStructures = [];

    if (clone_to_multiple_classes && target_classes.length > 0) {
      // Clone to multiple classes
      for (const targetClass of target_classes) {
        const newStructure = await FeeStructure.create({
          name: `${originalStructure.name} - ${targetClass}`,
          academic_year: new_academic_year || originalStructure.academic_year,
          class_name: targetClass,
          section: new_section || originalStructure.section,
          fee_type_id: originalStructure.fee_type_id,
          amount: originalStructure.amount,
          installment_type: originalStructure.installment_type,
          installment_count: originalStructure.installment_count,
          due_month: originalStructure.due_month,
          due_day: originalStructure.due_day,
          discount_applicable: originalStructure.discount_applicable,
          discount_amount: originalStructure.discount_amount,
          discount_type: originalStructure.discount_type,
          notes: `Cloned from ${originalStructure.name}`,
          school_id: req.schoolId,
          branch_id: req.branchId,
          created_by: req.user.id,
        });

        clonedStructures.push(newStructure);
      }
    } else {
      // Clone to single class
      const newStructure = await FeeStructure.create({
        name: new_name || `${originalStructure.name} (Copy)`,
        academic_year: new_academic_year || originalStructure.academic_year,
        class_name: new_class_name || originalStructure.class_name,
        section: new_section || originalStructure.section,
        fee_type_id: originalStructure.fee_type_id,
        amount: originalStructure.amount,
        installment_type: originalStructure.installment_type,
        installment_count: originalStructure.installment_count,
        due_month: originalStructure.due_month,
        due_day: originalStructure.due_day,
        discount_applicable: originalStructure.discount_applicable,
        discount_amount: originalStructure.discount_amount,
        discount_type: originalStructure.discount_type,
        notes: `Cloned from ${originalStructure.name}`,
        school_id: req.schoolId,
        branch_id: req.branchId,
        created_by: req.user.id,
      });

      clonedStructures.push(newStructure);
    }

    return res.status(201).json({
      success: true,
      message: `Fee structure cloned successfully. ${clonedStructures.length} structure(s) created.`,
      data: clonedStructures,
    });
  } catch (error) {
    logger.error('Error cloning fee structure:', error);
    return next(error);
  }
};

module.exports = {
  createFeeStructure,
  getFeeStructures,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  cloneFeeStructure,
};
