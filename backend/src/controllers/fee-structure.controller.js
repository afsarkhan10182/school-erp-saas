const { FeeStructure, FeeType, AcademicYear, Class } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');

/**
 * Validate fee structure to ensure one payment model per class per academic year
 * @param {string} branch_id - Branch ID
 * @param {Array} classNames - Array of class names to validate
 * @param {string} academic_year - Academic year
 * @param {string} new_payment_model - New payment model being created
 * @param {string} section - Section (optional)
 * @param {string} fee_type_id - Fee type ID
 * @param {string} school_id - School ID
 */
const validateFeeStructure = async (branch_id, classNames, academic_year, new_payment_model, section, fee_type_id, school_id) => {
  // Check for existing fee structures for each class
  for (const className of classNames) {
    const existing = await FeeStructure.findOne({
      where: { 
        branch_id, 
        academic_year,
        school_id,
        is_active: true,
        // Check both class_name and applicable_classes
        [Op.or]: [
          { class_name: className },
          { applicable_classes: { [Op.contains]: [className] } }
        ]
      }
    });

    if (existing) {
      // Check if it's the same fee type and section
      if (existing.fee_type_id === fee_type_id && existing.section === (section || null)) {
        // Same fee type and section - check payment model
        if (existing.payment_model !== new_payment_model) {
          throw new ApiError(
            400,
            `Class "${className}" already has a fee structure with "${existing.payment_model}" model for ${academic_year}. Cannot assign both monthly and installment models to the same class.`
          );
        } else {
          throw new ApiError(
            400,
            `Fee structure for Class "${className}" with fee type "${existing.feeType?.name || 'Unknown'}" already exists for ${academic_year}.`
          );
        }
      }
    }
  }
};

// Create a new fee structure
const createFeeStructure = async (req, res, next) => {
  try {
    const {
      academic_year_id,
      class_id,
      applicable_classes,
      section,
      fee_type_id,
      amount,
      monthly_payment_amount,
      total_months,
      due_day,
      payment_model,
      is_active = true,
    } = req.body;

    // Validate required fields for creation
    if (!academic_year_id || academic_year_id.trim() === '') {
      throw new ApiError(400, 'Academic year ID is required.');
    }

    if (!fee_type_id || fee_type_id.trim() === '') {
      throw new ApiError(400, 'Fee type ID is required.');
    }

    // Check if we have either class_id or applicable_classes
    if (!class_id && (!applicable_classes || !Array.isArray(applicable_classes) || applicable_classes.length === 0)) {
      throw new ApiError(400, 'Either class_id or applicable_classes array is required.');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(academic_year_id)) {
      throw new ApiError(400, 'Invalid academic year ID format.');
    }

    if (!uuidRegex.test(fee_type_id)) {
      throw new ApiError(400, 'Invalid fee type ID format.');
    }

    // Get academic year details
    const academicYear = await AcademicYear.findOne({
      where: {
        id: academic_year_id,
      },
    });

    if (!academicYear) {
      throw new ApiError(404, 'Academic year not found.');
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

    // Determine classes to process
    let classesToProcess = [];
    
    if (class_id) {
      // Single class mode
      const classData = await Class.findOne({
        where: {
          id: class_id,
          school_id: req.schoolId,
        },
      });

      if (!classData) {
        throw new ApiError(404, 'Class not found.');
      }
      
      classesToProcess = [{ id: class_id, name: classData.name }];
    } else {
      // Multiple classes mode
      const classNames = applicable_classes;
      const classData = await Class.findAll({
        where: {
          name: classNames,
          school_id: req.schoolId,
        },
      });

      if (classData.length !== classNames.length) {
        const foundNames = classData.map(c => c.name);
        const missingNames = classNames.filter(name => !foundNames.includes(name));
        throw new ApiError(404, `Classes not found: ${missingNames.join(', ')}`);
      }
      
      classesToProcess = classData.map(c => ({ id: c.id, name: c.name }));
    }

    // Create fee structures for each class
    const createdStructures = [];
    const errors = [];

    // Enhanced validation: Ensure one payment model per class per academic year
    const newClassNames = classesToProcess.map(c => c.name);
    const paymentModel = payment_model || 'monthly';
    
    await validateFeeStructure(
      req.branchId,
      newClassNames,
      academicYear.name,
      paymentModel,
      section,
      fee_type_id,
      req.schoolId
    );

    // Calculate amount based on payment model
    let calculatedAmount = monthly_payment_amount * total_months;

    // Create single fee structure with applicable_classes
    const sectionText = section ? ` - ${section}` : '';
    const classNamesText = classesToProcess.map(c => c.name).join(', ');
    const feeStructure = await FeeStructure.create({
      name: `${feeType.name} - ${classNamesText}${sectionText} (${academicYear.name})`,
      academic_year: academicYear.name,
      class_name: classesToProcess[0].name, // Keep for backward compatibility
      applicable_classes: classesToProcess.map(c => c.name), // Store all class names
      section: section || null,
      fee_type_id,
      amount: calculatedAmount,
      payment_model: payment_model || 'monthly',
      installment_type: req.body.installment_type || 'one_time',
      installment_count: req.body.installment_count || 1,
      installment_amounts: req.body.installment_amounts || [],
      monthly_payment_amount: monthly_payment_amount || calculatedAmount,
      total_months: total_months || 12,
      due_day: due_day || 10,
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

    createdStructures.push(feeStructureWithType);
    logger.info(`Fee structure created: ${feeStructure.name} with classes: ${classNamesText} (${feeStructure.academic_year})`);

    // Return response
    const response = {
      success: true,
      message: `Successfully created fee structure for classes: ${classNamesText}`,
      data: createdStructures[0],
    };

    return res.status(201).json(response);
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

    // Add payment model specific fields if provided
    if (req.body.payment_model !== undefined) {
      updateData.payment_model = req.body.payment_model;
    }
    if (req.body.installment_type !== undefined) {
      updateData.installment_type = req.body.installment_type;
    }
    if (req.body.installment_count !== undefined) {
      updateData.installment_count = req.body.installment_count;
    }
    if (req.body.installment_amounts !== undefined) {
      updateData.installment_amounts = req.body.installment_amounts;
    }
    if (req.body.monthly_payment_amount !== undefined) {
      updateData.monthly_payment_amount = req.body.monthly_payment_amount;
    }
    if (req.body.total_months !== undefined) {
      updateData.total_months = req.body.total_months;
    }
    if (req.body.due_day !== undefined) {
      updateData.due_day = req.body.due_day;
    }

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
          id: { [Op.ne]: id }, // Exclude current record
        },
      });

      if (existingFeeStructure) {
        const sectionText = newSection ? ` and section ${newSection}` : '';
        throw new ApiError(400, `Fee structure already exists for this class${sectionText} and fee type in this academic year.`);
      }
    }

    // Enhanced validation: Check payment model conflicts when updating
    if (req.body.payment_model !== undefined && req.body.payment_model !== feeStructure.payment_model) {
      const newPaymentModel = req.body.payment_model;
      const classNames = [newClassName];
      
      // If the fee structure has applicable_classes, check those too
      if (feeStructure.applicable_classes && Array.isArray(feeStructure.applicable_classes)) {
        classNames.push(...feeStructure.applicable_classes);
      }
      
      // Remove duplicates
      const uniqueClassNames = [...new Set(classNames)];
      
      await validateFeeStructure(
        req.branchId,
        uniqueClassNames,
        newAcademicYear,
        newPaymentModel,
        newSection,
        newFeeTypeId,
        req.schoolId
      );
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
    
    // Enhanced validation: Ensure one payment model per class per academic year
    await validateFeeStructure(
      req.branchId,
      [newClassName],
      newAcademicYear,
      originalStructure.payment_model,
      new_section || originalStructure.section,
      originalStructure.fee_type_id,
      req.schoolId
    );

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

// Get fee structures with complete context (for invoice generation)
/**
 * Create multiple fee structures for different sections (for Branch 2)
 * Useful for creating fee structures for Commerce-General, Commerce-IT, Science-General, Science-IT
 */
const createSectionBasedFeeStructures = async (req, res, next) => {
  try {
    const {
      academic_year_id,
      class_id,
      fee_type_id,
      sections_data, // Array of { section: string, amount: number, payment_model: string }
      is_active = true,
    } = req.body;

    // Validate required fields
    if (!academic_year_id || academic_year_id.trim() === '') {
      throw new ApiError(400, 'Academic year ID is required.');
    }

    if (!class_id || class_id.trim() === '') {
      throw new ApiError(400, 'Class ID is required.');
    }

    if (!fee_type_id || fee_type_id.trim() === '') {
      throw new ApiError(400, 'Fee type ID is required.');
    }

    if (!sections_data || !Array.isArray(sections_data) || sections_data.length === 0) {
      throw new ApiError(400, 'Sections data array is required with at least one section.');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(academic_year_id)) {
      throw new ApiError(400, 'Invalid academic year ID format.');
    }

    if (!uuidRegex.test(class_id)) {
      throw new ApiError(400, 'Invalid class ID format.');
    }

    if (!uuidRegex.test(fee_type_id)) {
      throw new ApiError(400, 'Invalid fee type ID format.');
    }

    // Get academic year details
    const academicYear = await AcademicYear.findOne({
      where: { id: academic_year_id }
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

    const createdStructures = [];
    const errors = [];

    // Create fee structure for each section
    for (const sectionData of sections_data) {
      try {
        const { section, amount, payment_model = 'installment', installment_count = 1, installment_amounts = [] } = sectionData;

        if (!section || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
          errors.push(`Invalid data for section: ${section}`);
          continue;
        }

        // Check if fee structure already exists for this section
        const existingFeeStructure = await FeeStructure.findOne({
          where: {
            school_id: req.schoolId,
            branch_id: req.branchId,
            academic_year: academicYear.name,
            class_name: classData.name,
            section: section,
            fee_type_id,
            payment_model,
            is_active: true,
          },
        });

        if (existingFeeStructure) {
          errors.push(`Fee structure already exists for ${classData.name} - ${section}`);
          continue;
        }

        // Create fee structure
        const feeStructure = await FeeStructure.create({
          name: `${feeType.name} - ${classData.name} - ${section} (${academicYear.name})`,
          academic_year: academicYear.name,
          class_name: classData.name,
          section: section,
          fee_type_id,
          amount: parseFloat(amount),
          payment_model,
          installment_type: payment_model === 'installment' ? 'yearly' : 'monthly',
          installment_count,
          installment_amounts,
          monthly_payment_amount: payment_model === 'monthly' ? parseFloat(amount) : null,
          total_months: payment_model === 'monthly' ? 12 : null,
          due_day: 10,
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

        createdStructures.push(feeStructureWithType);
        logger.info(`Section-based fee structure created: ${feeStructure.name}`);
      } catch (error) {
        logger.error(`Error creating fee structure for section ${sectionData.section}:`, error);
        errors.push(`Failed to create fee structure for ${sectionData.section}: ${error.message}`);
      }
    }

    if (createdStructures.length === 0) {
      throw new ApiError(400, 'No fee structures were created. Errors: ' + errors.join(', '));
    }

    return res.status(201).json({
      success: true,
      message: `Created ${createdStructures.length} fee structure(s) successfully.`,
      data: {
        created_structures: createdStructures,
        errors: errors.length > 0 ? errors : null,
      },
    });
  } catch (error) {
    logger.error('Error creating section-based fee structures:', error);
    return next(error);
  }
};

/**
 * Create fee structures for Branch 1 (Monthly Model) with predefined amounts
 * JR-SR: ₹800/month, 1st-5th: ₹900/month, 6th-10th: ₹1,000/month
 */
const createBranch1FeeStructures = async (req, res, next) => {
  try {
    const {
      academic_year_id,
      fee_type_id,
      is_active = true,
    } = req.body;

    // Validate required fields
    if (!academic_year_id || academic_year_id.trim() === '') {
      throw new ApiError(400, 'Academic year ID is required.');
    }

    if (!fee_type_id || fee_type_id.trim() === '') {
      throw new ApiError(400, 'Fee type ID is required.');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(academic_year_id)) {
      throw new ApiError(400, 'Invalid academic year ID format.');
    }

    if (!uuidRegex.test(fee_type_id)) {
      throw new ApiError(400, 'Invalid fee type ID format.');
    }

    // Get academic year details
    const academicYear = await AcademicYear.findOne({
      where: { id: academic_year_id },
    });

    if (!academicYear) {
      throw new ApiError(404, 'Academic year not found.');
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

    // Predefined class groups and amounts for Branch 1
    const classGroups = [
      { name: 'JR-SR', amount: 800, classes: ['JR', 'SR'] },
      { name: '1st-5th', amount: 900, classes: ['1st', '2nd', '3rd', '4th', '5th'] },
      { name: '6th-10th', amount: 1000, classes: ['6th', '7th', '8th', '9th', '10th'] }
    ];

    const createdStructures = [];
    const errors = [];

    // Create fee structure for each class group
    for (const group of classGroups) {
      try {
        // Check if fee structure already exists for this class group
        const existingFeeStructure = await FeeStructure.findOne({
          where: {
            school_id: req.schoolId,
            branch_id: req.branchId,
            academic_year: academicYear.name,
            class_name: group.name,
            fee_type_id,
            payment_model: 'monthly',
            is_active: true,
          },
        });

        if (existingFeeStructure) {
          errors.push(`Fee structure already exists for ${group.name}`);
          continue;
        }

        // Create fee structure
        const feeStructure = await FeeStructure.create({
          name: `${feeType.name} - ${group.name} (${academicYear.name})`,
          academic_year: academicYear.name,
          class_name: group.name,
          section: null, // No specific section for class groups
          fee_type_id,
          amount: group.amount * 12, // Total yearly amount
          payment_model: 'monthly',
          installment_type: 'monthly',
          installment_count: 12,
          installment_amounts: [],
          monthly_payment_amount: group.amount,
          total_months: 12,
          due_day: 5, // 5th of each month
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

        createdStructures.push(feeStructureWithType);
        logger.info(`Branch 1 fee structure created: ${feeStructure.name} - ₹${group.amount}/month`);
      } catch (error) {
        logger.error(`Error creating fee structure for ${group.name}:`, error);
        errors.push(`Failed to create fee structure for ${group.name}: ${error.message}`);
      }
    }

    if (createdStructures.length === 0) {
      throw new ApiError(400, 'No fee structures were created. Errors: ' + errors.join(', '));
    }

    return res.status(201).json({
      success: true,
      message: `Created ${createdStructures.length} Branch 1 fee structure(s) successfully.`,
      data: {
        created_structures: createdStructures,
        errors: errors.length > 0 ? errors : null,
        summary: {
          'JR-SR': '₹800/month',
          '1st-5th': '₹900/month', 
          '6th-10th': '₹1,000/month'
        }
      },
    });
  } catch (error) {
    logger.error('Error creating Branch 1 fee structures:', error);
    return next(error);
  }
};

const getFeeStructuresWithContext = async (req, res, next) => {
  try {
    const { payment_model, academic_year, class_name, fee_type_id } = req.query;
    
    const whereClause = {
      school_id: req.schoolId,
      is_active: true,
    };

    // Add branch filter if branch context is set
    if (req.branchId) {
      whereClause.branch_id = req.branchId;
    }

    // Add payment model filter if provided
    if (payment_model) {
      whereClause.payment_model = payment_model;
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
      order: [['academic_year', 'DESC'], ['class_name', 'ASC'], ['name', 'ASC']],
    });

    // Format the response with complete context
    const formattedStructures = feeStructures.map(structure => ({
      id: structure.id,
      name: structure.name,
      academic_year: structure.academic_year,
      class_name: structure.class_name,
      section: structure.section,
      amount: structure.amount,
      payment_model: structure.payment_model,
      due_day: structure.due_day,
      installment_type: structure.installment_type,
      installment_count: structure.installment_count,
      monthly_payment_amount: structure.monthly_payment_amount,
      total_months: structure.total_months,
      feeType: structure.feeType,
      branch_id: structure.branch_id,
      school_id: structure.school_id,
      is_active: structure.is_active,
      created_at: structure.created_at,
      updated_at: structure.updated_at,
    }));

    return res.status(200).json({ 
      success: true, 
      data: {
        fee_structures: formattedStructures,
        total: formattedStructures.length
      }
    });
  } catch (error) {
    logger.error('Error fetching fee structures with context:', error);
    return next(error);
  }
};

module.exports = {
  createFeeStructure,
  createSectionBasedFeeStructures,
  createBranch1FeeStructures,
  getFeeStructures,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  cloneFeeStructure,
  getFeeStructuresWithContext,
};
