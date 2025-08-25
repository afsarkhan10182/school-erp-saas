const { FeeInvoice, FeeStructure, FeeType, Student, Parent, School, FeePayment, Branch, Class } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { logger } = require('../../utils/logger');
const { Op } = require('sequelize');
const { validatePaymentSequence, getEarliestPendingMonth } = require('../../utils/academicYearUtils');
const { generateUniqueReceiptNumber, getClassCode } = require('./core');

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
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
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

    // Validate payment sequence for monthly payments
    if (invoice.payment_model === 'monthly') {
      // Get school to determine starting month
      const school = await School.findByPk(req.schoolId);
      const startingMonth = school.starting_month || 6; // Default to June
      
      // Get all student invoices for this fee structure and academic year
      const allStudentInvoices = await FeeInvoice.findAll({
        where: {
          student_id: invoice.student_id,
          fee_structure_id: invoice.fee_structure_id,
          academic_year: invoice.academic_year,
          payment_model: 'monthly',
          school_id: req.schoolId
        },
        order: [['month', 'ASC'], ['year', 'ASC']]
      });
      
      // Validate payment sequence
      const validation = validatePaymentSequence([invoice], allStudentInvoices, startingMonth);
      if (!validation.isValid) {
        throw new ApiError(400, validation.message);
      }
      
      logger.info(`Payment sequence validation passed for invoice ${invoice.invoice_number}`);
    }

    const newPaidAmount = parseFloat(invoice.paid_amount) + parseFloat(paymentAmount);

    if (newPaidAmount > parseFloat(invoice.total_amount)) {
      throw new ApiError(400, 'Payment amount exceeds invoice total');
    }

    // Validate payment amount for monthly payments
    if (invoice.payment_model === 'monthly') {
      const monthlyAmount = parseFloat(invoice.total_amount);
      const paymentAmountFloat = parseFloat(paymentAmount);
      
      // Check if payment is in multiples of monthly amount
      if (paymentAmountFloat % monthlyAmount !== 0) {
        throw new ApiError(400, `Payment amount must be in multiples of the monthly amount (₹${monthlyAmount.toLocaleString()}). You can pay for 1, 2, 3, etc. months at once.`);
      }
      
      // Calculate how many months this payment covers
      const monthsCovered = paymentAmountFloat / monthlyAmount;
      
      // Check if this would exceed the total amount for the year (12 months)
      const totalYearlyAmount = monthlyAmount * 12;
      if (newPaidAmount > totalYearlyAmount) {
        throw new ApiError(400, `Payment would exceed the total yearly amount of ₹${totalYearlyAmount.toLocaleString()}`);
      }
      
      logger.info(`Monthly payment validation passed: ${paymentAmountFloat} covers ${monthsCovered} month(s) at ₹${monthlyAmount} each`);
    }

    // Get school data for receipt generation
    const school = await School.findByPk(req.schoolId);

    // Generate unique receipt number for each payment
    let classCode = 'GEN';
    if (invoice.feeStructure?.class?.code) {
      classCode = invoice.feeStructure.class.code;
      logger.info('Class code from feeStructure.class.code:', {
        feeStructureId: invoice.feeStructure?.id,
        classCode: classCode,
        classData: invoice.feeStructure?.class
      });
    } else if (invoice.feeStructure?.class_name) {
      classCode = getClassCode(invoice.feeStructure);
      logger.info('Class code from feeStructure using getClassCode:', {
        feeStructureId: invoice.feeStructure?.id,
        className: invoice.feeStructure?.class_name,
        classCode: classCode,
        classData: invoice.feeStructure?.class
      });
    } else if (invoice.student.current_class) {
      const cleanName = invoice.student.current_class.replace(/^Class\s+/i, '').trim();
      classCode = cleanName.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      classCode = classCode.length >= 3 ? classCode : `${classCode}${'0'.repeat(3 - classCode.length)}`;
      logger.info('Class code from student current_class:', {
        studentClass: invoice.student.current_class,
        classCode: classCode
      });
    }

    logger.info('Final class code for receipt generation:', classCode);

    // Generate unique receipt number for this payment
    const tempReceipt = await generateUniqueReceiptNumber(classCode, { school_id: req.schoolId });
    const receiptNumber = tempReceipt.receipt_number;

    // Create payment record with the generated receipt number
    const paymentData = {
      payment_number: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      receipt_number: receiptNumber,
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
      notes,
      school_id: req.schoolId,
      branch_id: req.branchId,
      created_by: req.user.id,
    };

    const payment = await FeePayment.create(paymentData);

    // Update invoice with payment FIRST
    const updateData = {
      paid_amount: newPaidAmount,
      balance_amount: parseFloat(invoice.total_amount) - newPaidAmount,
      last_payment_date: payment_date || new Date(),
      updated_by: req.user.id,
    };

    // Update status based on payment model and amount
    if (invoice.payment_model === 'installment') {
      // For installment payments, update status based on payment amount
      if (newPaidAmount >= parseFloat(invoice.total_amount)) {
        updateData.status = 'paid';
        updateData.payment_status = 'paid';
      } else if (newPaidAmount > 0) {
        updateData.status = 'partial_paid';
        updateData.payment_status = 'partial';
      }
    } else {
      // For monthly payments, keep existing logic
      if (newPaidAmount >= parseFloat(invoice.total_amount)) {
        updateData.status = 'paid';
        updateData.payment_status = 'paid';
      } else if (newPaidAmount > 0) {
        updateData.status = 'partial_paid';
        updateData.payment_status = 'partial';
      }
    }

    await invoice.update(updateData);

    // Generate receipt data AFTER invoice update to get correct remaining balance
    const { generateReceiptData } = require('../../services/receipt.service');
    const receiptData = await generateReceiptData(payment.id);
    
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
        receipt: receiptData,
      },
    });
  } catch (error) {
    logger.error('Error recording payment:', error);
    return next(error);
  }
};

// Get invoice payments
const getInvoicePayments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

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

    const { count, rows: payments } = await FeePayment.findAndCountAll({
      where: {
        invoice_id: id,
        school_id: req.schoolId,
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    const totalPages = Math.ceil(count / parseInt(limit));

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

// Get payment by ID
const getPaymentById = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    // Build where clause based on user role
    const whereClause = {
      id: paymentId,
      school_id: req.schoolId,
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      // Branch admin can access payments from their branch OR payments with null branch_id
      whereClause.branch_id = {
        [Op.or]: [req.user.branch_id, null]
      };
    }

    const payment = await FeePayment.findOne({
      where: whereClause,
      include: [
        {
          model: FeeInvoice,
          as: 'invoice',
          include: [
            {
              model: Student,
              as: 'student',
            },
          ],
        },
      ],
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    logger.error('Error fetching payment:', error);
    return next(error);
  }
};

// Get payment receipt
const getPaymentReceipt = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    // Build where clause based on user role
    const whereClause = {
      id: paymentId,
      school_id: req.schoolId,
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      // Branch admin can access payments from their branch OR payments with null branch_id
      whereClause.branch_id = {
        [Op.or]: [req.user.branch_id, null]
      };
    }

    const payment = await FeePayment.findOne({
      where: whereClause,
      include: [
        {
          model: FeeInvoice,
          as: 'invoice',
          include: [
            {
              model: Student,
              as: 'student',
            },
          ],
        },
      ],
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    return res.status(200).json({
      success: true,
      data: {
        receipt_number: payment.receipt_number,
        receipt_data: payment.receipt_data,
      },
    });
  } catch (error) {
    logger.error('Error fetching payment receipt:', error);
    return next(error);
  }
};

// Get student payments
const getStudentPayments = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10, academic_year } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      student_id: studentId,
      school_id: req.schoolId,
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      whereClause['$invoice.branch_id$'] = req.user.branch_id;
    }

    if (academic_year) {
      whereClause['$invoice.academic_year$'] = academic_year;
    }

    const { count, rows: payments } = await FeePayment.findAndCountAll({
      where: whereClause,
      include: [
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
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    const totalPages = Math.ceil(count / parseInt(limit));

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
    logger.error('Error fetching student payments:', error);
    return next(error);
  }
};

// Get collections (all payments for the school)
const getCollections = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, payment_method, status, academic_year } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      school_id: req.schoolId,
    };

    // Handle branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see collections for their assigned branch
      whereClause['$invoice.branch_id$'] = req.user.branch_id;
    }

    // Add search filter
    if (search) {
      whereClause['$student.first_name$'] = { [Op.iLike]: `%${search}%` };
      whereClause['$student.last_name$'] = { [Op.iLike]: `%${search}%` };
      whereClause['$student.admission_number$'] = { [Op.iLike]: `%${search}%` };
    }

    // Add payment method filter
    if (payment_method) {
      whereClause.payment_method = payment_method;
    }

    // Add status filter
    if (status) {
      whereClause.payment_status = status;
    }

    // Add academic year filter
    if (academic_year) {
      whereClause['$invoice.academic_year$'] = academic_year;
    }

    const { count, rows: payments } = await FeePayment.findAndCountAll({
      where: whereClause,
      include: [
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
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number', 'photo'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    // Transform the data to match the frontend expectations
    const collections = payments.map(payment => ({
      id: payment.id,
      receipt_number: payment.receipt_number,
      student: {
        id: payment.student?.id,
        first_name: payment.student?.first_name,
        last_name: payment.student?.last_name,
        admission_number: payment.student?.admission_number,
        photo: payment.student?.photo,
      },
      amount: parseFloat(payment.payment_amount),
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      status: payment.payment_status || 'completed',
      transaction_id: payment.transaction_id,
      created_at: payment.created_at,
    }));

    const totalPages = Math.ceil(count / parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        collections,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching collections:', error);
    return next(error);
  }
};

module.exports = {
  calculateLateFees,
  applyLateFees,
  recordPayment,
  getInvoicePayments,
  getPaymentById,
  getPaymentReceipt,
  getStudentPayments,
  getCollections,
}; 