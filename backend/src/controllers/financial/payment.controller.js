const {
  FeeInvoice,
  FeeStructure,
  FeeType,
  Student,
  Parent,
  School,
  FeePayment,
  Branch,
  Class
} = require('~/models');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');
const { sequelize } = require('~/config/database');
const { Op } = require('sequelize');
const {
  validatePaymentSequence,
  getEarliestPendingMonth
} = require('~/utils/academic/academicYearUtils');
const { generateUniqueReceiptNumber, getClassCode } = require('./core.controller');
const { getPaymentIdempotency, replayPayment } = require('~/utils/financial/paymentIdempotency');

// Calculate late fees based on due date
const calculateLateFees = async invoice => {
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
  let transaction;
  try {
    const { id } = req.params;
    const where = {
      id,
      school_id: req.schoolId,
      status: { [Op.in]: ['sent', 'partial_paid', 'overdue'] }
    };
    if (req.user.role === 'branch_admin') {
      if (!req.user.branch_id) throw new ApiError(403, 'Branch access is not configured for this account');
      where.branch_id = req.user.branch_id;
    }

    transaction = await sequelize.transaction();
    const invoice = await FeeInvoice.findOne({
      where,
      transaction,
      lock: { level: transaction.LOCK.UPDATE, of: FeeInvoice }
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
      }, { transaction });
      await transaction.commit();

      logger.info(`Late fee applied: ${lateFeeAmount} to invoice ${invoice.invoice_number}`);

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
    if (transaction && !transaction.finished) await transaction.rollback();
    logger.error('Error applying late fees:', error);
    return next(error);
  }
};

// Record payment for an invoice
const recordPayment = async (req, res, next) => {
  let transaction;
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
      notes
    } = req.body;

    // Support both 'amount' and 'payment_amount' for backward compatibility
    const paymentAmount = amount || payment_amount;
    const idempotency = getPaymentIdempotency(req);

    if (!paymentAmount || paymentAmount <= 0) {
      throw new ApiError(400, 'Valid payment amount is required');
    }
    transaction = await sequelize.transaction();

    // Build where clause based on user role
    const whereClause = {
      id,
      school_id: req.schoolId
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      whereClause.branch_id = req.user.branch_id;
    }

    const invoice = await FeeInvoice.findOne({
      where: whereClause,
      transaction,
      lock: { level: transaction.LOCK.UPDATE, of: FeeInvoice }
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    await invoice.reload({
      transaction,
      include: [
        {
          model: Student,
          as: 'student'
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          include: [
            {
              model: FeeType,
              as: 'feeType'
            },
            {
              model: Class,
              as: 'class',
              attributes: ['id', 'name', 'code']
            }
          ]
        }
      ]
    });

    if (idempotency) {
      const existingPayment = await FeePayment.findOne({
        where: { school_id: req.schoolId, invoice_id: invoice.id, idempotency_key: idempotency.key },
        transaction
      });
      const replay = await replayPayment(existingPayment, idempotency, transaction, res);
      if (replay) return replay;
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
      const school = await School.findByPk(req.schoolId, { transaction });
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
        order: [
          ['month', 'ASC'],
          ['year', 'ASC']
        ],
        transaction
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
        throw new ApiError(
          400,
          `Payment amount must be in multiples of the monthly amount (₹${monthlyAmount.toLocaleString()}). You can pay for 1, 2, 3, etc. months at once.`
        );
      }

      // Calculate how many months this payment covers
      const monthsCovered = paymentAmountFloat / monthlyAmount;

      // Check if this would exceed the total amount for the year (12 months)
      const totalYearlyAmount = monthlyAmount * 12;
      if (newPaidAmount > totalYearlyAmount) {
        throw new ApiError(
          400,
          `Payment would exceed the total yearly amount of ₹${totalYearlyAmount.toLocaleString()}`
        );
      }

      logger.info(
        `Monthly payment validation passed: ${paymentAmountFloat} covers ${monthsCovered} month(s) at ₹${monthlyAmount} each`
      );
    }

    // Get school data for receipt generation
    const school = await School.findByPk(req.schoolId, { transaction });

    // Generate unique receipt number for each payment
    // Use the same class code logic as invoice generation to ensure consistency
    const classCode = await getClassCode(invoice.feeStructure, invoice.student);

    logger.info('Class code for receipt generation (using same logic as invoice):', {
      feeStructureId: invoice.feeStructure?.id,
      classCode: classCode,
      studentClass: invoice.student?.current_class,
      feeStructureClass: invoice.feeStructure?.class_name
    });

    // Get branch_id from invoice if not provided in request
    const branchId = req.branchId || invoice.branch_id;

    if (!branchId) {
      logger.error('No branch_id available for receipt generation', {
        reqBranchId: req.branchId,
        invoiceBranchId: invoice.branch_id,
        invoiceId: invoice.id,
        schoolId: req.schoolId
      });
      throw new ApiError(400, 'Branch ID is required for receipt generation');
    }

    const academicYear = invoice.academic_year;
    if (!academicYear) throw new ApiError(400, 'Invoice academic year is required for receipt generation');

    // Generate unique receipt number for this payment
    const tempReceipt = await generateUniqueReceiptNumber(classCode, {
      school_id: req.schoolId,
      branch_id: branchId,
      academic_year: academicYear,
      transaction
    });
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
      ...(idempotency && {
        idempotency_key: idempotency.key,
        idempotency_request_hash: idempotency.fingerprint
      }),
      cheque_number,
      bank_name,
      reference_number,
      payment_status: 'completed',
      notes,
      school_id: req.schoolId,
      branch_id: branchId,
      academic_year: academicYear,
      created_by: req.user.id
    };

    const payment = await FeePayment.create(paymentData, { transaction });

    // Update invoice with payment FIRST
    const updateData = {
      paid_amount: newPaidAmount,
      balance_amount: parseFloat(invoice.total_amount) - newPaidAmount,
      last_payment_date: payment_date || new Date(),
      updated_by: req.user.id
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

    await invoice.update(updateData, { transaction });

    // Generate receipt data AFTER invoice update to get correct remaining balance
    const { generateReceiptData } = require('~/services/financial/receipt.service');
    const receiptData = await generateReceiptData(payment.id, { transaction });
    const responseData = {
      payment_id: payment.id,
      payment_number: payment.payment_number,
      receipt_number: payment.receipt_number,
      invoice_id: invoice.id,
      payment_amount: parseFloat(paymentAmount),
      new_paid_amount: newPaidAmount,
      remaining_balance: Math.max(0, parseFloat(invoice.total_amount) - newPaidAmount),
      status: invoice.status,
      receipt: receiptData
    };
    if (idempotency) {
      await payment.update({ idempotency_response: responseData }, { transaction });
    }
    await transaction.commit();

    logger.info(
      `Payment recorded: ${paymentAmount} for invoice ${invoice.invoice_number} (Payment: ${payment.payment_number})`
    );

    return res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: responseData
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        logger.error('Error rolling back payment transaction:', rollbackError);
      }
    }
    logger.error('Error recording payment:', error);
    return next(error);
  }
};

const reversePayment = async (req, res, next) => {
  let transaction;
  try {
    if (!['super_admin', 'admin'].includes(req.user.role)) {
      throw new ApiError(403, 'Only a school administrator can reverse a payment');
    }

    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason) throw new ApiError(400, 'A reason is required to reverse a payment');
    if (reason.length > 500) throw new ApiError(400, 'Reversal reason must be 500 characters or fewer');

    transaction = await sequelize.transaction();
    const payment = await FeePayment.findOne({
      where: { id: req.params.paymentId, school_id: req.schoolId },
      transaction,
      lock: { level: transaction.LOCK.UPDATE, of: FeePayment }
    });
    if (!payment) throw new ApiError(404, 'Payment not found');
    if (payment.payment_status !== 'completed') {
      throw new ApiError(409, 'Only completed payments can be reversed');
    }
    if (!payment.invoice_id) throw new ApiError(409, 'This payment is not linked to an invoice');

    const invoice = await FeeInvoice.findOne({
      where: { id: payment.invoice_id, school_id: req.schoolId },
      transaction,
      lock: { level: transaction.LOCK.UPDATE, of: FeeInvoice }
    });
    if (!invoice) throw new ApiError(404, 'Payment invoice not found');

    const paidBefore = Number(invoice.paid_amount || 0);
    const paymentAmount = Number(payment.payment_amount);
    if (paymentAmount > paidBefore + 0.001) {
      throw new ApiError(409, 'Invoice balance does not match this payment; reversal was not applied');
    }

    const paidAfter = Math.max(0, Math.round((paidBefore - paymentAmount) * 100) / 100);
    const total = Number(invoice.total_amount || 0);
    const balanceAfter = Math.max(0, Math.round((total - paidAfter) * 100) / 100);
    const lastPayment = await FeePayment.findOne({
      where: {
        invoice_id: invoice.id,
        school_id: req.schoolId,
        payment_status: 'completed',
        id: { [Op.ne]: payment.id }
      },
      attributes: ['payment_date', 'payment_method', 'transaction_id', 'receipt_number'],
      order: [['payment_date', 'DESC'], ['created_at', 'DESC']],
      transaction
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = invoice.due_date ? new Date(`${invoice.due_date}T00:00:00`) : null;
    const overdue = dueDate && dueDate < today;
    const nextInvoiceStatus = invoice.status === 'cancelled'
      ? 'cancelled'
      : paidAfter > 0
        ? 'partial_paid'
        : overdue
          ? 'overdue'
          : 'sent';

    await payment.update({
      payment_status: 'reversed',
      reversed_at: new Date(),
      reversal_reason: reason,
      reversed_by: req.user.id,
      updated_by: req.user.id
    }, { transaction });
    await invoice.update({
      paid_amount: paidAfter,
      balance_amount: balanceAfter,
      status: nextInvoiceStatus,
      payment_status: paidAfter > 0 ? 'partial' : overdue ? 'overdue' : 'pending',
      last_payment_date: lastPayment?.payment_date || null,
      payment_method: lastPayment?.payment_method || null,
      transaction_id: lastPayment?.transaction_id || null,
      receipt_number: lastPayment?.receipt_number || (invoice.receipt_number === payment.receipt_number ? null : invoice.receipt_number),
      updated_by: req.user.id
    }, { transaction });

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: 'Payment reversed; its original receipt remains in the audit history',
      data: {
        payment_id: payment.id,
        payment_status: 'reversed',
        reversed_at: payment.reversed_at,
        reversal_reason: reason,
        invoice_id: invoice.id,
        paid_amount: paidAfter,
        balance_amount: balanceAfter,
        invoice_status: nextInvoiceStatus
      }
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        logger.error('Error rolling back payment reversal:', rollbackError);
      }
    }
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
      school_id: req.schoolId
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      whereClause.branch_id = req.user.branch_id;
    }

    const invoice = await FeeInvoice.findOne({
      where: whereClause
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    const { count, rows: payments } = await FeePayment.findAndCountAll({
      where: {
        invoice_id: id,
        school_id: req.schoolId
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
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
          limit: parseInt(limit)
        }
      }
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
      school_id: req.schoolId
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
              as: 'student'
            }
          ]
        }
      ]
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
      school_id: req.schoolId
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
              as: 'student'
            }
          ]
        }
      ]
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    return res.status(200).json({
      success: true,
      data: {
        receipt_number: payment.receipt_number,
        receipt_data: payment.receipt_data,
        payment_status: payment.payment_status,
        reversal_reason: payment.reversal_reason,
        reversed_at: payment.reversed_at
      }
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
      school_id: req.schoolId
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
                  as: 'feeType'
                }
              ]
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
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
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching student payments:', error);
    return next(error);
  }
};

// Get collections (all payments for the school)
const getCollections = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, payment_method, status, academic_year, branch_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      school_id: req.schoolId
    };

    // Handle branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see collections for their assigned branch
      whereClause['$invoice.branch_id$'] = req.user.branch_id;
    } else if (branch_id) {
      whereClause['$invoice.branch_id$'] = branch_id;
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
                  as: 'feeType'
                }
              ]
            }
          ]
        },
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number', 'photo']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
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
        photo: payment.student?.photo
      },
      amount: parseFloat(payment.payment_amount),
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      status: payment.payment_status || 'completed',
      transaction_id: payment.transaction_id,
      created_at: payment.created_at
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
          limit: parseInt(limit)
        }
      }
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
  reversePayment,
  getInvoicePayments,
  getPaymentById,
  getPaymentReceipt,
  getStudentPayments,
  getCollections
};
