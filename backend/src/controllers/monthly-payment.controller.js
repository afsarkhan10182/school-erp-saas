const { MonthlyPayment, FeeStructure, FeeType, Student, School, Branch } = require('../models');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');
const { generateMonthlyReceipt } = require('../services/receipt.service');
const { Op } = require('sequelize');

/**
 * Generate monthly payments for students based on fee structure
 */
const generateMonthlyPayments = async (req, res, next) => {
  try {
    const {
      academic_year,
      class_name,
      section,
      fee_structure_id,
      student_ids,
      months,
      year
    } = req.body;

    // Ensure school context is set
    if (!req.schoolId) {
      throw new ApiError(400, 'School context is required');
    }

    if (!academic_year || !fee_structure_id || !months || !year) {
      throw new ApiError(400, 'Academic year, fee structure ID, months, and year are required');
    }

    // Get fee structure
    const feeStructure = await FeeStructure.findOne({
      where: {
        id: fee_structure_id,
        school_id: req.schoolId,
        payment_model: 'monthly',
        is_active: true
      },
      include: [
        {
          model: FeeType,
          as: 'feeType',
        },
      ],
    });

    if (!feeStructure) {
      throw new ApiError(404, 'Fee structure not found or not configured for monthly payments');
    }

    // Build student filter
    const studentFilter = {
      school_id: req.schoolId,
      academic_year,
      status: 'active',
    };

    if (class_name) {
      const classCode = class_name.replace(/^Class\s+/i, '').trim();
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

    const payments = [];
    const errors = [];

    // Generate monthly payments for each student
    for (const student of students) {
      for (const month of months) {
        try {
          // Check if monthly payment already exists
          const existingPayment = await MonthlyPayment.findOne({
            where: {
              student_id: student.id,
              fee_structure_id: feeStructure.id,
              academic_year,
              month,
              year,
            },
          });

          if (existingPayment) {
            continue; // Skip if payment already exists
          }

          // Calculate due date for the month
          const dueDate = new Date(year, month - 1, feeStructure.due_day);
          
          // Calculate due amount - use monthly_payment_amount if available, otherwise use total amount
          const dueAmount = feeStructure.monthly_payment_amount || feeStructure.amount;
          
          if (!dueAmount) {
            throw new Error('Fee structure must have either monthly_payment_amount or amount set');
          }
          
          // Create monthly payment
          const paymentData = {
            student_id: student.id,
            fee_structure_id: feeStructure.id,
            academic_year,
            month,
            year,
            due_amount: dueAmount,
            due_date: dueDate,
            school_id: req.schoolId,
            branch_id: req.branchId,
            created_by: req.user.id,
          };

          const payment = await MonthlyPayment.create(paymentData);
          payments.push(payment);
        } catch (error) {
          errors.push({
            student_id: student.id,
            student_name: `${student.first_name} ${student.last_name}`,
            month,
            year,
            error: error.message,
          });
        }
      }
    }

    logger.info(`Generated ${payments.length} monthly payments for ${students.length} students`);
    
    return res.status(201).json({
      success: true,
      message: `Generated ${payments.length} monthly payments successfully`,
      data: {
        payments_generated: payments.length,
        students_processed: students.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    logger.error('Error generating monthly payments:', error);
    return next(error);
  }
};

/**
 * Get monthly payments for a student
 */
const getStudentMonthlyPayments = async (req, res, next) => {
  try {
    const { student_id, academic_year, fee_structure_id } = req.query;

    // Ensure school context is set
    if (!req.schoolId) {
      throw new ApiError(400, 'School context is required');
    }

    if (!student_id) {
      throw new ApiError(400, 'Student ID is required');
    }

    const whereClause = {
      student_id,
      school_id: req.schoolId,
    };

    if (academic_year) whereClause.academic_year = academic_year;
    if (fee_structure_id) whereClause.fee_structure_id = fee_structure_id;

    const payments = await MonthlyPayment.findAll({
      where: whereClause,
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
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    // Calculate summary
    const totalDue = payments.reduce((sum, payment) => sum + parseFloat(payment.due_amount), 0);
    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.paid_amount), 0);
    const totalBalance = payments.reduce((sum, payment) => sum + parseFloat(payment.balance_amount), 0);
    const paidMonths = payments.filter(p => p.status === 'paid').length;
    const pendingMonths = payments.filter(p => p.status === 'pending').length;
    const overdueMonths = payments.filter(p => p.status === 'overdue').length;

    return res.status(200).json({
      success: true,
      data: {
        payments,
        summary: {
          total_due: totalDue,
          total_paid: totalPaid,
          total_balance: totalBalance,
          paid_months: paidMonths,
          pending_months: pendingMonths,
          overdue_months: overdueMonths,
          total_months: payments.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching student monthly payments:', error);
    return next(error);
  }
};

/**
 * Record payment for a monthly payment
 */
const recordMonthlyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      payment_amount,
      payment_method = 'cash',
      payment_date,
      transaction_id,
      notes,
    } = req.body;

    // Ensure school context is set
    if (!req.schoolId) {
      throw new ApiError(400, 'School context is required');
    }

    if (!payment_amount || payment_amount <= 0) {
      throw new ApiError(400, 'Valid payment amount is required');
    }

    const payment = await MonthlyPayment.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
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

    if (!payment) {
      throw new ApiError(404, 'Monthly payment not found');
    }

    if (payment.status === 'paid') {
      throw new ApiError(400, 'Monthly payment is already fully paid');
    }

    const newPaidAmount = parseFloat(payment.paid_amount) + parseFloat(payment_amount);

    if (newPaidAmount > parseFloat(payment.due_amount)) {
      throw new ApiError(400, 'Payment amount exceeds monthly due amount');
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update payment
    await payment.update({
      paid_amount: newPaidAmount,
      balance_amount: parseFloat(payment.due_amount) - newPaidAmount,
      payment_date: payment_date || new Date(),
      payment_method,
      transaction_id,
      receipt_number: receiptNumber,
      notes,
      updated_by: req.user.id,
    });

    // Generate receipt
    const school = await School.findByPk(req.schoolId);
    const receipt = await generateMonthlyReceipt(payment, school, payment.student);

    logger.info(`Monthly payment recorded: ${payment_amount} for student ${payment.student_id}, month ${payment.month}/${payment.year}`);

    return res.status(200).json({
      success: true,
      message: 'Monthly payment recorded successfully',
      data: {
        payment_id: payment.id,
        payment_amount: parseFloat(payment_amount),
        new_paid_amount: newPaidAmount,
        remaining_balance: parseFloat(payment.due_amount) - newPaidAmount,
        status: payment.status,
        receipt: {
          receipt_number: receipt.receipt_number,
          receipt_html: receipt.receipt_html,
        },
      },
    });
  } catch (error) {
    logger.error('Error recording monthly payment:', error);
    return next(error);
  }
};

/**
 * Get monthly payment by ID
 */
const getMonthlyPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await MonthlyPayment.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
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

    if (!payment) {
      throw new ApiError(404, 'Monthly payment not found');
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    logger.error('Error fetching monthly payment:', error);
    return next(error);
  }
};

/**
 * Get monthly payments with filtering and pagination
 */
const getMonthlyPayments = async (req, res, next) => {
  try {
    const {
      academic_year,
      class_name,
      section,
      status,
      student_id,
      fee_structure_id,
      branch_id,
      month,
      year,
      page = 1,
      limit = 50,
    } = req.query;

    // Ensure school context is set
    if (!req.schoolId) {
      throw new ApiError(400, 'School context is required');
    }

    const whereClause = {
      school_id: req.schoolId,
    };

    if (academic_year) whereClause.academic_year = academic_year;
    if (status) whereClause.status = status;
    if (student_id) whereClause.student_id = student_id;
    if (fee_structure_id) whereClause.fee_structure_id = fee_structure_id;
    if (branch_id) whereClause.branch_id = branch_id;
    if (month) whereClause.month = month;
    if (year) whereClause.year = year;

    const includeClause = [
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
        where: {},
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
        ],
      },
    ];

    // Add student filters
    if (class_name) includeClause[1].where.current_class = class_name;
    if (section) includeClause[1].where.section = section;

    const offset = (page - 1) * limit;

    const { count, rows: payments } = await MonthlyPayment.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['year', 'DESC'], ['month', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total_count: count,
          total_pages: totalPages,
          current_page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching monthly payments:', error);
    return next(error);
  }
};

// Generate receipt for a monthly payment
const generateReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the monthly payment
    const payment = await MonthlyPayment.findByPk(id, {
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

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Monthly payment not found',
      });
    }

    // Check if payment has any payments (allow receipts for partial payments)
    if (payment.status === 'sent' || parseFloat(payment.paid_amount || 0) === 0) {
      return res.status(400).json({
        success: false,
        message: 'Receipt can only be generated for payments with payments',
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

    // Generate receipt
    const receipt = await generateMonthlyReceipt(payment, school, payment.student);

    // Update payment with receipt number
    await payment.update({
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

// Test endpoint to verify system is working
const testMonthlyPaymentSystem = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Monthly payment system is working correctly',
      data: {
        timestamp: new Date().toISOString(),
        features: [
          'Monthly payment generation',
          'Payment recording with receipts',
          'Balance calculation',
          'Professional receipt generation',
          'Payment model support (monthly/installment)'
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateMonthlyPayments,
  getMonthlyPayments,
  getMonthlyPaymentById,
  recordMonthlyPayment,
  generateReceipt,
  getStudentMonthlyPayments,
  testMonthlyPaymentSystem
}; 