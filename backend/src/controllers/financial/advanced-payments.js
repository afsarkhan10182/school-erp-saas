const {
  FeeInvoice,
  FeeStructure,
  FeeType,
  Student,
  Parent,
  School,
  FeePayment,
  Branch,
  Class,
  sequelize
} = require('~/models');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');
const { generateUniqueReceiptNumber, getClassCode } = require('./core.controller');
const { getPaymentIdempotency, replayPayment } = require('~/utils/financial/paymentIdempotency');

// Helper function to get student full name
const getStudentFullName = student => {
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

// Get payment breakdown for an invoice
const getBreakdown = async (req, res, next) => {
  try {
    const { id } = req.params;

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
        },
        {
          model: FeePayment,
          as: 'payments',
          order: [['created_at', 'ASC']]
        }
      ]
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    // Calculate breakdown
    const totalAmount = parseFloat(invoice.total_amount || 0);
    const paidAmount = parseFloat(invoice.paid_amount || 0);
    const balanceAmount = parseFloat(invoice.balance_amount || 0);
    const lateFeeAmount = parseFloat(invoice.late_fee_amount || 0);

    const breakdown = {
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        fee_type: invoice.feeStructure?.feeType?.name || 'Unknown',
        class_name: invoice.class_name,
        section: invoice.section,
        academic_year: invoice.academic_year,
        due_date: invoice.due_date,
        status: invoice.status
      },
      student: {
        id: invoice.student.id,
        name: getStudentFullName(invoice.student),
        admission_number: invoice.student.admission_number,
        class: invoice.student.current_class,
        section: invoice.student.section
      },
      amounts: {
        base_amount: totalAmount - lateFeeAmount,
        late_fee_amount: lateFeeAmount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        collection_percentage: totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(2) : 0
      },
      payments: invoice.payments.map(payment => ({
        id: payment.id,
        payment_number: payment.payment_number,
        receipt_number: payment.receipt_number,
        payment_amount: parseFloat(payment.payment_amount || 0),
        payment_method: payment.payment_method,
        payment_date: payment.payment_date,
        transaction_id: payment.transaction_id,
        created_at: payment.created_at
      })),
      summary: {
        total_payments: invoice.payments.length,
        payment_methods: [...new Set(invoice.payments.map(p => p.payment_method))],
        first_payment_date: invoice.payments.length > 0 ? invoice.payments[0].payment_date : null,
        last_payment_date:
          invoice.payments.length > 0
            ? invoice.payments[invoice.payments.length - 1].payment_date
            : null
      }
    };

    return res.status(200).json({ success: true, data: breakdown });
  } catch (error) {
    logger.error('Error fetching payment breakdown:', error);
    return next(error);
  }
};

// Record flexible installment payment
const recordFlexibleInstallmentPayment = async (req, res, next) => {
  let transaction;
  try {
    const id = req.params.id || req.body.invoice_id;
    const {
      payment_amount,
      payment_method = 'cash',
      payment_date,
      transaction_id,
      installment_number,
      notes
    } = req.body;
    const idempotency = getPaymentIdempotency(req);

    if (!payment_amount || payment_amount <= 0) {
      throw new ApiError(400, 'Valid payment amount is required');
    }

    transaction = await sequelize.transaction();
    const where = { id, school_id: req.schoolId };
    if (req.user.role === 'branch_admin') where.branch_id = req.user.branch_id;

    const invoice = await FeeInvoice.findOne({
      where,
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
      ],
      transaction,
      lock: { level: transaction.LOCK.UPDATE, of: FeeInvoice }
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

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

    const newPaidAmount = parseFloat(invoice.paid_amount || 0) + parseFloat(payment_amount);
    const totalAmount = parseFloat(invoice.total_amount || 0);

    if (newPaidAmount > totalAmount) {
      throw new ApiError(400, 'Payment amount exceeds invoice total');
    }

    // Get school data for receipt generation
    const school = await School.findByPk(req.schoolId, { transaction });

    // Generate unique receipt number for this payment
    // Use the same class code logic as invoice generation to ensure consistency
    const classCode = await getClassCode(invoice.feeStructure, invoice.student);

    // Get branch_id from invoice if not provided in request
    const branchId = req.branchId || invoice.branch_id;

    if (!branchId) {
      logger.error('No branch_id available for advanced payment receipt generation', {
        reqBranchId: req.branchId,
        invoiceBranchId: invoice.branch_id,
        invoiceId: invoice.id,
        schoolId: req.schoolId
      });
      throw new ApiError(400, 'Branch ID is required for advanced payment receipt generation');
    }

    // Get current academic year (no fallbacks - must be set by super admin)
    const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');
    const currentAcademicYear = await getCurrentAcademicYearForSchool();

    if (!currentAcademicYear) {
      throw new ApiError(400, 'No current academic year is set. Please contact the administrator.');
    }

    const academicYear = currentAcademicYear.name;

    // Generate unique receipt number for this payment
    const tempReceipt = await generateUniqueReceiptNumber(classCode, {
      school_id: req.schoolId,
      branch_id: branchId,
      academic_year: academicYear,
      transaction
    });
    const receiptNumber = tempReceipt.receipt_number;

    // Create payment record
    const paymentData = {
      payment_number: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      receipt_number: receiptNumber,
      invoice_id: invoice.id,
      student_id: invoice.student_id,
      payment_amount: parseFloat(payment_amount),
      payment_method,
      payment_date: payment_date || new Date(),
      transaction_id,
      ...(idempotency && {
        idempotency_key: idempotency.key,
        idempotency_request_hash: idempotency.fingerprint
      }),
      payment_status: 'completed',
      receipt_data: {
        receipt_number: receiptNumber,
        invoice_number: invoice.invoice_number,
        student_name: getStudentFullName(invoice.student),
        payment_amount: payment_amount,
        payment_method,
        transaction_id,
        payment_date: payment_date || new Date(),
        remaining_balance: Math.max(0, totalAmount - newPaidAmount),
        school_name: school.name,
        fee_type: invoice.feeStructure?.feeType?.name || 'Unknown',
        class_name: invoice.student?.current_class || invoice.class_name,
        section: invoice.student?.section || invoice.section,
        installment_number: installment_number || 'Flexible'
      },
      notes: notes || `Flexible installment payment - ${installment_number || 'Custom'}`,
      school_id: req.schoolId,
      branch_id: branchId,
      academic_year: academicYear,
      created_by: req.user.id
    };

    const payment = await FeePayment.create(paymentData, { transaction });

    // Update invoice
    const newStatus = newPaidAmount >= totalAmount ? 'paid' : 'partial_paid';
    await invoice.update({
      paid_amount: newPaidAmount,
      balance_amount: Math.max(0, totalAmount - newPaidAmount),
      last_payment_date: payment_date || new Date(),
      status: newStatus,
      updated_by: req.user.id
    }, { transaction });

    const responseData = {
      payment_id: payment.id,
      payment_number: payment.payment_number,
      receipt_number: payment.receipt_number,
      invoice_id: invoice.id,
      payment_amount: parseFloat(payment_amount),
      new_paid_amount: newPaidAmount,
      remaining_balance: Math.max(0, totalAmount - newPaidAmount),
      status: newStatus,
      installment_number: installment_number || 'Flexible',
      receipt: { receipt_number: payment.receipt_number }
    };
    if (idempotency) await payment.update({ idempotency_response: responseData }, { transaction });
    await transaction.commit();

    logger.info(
      `Flexible installment payment recorded: ${payment_amount} for invoice ${invoice.invoice_number} (Payment: ${payment.payment_number})`
    );

    return res.status(200).json({
      success: true,
      message: 'Flexible installment payment recorded successfully',
      data: responseData
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        logger.error('Error rolling back flexible installment payment:', rollbackError);
      }
    }
    logger.error('Error recording flexible installment payment:', error);
    return next(error);
  }
};

module.exports = {
  getBreakdown,
  recordFlexibleInstallmentPayment
};
