const { FeeInvoice, FeeStructure, FeeType, Student, Parent, School, FeePayment, Branch } = require('../models');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');
const { generateInstallmentReceipt } = require('../services/receipt.service');

// Generate invoices for students based on fee structure
const generateInvoices = async (req, res, next) => {
  try {
    const {
      academic_year,
      class_name,
      section,
      fee_type_ids,
      student_ids,
      due_date,
      notes,
    } = req.body;

    if (!academic_year || !class_name) {
      throw new ApiError(400, 'Academic year and class name are required');
    }

    // Build student filter
    const studentFilter = {
      school_id: req.schoolId,
      academic_year,
      status: 'active',
    };

    // Handle class name matching - try both full name and code
    if (class_name) {
      // Extract the class code from the full name (e.g., "Class I" -> "I")
      const classCode = class_name.replace(/^Class\s+/i, '').trim();
      
      // Try to match students with either the full class name or the class code
      studentFilter.current_class = {
        [Op.or]: [class_name, classCode]
      };
    }

    if (section) studentFilter.section = section;
    if (student_ids && student_ids.length > 0) studentFilter.id = { [Op.in]: student_ids };

    // Get students
    const students = await Student.findAll({
      where: studentFilter,
    });



    if (students.length === 0) {
      throw new ApiError(404, 'No active students found for the specified criteria');
    }

    // Build fee structure filter
    const feeStructureFilter = {
      school_id: req.schoolId,
      academic_year,
      class_name,
      is_active: true,
    };

    if (section) feeStructureFilter.section = section;
    if (fee_type_ids && fee_type_ids.length > 0) {
      feeStructureFilter.fee_type_id = { [Op.in]: fee_type_ids };
    }

    // Get fee structures
    const feeStructures = await FeeStructure.findAll({
      where: feeStructureFilter,
      include: [
        {
          model: FeeType,
          as: 'feeType',
        },
      ],
    });

    if (feeStructures.length === 0) {
      throw new ApiError(404, 'No fee structures found for the specified criteria');
    }

    const invoices = [];
    const errors = [];

    // Generate invoices for each student and fee structure
    for (const student of students) {
      for (const feeStructure of feeStructures) {
        try {
          // Check if invoice already exists
          const existingInvoice = await FeeInvoice.findOne({
            where: {
              student_id: student.id,
              fee_structure_id: feeStructure.id,
              academic_year,
              installment_number: 1, // For now, generating first installment
            },
          });

          if (existingInvoice) {
            continue; // Skip if invoice already exists
          }

          // Calculate amounts
          const baseAmount = parseFloat(feeStructure.amount);
          let discountAmount = 0;
          let taxAmount = 0;

          // Apply discount if applicable
          if (feeStructure.discount_applicable) {
            if (feeStructure.discount_type === 'percentage') {
              discountAmount = (baseAmount * parseFloat(feeStructure.discount_amount)) / 100;
            } else {
              discountAmount = parseFloat(feeStructure.discount_amount);
            }
          }

          // Apply tax if applicable (default to no tax for minimal fee types)
          if (feeStructure.feeType.tax_applicable) {
            const taxableAmount = baseAmount - discountAmount;
            taxAmount = (taxableAmount * parseFloat(feeStructure.feeType.tax_percentage || 0)) / 100;
          }

          const totalAmount = baseAmount - discountAmount + taxAmount;

          // Calculate due date
          let calculatedDueDate = null;
          
          // Check if due_date is provided and valid
          if (due_date && due_date.trim() !== '') {
            calculatedDueDate = new Date(due_date);
            // Validate the date
            if (isNaN(calculatedDueDate.getTime())) {
              calculatedDueDate = null; // Invalid date, will use fallback
            }
          }
          
          // If no valid due date provided, calculate based on fee structure or default
          if (!calculatedDueDate) {
            const today = new Date();
            calculatedDueDate = new Date(today);
            
            // Try to get due days from fee type settings first, then fee structure, then default
            let dueDays = 30; // Default fallback
            
            // Check if fee type has due_date_days configured
            if (feeStructure.feeType.due_date_days) {
              dueDays = feeStructure.feeType.due_date_days;
            }
            
            // Check if fee structure has due_day configured (for monthly due dates)
            if (feeStructure.due_day) {
              // Calculate due date based on due_day of current month
              const currentMonth = today.getMonth();
              const currentYear = today.getFullYear();
              calculatedDueDate = new Date(currentYear, currentMonth, feeStructure.due_day);
              
              // If the due day has passed this month, set it to next month
              if (calculatedDueDate < today) {
                calculatedDueDate = new Date(currentYear, currentMonth + 1, feeStructure.due_day);
              }
            } else {
              // Use simple X-day calculation based on fee type settings
              calculatedDueDate.setDate(today.getDate() + dueDays);
            }
            

          }

          // Generate invoice number
          const year = new Date().getFullYear();
          const month = String(new Date().getMonth() + 1).padStart(2, '0');
          const count = await FeeInvoice.count({ where: { school_id: req.schoolId } });
          const invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;

          // Create invoice
          const invoiceData = {
            invoice_number: invoiceNumber,
            student_id: student.id,
            fee_structure_id: feeStructure.id,
            academic_year,
            class_name: student.current_class || class_name,
            section: student.section || section,
            fee_type_name: feeStructure.feeType.name,
            due_date: calculatedDueDate,
            amount: baseAmount,
            base_amount: baseAmount,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            balance_amount: totalAmount,
            status: 'sent',
            payment_status: 'pending',
            notes,
            installment_number: 1,
            total_installments: feeStructure.installment_count,
            invoice_items: [
              {
                fee_type_id: feeStructure.fee_type_id,
                fee_type_name: feeStructure.feeType.name,
                amount: baseAmount,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                total_amount: totalAmount,
              },
            ],
            school_id: req.schoolId,
            branch_id: req.branchId,
            created_by: req.user.id,
          };



          const invoice = await FeeInvoice.create(invoiceData);

          invoices.push(invoice);
        } catch (error) {
          errors.push({
            student_id: student.id,
            student_name: `${student.first_name} ${student.last_name}`,
            fee_type: feeStructure.feeType.name,
            error: error.message,
          });
        }
      }
    }

    logger.info(`Generated ${invoices.length} invoices for ${students.length} students`);
    
    return res.status(201).json({
      success: true,
      message: `Generated ${invoices.length} invoices successfully`,
      data: {
        invoices_generated: invoices.length,
        students_processed: students.length,
        errors: errors.length > 0 ? errors : undefined,
      },
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
    } = req.query;

    const whereClause = {
      school_id: req.schoolId,
    };

    if (academic_year) whereClause.academic_year = academic_year;
    if (status) whereClause.status = status;
    if (student_id) whereClause.student_id = student_id;
    if (branch_id) whereClause.branch_id = branch_id;

    // Debug logging
    logger.debug('getInvoices - Debug info:', {
      schoolId: req.schoolId,
      whereClause,
      query: req.query,
      user: {
        id: req.user?.id,
        role: req.user?.role,
        school_id: req.user?.school_id
      }
    });

    const includeClause = [
      {
        model: Student,
        as: 'student',
        where: {},
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
    if (class_name) includeClause[0].where.current_class = class_name;
    if (section) includeClause[0].where.section = section;

    const offset = (page - 1) * limit;

    // First, let's check if there are any invoices at all for this school
    const totalInvoices = await FeeInvoice.count({ where: { school_id: req.schoolId } });
    logger.debug('getInvoices - Total invoices for school:', totalInvoices);

    const { count, rows: invoices } = await FeeInvoice.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    logger.debug('getInvoices - Query result:', {
      count,
      invoicesFound: invoices.length,
      whereClause,
      includeClause
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: {
        invoices,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
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

// Calculate late fees based on due date
const calculateLateFees = async (invoice) => {
  const currentDate = new Date();
  const dueDate = new Date(invoice.due_date);
  
  if (currentDate <= dueDate) {
    return 0; // No late fee if not overdue
  }
  
  const daysOverdue = Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24));
  const lateFeePct = parseFloat(invoice.late_fee_percentage) || 2.0; // Default 2% late fee
  
  // Calculate late fee (2% per month or part thereof)
  const monthsOverdue = Math.ceil(daysOverdue / 30);
  const lateFee = (parseFloat(invoice.total_amount) * lateFeePct * monthsOverdue) / 100;
  
  return parseFloat(lateFee.toFixed(2));
};

// Apply late fees to overdue invoices
const applyLateFees = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const invoice = await FeeInvoice.findOne({
      where: {
        id,
        school_id: req.schoolId,
        status: { [Op.in]: ['sent', 'partial_paid', 'overdue'] }
      }
    });
    
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found or not eligible for late fees');
    }
    
    if (invoice.is_late_fee_applied) {
      throw new ApiError(400, 'Late fees already applied to this invoice');
    }
    
    const lateFeeAmount = await calculateLateFees(invoice);
    
    if (lateFeeAmount > 0) {
      const newTotalAmount = parseFloat(invoice.total_amount) + lateFeeAmount;
      const newBalanceAmount = newTotalAmount - parseFloat(invoice.paid_amount);
      
      await invoice.update({
        late_fee_amount: lateFeeAmount,
        total_amount: newTotalAmount,
        balance_amount: newBalanceAmount,
        is_late_fee_applied: true,
        late_fee_applied_date: new Date(),
        status: 'overdue',
        updated_by: req.user.id
      });
      
      logger.info(`Late fee applied: $${lateFeeAmount} to invoice ${invoice.invoice_number}`);
      
      return res.status(200).json({
        success: true,
        message: 'Late fees applied successfully',
        data: {
          invoice_id: invoice.id,
          new_total_amount: newTotalAmount,
          new_balance_amount: newBalanceAmount
        }
      });
    } else {
      throw new ApiError(400, 'No late fees applicable for this invoice');
    }
  } catch (error) {
    logger.error('Error applying late fees:', error);
    return next(error);
  }
};

// Generate receipt after payment
const generateReceipt = async (invoice, paymentAmount, paymentMethod, transactionId) => {
  try {
    const { generateInstallmentReceipt } = require('../services/receipt.service');
    const { School } = require('../models');
    
    // Get school data
    const school = await School.findByPk(invoice.school_id);
    
    // Get student data
    const student = invoice.student || await Student.findByPk(invoice.student_id);
    
    // Generate professional receipt
    const receipt = await generateInstallmentReceipt(
      invoice, 
      paymentAmount, 
      paymentMethod, 
      transactionId, 
      school, 
      student
    );
    
    return receipt;
  } catch (error) {
    logger.error('Error generating receipt:', error);
    
    // Fallback to simple receipt
    const receiptData = {
      receipt_number: `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      invoice_number: invoice.invoice_number,
      student_name: invoice.student ? `${invoice.student.first_name} ${invoice.student.last_name}` : 'N/A',
      payment_amount: paymentAmount,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      payment_date: new Date(),
      remaining_balance: parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount) - parseFloat(paymentAmount),
      school_name: invoice.school ? invoice.school.name : 'School Name'
    };
    
    const receiptHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
        <h2 style="text-align: center; color: #333;">Payment Receipt</h2>
        <hr>
        <p><strong>Receipt No:</strong> ${receiptData.receipt_number}</p>
        <p><strong>Invoice No:</strong> ${receiptData.invoice_number}</p>
        <p><strong>Student:</strong> ${receiptData.student_name}</p>
        <p><strong>Amount Paid:</strong> ₹${receiptData.payment_amount}</p>
        <p><strong>Payment Method:</strong> ${receiptData.payment_method}</p>
        <p><strong>Transaction ID:</strong> ${receiptData.transaction_id || 'N/A'}</p>
        <p><strong>Payment Date:</strong> ${receiptData.payment_date.toLocaleDateString()}</p>
        <p><strong>Remaining Balance:</strong> ₹${receiptData.remaining_balance}</p>
        <hr>
        <p style="text-align: center; font-size: 12px; color: #666;">Thank you for your payment!</p>
      </div>
    `;
    
    return {
      receipt_number: receiptData.receipt_number,
      receipt_html: receiptHtml,
      receipt_data: receiptData
    };
  }
};

// Record payment for an invoice
const recordPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      amount,
      payment_amount,
      payment_method = 'cash',
      payment_date,
      transaction_id,
      cheque_number,
      bank_name,
      reference_number,
      notes,
    } = req.body;

    // Support both 'amount' and 'payment_amount' for backward compatibility
    const paymentAmount = amount || payment_amount;

    if (!paymentAmount || paymentAmount <= 0) {
      throw new ApiError(400, 'Valid payment amount is required');
    }

    const invoice = await FeeInvoice.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
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

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new ApiError(400, 'Invoice is already fully paid');
    }

    if (invoice.status === 'cancelled') {
      throw new ApiError(400, 'Cannot record payment for cancelled invoice');
    }

    const newPaidAmount = parseFloat(invoice.paid_amount) + parseFloat(paymentAmount);

    if (newPaidAmount > parseFloat(invoice.total_amount)) {
      throw new ApiError(400, 'Payment amount exceeds invoice total');
    }

    // Get school data for receipt generation
    const school = await School.findByPk(req.schoolId);

    // Generate receipt for this payment
    const receipt = await generateInstallmentReceipt(
      invoice, 
      paymentAmount, 
      payment_method, 
      transaction_id, 
      school, 
      invoice.student
    );

    // Create payment record
    const paymentData = {
      payment_number: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      receipt_number: receipt.receipt_number,
      invoice_id: invoice.id,
      student_id: invoice.student_id,
      payment_amount: parseFloat(paymentAmount),
      payment_method,
      payment_date: payment_date || new Date(),
      transaction_id,
      cheque_number,
      bank_name,
      reference_number,
      payment_status: 'completed',
      receipt_html: receipt.receipt_html,
      receipt_data: {
        receipt_number: receipt.receipt_number,
        invoice_number: invoice.invoice_number,
        student_name: `${invoice.student.first_name} ${invoice.student.last_name}`,
        payment_amount: paymentAmount,
        payment_method,
        transaction_id,
        payment_date: payment_date || new Date(),
        remaining_balance: Math.max(0, parseFloat(invoice.total_amount) - newPaidAmount),
        school_name: school.name,
        fee_type: invoice.fee_type_name,
        class_name: invoice.class_name,
        section: invoice.section,
      },
      notes,
      school_id: req.schoolId,
      branch_id: req.branchId,
      created_by: req.user.id,
    };

    const payment = await FeePayment.create(paymentData);

    // Update invoice with payment
    await invoice.update({
      paid_amount: newPaidAmount,
      balance_amount: parseFloat(invoice.total_amount) - newPaidAmount,
      last_payment_date: payment_date || new Date(),
      updated_by: req.user.id,
    });
    
    logger.info(`Payment recorded: ${paymentAmount} for invoice ${invoice.invoice_number} (Payment: ${payment.payment_number})`);

    return res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment_id: payment.id,
        payment_number: payment.payment_number,
        receipt_number: payment.receipt_number,
        invoice_id: invoice.id,
        payment_amount: parseFloat(paymentAmount),
        new_paid_amount: newPaidAmount,
        remaining_balance: Math.max(0, parseFloat(invoice.total_amount) - newPaidAmount),
        status: invoice.status,
        receipt: {
          receipt_number: payment.receipt_number,
          receipt_html: payment.receipt_html,
        },
      },
    });
  } catch (error) {
    logger.error('Error recording payment:', error);
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

// Get fee collection summary
const getFeeCollectionSummary = async (req, res, next) => {
  try {
    const { academic_year, class_name, start_date, end_date } = req.query;

    const whereClause = {
      school_id: req.schoolId,
    };

    if (academic_year) whereClause.academic_year = academic_year;
    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)],
      };
    }

    const includeClause = [];
    if (class_name) {
      includeClause.push({
        model: Student,
        as: 'student',
        where: { current_class: class_name },
        attributes: [],
      });
    }

    // Get summary statistics
    const totalInvoices = await FeeInvoice.count({
      where: whereClause,
      include: includeClause,
    });

    const paidInvoices = await FeeInvoice.count({
      where: { ...whereClause, status: 'paid' },
      include: includeClause,
    });

    const overdueInvoices = await FeeInvoice.count({
      where: { ...whereClause, status: 'overdue' },
      include: includeClause,
    });

    const partialPaidInvoices = await FeeInvoice.count({
      where: { ...whereClause, status: 'partial_paid' },
      include: includeClause,
    });

    // Get amount statistics
    const amountStats = await FeeInvoice.findAll({
      where: whereClause,
      include: includeClause,
      attributes: [
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('total_amount')), 'total_amount'],
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('paid_amount')), 'total_paid'],
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('balance_amount')), 'total_balance'],
      ],
      raw: true,
    });

    const summary = {
      invoice_counts: {
        total: totalInvoices,
        paid: paidInvoices,
        overdue: overdueInvoices,
        partial_paid: partialPaidInvoices,
        pending: totalInvoices - paidInvoices - overdueInvoices - partialPaidInvoices,
      },
      amounts: {
        total_amount: parseFloat(amountStats[0]?.total_amount || 0),
        total_paid: parseFloat(amountStats[0]?.total_paid || 0),
        total_balance: parseFloat(amountStats[0]?.total_balance || 0),
        collection_percentage: totalInvoices > 0 
          ? ((paidInvoices / totalInvoices) * 100).toFixed(2)
          : 0,
      },
    };

    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    logger.error('Error fetching fee collection summary:', error);
    return next(error);
  }
};

// Generate report with filtering, pagination, and sorting options
// Export fee invoice report in Excel or CSV format (legacy - replaced by new implementation)
const exportFeeInvoicesReportLegacy = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const invoices = await FeeInvoice.findAll({
      where: {
        school_id: req.schoolId,
      },
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

    // Process and convert invoices data to desired format
    let data;
    if (format === 'excel') {
      // Convert to Excel format
      data = convertToExcel(invoices); // Assume convertToExcel is a utility function
    } else {
      // Convert to CSV format
      data = convertToCSV(invoices); // Assume convertToCSV is a utility function
    }

    res.setHeader('Content-disposition', `attachment; filename=fee_invoices.${format}`);
    res.set('Content-Type', `text/${format}`);
    res.send(data);
  } catch (error) {
    logger.error('Error exporting fee invoices:', error);
    return next(error);
  }
};

// GET endpoint to retrieve fee invoice report with pagination and filtering
const getFeeInvoiceReport = async (req, res, next) => {
  try {
    logger.debug('getFeeInvoiceReport: Request received', {
      userRole: req.user?.role,
      userSchoolId: req.user?.school_id,
      schoolId: req.schoolId,
      query: req.query
    });

    const { page = 1, limit = 10, search, status, class_name, section, from_date, to_date } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      school_id: req.schoolId,
    };

    if (status) whereClause.status = status;
    if (from_date && to_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(from_date), new Date(to_date)],
      };
    }

    logger.debug('getFeeInvoiceReport: Query parameters', {
      whereClause,
      page,
      limit,
      offset
    });

    const includeClause = [
      {
        model: Student,
        as: 'student',
        where: {},
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
    ];

    // Add student filters
    if (search) {
      includeClause[0].where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { 
          admission_number: { 
            [Op.and]: [
              { [Op.not]: null },
              { [Op.iLike]: `%${search}%` }
            ]
          } 
        },
      ];
    }
    if (class_name) includeClause[0].where.current_class = class_name;
    if (section) includeClause[0].where.section = section;

    const { count, rows: invoices } = await FeeInvoice.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        invoices,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_records: count,
          per_page: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching fee invoice report:', error);
    return next(error);
  }
};

// GET endpoint to export fee invoices report
const exportFeeInvoicesReport = async (req, res, next) => {
  try {
    const { format = 'csv', search, status, class_name, section, from_date, to_date } = req.query;

    const whereClause = {
      school_id: req.schoolId,
    };

    if (status) whereClause.status = status;
    if (from_date && to_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(from_date), new Date(to_date)],
      };
    }

    const includeClause = [
      {
        model: Student,
        as: 'student',
        where: {},
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
    ];

    // Add student filters
    if (search) {
      includeClause[0].where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { 
          admission_number: { 
            [Op.and]: [
              { [Op.not]: null },
              { [Op.iLike]: `%${search}%` }
            ]
          } 
        },
      ];
    }
    if (class_name) includeClause[0].where.current_class = class_name;
    if (section) includeClause[0].where.section = section;

    const invoices = await FeeInvoice.findAll({
      where: whereClause,
      include: includeClause,
      order: [['created_at', 'DESC']],
    });

    // Convert to export format
    const exportData = invoices.map(invoice => ({
      'Invoice Number': invoice.invoice_number,
      'Student Name': invoice.student ? `${invoice.student.first_name} ${invoice.student.last_name}` : 'N/A',
      'Admission Number': invoice.student?.admission_number || 'N/A',
      'Class': invoice.student?.current_class || 'N/A',
      'Section': invoice.student?.section || 'N/A',
      'Amount': invoice.amount,
      'Paid Amount': invoice.paid_amount,
      'Balance': invoice.balance_amount,
      'Due Date': invoice.due_date,
      'Status': invoice.status,
      'Created At': invoice.created_at,
      'Updated At': invoice.updated_at,
    }));

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = Object.keys(exportData[0] || {});
      const csvRows = exportData.map(row => 
        csvHeaders.map(header => {
          const value = row[header];
          // Handle null/undefined values and escape quotes
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        }).join(',')
      );
      
      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="fee-invoices-report-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="fee-invoices-report-${new Date().toISOString().split('T')[0]}.json"`);
      res.json({
        success: true,
        data: exportData,
        exported_at: new Date().toISOString(),
        total_records: exportData.length,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid export format. Supported formats: csv, json',
      });
    }
  } catch (error) {
    logger.error('Error exporting fee invoices report:', error);
    return next(error);
  }
};

// Get fee collection statistics
const getFeeStats = async (req, res, next) => {
  try {
    logger.debug('getFeeStats: Request received', {
      userRole: req.user?.role,
      userSchoolId: req.user?.school_id,
      schoolId: req.schoolId,
      query: req.query
    });

    const { academic_year, class_name } = req.query;
    
    const whereClause = {
      school_id: req.schoolId,
    };

    if (academic_year) whereClause.academic_year = academic_year;

    const includeClause = [];
    if (class_name) {
      includeClause.push({
        model: Student,
        as: 'student',
        where: { current_class: class_name },
        attributes: [],
      });
    }

    logger.debug('getFeeStats: Query parameters', {
      whereClause,
      includeClause: includeClause.length
    });

    // Get summary statistics
    const [totalInvoices, paidInvoices, overdueInvoices, partialPaidInvoices] = await Promise.all([
      FeeInvoice.count({
        where: whereClause,
        include: includeClause,
      }),
      FeeInvoice.count({
        where: { ...whereClause, status: 'paid' },
        include: includeClause,
      }),
      FeeInvoice.count({
        where: { ...whereClause, status: 'overdue' },
        include: includeClause,
      }),
      FeeInvoice.count({
        where: { ...whereClause, status: 'partial_paid' },
        include: includeClause,
      }),
    ]);

    // Get amount statistics
    const amountStats = await FeeInvoice.findAll({
      where: whereClause,
      include: includeClause,
      attributes: [
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('total_amount')), 'total_amount'],
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('paid_amount')), 'total_paid'],
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('balance_amount')), 'total_balance'],
      ],
      raw: true,
    });

    const stats = amountStats[0] || {};

    return res.status(200).json({
      success: true,
      data: {
        totalInvoices,
        paidInvoices,
        overdueInvoices,
        partialPaidInvoices,
        totalAmount: parseFloat(stats.total_amount || 0),
        totalPaid: parseFloat(stats.total_paid || 0),
        totalBalance: parseFloat(stats.total_balance || 0),
        totalLateFees: parseFloat(stats.total_late_fees || 0),
        collectionRate: stats.total_amount ? ((stats.total_paid / stats.total_amount) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching fee stats:', error);
    return next(error);
  }
};

// Get student dues for quick collection
const getStudentDues = async (req, res, next) => {
  try {
    const { student_id, academic_year } = req.query;

    if (!student_id) {
      throw new ApiError(400, 'Student ID is required');
    }

    // Get student with basic info
    const student = await Student.findOne({
      where: {
        id: student_id,
        school_id: req.schoolId,
      },
      attributes: ['id', 'first_name', 'last_name', 'admission_number', 'current_class', 'section'],
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Build invoice filter
    const invoiceFilter = {
      student_id,
      school_id: req.schoolId,
      status: { [Op.in]: ['sent', 'partial_paid', 'overdue'] }, // Only unpaid invoices
    };

    if (academic_year) {
      invoiceFilter.academic_year = academic_year;
    }

    // Get unpaid invoices
    const invoices = await FeeInvoice.findAll({
      where: invoiceFilter,
      include: [
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
      order: [['due_date', 'ASC']],
    });

    // Calculate summary
    const totalDues = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.balance_amount), 0);
    const overdueAmount = invoices
      .filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + parseFloat(invoice.balance_amount), 0);

    return res.status(200).json({
      success: true,
      data: {
        student,
        invoices,
        summary: {
          total_dues: totalDues,
          overdue_amount: overdueAmount,
          invoice_count: invoices.length,
          overdue_count: invoices.filter(inv => inv.status === 'overdue').length,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching student dues:', error);
    return next(error);
  }
};

// Get student fee ledger (complete payment history)
const getStudentFeeLedger = async (req, res, next) => {
  try {
    const { student_id, academic_year, page = 1, limit = 50 } = req.query;

    if (!student_id) {
      throw new ApiError(400, 'Student ID is required');
    }

    // Get student with basic info
    const student = await Student.findOne({
      where: {
        id: student_id,
        school_id: req.schoolId,
      },
      attributes: ['id', 'first_name', 'last_name', 'admission_number', 'current_class', 'section'],
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Build invoice filter
    const invoiceFilter = {
      student_id,
      school_id: req.schoolId,
    };

    if (academic_year) {
      invoiceFilter.academic_year = academic_year;
    }

    const offset = (page - 1) * limit;

    // Get all invoices for student
    const { count, rows: invoices } = await FeeInvoice.findAndCountAll({
      where: invoiceFilter,
      include: [
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
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    // Calculate summary statistics
    const totalInvoices = await FeeInvoice.count({ where: invoiceFilter });
    const paidInvoices = await FeeInvoice.count({ 
      where: { ...invoiceFilter, status: 'paid' } 
    });
    const overdueInvoices = await FeeInvoice.count({ 
      where: { ...invoiceFilter, status: 'overdue' } 
    });

    // Get amount statistics
    const amountStats = await FeeInvoice.findAll({
      where: invoiceFilter,
      attributes: [
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('total_amount')), 'total_amount'],
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('paid_amount')), 'total_paid'],
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('balance_amount')), 'total_balance'],
      ],
      raw: true,
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: {
        student,
        invoices,
        summary: {
          total_invoices: totalInvoices,
          paid_invoices: paidInvoices,
          overdue_invoices: overdueInvoices,
          total_amount: parseFloat(amountStats[0]?.total_amount || 0),
          total_paid: parseFloat(amountStats[0]?.total_paid || 0),
          total_balance: parseFloat(amountStats[0]?.total_balance || 0),
          total_late_fees: parseFloat(amountStats[0]?.total_late_fees || 0),
        },
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching student fee ledger:', error);
    return next(error);
  }
};

// Generate receipt for a fee invoice
const generateReceiptForInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the invoice
    const invoice = await FeeInvoice.findByPk(id, {
      include: [
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
          model: Student,
          as: 'student',
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Check if invoice has any payments (allow receipts for partial payments)
    if (invoice.status === 'sent' || parseFloat(invoice.paid_amount || 0) === 0) {
      return res.status(400).json({
        success: false,
        message: 'Receipt can only be generated for invoices with payments',
      });
    }

    // Get school data
    const school = await School.findByPk(req.schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Generate receipt using the existing service
    const receipt = await generateInstallmentReceipt(invoice, invoice.paid_amount, 'cash', null, school, invoice.student);

    // Update invoice with receipt number
    await invoice.update({
      receipt_number: receipt.receipt_number,
    });

    return res.status(200).json({
      success: true,
      message: 'Receipt generated successfully',
      data: {
        receipt: {
          receipt_number: receipt.receipt_number,
          receipt_html: receipt.receipt_html,
        },
      },
    });
  } catch (error) {
    logger.error('Error generating receipt:', error);
    return next(error);
  }
};

// Get receipt for a fee invoice
const getReceiptForInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the invoice
    const invoice = await FeeInvoice.findByPk(id, {
      include: [
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
          model: Student,
          as: 'student',
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    if (!invoice.receipt_number) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found for this invoice',
      });
    }

    // Get school data
    const school = await School.findByPk(req.schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Generate receipt HTML
    const receipt = await generateInstallmentReceipt(invoice, invoice.paid_amount, 'cash', null, school, invoice.student);

    return res.status(200).json({
      success: true,
      data: {
        receipt: {
          receipt_number: receipt.receipt_number,
          receipt_html: receipt.receipt_html,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching receipt:', error);
    return next(error);
  }
};

// Get all payments for an invoice
const getInvoicePayments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const invoice = await FeeInvoice.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    const offset = (page - 1) * limit;

    const { count, rows: payments } = await FeePayment.findAndCountAll({
      where: {
        invoice_id: id,
        school_id: req.schoolId,
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number'],
        },
      ],
      order: [['payment_date', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching invoice payments:', error);
    return next(error);
  }
};

// Get a specific payment by ID
const getPaymentById = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await FeePayment.findOne({
      where: {
        id: paymentId,
        school_id: req.schoolId,
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number'],
        },
        {
          model: FeeInvoice,
          as: 'invoice',
          attributes: ['id', 'invoice_number', 'total_amount', 'fee_type_name', 'class_name', 'section'],
        },
      ],
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    logger.error('Error fetching payment:', error);
    return next(error);
  }
};

// Get receipt for a specific payment
const getPaymentReceipt = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await FeePayment.findOne({
      where: {
        id: paymentId,
        school_id: req.schoolId,
      },
      include: [
        {
          model: Student,
          as: 'student',
        },
        {
          model: FeeInvoice,
          as: 'invoice',
          include: [
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
        },
      ],
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    // If receipt HTML exists, return it
    if (payment.receipt_html) {
      return res.status(200).json({
        success: true,
        data: {
          receipt_number: payment.receipt_number,
          receipt_html: payment.receipt_html,
          payment_data: payment.receipt_data,
        },
      });
    }

    // Regenerate receipt if not stored
    const school = await School.findByPk(req.schoolId);
    const receipt = await generateInstallmentReceipt(
      payment.invoice,
      payment.payment_amount,
      payment.payment_method,
      payment.transaction_id,
      school,
      payment.student
    );

    // Update payment with receipt
    await payment.update({
      receipt_html: receipt.receipt_html,
    });

    return res.status(200).json({
      success: true,
      data: {
        receipt_number: payment.receipt_number,
        receipt_html: receipt.receipt_html,
        payment_data: payment.receipt_data,
      },
    });
  } catch (error) {
    logger.error('Error fetching payment receipt:', error);
    return next(error);
  }
};

// Get all payments for a student
const getStudentPayments = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 50, academic_year } = req.query;

    const student = await Student.findOne({
      where: {
        id: studentId,
        school_id: req.schoolId,
      },
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    const offset = (page - 1) * limit;

    const whereClause = {
      student_id: studentId,
      school_id: req.schoolId,
    };

    const { count, rows: payments } = await FeePayment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: FeeInvoice,
          as: 'invoice',
          where: academic_year ? { academic_year } : {},
          attributes: ['id', 'invoice_number', 'total_amount', 'fee_type_name', 'class_name', 'section', 'academic_year'],
        },
      ],
      order: [['payment_date', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          admission_number: student.admission_number,
        },
        payments,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching student payments:', error);
    return next(error);
  }
};

module.exports = {
  generateInvoices,
  getInvoices,
  getInvoiceById,
  recordPayment,
  updateInvoice,
  cancelInvoice,
  getFeeCollectionSummary,
  getFeeInvoiceReport,
  exportFeeInvoicesReport,
  exportFeeInvoicesReportLegacy,
  getFeeStats,
  applyLateFees,
  getStudentDues,
  getStudentFeeLedger,
  adjustInvoice,
  generateReceipt: generateReceiptForInvoice,
  getReceipt: getReceiptForInvoice,
  getInvoicePayments,
  getPaymentById,
  getPaymentReceipt,
  getStudentPayments,
};
