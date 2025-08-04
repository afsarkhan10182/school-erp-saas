const { FeeInvoice, FeeStructure, FeeType, Student, Parent, School, FeePayment, Branch, Class } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { logger } = require('../../utils/logger');
const { getAcademicYearMonths, validatePaymentSequence } = require('../../utils/academicYearUtils');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');

// Helper function to get student full name
const getStudentFullName = (student) => {
  const firstName = student.first_name || '';
  const lastName = student.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  } else {
    return 'Unknown Student';
  }
};

// Generate unique invoice number with microsecond precision
// Helper function to get class code from fee structure
const getClassCode = (feeStructure) => {
  // Get code from the associated Class model
  if (feeStructure.class && feeStructure.class.code) {
    return feeStructure.class.code;
  }
  
  // Generate from class_name
  if (feeStructure.class_name) {
    const cleanName = feeStructure.class_name.replace(/^Class\s+/i, '').trim();
    const code = cleanName.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return code.length >= 3 ? code : `${code}${'0'.repeat(3 - code.length)}`;
  }
  
  // Default fallback
  return 'GEN';
};

// Generate unique invoice number using PostgreSQL auto-increment
const generateUniqueInvoiceNumber = async (classCode, invoiceData, receiptOnly = false) => {
  // Get the next auto-increment ID directly from the database
  const result = await sequelize.query(
    "SELECT nextval(pg_get_serial_sequence('fee_invoices', 'invoice_id')) as next_id",
    { type: sequelize.QueryTypes.SELECT }
  );
  
  const nextId = result[0].next_id;
  
  // Generate invoice number using the auto-increment ID
  const invoiceNumber = `INV-${classCode}-${nextId}`;
  
  if (receiptOnly) {
    // For receipt generation, just return the invoice number without creating a database record
    return { invoice_number: invoiceNumber };
  }
  
  // Create the real invoice with the generated invoice number
  const realInvoice = await FeeInvoice.create({
    ...invoiceData,
    invoice_number: invoiceNumber
  });
  
  return realInvoice; // Return the complete invoice object
};

// Generate invoices for students based on fee structure
const generateInvoices = async (req, res, next) => {
  try {
    const {
      payment_model = 'installment', // 'installment' or 'monthly'
      fee_structure_ids, // Array of fee structure IDs
      fee_structure_id, // Single fee structure ID (for backward compatibility)
      student_ids,
      student_id, // Single student ID (for backward compatibility)
      due_date,
      notes,
      months, // For monthly payments
      year, // For monthly payments
    } = req.body;

    // Handle both fee_structure_ids (array) and fee_structure_id (single) for flexibility
    let finalFeeStructureIds = fee_structure_ids;
    if (!finalFeeStructureIds && fee_structure_id) {
      finalFeeStructureIds = [fee_structure_id];
    }

    if (!finalFeeStructureIds || !Array.isArray(finalFeeStructureIds) || finalFeeStructureIds.length === 0) {
      throw new ApiError(400, 'Fee structure IDs are required');
    }

    // Handle both student_ids (array) and student_id (single) for flexibility
    let finalStudentIds = student_ids;
    if (!finalStudentIds && student_id) {
      finalStudentIds = [student_id];
    }

    // Validate payment model
    if (!['installment', 'monthly'].includes(payment_model)) {
      throw new ApiError(400, 'Payment model must be either "installment" or "monthly"');
    }

    // Validate monthly payment parameters
    if (payment_model === 'monthly') {
      if (!months || !Array.isArray(months) || months.length === 0) {
        throw new ApiError(400, 'Months are required for monthly payments');
      }
      if (!year || year < 2000 || year > 2100) {
        throw new ApiError(400, 'Valid year is required for monthly payments');
      }
      // Validate months
      for (const month of months) {
        if (month < 1 || month > 12) {
          throw new ApiError(400, 'Invalid month value. Must be between 1 and 12');
        }
      }
    }

    // Get fee structures to extract context
    const feeStructures = await FeeStructure.findAll({
      where: { 
        id: { [Op.in]: finalFeeStructureIds },
        school_id: req.schoolId,
        is_active: true
      },
      include: [
        {
          model: FeeType,
          as: 'feeType',
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code'],
        },
      ],
    });

    if (feeStructures.length === 0) {
      throw new ApiError(404, 'No fee structures found for the specified IDs');
    }

    // Group students by fee structure context to handle multiple fee structures
    const invoices = [];
    const errors = [];

    for (const feeStructure of feeStructures) {
      // Build student filter based on fee structure context
      const studentFilter = {
        school_id: req.schoolId,
        academic_year: feeStructure.academic_year,
        status: 'active',
      };

      // Handle class name matching - support both single class_name and multiple applicable_classes
      if (feeStructure.applicable_classes && Array.isArray(feeStructure.applicable_classes) && feeStructure.applicable_classes.length > 0) {
        // Multiple classes mode - use applicable_classes array
        const classNames = feeStructure.applicable_classes;
        const classCodes = classNames.map(className => className.replace(/^Class\s+/i, '').trim());
        
        // Try to match students with any of the class names or codes
        studentFilter.current_class = {
          [Op.or]: [...classNames, ...classCodes]
        };
        
        logger.info(`Fee structure ${feeStructure.name} has multiple classes: ${classNames.join(', ')}`);
      } else if (feeStructure.class_name) {
        // Single class mode - fallback to class_name
        const classCode = feeStructure.class_name.replace(/^Class\s+/i, '').trim();
        
        // Try to match students with either the full class name or the class code
        studentFilter.current_class = {
          [Op.or]: [feeStructure.class_name, classCode]
        };
        
        logger.info(`Fee structure ${feeStructure.name} has single class: ${feeStructure.class_name}`);
      }

      if (feeStructure.section) studentFilter.section = feeStructure.section;
      if (finalStudentIds && finalStudentIds.length > 0) studentFilter.id = { [Op.in]: finalStudentIds };

      // Get students for this fee structure
      const students = await Student.findAll({
        where: studentFilter,
      });

      // Future-proof optimization: Get all existing invoices for these students in one query
      const studentIds = students.map(s => s.id);
      const existingInvoicesMap = new Map();
      
      if (studentIds.length > 0) {
        const existingInvoices = await FeeInvoice.findAll({
          where: {
            student_id: { [Op.in]: studentIds },
            fee_structure_id: feeStructure.id,
            academic_year: feeStructure.academic_year,
          },
          attributes: ['student_id', 'invoice_number', 'payment_model', 'month', 'year']
        });
        
        // Group existing invoices by student_id for fast lookup
        existingInvoices.forEach(invoice => {
          if (!existingInvoicesMap.has(invoice.student_id)) {
            existingInvoicesMap.set(invoice.student_id, []);
          }
          existingInvoicesMap.get(invoice.student_id).push(invoice);
        });
      }

      if (students.length === 0) {
        // Show applicable classes in error message
        const classInfo = feeStructure.applicable_classes && Array.isArray(feeStructure.applicable_classes) && feeStructure.applicable_classes.length > 0
          ? `classes: ${feeStructure.applicable_classes.join(', ')}`
          : `class: ${feeStructure.class_name}`;
        
        errors.push(`No active students found for fee structure: ${feeStructure.name} (${classInfo}${feeStructure.section ? ` - ${feeStructure.section}` : ''})`);
        continue;
      }

      // Generate invoices for each student and this fee structure
      for (const student of students) {
        try {
          // Comprehensive check for existing invoices
          let hasExistingInvoices = false;
          let existingInvoice;
          
          // Check if this student already has ANY invoices for this fee structure and academic year (using pre-fetched data)
          const existingInvoicesForStudent = existingInvoicesMap.get(student.id) || [];
          
          if (existingInvoicesForStudent.length > 0) {
            logger.info(`Student ${getStudentFullName(student)} already has ${existingInvoicesForStudent.length} invoices for fee structure ${feeStructure.name} in academic year ${feeStructure.academic_year}`);
            errors.push({
              student: getStudentFullName(student),
              student_id: student.id,
              fee_structure: feeStructure.name,
              fee_structure_id: feeStructure.id,
              error: `Student already has ${existingInvoicesForStudent.length} invoices for this fee structure in academic year ${feeStructure.academic_year}`,
              validation_details: [{
                field: 'existing_invoices',
                message: `Found ${existingInvoicesForStudent.length} existing invoices`,
                value: { 
                  existing_invoice_count: existingInvoicesForStudent.length,
                  existing_invoice_numbers: existingInvoicesForStudent.map(inv => inv.invoice_number)
                }
              }]
            });
            continue;
          }
          
          // Note: We've already checked for existing invoices above, so we can proceed with generation

          // Validate required data before generating invoices
          if (!student.first_name) {
            errors.push({
              student: getStudentFullName(student),
              student_id: student.id,
              fee_structure: feeStructure.name,
              fee_structure_id: feeStructure.id,
              error: `Student has missing first name`,
              validation_details: [{
                field: 'student_name',
                message: 'First name is required',
                value: { first_name: student.first_name, last_name: student.last_name }
              }]
            });
            continue;
          }
          
          if (!feeStructure.amount && !feeStructure.monthly_payment_amount) {
            errors.push({
              student: getStudentFullName(student),
              student_id: student.id,
              fee_structure: feeStructure.name,
              fee_structure_id: feeStructure.id,
              error: `Fee structure has no amount configured`,
              validation_details: [{
                field: 'fee_structure_amount',
                message: 'Neither amount nor monthly_payment_amount is configured',
                value: { amount: feeStructure.amount, monthly_payment_amount: feeStructure.monthly_payment_amount }
              }]
            });
            continue;
          }
          
          if (!feeStructure.academic_year) {
            errors.push({
              student: getStudentFullName(student),
              student_id: student.id,
              fee_structure: feeStructure.name,
              fee_structure_id: feeStructure.id,
              error: `Fee structure has no academic year configured`,
              validation_details: [{
                field: 'academic_year',
                message: 'Academic year is required',
                value: feeStructure.academic_year
              }]
            });
            continue;
          }
          
          if (!feeStructure.class_name) {
            errors.push({
              student: getStudentFullName(student),
              student_id: student.id,
              fee_structure: feeStructure.name,
              fee_structure_id: feeStructure.id,
              error: `Fee structure has no class name configured`,
              validation_details: [{
                field: 'class_name',
                message: 'Class name is required',
                value: feeStructure.class_name
              }]
            });
            continue;
          }
          
          if (!feeStructure.fee_type_id) {
            errors.push({
              student: getStudentFullName(student),
              student_id: student.id,
              fee_structure: feeStructure.name,
              fee_structure_id: feeStructure.id,
              error: `Fee structure has no fee type configured`,
              validation_details: [{
                field: 'fee_type_id',
                message: 'Fee type is required',
                value: feeStructure.fee_type_id
              }]
            });
            continue;
          }
          
          // Generate invoices based on payment model
          if (payment_model === 'monthly') {
            // Get school to determine starting month
            const school = await School.findByPk(req.schoolId);
            const startingMonth = school.starting_month || 6; // Default to June
            
            // Generate academic year months based on school's starting month
            const academicYearMonths = getAcademicYearMonths(startingMonth, feeStructure.academic_year);
            
            // If specific months are provided, filter to only those months
            // Otherwise, generate all 12 months
            const monthsToGenerate = months && months.length > 0 
              ? academicYearMonths.filter(m => months.includes(m.month))
              : academicYearMonths;
            
            // Generate monthly invoices for each academic month
            for (const academicMonth of monthsToGenerate) {
              // Calculate due date for this month (using due_day from fee structure)
              let calculatedDueDate = new Date(academicMonth.year, academicMonth.month - 1, feeStructure.due_day || 10);
              
              // Generate unique invoice number
              const invoice = await generateUniqueInvoiceNumber(getClassCode(feeStructure), {
                student_id: student.id,
                fee_structure_id: feeStructure.id,
                academic_year: feeStructure.academic_year,
                class_name: feeStructure.class_name,
                section: feeStructure.section,
                fee_type_name: feeStructure.feeType?.name || 'Fee',
                fee_type_id: feeStructure.fee_type_id,
                invoice_date: new Date(),
                due_date: calculatedDueDate,
                amount: parseFloat(feeStructure.monthly_payment_amount) || parseFloat(feeStructure.amount) || 0,
                base_amount: parseFloat(feeStructure.monthly_payment_amount) || parseFloat(feeStructure.amount) || 0,
                discount_amount: parseFloat(feeStructure.discount_amount) || 0,
                tax_amount: parseFloat(feeStructure.tax_amount) || 0,
                total_amount: (parseFloat(feeStructure.monthly_payment_amount) || parseFloat(feeStructure.amount) || 0) - (parseFloat(feeStructure.discount_amount) || 0) + (parseFloat(feeStructure.tax_amount) || 0),
                paid_amount: 0.00,
                balance_amount: (parseFloat(feeStructure.monthly_payment_amount) || parseFloat(feeStructure.amount) || 0) - (parseFloat(feeStructure.discount_amount) || 0) + (parseFloat(feeStructure.tax_amount) || 0),
                status: 'sent',
                payment_status: 'pending',
                installment_number: 1,
                total_installments: 1,
                payment_model: 'monthly',
                month: academicMonth.month,
                year: academicMonth.year,
                notes: notes || `Monthly payment for ${academicMonth.display} - ${feeStructure.name}`,
                school_id: req.schoolId,
                branch_id: feeStructure.branch_id || req.branchId,
                created_by: req.user.id,
              });
              invoices.push(invoice); // Store the invoice object
            }
          } else {
            // Generate installment invoices based on installment type
            if (feeStructure.installment_type === 'one_time') {
              // One-Time Full Fee: Generate ONE invoice for the entire amount
              let calculatedDueDate = feeStructure.due_date;
              
              // If no due date is set in the fee structure, set a default (3 months from now)
              if (!calculatedDueDate) {
                const defaultDate = new Date();
                defaultDate.setMonth(defaultDate.getMonth() + 3);
                calculatedDueDate = defaultDate.toISOString().split('T')[0];
                
                // Log this for debugging
                logger.info(`No due date found in fee structure ${feeStructure.name}, using default date: ${calculatedDueDate}`);
              }

              // Generate unique invoice number
              const invoice = await generateUniqueInvoiceNumber(getClassCode(feeStructure), {
                student_id: student.id,
                fee_structure_id: feeStructure.id,
                academic_year: feeStructure.academic_year,
                class_name: feeStructure.class_name,
                section: feeStructure.section,
                fee_type_name: feeStructure.feeType?.name || 'Fee',
                fee_type_id: feeStructure.fee_type_id,
                invoice_date: new Date(),
                due_date: calculatedDueDate,
                amount: parseFloat(feeStructure.amount) || 0,
                base_amount: parseFloat(feeStructure.amount) || 0,
                discount_amount: parseFloat(feeStructure.discount_amount) || 0,
                tax_amount: parseFloat(feeStructure.tax_amount) || 0,
                total_amount: (parseFloat(feeStructure.amount) || 0) - (parseFloat(feeStructure.discount_amount) || 0) + (parseFloat(feeStructure.tax_amount) || 0),
                paid_amount: 0.00,
                balance_amount: (parseFloat(feeStructure.amount) || 0) - (parseFloat(feeStructure.discount_amount) || 0) + (parseFloat(feeStructure.tax_amount) || 0),
                status: 'sent',
                payment_status: 'pending',
                installment_number: 1, // Always 1 for one-time full fee
                total_installments: 1, // Always 1 for one-time full fee
                payment_model: 'installment',
                notes: notes || `One-time full fee payment for ${feeStructure.academic_year} - ${feeStructure.name}`,
                school_id: req.schoolId,
                branch_id: feeStructure.branch_id || req.branchId,
                created_by: req.user.id,
              });
              invoices.push(invoice); // Store the invoice object
            } else if (feeStructure.installment_type === 'multiple') {
              // Multiple Installments: Generate multiple invoices based on installment_amounts and installment_due_dates
              const installmentAmounts = feeStructure.installment_amounts || [];
              const installmentDueDates = feeStructure.installment_due_dates || [];
              const totalInstallments = installmentAmounts.length;
              
              if (totalInstallments === 0) {
                throw new ApiError(400, `Fee structure ${feeStructure.name} has no installment amounts configured for multiple installments.`);
              }

              // If installment due dates are missing, generate default due dates
              let finalInstallmentDueDates = installmentDueDates;
              if (installmentDueDates.length !== totalInstallments) {
                logger.info(`Fee structure ${feeStructure.name} has ${installmentAmounts.length} installments but ${installmentDueDates.length} due dates. Generating default due dates.`);
                
                // Generate default due dates (spread across the year)
                finalInstallmentDueDates = [];
                const currentDate = new Date();
                for (let i = 0; i < totalInstallments; i++) {
                  const installmentDate = new Date(currentDate);
                  installmentDate.setMonth(currentDate.getMonth() + (i * 6)); // Every 6 months
                  finalInstallmentDueDates.push(installmentDate.toISOString().split('T')[0]);
                }
                
                logger.info(`Generated default due dates for ${feeStructure.name}: ${finalInstallmentDueDates.join(', ')}`);
              }

              // Calculate total amount from installments
              const totalAmount = installmentAmounts.reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
              
              // Generate invoices for each installment
              for (let i = 0; i < totalInstallments; i++) {
                const installmentAmount = parseFloat(installmentAmounts[i]) || 0;
                const installmentDueDate = finalInstallmentDueDates[i];
                
                if (installmentAmount <= 0) {
                  throw new ApiError(400, `Invalid installment amount for installment ${i + 1} in fee structure ${feeStructure.name}.`);
                }

                if (!installmentDueDate) {
                  throw new ApiError(400, `Missing due date for installment ${i + 1} in fee structure ${feeStructure.name}.`);
                }

                // Generate unique invoice number for this installment
                const invoice = await generateUniqueInvoiceNumber(getClassCode(feeStructure), {
                  student_id: student.id,
                  fee_structure_id: feeStructure.id,
                  academic_year: feeStructure.academic_year,
                  class_name: feeStructure.class_name,
                  section: feeStructure.section,
                  fee_type_name: feeStructure.feeType?.name || 'Fee',
                  fee_type_id: feeStructure.fee_type_id,
                  invoice_date: new Date(),
                  due_date: installmentDueDate,
                  amount: installmentAmount,
                  base_amount: installmentAmount,
                  discount_amount: 0, // No discount per installment
                  tax_amount: 0, // No tax per installment
                  total_amount: installmentAmount,
                  paid_amount: 0.00,
                  balance_amount: installmentAmount,
                  status: 'sent',
                  payment_status: 'pending',
                  installment_number: i + 1,
                  total_installments: totalInstallments,
                  payment_model: 'installment',
                  notes: notes || `Installment ${i + 1} of ${totalInstallments} for ${feeStructure.academic_year} - ${feeStructure.name}`,
                  school_id: req.schoolId,
                  branch_id: feeStructure.branch_id || req.branchId,
                  created_by: req.user.id,
                });
                invoices.push(invoice); // Store the invoice object
              }
            }
          }
        } catch (error) {
          logger.error(`Error generating invoice for student ${student.id} and fee structure ${feeStructure.id}:`, error);
          logger.error(`Error details - Name: ${error.name}, Message: ${error.message}, Stack: ${error.stack}`);
          
          // Provide more detailed error information
          let errorMessage = error.message;
          let validationDetails = null;
          
          if (error.name === 'SequelizeValidationError') {
            validationDetails = error.errors.map(err => ({
              field: err.path,
              message: err.message,
              value: err.value
            }));
            errorMessage = `Validation errors: ${error.errors.map(err => `${err.path}: ${err.message}`).join(', ')}`;
          } else if (error.name === 'SequelizeForeignKeyConstraintError') {
            errorMessage = `Foreign key constraint error: ${error.message}`;
            validationDetails = [{
              field: 'foreign_key',
              message: error.message,
              value: error.fields
            }];
          } else if (error.name === 'SequelizeUniqueConstraintError') {
            errorMessage = `Unique constraint error: ${error.message}`;
            validationDetails = [{
              field: 'unique_constraint',
              message: error.message,
              value: error.fields
            }];
          } else {
            // For any other type of error, include the full error details
            validationDetails = [{
              field: 'unknown_error',
              message: error.message,
              value: {
                error_name: error.name,
                error_code: error.code,
                error_sql: error.sql
              }
            }];
          }
          
          errors.push({
            student: getStudentFullName(student),
            student_id: student.id,
            fee_structure: feeStructure.name,
            fee_structure_id: feeStructure.id,
            error: errorMessage,
            validation_details: validationDetails,
            error_type: error.name,
            full_error: error.message
          });
        }
      }
    }

    // Determine response status based on success/failure
    const hasErrors = errors.length > 0;
    const hasInvoices = invoices.length > 0;
    
    // Log the final status for debugging
    logger.info(`Invoice generation completed: ${invoices.length} invoices, ${errors.length} errors`);
    
    if (!hasInvoices && hasErrors) {
      // No invoices generated, only errors
      const errorMessages = errors.map(err => {
        if (typeof err === 'string') {
          return err;
        } else if (err && typeof err === 'object') {
          return `${err.student}: ${err.error}`;
        }
        return 'Unknown error';
      }).join(', ');
      
      logger.error(`No invoices generated. Errors: ${errorMessages}`);
      throw new ApiError(400, `No invoices generated. Errors: ${errorMessages}`);
    }
    
    // Determine appropriate status code and message
    let statusCode = 201;
    let message = `Successfully generated ${invoices.length} invoices`;
    
    if (hasInvoices && hasErrors) {
      // Partial success - some invoices generated, some failed
      statusCode = 200; // Use 200 instead of 207 for better frontend compatibility
      message = `Generated ${invoices.length} invoices with ${errors.length} errors`;
      logger.warn(`Partial success: ${invoices.length} invoices generated with ${errors.length} errors`);
    } else if (hasInvoices && !hasErrors) {
      // Complete success
      statusCode = 201;
      message = `Successfully generated ${invoices.length} invoices`;
      logger.info(`Complete success: ${invoices.length} invoices generated`);
    }
    
    logger.info(`Generated ${invoices.length} invoices for ${feeStructures.length} fee structures`);
    
    const response = {
      success: hasInvoices, // true if any invoices were generated
      message: message,
      data: {
        invoices: invoices,
        total_generated: invoices.length,
        errors: hasErrors ? errors : undefined,
        error_summary: hasErrors ? {
          total_errors: errors.length,
          error_types: errors.reduce((acc, err) => {
            const errorType = typeof err === 'object' ? err.error : 'Unknown';
            acc[errorType] = (acc[errorType] || 0) + 1;
            return acc;
          }, {})
        } : undefined
      }
    };
    
    logger.info(`Sending response with status ${statusCode}:`, {
      success: response.success,
      total_generated: response.data.total_generated,
      has_errors: hasErrors,
      error_count: errors.length
    });
    
    return res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Error generating invoices:', error);
    return next(error);
  }
};



// Get invoices with filtering and pagination
const getInvoices = async (req, res, next) => {
  try {
    const {
      academic_year,
      class_name,
      section,
      status,
      student_id,
      branch_id,
      page = 1,
      limit = 50,
      payment_model,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build invoice filter
    const invoiceWhereClause = {
      school_id: req.schoolId,
    };

    // Handle branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see invoices for their assigned branch
      invoiceWhereClause.branch_id = req.user.branch_id;
    } else if (branch_id) {
      // Super admin and school admin can filter by specific branch if provided
      invoiceWhereClause.branch_id = branch_id;
    }

    if (academic_year) invoiceWhereClause.academic_year = academic_year;
    if (status) invoiceWhereClause.status = status;
    if (student_id) invoiceWhereClause.student_id = student_id;
    if (payment_model) invoiceWhereClause.payment_model = payment_model;

    const invoiceIncludeClause = [
      {
        model: Student,
        as: 'student',
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
        ],
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        include: [
          {
            model: FeeType,
            as: 'feeType',
          },
        ],
      },
      {
        model: Branch,
        as: 'branch',
        attributes: ['id', 'name', 'code'],
      },
    ];

    // Add student filters
    const studentWhereClause = {};
    if (class_name) {
      const classCode = class_name.replace(/^Class\s+/i, '').trim();
      studentWhereClause.current_class = {
        [Op.or]: [class_name, classCode]
      };
    }
    if (section) studentWhereClause.section = section;
    
    // Handle student branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see students from their assigned branch
      studentWhereClause.branch_id = req.user.branch_id;
    } else if (branch_id) {
      // Super admin and school admin can filter by specific branch if provided
      studentWhereClause.branch_id = branch_id;
    }

    if (Object.keys(studentWhereClause).length > 0) {
      invoiceIncludeClause[0].where = studentWhereClause;
    }

    const { count, rows: invoices } = await FeeInvoice.findAndCountAll({
      where: invoiceWhereClause,
      include: invoiceIncludeClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching invoices:', error);
    return next(error);
  }
};

// Get invoice by ID
const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Build where clause based on user role
    const whereClause = {
      id,
      school_id: req.schoolId,
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      whereClause.branch_id = req.user.branch_id;
    }

    const invoice = await FeeInvoice.findOne({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: Parent,
              as: 'parents',
              through: { attributes: [] },
            },
          ],
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          include: [
            {
              model: FeeType,
              as: 'feeType',
            },
          ],
        },
      ],
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    logger.error('Error fetching invoice:', error);
    return next(error);
  }
};

// Update invoice
const updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build where clause based on user role
    const whereClause = {
      id,
      school_id: req.schoolId,
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      whereClause.branch_id = req.user.branch_id;
    }

    const invoice = await FeeInvoice.findOne({
      where: whereClause,
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    // Prevent updating paid invoices
    if (invoice.status === 'paid' && updates.status !== 'paid') {
      throw new ApiError(400, 'Cannot modify paid invoice');
    }

    await invoice.update({
      ...updates,
      updated_by: req.user.id,
    });

    const updatedInvoice = await FeeInvoice.findByPk(invoice.id, {
      include: [
        {
          model: Student,
          as: 'student',
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          include: [
            {
              model: FeeType,
              as: 'feeType',
            },
          ],
        },
      ],
    });

    logger.info(`Invoice updated: ${invoice.invoice_number}`);
    return res.status(200).json({ success: true, data: updatedInvoice });
  } catch (error) {
    logger.error('Error updating invoice:', error);
    return next(error);
  }
};

// Cancel invoice
const cancelInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const invoice = await FeeInvoice.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new ApiError(400, 'Cannot cancel paid invoice');
    }

    if (invoice.paid_amount > 0) {
      throw new ApiError(400, 'Cannot cancel invoice with partial payments');
    }

    await invoice.update({
      status: 'cancelled',
      notes: `${invoice.notes || ''}\n\nCancelled: ${reason || 'No reason provided'}`,
      updated_by: req.user.id,
    });

    logger.info(`Invoice cancelled: ${invoice.invoice_number} - ${reason}`);
    return res.status(200).json({ success: true, message: 'Invoice cancelled successfully' });
  } catch (error) {
    logger.error('Error cancelling invoice:', error);
    return next(error);
  }
};

// Manual fee adjustment (waive or add fees)
const adjustInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      adjustment_type, // 'waive' or 'add'
      adjustment_amount,
      adjustment_reason,
      notes,
    } = req.body;

    if (!adjustment_type || !adjustment_amount || adjustment_amount <= 0) {
      throw new ApiError(400, 'Valid adjustment type and amount are required');
    }

    if (!['waive', 'add'].includes(adjustment_type)) {
      throw new ApiError(400, 'Adjustment type must be either "waive" or "add"');
    }

    const invoice = await FeeInvoice.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if (invoice.status === 'cancelled') {
      throw new ApiError(400, 'Cannot adjust cancelled invoice');
    }

    let newTotalAmount = parseFloat(invoice.total_amount);
    let newBalanceAmount = parseFloat(invoice.balance_amount);

    if (adjustment_type === 'waive') {
      // Waive fees (reduce total amount)
      if (adjustment_amount > newBalanceAmount) {
        throw new ApiError(400, 'Waiver amount cannot exceed remaining balance');
      }
      newTotalAmount -= parseFloat(adjustment_amount);
      newBalanceAmount -= parseFloat(adjustment_amount);
    } else {
      // Add fees (increase total amount)
      newTotalAmount += parseFloat(adjustment_amount);
      newBalanceAmount += parseFloat(adjustment_amount);
    }

    // Update invoice
    await invoice.update({
      total_amount: newTotalAmount,
      balance_amount: newBalanceAmount,
      notes: notes || invoice.notes,
      updated_by: req.user.id,
    });

    // Create adjustment record (you might want to create a separate table for this)
    logger.info(`Fee adjustment applied: ${adjustment_type} ${adjustment_amount} for invoice ${invoice.invoice_number}. Reason: ${adjustment_reason}`);

    return res.status(200).json({
      success: true,
      message: `Fee adjustment applied successfully`,
      data: {
        invoice_id: invoice.id,
        adjustment_type,
        adjustment_amount: parseFloat(adjustment_amount),
        new_total_amount: newTotalAmount,
        new_balance_amount: newBalanceAmount,
        adjustment_reason,
      },
    });
  } catch (error) {
    logger.error('Error adjusting invoice:', error);
    return next(error);
  }
};

// Get grouped invoices for better UI display
const getGroupedInvoices = async (req, res, next) => {
  try {
    const {
      academic_year,
      class_name,
      section,
      status,
      student_id,
      branch_id,
      page = 1,
      limit,
      payment_model,
      all = false, // Special parameter to get all invoices
    } = req.query;
    
    // If 'all' parameter is true or no limit is specified, get all invoices (no pagination)
    const finalLimit = (all === 'true' || all === true) ? null : (limit ? parseInt(limit) : 50);

    const offset = finalLimit ? (page - 1) * finalLimit : 0;

    // Build invoice filter
    const invoiceWhereClause = {};
    
    if (req.schoolId) {
      invoiceWhereClause.school_id = req.schoolId;
    }

    // Handle branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see invoices for their assigned branch
      invoiceWhereClause.branch_id = req.user.branch_id;
    } else if (branch_id) {
      // Super admin and school admin can filter by specific branch if provided
      invoiceWhereClause.branch_id = branch_id;
    }

    if (academic_year) invoiceWhereClause.academic_year = academic_year;
    if (status) invoiceWhereClause.status = status;
    if (student_id) invoiceWhereClause.student_id = student_id;
    if (payment_model) invoiceWhereClause.payment_model = payment_model;

    const invoiceIncludeClause = [
      {
        model: Student,
        as: 'student',
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
        ],
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        include: [
          {
            model: FeeType,
            as: 'feeType',
          },
        ],
      },
      {
        model: Branch,
        as: 'branch',
        attributes: ['id', 'name', 'code'],
      },
    ];

    // Add student filters
    const studentWhereClause = {};
    if (class_name) {
      const classCode = class_name.replace(/^Class\s+/i, '').trim();
      studentWhereClause.current_class = {
        [Op.or]: [class_name, classCode]
      };
    }
    if (section) studentWhereClause.section = section;
    
    // Handle student branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see students from their assigned branch
      studentWhereClause.branch_id = req.user.branch_id;
    } else if (branch_id) {
      // Super admin and school admin can filter by specific branch if provided
      studentWhereClause.branch_id = branch_id;
    }

    if (Object.keys(studentWhereClause).length > 0) {
      invoiceIncludeClause[0].where = studentWhereClause;
    }

    // Get all invoices first
    const { count, rows: allInvoices } = await FeeInvoice.findAndCountAll({
      where: invoiceWhereClause,
      include: invoiceIncludeClause,
      order: [['created_at', 'DESC']],
    });

    // Group invoices by receipt_group_id for paid/partial_paid invoices
    const groupedInvoices = {};
    const ungroupedInvoices = [];

    allInvoices.forEach(invoice => {
      if (invoice.receipt_group_id && ['paid', 'partial_paid'].includes(invoice.status)) {
        if (!groupedInvoices[invoice.receipt_group_id]) {
          groupedInvoices[invoice.receipt_group_id] = {
            receipt_group_id: invoice.receipt_group_id,
            invoices: [],
            total_amount: 0,
            total_paid: 0,
            total_balance: 0,
            payment_date: invoice.last_payment_date,
            payment_method: invoice.payment_method,
            transaction_id: invoice.transaction_id,
            status: invoice.status,
            student: invoice.student,
            branch: invoice.branch,
            feeStructure: invoice.feeStructure,
            payment_model: invoice.payment_model,
          };
        }
        groupedInvoices[invoice.receipt_group_id].invoices.push(invoice);
        groupedInvoices[invoice.receipt_group_id].total_amount += parseFloat(invoice.total_amount || 0);
        groupedInvoices[invoice.receipt_group_id].total_paid += parseFloat(invoice.paid_amount || 0);
        groupedInvoices[invoice.receipt_group_id].total_balance += parseFloat(invoice.balance_amount || 0);
      } else {
        ungroupedInvoices.push(invoice);
      }
    });

    // Helper function to get month name
    const getMonthName = (month) => {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return months[month - 1] || month;
    };

    // Convert grouped invoices to array format with enhanced info
    const groupedArray = Object.values(groupedInvoices).map(group => {
      const months = group.invoices.map(inv => inv.month).sort((a, b) => a - b);
      const years = [...new Set(group.invoices.map(inv => inv.year))];
      
      // Format month names with years
      const monthNames = group.invoices.map(inv => {
        const monthName = getMonthName(inv.month);
        return `${monthName} ${inv.year}`;
      }).join(', ');
      
      // Format month range with years
      let monthRange = '';
      if (months.length > 1) {
        const startMonth = getMonthName(months[0]);
        const endMonth = getMonthName(months[months.length - 1]);
        monthRange = `${startMonth} ${years[0]} - ${endMonth} ${years[0]}`;
      } else {
        const monthName = getMonthName(months[0]);
        monthRange = `${monthName} ${years[0]}`;
      }
      
      return {
        id: group.receipt_group_id,
        receipt_group_id: group.receipt_group_id,
        invoice_number: group.receipt_group_id.startsWith('INV-GROUP-') ? group.receipt_group_id : `INV-${group.receipt_group_id.slice(-8)}`,
        fee_type: group.invoices[0]?.feeStructure?.feeType?.name || 'Unknown',
        class_name: group.invoices[0]?.class_name,
        section: group.invoices[0]?.section,
        total_amount: group.total_amount,
        paid_amount: group.total_paid,
        balance_amount: group.total_balance,
        due_date: group.invoices[0]?.due_date,
        status: group.total_balance <= 0 ? 'paid' : 'partial_paid',
        academic_year: group.invoices[0]?.academic_year,
        month: months[0],
        year: years[0],
        months_covered: group.invoices.length,
        month_range: monthRange,
        month_names: monthNames,
        display_name: `${group.receipt_group_id.startsWith('INV-GROUP-') ? group.receipt_group_id : `INV-${group.receipt_group_id.slice(-8)}`} → Paid for ${monthNames} (₹${group.total_paid.toLocaleString()})`,
        payment_date: group.payment_date,
        payment_method: group.payment_method,
        transaction_id: group.transaction_id,
        payment_model: group.payment_model,
        student: group.student,
        branch: group.branch,
        feeStructure: group.feeStructure,
        is_grouped: true
      };
    });

    // Sort by payment date (newest first)
    groupedArray.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

    // Apply pagination to combined results
    const allResults = [...groupedArray, ...ungroupedInvoices];
    
    // If no limit specified, return all results
    const paginatedResults = finalLimit ? allResults.slice(offset, offset + finalLimit) : allResults;
    const totalCount = allResults.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return res.status(200).json({
      success: true,
      data: {
        invoices: paginatedResults,
        grouped_invoices: groupedArray,
        ungrouped_invoices: ungroupedInvoices,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: totalCount,
          limit: finalLimit || 'all',
        },
        summary: {
          total_invoices: count,
          total_grouped: groupedArray.length,
          total_ungrouped: ungroupedInvoices.length,
          total_paid: groupedArray.reduce((sum, group) => sum + group.total_paid, 0),
          total_balance: ungroupedInvoices.reduce((sum, inv) => sum + parseFloat(inv.balance_amount || 0), 0),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching grouped invoices:', error);
    return next(error);
  }
};

module.exports = {
  generateInvoices,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  cancelInvoice,
  adjustInvoice,
  getGroupedInvoices,
  generateUniqueInvoiceNumber,
  getClassCode
}; 