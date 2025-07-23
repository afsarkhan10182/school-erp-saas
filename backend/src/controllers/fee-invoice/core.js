const { FeeInvoice, FeeStructure, FeeType, Student, Parent, School, FeePayment, Branch } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { logger } = require('../../utils/logger');
const { Op } = require('sequelize');

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
          // Check if invoice already exists based on payment model
          let existingInvoice;
          if (payment_model === 'monthly') {
            // For monthly payments, check each month
            for (const month of months) {
              existingInvoice = await FeeInvoice.findOne({
                where: {
                  student_id: student.id,
                  fee_structure_id: feeStructure.id,
                  academic_year: feeStructure.academic_year,
                  payment_model: 'monthly',
                  month: month,
                  year: year,
                },
              });

              if (existingInvoice) {
                errors.push(`Monthly invoice already exists for student ${student.first_name} ${student.last_name}, fee structure ${feeStructure.name}, month ${month}/${year}`);
                continue;
              }
            }
          } else {
            // For installment payments, check if ANY invoice exists for this student in this academic year
            // This ensures ONE invoice per student per academic year for installment payments
            existingInvoice = await FeeInvoice.findOne({
              where: {
                student_id: student.id,
                academic_year: feeStructure.academic_year,
                payment_model: 'installment',
              },
            });

            if (existingInvoice) {
              errors.push(`Installment invoice already exists for student ${student.first_name} ${student.last_name} for academic year ${feeStructure.academic_year}`);
              continue;
            }
          }

          // Generate invoices based on payment model
          if (payment_model === 'monthly') {
            // Generate monthly invoices for each month
            for (const month of months) {
              // Calculate due date for this month
              let calculatedDueDate = new Date(year, month - 1, feeStructure.due_day || 10);
              
              // Generate invoice number
              const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
              
              // Calculate amounts - use monthly_payment_amount for monthly payments
              const baseAmount = parseFloat(feeStructure.monthly_payment_amount) || parseFloat(feeStructure.amount) || 0;
              const discountAmount = parseFloat(feeStructure.discount_amount) || 0;
              const taxAmount = parseFloat(feeStructure.tax_amount) || 0;
              const totalAmount = baseAmount - discountAmount + taxAmount;
              
              // Log fee structure details for debugging
              logger.info(`Fee structure details for ${feeStructure.name}:`, {
                fee_structure_id: feeStructure.id,
                base_amount: baseAmount,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                payment_model: payment_model,
                month: month,
                year: year
              });
              
              // Ensure total amount is not zero
              if (totalAmount <= 0) {
                throw new ApiError(400, `Fee structure ${feeStructure.name} has invalid amount: ${baseAmount}. Please check the fee structure configuration.`);
              }
              
              // Create monthly invoice
              const monthlyInvoice = await FeeInvoice.create({
                invoice_number: invoiceNumber,
                student_id: student.id,
                fee_structure_id: feeStructure.id,
                academic_year: feeStructure.academic_year,
                class_name: feeStructure.class_name,
                section: feeStructure.section,
                fee_type_name: feeStructure.feeType?.name || 'Fee',
                fee_type_id: feeStructure.fee_type_id,
                invoice_date: new Date(),
                due_date: calculatedDueDate,
                amount: baseAmount,
                base_amount: baseAmount,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                paid_amount: 0.00,
                balance_amount: totalAmount,
                status: 'sent',
                payment_status: 'pending',
                installment_number: 1,
                total_installments: 1,
                payment_model: 'monthly',
                month: month,
                year: year,
                notes: notes || `Monthly payment for ${month}/${year} - ${feeStructure.name}`,
                school_id: req.schoolId,
                branch_id: feeStructure.branch_id || req.branchId,
                created_by: req.user.id,
              });

              invoices.push(monthlyInvoice);
            }
          } else {
            // Generate installment invoice - ONE per student per academic year
            let calculatedDueDate = due_date;
            if (!calculatedDueDate && feeStructure.due_day) {
              const currentDate = new Date();
              calculatedDueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), feeStructure.due_day);
              // If the due day has passed this month, set it to next month
              if (calculatedDueDate < currentDate) {
                calculatedDueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, feeStructure.due_day);
              }
            }

            // Generate invoice number
            const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
            
            // Calculate amounts - for installment, this is the TOTAL amount for the year
            const baseAmount = parseFloat(feeStructure.amount) || 0;
            const discountAmount = parseFloat(feeStructure.discount_amount) || 0;
            const taxAmount = parseFloat(feeStructure.tax_amount) || 0;
            const totalAmount = baseAmount - discountAmount + taxAmount;
            
            // Ensure total amount is not zero
            if (totalAmount <= 0) {
              throw new ApiError(400, `Fee structure ${feeStructure.name} has invalid amount: ${baseAmount}. Please check the fee structure configuration.`);
            }
            
            // Create installment invoice - ONE per student per academic year
            const invoice = await FeeInvoice.create({
              invoice_number: invoiceNumber,
              student_id: student.id,
              fee_structure_id: feeStructure.id,
              academic_year: feeStructure.academic_year,
              class_name: feeStructure.class_name,
              section: feeStructure.section,
              fee_type_name: feeStructure.feeType?.name || 'Fee',
              fee_type_id: feeStructure.fee_type_id,
              invoice_date: new Date(),
              due_date: calculatedDueDate,
              amount: baseAmount,
              base_amount: baseAmount,
              discount_amount: discountAmount,
              tax_amount: taxAmount,
              total_amount: totalAmount,
              paid_amount: 0.00,
              balance_amount: totalAmount,
              status: 'sent',
              payment_status: 'pending',
              installment_number: 1, // Always 1 for installment model (ONE invoice per year)
              total_installments: 1, // Always 1 for installment model (ONE invoice per year)
              payment_model: 'installment',
              notes: notes || `Annual installment payment for ${feeStructure.academic_year} - ${feeStructure.name}`,
              school_id: req.schoolId,
              branch_id: feeStructure.branch_id || req.branchId,
              created_by: req.user.id,
            });

            invoices.push(invoice);
          }
        } catch (error) {
          logger.error(`Error generating invoice for student ${student.id} and fee structure ${feeStructure.id}:`, error);
          errors.push(`Failed to generate invoice for student ${student.first_name} ${student.last_name}: ${error.message}`);
        }
      }
    }

    if (invoices.length === 0) {
      throw new ApiError(400, `No invoices generated. Errors: ${errors.join(', ')}`);
    }

    logger.info(`Generated ${invoices.length} invoices for ${feeStructures.length} fee structures`);
    
    return res.status(201).json({
      success: true,
      message: `Successfully generated ${invoices.length} invoices`,
      data: {
        invoices: invoices,
        total_generated: invoices.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    logger.error('Error generating invoices:', error);
    return next(error);
  }
};

// Get all invoices
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
      payment_model, // Filter by payment model: 'monthly', 'installment', or undefined for both
    } = req.query;

    const offset = (page - 1) * limit;
    let allInvoices = [];
    let totalCount = 0;

    // Build invoice filter
    const invoiceWhereClause = {};
    
    // Only filter by school_id if it's provided (super admin can see all schools)
    if (req.schoolId) {
      invoiceWhereClause.school_id = req.schoolId;
    }

    if (academic_year) invoiceWhereClause.academic_year = academic_year;
    if (status) invoiceWhereClause.status = status;
    if (student_id) invoiceWhereClause.student_id = student_id;
    if (branch_id) invoiceWhereClause.branch_id = branch_id;
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

    // Add student filters only if they are provided
    const studentWhereClause = {};
    if (class_name) {
      const classCode = class_name.replace(/^Class\s+/i, '').trim();
      studentWhereClause.current_class = {
        [Op.or]: [class_name, classCode]
      };
    }
    if (section) studentWhereClause.section = section;
    if (branch_id) studentWhereClause.branch_id = branch_id;

    // Only add where clause if there are filters
    if (Object.keys(studentWhereClause).length > 0) {
      invoiceIncludeClause[0].where = studentWhereClause;
    }

    const { count, rows: invoices } = await FeeInvoice.findAndCountAll({
      where: invoiceWhereClause,
      include: invoiceIncludeClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    // Use actual payment_model from database
    allInvoices = invoices.map(invoice => ({
      ...invoice.toJSON(),
      payment_model: invoice.payment_model || 'installment', // Fallback for existing records
    }));
    totalCount = count;

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: {
        invoices: allInvoices,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: totalCount,
          limit: parseInt(limit),
        },
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

    const invoice = await FeeInvoice.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
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

    const invoice = await FeeInvoice.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
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
      limit = 50,
      payment_model,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build invoice filter
    const invoiceWhereClause = {};
    
    if (req.schoolId) {
      invoiceWhereClause.school_id = req.schoolId;
    }

    if (academic_year) invoiceWhereClause.academic_year = academic_year;
    if (status) invoiceWhereClause.status = status;
    if (student_id) invoiceWhereClause.student_id = student_id;
    if (branch_id) invoiceWhereClause.branch_id = branch_id;
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
    if (branch_id) studentWhereClause.branch_id = branch_id;

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
        invoice_number: `RCP-${group.receipt_group_id.slice(-8)}`,
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
        display_name: `RCP-${group.receipt_group_id.slice(-8)} → Paid for ${monthNames} (₹${group.total_paid.toLocaleString()})`,
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
    const paginatedResults = allResults.slice(offset, offset + parseInt(limit));
    const totalCount = allResults.length;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

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
          limit: parseInt(limit),
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
}; 