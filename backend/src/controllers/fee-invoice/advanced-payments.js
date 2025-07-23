const { FeeInvoice, FeeStructure, FeeType, Student, Parent, School, FeePayment, Branch } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { logger } = require('../../utils/logger');
const { Op } = require('sequelize');
const { generateInstallmentReceipt } = require('../../services/receipt.service');

// Get payment breakdown for an invoice
const getBreakdown = async (req, res, next) => {
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
          model: FeePayment,
          as: 'payments',
          order: [['created_at', 'ASC']],
        },
      ],
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
        status: invoice.status,
      },
      student: {
        id: invoice.student.id,
        name: `${invoice.student.first_name} ${invoice.student.last_name}`,
        admission_number: invoice.student.admission_number,
        class: invoice.student.current_class,
        section: invoice.student.section,
      },
      amounts: {
        base_amount: totalAmount - lateFeeAmount,
        late_fee_amount: lateFeeAmount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        collection_percentage: totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(2) : 0,
      },
      payments: invoice.payments.map(payment => ({
        id: payment.id,
        payment_number: payment.payment_number,
        receipt_number: payment.receipt_number,
        payment_amount: parseFloat(payment.payment_amount || 0),
        payment_method: payment.payment_method,
        payment_date: payment.payment_date,
        transaction_id: payment.transaction_id,
        created_at: payment.created_at,
      })),
      summary: {
        total_payments: invoice.payments.length,
        payment_methods: [...new Set(invoice.payments.map(p => p.payment_method))],
        first_payment_date: invoice.payments.length > 0 ? invoice.payments[0].payment_date : null,
        last_payment_date: invoice.payments.length > 0 ? invoice.payments[invoice.payments.length - 1].payment_date : null,
      },
    };

    return res.status(200).json({ success: true, data: breakdown });
  } catch (error) {
    logger.error('Error fetching payment breakdown:', error);
    return next(error);
  }
};

// Record flexible installment payment
const recordFlexibleInstallmentPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      payment_amount,
      payment_method = 'cash',
      payment_date,
      transaction_id,
      installment_number,
      notes,
    } = req.body;

    if (!payment_amount || payment_amount <= 0) {
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

    const newPaidAmount = parseFloat(invoice.paid_amount || 0) + parseFloat(payment_amount);
    const totalAmount = parseFloat(invoice.total_amount || 0);

    if (newPaidAmount > totalAmount) {
      throw new ApiError(400, 'Payment amount exceeds invoice total');
    }

    // Get school data for receipt generation
    const school = await School.findByPk(req.schoolId);

    // Generate receipt for this payment
    const receipt = await generateInstallmentReceipt(
      invoice,
      payment_amount,
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
      payment_amount: parseFloat(payment_amount),
      payment_method,
      payment_date: payment_date || new Date(),
      transaction_id,
      payment_status: 'completed',
      receipt_html: receipt.receipt_html,
      receipt_data: {
        receipt_number: receipt.receipt_number,
        invoice_number: invoice.invoice_number,
        student_name: `${invoice.student.first_name} ${invoice.student.last_name}`,
        payment_amount: payment_amount,
        payment_method,
        transaction_id,
        payment_date: payment_date || new Date(),
        remaining_balance: Math.max(0, totalAmount - newPaidAmount),
        school_name: school.name,
        fee_type: invoice.feeStructure?.feeType?.name || 'Unknown',
        class_name: invoice.class_name,
        section: invoice.section,
        installment_number: installment_number || 'Flexible',
      },
      notes: notes || `Flexible installment payment - ${installment_number || 'Custom'}`,
      school_id: req.schoolId,
      branch_id: req.branchId,
      created_by: req.user.id,
    };

    const payment = await FeePayment.create(paymentData);

    // Update invoice
    const newStatus = newPaidAmount >= totalAmount ? 'paid' : 'partial_paid';
    await invoice.update({
      paid_amount: newPaidAmount,
      balance_amount: Math.max(0, totalAmount - newPaidAmount),
      last_payment_date: payment_date || new Date(),
      status: newStatus,
      updated_by: req.user.id,
    });

    logger.info(`Flexible installment payment recorded: ${payment_amount} for invoice ${invoice.invoice_number} (Payment: ${payment.payment_number})`);

    return res.status(200).json({
      success: true,
      message: 'Flexible installment payment recorded successfully',
      data: {
        payment_id: payment.id,
        payment_number: payment.payment_number,
        receipt_number: payment.receipt_number,
        invoice_id: invoice.id,
        payment_amount: parseFloat(payment_amount),
        new_paid_amount: newPaidAmount,
        remaining_balance: Math.max(0, totalAmount - newPaidAmount),
        status: newStatus,
        installment_number: installment_number || 'Flexible',
        receipt: {
          receipt_number: payment.receipt_number,
          receipt_html: payment.receipt_html,
        },
      },
    });
  } catch (error) {
    logger.error('Error recording flexible installment payment:', error);
    return next(error);
  }
};

module.exports = {
  getBreakdown,
  recordFlexibleInstallmentPayment,
}; 