const { FeeInvoice, FeeStructure, FeeType, Student, Parent } = require('../models');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

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
      current_class: class_name,
      status: 'active',
    };

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

          // Apply tax if applicable
          if (feeStructure.feeType.tax_applicable) {
            const taxableAmount = baseAmount - discountAmount;
            taxAmount = (taxableAmount * parseFloat(feeStructure.feeType.tax_percentage)) / 100;
          }

          const totalAmount = baseAmount - discountAmount + taxAmount;

          // Calculate due date
          let calculatedDueDate = due_date;
          if (!calculatedDueDate) {
            const today = new Date();
            calculatedDueDate = new Date(today);
            calculatedDueDate.setDate(today.getDate() + feeStructure.feeType.due_date_days);
          }

          // Create invoice
          const invoice = await FeeInvoice.create({
            student_id: student.id,
            fee_structure_id: feeStructure.id,
            academic_year,
            due_date: calculatedDueDate,
            amount: baseAmount,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            balance_amount: totalAmount,
            status: 'sent',
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
          });

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
      page = 1,
      limit = 50,
    } = req.query;

    const whereClause = {
      school_id: req.schoolId,
    };

    if (academic_year) whereClause.academic_year = academic_year;
    if (status) whereClause.status = status;
    if (student_id) whereClause.student_id = student_id;

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
    if (class_name) includeClause[0].where.current_class = class_name;
    if (section) includeClause[0].where.section = section;

    const offset = (page - 1) * limit;

    const { count, rows: invoices } = await FeeInvoice.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
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

// Record payment for an invoice
const recordPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      payment_amount,
      payment_method = 'cash',
      payment_date,
      transaction_id,
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

    const newPaidAmount = parseFloat(invoice.paid_amount) + parseFloat(payment_amount);

    if (newPaidAmount > parseFloat(invoice.total_amount)) {
      throw new ApiError(400, 'Payment amount exceeds invoice total');
    }

    // Update invoice with payment
    await invoice.update({
      paid_amount: newPaidAmount,
      balance_amount: parseFloat(invoice.total_amount) - newPaidAmount,
      last_payment_date: payment_date || new Date(),
      updated_by: req.user.id,
    });

    // TODO: Create payment record in separate payments table (future enhancement)
    
    logger.info(`Payment recorded: ${payment_amount} for invoice ${invoice.invoice_number}`);

    return res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        invoice_id: invoice.id,
        payment_amount: parseFloat(payment_amount),
        new_paid_amount: newPaidAmount,
        remaining_balance: parseFloat(invoice.total_amount) - newPaidAmount,
        status: invoice.status,
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

module.exports = {
  generateInvoices,
  getInvoices,
  getInvoiceById,
  recordPayment,
  updateInvoice,
  cancelInvoice,
  getFeeCollectionSummary,
};
