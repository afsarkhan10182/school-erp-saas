const { FeeStructure, FeeType, AcademicYear, Class } = require('../models');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');

// Create a new fee structure
const createFeeStructure = async (req, res, next) => {
  try {
    const {
      academic_year_id,
      class_id,
      section,
      fee_type_id,
      amount,
      is_active = true,
    } = req.body;

    // Get academic year details
    const academicYear = await AcademicYear.findOne({
      where: {
        id: academic_year_id,
      },
    });

    if (!academicYear) {
      throw new ApiError(404, 'Academic year not found.');
    }

    // Get class details
    const classData = await Class.findOne({
      where: {
        id: class_id,
        school_id: req.schoolId,
      },
    });

    if (!classData) {
      throw new ApiError(404, 'Class not found.');
    }

    // Check if fee structure already exists for this class, section, and fee type (only active ones)
    const existingFeeStructure = await FeeStructure.findOne({
      where: {
        school_id: req.schoolId,
        branch_id: req.branchId,
        academic_year: academicYear.name,
        class_name: classData.name,
        section: section || null,
        fee_type_id,
        is_active: true,
      },
    });

    if (existingFeeStructure) {
      const sectionText = section ? ` and section ${section}` : '';
      throw new ApiError(400, `Fee structure already exists for this class${sectionText} and fee type in this academic year.`);
    }

    // Verify fee type exists
    const feeType = await FeeType.findOne({
      where: {
        id: fee_type_id,
        school_id: req.schoolId,
        branch_id: req.branchId,
        is_active: true,
      },
    });

    if (!feeType) {
      throw new ApiError(404, 'Fee type not found.');
    }

    // Create fee structure
    const sectionText = section ? ` - ${section}` : '';
    const feeStructure = await FeeStructure.create({
      name: `${feeType.name} - ${classData.name}${sectionText} (${academicYear.name})`,
      academic_year: academicYear.name,
      class_name: classData.name,
      section: section || null,
      fee_type_id,
      amount,
      installment_type: 'one_time',
      installment_count: 1,
      due_day: 10,
      discount_applicable: false,
      discount_amount: 0.00,
      discount_type: 'fixed',
      is_active,
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

    // Add branch filter if branch context is set
    if (req.branchId) {
      whereClause.branch_id = req.branchId;
    }

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

    const whereClause = {
      id,
      school_id: req.schoolId,
    };

    // Add branch filter if branch context is set
    if (req.branchId) {
      whereClause.branch_id = req.branchId;
    }

    const feeStructure = await FeeStructure.findOne({
      where: whereClause,
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
    const {
      academic_year_id,
      class_id,
      section,
      fee_type_id,
      amount,
      is_active,
    } = req.body;

    const whereClause = {
      id,
      school_id: req.schoolId,
    };

    // Add branch filter if branch context is set
    if (req.branchId) {
      whereClause.branch_id = req.branchId;
    }

    const feeStructure = await FeeStructure.findOne({
      where: whereClause,
    });

    if (!feeStructure) {
      throw new ApiError(404, 'Fee structure not found.');
    }

    // Prepare update data
    const updateData = {
      amount,
      is_active,
      section: section || null,
      updated_by: req.user.id,
    };

    // If academic_year_id is provided, get the academic year name
    if (academic_year_id) {
      const academicYear = await AcademicYear.findOne({
        where: {
          id: academic_year_id,
        },
      });

      if (!academicYear) {
        throw new ApiError(404, 'Academic year not found.');
      }

      updateData.academic_year = academicYear.name;
    }

    // If class_id is provided, get the class name
    if (class_id) {
      const classData = await Class.findOne({
        where: {
          id: class_id,
          school_id: req.schoolId,
        },
      });

      if (!classData) {
        throw new ApiError(404, 'Class not found.');
      }

      updateData.class_name = classData.name;
    }

    // If fee_type_id is being updated, verify it exists
    if (fee_type_id && fee_type_id !== feeStructure.fee_type_id) {
      const feeType = await FeeType.findOne({
        where: {
          id: fee_type_id,
          school_id: req.schoolId,
          branch_id: req.branchId,
          is_active: true,
        },
      });

      if (!feeType) {
        throw new ApiError(404, 'Fee type not found.');
      }

      updateData.fee_type_id = fee_type_id;
    }

    // Check for duplicate fee structure if class, section, or academic year is being updated
    const newAcademicYear = updateData.academic_year || feeStructure.academic_year;
    const newClassName = updateData.class_name || feeStructure.class_name;
    const newSection = updateData.section || feeStructure.section;
    const newFeeTypeId = updateData.fee_type_id || feeStructure.fee_type_id;

    if (updateData.academic_year || updateData.class_name || updateData.section || updateData.fee_type_id) {
      const existingFeeStructure = await FeeStructure.findOne({
        where: {
          school_id: req.schoolId,
          branch_id: req.branchId,
          academic_year: newAcademicYear,
          class_name: newClassName,
          section: newSection,
          fee_type_id: newFeeTypeId,
          is_active: true,
          id: { [require('sequelize').Op.ne]: id }, // Exclude current record
        },
      });

      if (existingFeeStructure) {
        const sectionText = newSection ? ` and section ${newSection}` : '';
        throw new ApiError(400, `Fee structure already exists for this class${sectionText} and fee type in this academic year.`);
      }
    }

    // Update the name if class, section, or fee type is being updated
    if (updateData.class_name || updateData.section || updateData.fee_type_id) {
      const feeType = await FeeType.findByPk(updateData.fee_type_id || feeStructure.fee_type_id);
      const sectionText = updateData.section || feeStructure.section ? ` - ${updateData.section || feeStructure.section}` : '';
      const className = updateData.class_name || feeStructure.class_name;
      const academicYear = updateData.academic_year || feeStructure.academic_year;
      
      updateData.name = `${feeType.name} - ${className}${sectionText} (${academicYear})`;
    }

    await feeStructure.update(updateData);

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

    const whereClause = {
      id,
      school_id: req.schoolId,
    };

    // Add branch filter if branch context is set
    if (req.branchId) {
      whereClause.branch_id = req.branchId;
    }

    const feeStructure = await FeeStructure.findOne({
      where: whereClause,
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
      throw new ApiError(404, 'Fee structure not found.');
    }

    // Check if fee structure already exists for the new combination (only active ones)
    const newAcademicYear = new_academic_year || originalStructure.academic_year;
    const newClassName = new_class_name || originalStructure.class_name;
    
    const existingFeeStructure = await FeeStructure.findOne({
      where: {
        school_id: req.schoolId,
        branch_id: req.branchId,
        academic_year: newAcademicYear,
        class_name: newClassName,
        fee_type_id: originalStructure.fee_type_id,
        is_active: true,
      },
    });

    if (existingFeeStructure) {
      throw new ApiError(400, 'Fee structure already exists for this class and fee type in this academic year.');
    }

    // Create cloned fee structure
    const clonedStructure = await FeeStructure.create({
      name: new_name || `${originalStructure.name} (Clone)`,
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
      notes: originalStructure.notes,
      is_active: true,
      school_id: req.schoolId,
      branch_id: req.branchId,
      created_by: req.user.id,
    });

    // Include fee type in response
    const clonedStructureWithType = await FeeStructure.findByPk(clonedStructure.id, {
      include: [
        {
          model: FeeType,
          as: 'feeType',
        },
      ],
    });

    logger.info(`Fee structure cloned: ${clonedStructure.name} - ${clonedStructure.class_name} (${clonedStructure.academic_year})`);
    return res.status(201).json({ success: true, data: clonedStructureWithType });
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
