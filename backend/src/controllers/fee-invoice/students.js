const { FeeInvoice, FeeStructure, FeeType, Student, Parent, School, FeePayment, Branch, Class, Stream, sequelize } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { logger } = require('../../utils/logger');
const { Op } = require('sequelize');
const { generateCombinedReceipt } = require('./receipts');
const { getAvailablePaymentMonths, getEarliestPendingMonth, getMonthName } = require('../../utils/academicYearUtils');
const { generateUniqueInvoiceNumber, getClassCode, generateUniqueReceiptNumber } = require('./core');

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


// Shared utility function to get student invoices
const getStudentInvoices = async (studentId, schoolId, options = {}) => {
  const {
    academic_year,
    payment_model,
    status = ['sent', 'partial_paid', 'overdue'],
    includeFeeStructure = true,
    includeStudent = false,
    branchId = null, // Add branch filter option
  } = options;

  const invoiceFilter = {
    student_id: studentId,
    school_id: schoolId,
    status: { [Op.in]: status },
  };

  // Add branch filter if provided
  if (branchId) {
    invoiceFilter.branch_id = branchId;
  }

  if (academic_year) {
    invoiceFilter.academic_year = academic_year;
  }

  // Add payment model filter if specified
  if (payment_model) {
    invoiceFilter.payment_model = payment_model;
  }

  const includeClause = [];
  
  if (includeFeeStructure) {
    includeClause.push({
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
        },
      ],
    });
  }

  if (includeStudent) {
    includeClause.push({
      model: Student,
      as: 'student',
    });
  }

  return await FeeInvoice.findAll({
    where: invoiceFilter,
    include: includeClause,
    order: [['due_date', 'ASC']],
  });
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

    // Build filter for all invoices (including paid ones)
    const invoiceFilter = {
      student_id: student_id,
      school_id: req.schoolId,
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      invoiceFilter.branch_id = req.user.branch_id;
    }

    if (academic_year) {
      invoiceFilter.academic_year = academic_year;
    }

    // Get ALL invoices (including paid ones) for proper calculation
    const allInvoices = await FeeInvoice.findAll({
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
            {
              model: Class,
              as: 'class',
            },
          ],
        },
        {
          model: FeePayment,
          as: 'payments',
          order: [['created_at', 'DESC']],
        },
      ],
      order: [['due_date', 'ASC']],
    });

    // Separate monthly payments from regular invoices
    const monthlyPayments = allInvoices.filter(invoice => 
      invoice.feeStructure?.payment_model === 'monthly'
    );
    
    const regularInvoices = allInvoices.filter(invoice => 
      invoice.feeStructure?.payment_model !== 'monthly'
    );

    // Group monthly payments by receipt_number for paid/partial_paid invoices
    const groupedMonthlyPayments = [];
    const ungroupedMonthlyPayments = [];
    
    // Group invoices that have receipt_number (paid/partial_paid)
    const groupedInvoices = {};
    monthlyPayments.forEach(invoice => {
      if (invoice.receipt_number && ['paid', 'partial_paid'].includes(invoice.status)) {
        if (!groupedInvoices[invoice.receipt_number]) {
          groupedInvoices[invoice.receipt_number] = {
            receipt_number: invoice.receipt_number,
            invoices: [],
            total_amount: 0,
            total_paid: 0,
            total_balance: 0,
            payment_date: invoice.last_payment_date || invoice.updated_at,
            payment_method: invoice.payment_method || 'unknown',
            transaction_id: invoice.transaction_id,
            status: invoice.status,
          };
        }
        groupedInvoices[invoice.receipt_number].invoices.push(invoice);
        groupedInvoices[invoice.receipt_number].total_amount += parseFloat(invoice.total_amount || 0);
        groupedInvoices[invoice.receipt_number].total_paid += parseFloat(invoice.paid_amount || 0);
        groupedInvoices[invoice.receipt_number].total_balance += parseFloat(invoice.balance_amount || 0);
      } else {
        ungroupedMonthlyPayments.push(invoice);
      }
    });

    // Convert grouped invoices to array format with enhanced info
    Object.values(groupedInvoices).forEach(group => {
      const months = group.invoices.map(inv => inv.month).sort((a, b) => a - b);
      const years = [...new Set(group.invoices.map(inv => inv.year))];
      
      groupedMonthlyPayments.push({
        id: group.receipt_number,
        receipt_number: group.receipt_number,
        invoice_number: group.invoices.map(inv => inv.invoice_number).join(', '),
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
        month_range: months.length > 1 ? `${months[0]} - ${months[months.length - 1]}` : months[0],
        month_names: group.invoices.map(inv => {
          const monthName = getMonthName(inv.month);
          return `${monthName} ${inv.year}`;
        }).join(', '),
        display_name: `${group.invoices.map(inv => inv.invoice_number).join(', ')} → Paid for ${group.invoices.map(inv => {
          const monthName = getMonthName(inv.month);
          return `${monthName} ${inv.year}`;
        }).join(', ')} (₹${group.total_paid.toLocaleString()})`,
        payment_date: group.payment_date,
        payment_method: group.payment_method,
        transaction_id: group.transaction_id,
        payment_model: 'monthly',
        feeStructure: group.invoices[0]?.feeStructure,
        is_grouped: true
      });
    });

    // Handle individual paid invoices (not grouped)
    const individualPaidInvoices = monthlyPayments.filter(invoice => 
      !invoice.receipt_number && invoice.status === 'paid' && invoice.paid_amount > 0
    );
    
    individualPaidInvoices.forEach(invoice => {
      groupedMonthlyPayments.push({
        id: invoice.id,
        receipt_number: null,
        invoice_number: invoice.invoice_number,
        fee_type: invoice.feeStructure?.feeType?.name || 'Unknown',
        class_name: invoice.class_name,
        section: invoice.section,
        total_amount: parseFloat(invoice.total_amount || 0),
        paid_amount: parseFloat(invoice.paid_amount || 0),
        balance_amount: parseFloat(invoice.balance_amount || 0),
        due_date: invoice.due_date,
        status: 'paid',
        academic_year: invoice.academic_year,
        month: invoice.month,
        year: invoice.year,
        months_covered: 1,
        month_range: invoice.month,
        month_names: `${getMonthName(invoice.month)} ${invoice.year}`,
        display_name: `${invoice.invoice_number} → Paid for ${getMonthName(invoice.month)} ${invoice.year} (₹${invoice.paid_amount.toLocaleString()})`,
        payment_date: invoice.last_payment_date || invoice.updated_at,
        payment_method: invoice.payment_method || 'unknown',
        transaction_id: invoice.transaction_id,
        payment_model: 'monthly',
        feeStructure: invoice.feeStructure,
        is_grouped: false
      });
    });

    // Filter ungrouped payments to only include truly pending invoices
    const pendingMonthlyPayments = ungroupedMonthlyPayments.filter(invoice => 
      invoice.status === 'sent' || invoice.status === 'overdue' || 
      (invoice.status === 'partial_paid' && invoice.balance_amount > 0)
    );

    // Calculate totals correctly - ONLY for unpaid/partial_paid invoices
    const unpaidInvoices = allInvoices.filter(invoice => 
      invoice.status !== 'paid' && invoice.balance_amount > 0
    );
    
    const totalDues = unpaidInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.balance_amount || 0), 0);
    const totalInvoices = allInvoices.length;
    
    // Calculate overdue amount
    const overdueInvoices = allInvoices.filter(invoice => invoice.status === 'overdue');
    const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.balance_amount || 0), 0);

    // Calculate monthly payment statistics
    const monthlyPaymentCount = monthlyPayments.length;
    const monthlyPaymentTotal = monthlyPayments.reduce((sum, invoice) => sum + parseFloat(invoice.balance_amount || 0), 0);

    // Calculate paid months count and total
    const paidMonthsCount = groupedMonthlyPayments.reduce((sum, payment) => sum + payment.months_covered, 0);
    const paidMonthsTotal = groupedMonthlyPayments.reduce((sum, payment) => sum + payment.paid_amount, 0);
    
    // Calculate total amount and total paid for all invoices
    const totalAmount = allInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);
    const totalPaid = allInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.paid_amount || 0), 0);
    
    // Calculate total dues - use balance_amount as it's the source of truth
    // If all invoices are paid, total dues should be 0
    const finalTotalDues = totalDues;
    
    // Debug logging
    logger.info(`Student ${student_id} calculation:`, {
      totalAmount,
      totalPaid,
      totalDues,
      finalTotalDues,
      paidMonthsCount,
      paidMonthsTotal,
      monthlyPaymentCount,
      monthlyPaymentTotal,
      invoiceCount: allInvoices.length,
      paidInvoices: allInvoices.filter(inv => inv.status === 'paid').length,
      partialPaidInvoices: allInvoices.filter(inv => inv.status === 'partial_paid').length,
      sentInvoices: allInvoices.filter(inv => inv.status === 'sent').length
    });

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          admission_number: student.admission_number,
          current_class: student.current_class,
          section: student.section,
        },
        summary: {
          total_dues: finalTotalDues,
          overdue_amount: overdueAmount,
          invoice_count: totalInvoices,
          unpaid_invoice_count: unpaidInvoices.length,
          monthly_payment_count: monthlyPaymentCount,
          monthly_payment_total: monthlyPaymentTotal,
          regular_invoice_count: regularInvoices.length,
          regular_invoice_total: regularInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.balance_amount || 0), 0),
          paid_months_count: paidMonthsCount,
          paid_months_total: paidMonthsTotal,
          pending_months_count: pendingMonthlyPayments.length,
          total_amount: totalAmount,
          total_paid: totalPaid
        },
        invoices: regularInvoices.map(invoice => ({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          fee_type: invoice.feeStructure?.feeType?.name || 'Unknown',
          class_name: invoice.class_name,
          section: invoice.section,
          total_amount: parseFloat(invoice.total_amount || 0),
          paid_amount: parseFloat(invoice.paid_amount || 0),
          balance_amount: parseFloat(invoice.balance_amount || 0),
          due_date: invoice.due_date,
          status: invoice.status,
          academic_year: invoice.academic_year,
          payment_model: invoice.feeStructure?.payment_model || 'installment',
          feeStructure: invoice.feeStructure
        })),
        monthly_payments: [
          // Add grouped payments first (paid/partial_paid)
          ...groupedMonthlyPayments,
                     // Add ungrouped payments (sent/overdue)
           ...pendingMonthlyPayments.map(invoice => ({
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            fee_type: invoice.feeStructure?.feeType?.name || 'Unknown',
            class_name: invoice.class_name,
            section: invoice.section,
            total_amount: parseFloat(invoice.total_amount || 0),
            paid_amount: parseFloat(invoice.paid_amount || 0),
            balance_amount: parseFloat(invoice.balance_amount || 0),
            due_date: invoice.due_date,
            status: invoice.status,
            academic_year: invoice.academic_year,
            month: invoice.month,
            year: invoice.year,
            payment_model: invoice.feeStructure?.payment_model || 'monthly',
            feeStructure: invoice.feeStructure,
            is_grouped: false
          }))
        ],
      },
    });
  } catch (error) {
    logger.error('Error fetching student dues:', error);
    return next(error);
  }
};

// Get student fee ledger
const getStudentFeeLedger = async (req, res, next) => {
  try {
    const { student_id, academic_year, status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (!student_id) {
      throw new ApiError(400, 'Student ID is required');
    }

    // Verify student exists and belongs to school
    const student = await Student.findOne({
      where: {
        id: student_id,
        school_id: req.schoolId,
      },
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: [] },
        },
      ],
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Build invoice filter
    const invoiceFilter = {
      student_id: student_id,
      school_id: req.schoolId,
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      invoiceFilter.branch_id = req.user.branch_id;
    }

    if (academic_year) {
      invoiceFilter.academic_year = academic_year;
    }

    if (status) {
      invoiceFilter.status = status;
    }

    // Get all invoices first (without pagination to handle grouping)
    const allInvoices = await FeeInvoice.findAll({
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
        {
          model: FeePayment,
          as: 'payments',
          order: [['created_at', 'DESC']],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Separate monthly payments from regular invoices
    const monthlyPayments = allInvoices.filter(invoice => 
      invoice.feeStructure?.payment_model === 'monthly'
    );
    
    const regularInvoices = allInvoices.filter(invoice => 
      invoice.feeStructure?.payment_model !== 'monthly'
    );

    // Group monthly payments by receipt_number for paid/partial_paid invoices
    const groupedMonthlyPayments = [];
    const ungroupedMonthlyPayments = [];
    
    // Group invoices that have receipt_number (paid/partial_paid)
    const groupedInvoices = {};
    monthlyPayments.forEach(invoice => {
      if (invoice.receipt_number && ['paid', 'partial_paid'].includes(invoice.status)) {
        if (!groupedInvoices[invoice.receipt_number]) {
          groupedInvoices[invoice.receipt_number] = {
            receipt_number: invoice.receipt_number,
            invoices: [],
            total_amount: 0,
            total_paid: 0,
            total_balance: 0,
            payment_date: invoice.last_payment_date,
            payment_method: invoice.payment_method,
            transaction_id: invoice.transaction_id,
            status: invoice.status,
          };
        }
        groupedInvoices[invoice.receipt_number].invoices.push(invoice);
        groupedInvoices[invoice.receipt_number].total_amount += parseFloat(invoice.total_amount || 0);
        groupedInvoices[invoice.receipt_number].total_paid += parseFloat(invoice.paid_amount || 0);
        groupedInvoices[invoice.receipt_number].total_balance += parseFloat(invoice.balance_amount || 0);
      } else {
        ungroupedMonthlyPayments.push(invoice);
      }
    });

    // Convert grouped invoices to array format with enhanced info
    Object.values(groupedInvoices).forEach(group => {
      const months = group.invoices.map(inv => inv.month).sort((a, b) => a - b);
      const years = [...new Set(group.invoices.map(inv => inv.year))];
      
      groupedMonthlyPayments.push({
        id: group.receipt_number, // Use receipt_number as ID for grouping
        receipt_number: group.receipt_number,
        invoice_number: group.invoices.map(inv => inv.invoice_number).join(', '),
        fee_type: group.invoices[0]?.feeStructure?.feeType?.name || 'Unknown',
        class_name: group.invoices[0]?.class_name,
        section: group.invoices[0]?.section,
        total_amount: group.total_amount,
        paid_amount: group.total_paid,
        balance_amount: group.total_balance,
        due_date: group.invoices[0]?.due_date,
        status: group.total_balance <= 0 ? 'paid' : 'partial_paid',
        academic_year: group.invoices[0]?.academic_year,
        month: months[0], // First month in group
        year: years[0],
        months_covered: group.invoices.length,
        month_range: months.length > 1 ? `${months[0]} - ${months[months.length - 1]}` : months[0],
        month_names: group.invoices.map(inv => {
          const monthName = getMonthName(inv.month);
          return `${monthName} ${inv.year}`;
        }).join(', '),
        display_name: `${group.invoices.map(inv => inv.invoice_number).join(', ')} → Paid for ${group.invoices.map(inv => {
          const monthName = getMonthName(inv.month);
          return `${monthName} ${inv.year}`;
        }).join(', ')} (₹${group.total_paid.toLocaleString()})`,
        payment_date: group.payment_date,
        payment_method: group.payment_method,
        transaction_id: group.transaction_id,
        payment_model: 'monthly',
        feeStructure: group.invoices[0]?.feeStructure,
        is_grouped: true,
        payments: group.invoices[0]?.payments || []
      });
    });

    // Combine all invoices: grouped payments + ungrouped monthly + regular invoices
    const allCombinedInvoices = [
      ...groupedMonthlyPayments,
      ...ungroupedMonthlyPayments,
      ...regularInvoices
    ];

    // Apply pagination to combined results
    const totalCount = allCombinedInvoices.length;
    const paginatedInvoices = allCombinedInvoices.slice(offset, offset + parseInt(limit));

    // Calculate summary based on combined invoices
    const totalInvoices = allCombinedInvoices.length;
    const paidInvoices = allCombinedInvoices.filter(inv => ['paid', 'partial_paid'].includes(inv.status)).length;
    const overdueInvoices = allCombinedInvoices.filter(inv => inv.status === 'overdue').length;

    // Calculate amount stats from combined invoices
    const totalAmount = allCombinedInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
    const totalPaid = allCombinedInvoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0);
    const totalBalance = allCombinedInvoices.reduce((sum, inv) => sum + parseFloat(inv.balance_amount || 0), 0);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: getStudentFullName(student),
          admission_number: student.admission_number,
          class: student.current_class,
          section: student.section,
          parents: student.parents,
        },
        summary: {
          total_invoices: totalInvoices,
          paid_invoices: paidInvoices,
          overdue_invoices: overdueInvoices,
          total_amount: totalAmount,
          total_paid: totalPaid,
          total_balance: totalBalance,
          collection_rate: totalAmount > 0 ? ((totalPaid / totalAmount) * 100).toFixed(2) : 0,
        },
        invoices: paginatedInvoices.map(invoice => {
          // Handle grouped payments differently
          if (invoice.is_grouped) {
            return {
              id: invoice.id,
              invoice_number: invoice.invoice_number,
              fee_type: invoice.fee_type,
              class_name: invoice.class_name,
              section: invoice.section,
              total_amount: invoice.total_amount,
              paid_amount: invoice.paid_amount,
              balance_amount: invoice.balance_amount,
              due_date: invoice.due_date,
              status: invoice.status,
              academic_year: invoice.academic_year,
              created_at: invoice.payment_date || invoice.created_at,
              payment_model: invoice.payment_model,
              is_grouped: true,
              receipt_number: invoice.receipt_number,
              months_covered: invoice.months_covered,
              month_names: invoice.month_names,

              payments: invoice.payments || [],
            };
          } else {
            // Regular invoice
            return {
              id: invoice.id,
              invoice_number: invoice.invoice_number,
              fee_type: invoice.feeStructure?.feeType?.name || 'Unknown',
              class_name: invoice.class_name,
              section: invoice.section,
              total_amount: parseFloat(invoice.total_amount || 0),
              paid_amount: parseFloat(invoice.paid_amount || 0),
              balance_amount: parseFloat(invoice.balance_amount || 0),
              due_date: invoice.due_date,
              status: invoice.status,
              academic_year: invoice.academic_year,
              created_at: invoice.created_at,
              payment_model: invoice.feeStructure?.payment_model || 'installment',
              is_grouped: false,
              payments: invoice.payments?.map(payment => ({
                id: payment.id,
                payment_number: payment.payment_number,
                receipt_number: payment.receipt_number,
                payment_amount: parseFloat(payment.payment_amount || 0),
                payment_method: payment.payment_method,
                payment_date: payment.payment_date,
                created_at: payment.created_at,
              })) || [],
            };
          }
        }),
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: totalCount,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching student fee ledger:', error);
    return next(error);
  }
};

// Enhanced Smart Payment System - supports multiple payment modes
const recordSmartPayment = async (req, res, next) => {
  try {
    const {
      student_id,
      payment_amount,
      payment_method = 'cash',
      payment_date,
      transaction_id,
      notes,
      academic_year,
      payment_mode = 'auto', // 'auto' or 'manual'
      selected_invoice_ids = [], // For manual mode
    } = req.body;

    if (!student_id || !payment_amount || payment_amount <= 0) {
      throw new ApiError(400, 'Student ID and valid payment amount are required');
    }

    // Validate payment amount for monthly payments
    if (payment_mode === 'auto') {
      // Build where clause based on user role
      const whereClause = {
        student_id,
        school_id: req.schoolId,
        status: { [Op.in]: ['sent', 'partial_paid', 'overdue'] },
      };

      // Add branch filter for branch admins
      if (req.user.role === 'branch_admin') {
        whereClause.branch_id = req.user.branch_id;
      }

      // Get the first pending invoice to determine monthly fee amount
      const firstPendingInvoice = await FeeInvoice.findOne({
        where: whereClause,
        include: [
          {
            model: FeeStructure,
            as: 'feeStructure',
          },
        ],
        order: [['due_date', 'ASC']],
      });

      if (firstPendingInvoice && firstPendingInvoice.feeStructure?.payment_model === 'monthly') {
        const monthlyFee = parseFloat(firstPendingInvoice.total_amount || 0);
        if (monthlyFee > 0) {
          const monthsCovered = Math.floor(payment_amount / monthlyFee);
          const remainder = payment_amount % monthlyFee;
          
          if (remainder > 0) {
            throw new ApiError(400, `Payment amount ₹${payment_amount} must be a multiple of monthly fee ₹${monthlyFee}. Please enter an amount that covers complete months only.`);
          }
          
          if (monthsCovered === 0) {
            throw new ApiError(400, `Payment amount ₹${payment_amount} is less than monthly fee ₹${monthlyFee}. Please enter at least ₹${monthlyFee} to cover one month.`);
          }
        }
      }
    }

    // Get student
    const student = await Student.findOne({
      where: {
        id: student_id,
        school_id: req.schoolId,
      },
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Get pending invoices using shared utility
    let pendingInvoices = await getStudentInvoices(student_id, req.schoolId, { 
      academic_year,
      includeStudent: false,
      branchId: req.user.role === 'branch_admin' ? req.user.branch_id : null
    });

    if (pendingInvoices.length === 0) {
      throw new ApiError(400, 'No pending invoices found for this student');
    }

    // Handle manual mode - filter by selected invoice IDs
    if (payment_mode === 'manual' && selected_invoice_ids && selected_invoice_ids.length > 0) {
      pendingInvoices = pendingInvoices.filter(invoice => 
        selected_invoice_ids.includes(invoice.id)
      );
      
      if (pendingInvoices.length === 0) {
        throw new ApiError(400, 'No valid invoices found from selected list');
      }
    }

    let remainingAmount = parseFloat(payment_amount);
    const appliedPayments = [];
    const errors = [];
    const processedInvoices = [];

    // Generate a simple receipt number for this payment
    // Use the same class code logic as invoice generation to ensure consistency
    const classCode = await getClassCode(pendingInvoices[0].feeStructure, student);
    
    logger.info('Smart payment - Class code generated:', {
      classCode,
      feeStructureId: pendingInvoices[0].feeStructure?.id,
      studentClass: student.current_class,
      schoolId: req.schoolId
    });
    
    // Generate a single receipt number for this payment (no groups)
    const tempReceipt = await generateUniqueReceiptNumber(classCode, { school_id: req.schoolId });
    const receiptNumber = tempReceipt.receipt_number;
    
    logger.info('Smart payment - Receipt number generated:', {
      receiptNumber,
      classCode
    });
    
    // Enhanced allocation logic with monthly payment support
    // Calculate how many months can be covered by this payment
    const firstInvoice = pendingInvoices[0];
    const isMonthlyPayment = firstInvoice.feeStructure?.payment_model === 'monthly';
    const monthlyFee = isMonthlyPayment ? parseFloat(firstInvoice.total_amount || 0) : null;
    
    let monthsToCover = 0;
    let invoicesToProcess = [];
    
    if (isMonthlyPayment && monthlyFee && monthlyFee > 0) {
      // Calculate how many complete months can be covered
      monthsToCover = Math.floor(remainingAmount / monthlyFee);
      
      if (monthsToCover >= 1) {
        // Take first N months that can be fully paid
        invoicesToProcess = pendingInvoices.slice(0, monthsToCover);
        logger.info(`Smart payment: ₹${payment_amount} can cover ${monthsToCover} months at ₹${monthlyFee} each`);
      } else {
        // Partial month payment - process only the first invoice
        invoicesToProcess = [pendingInvoices[0]];
        logger.info(`Smart payment: ₹${payment_amount} is insufficient for complete month (₹${monthlyFee} required)`);
      }
    } else {
      // For installment payments, process invoices one by one
      invoicesToProcess = pendingInvoices;
    }
    
    // Process the selected invoices
    for (const invoice of invoicesToProcess) {
      if (remainingAmount <= 0) break;

      const invoiceBalance = parseFloat(invoice.balance_amount || 0);
      if (invoiceBalance <= 0) continue;

      let amountToApply;
      
      if (isMonthlyPayment && monthlyFee) {
        // For monthly payments, apply the monthly fee amount
        amountToApply = Math.min(monthlyFee, remainingAmount, invoiceBalance);
      } else {
        // For installment payments, apply what's available
        amountToApply = Math.min(remainingAmount, invoiceBalance);
      }

      const newPaidAmount = parseFloat(invoice.paid_amount || 0) + amountToApply;
      const newBalanceAmount = parseFloat(invoice.total_amount || 0) - newPaidAmount;

      try {
        // Create payment record for historical tracking
        const paymentData = {
          payment_number: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          receipt_number: receiptNumber, // Use the main receipt number for this payment
          invoice_id: invoice.id,
          student_id: student.id,
          payment_amount: amountToApply,
          payment_method,
          payment_date: payment_date || new Date(),
          transaction_id,
          payment_status: 'completed',
          notes: `Smart payment allocation - ${notes || ''}`,
          school_id: req.schoolId,
          branch_id: req.branchId,
          created_by: req.user.id,
        };

        logger.info('Smart payment - Creating payment record:', {
          invoiceId: invoice.id,
          receiptNumber,
          amountToApply,
          paymentMethod: payment_method
        });

        const payment = await FeePayment.create(paymentData);

        // Update invoice with receipt_number for grouping
        logger.info('Smart payment - Updating invoice:', {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          receiptNumber,
          newPaidAmount,
          newBalanceAmount
        });

        await invoice.update({
          paid_amount: newPaidAmount,
          balance_amount: newBalanceAmount,
          last_payment_date: payment_date || new Date(),
          status: newBalanceAmount <= 0 ? 'paid' : 'partial_paid',
          receipt_number: receiptNumber, // Simple receipt number per class
          payment_method: payment_method,
          transaction_id: transaction_id,
          notes: `${invoice.notes || ''}\nSmart payment: ₹${amountToApply} on ${new Date().toLocaleDateString()} - ${notes || ''}`,
          updated_by: req.user.id,
        });

        processedInvoices.push(invoice);

        appliedPayments.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          month: invoice.month || null,
          year: invoice.year || null,
          fee_type: invoice.feeStructure?.feeType?.name || 'Unknown',
          amount_applied: amountToApply,
          payment_id: payment.id,
          new_balance: newBalanceAmount,
          status: newBalanceAmount <= 0 ? 'paid' : 'partial_paid',
          is_monthly: isMonthlyPayment,
          receipt_number: receiptNumber,
        });

        remainingAmount -= amountToApply;
      } catch (error) {
        logger.error(`Error applying payment to invoice ${invoice.id}:`, error);
        errors.push(`Failed to apply payment to invoice ${invoice.invoice_number}: ${error.message}`);
      }
    }

    if (appliedPayments.length === 0) {
      throw new ApiError(400, 'Failed to apply payment to any invoices');
    }

    const totalApplied = parseFloat(payment_amount) - remainingAmount;

    // Calculate payment summary
    const paidMonths = appliedPayments
      .filter(payment => payment.is_monthly && payment.status === 'paid')
      .map(payment => `${payment.month} ${payment.year}`)
      .join(', ');

    const remainingInvoices = await FeeInvoice.count({
      where: {
        student_id,
        school_id: req.schoolId,
        status: { [Op.in]: ['sent', 'partial_paid', 'overdue'] },
      },
    });

    const totalRemainingAmount = await FeeInvoice.sum('balance_amount', {
      where: {
        student_id,
        school_id: req.schoolId,
        status: { [Op.in]: ['sent', 'partial_paid', 'overdue'] },
      },
    });

    logger.info(`Smart payment applied: ${totalApplied} for student ${student.id} across ${appliedPayments.length} invoices`);

    // Generate combined receipt for all grouped invoices
    const groupedInvoices = await getStudentInvoices(student_id, req.schoolId, {
      includeStudent: true,
      status: ['paid', 'partial_paid'] // Include paid invoices for receipt generation
    }).then(invoices => invoices.filter(invoice => invoice.receipt_number === receiptNumber));

    // Get school data with receipt settings for receipt generation
    const school = await School.findByPk(req.schoolId, {
      attributes: [
        'id', 'name', 'code', 'logo', 'address', 'phone', 'email', 'website',
        'receipt_settings'
      ]
    });

    // Get branch data if student has a branch
    let branch = null;
    if (student.branch_id) {
      branch = await Branch.findByPk(student.branch_id, {
        attributes: ['id', 'name', 'code', 'receipt_logo']
      });
    }

    // Generate combined receipt
    const combinedReceipt = await generateCombinedReceipt(
      groupedInvoices,
      totalApplied,
      payment_method,
      transaction_id,
      school,
      student,
      receiptNumber, // Pass the receipt number to preserve historical state
      branch // Pass branch data for receipt customization
    );

    // Store receipt data in the first payment for future reference
    if (appliedPayments.length > 0) {
      const firstPaymentId = appliedPayments[0].payment_id;
      const firstPayment = await FeePayment.findByPk(firstPaymentId);
      if (firstPayment) {
        // Always store the receipt data to ensure historical state is preserved
        await firstPayment.update({ receipt_data: combinedReceipt.receipt_data });
        logger.info(`Stored combined receipt data for receipt ${receiptNumber} in payment ${firstPaymentId}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Smart payment recorded successfully',
      data: {
        student_id,
        student_name: getStudentFullName(student),
        total_payment_amount: parseFloat(payment_amount),
        total_applied_amount: totalApplied,
        remaining_amount: remainingAmount,
        invoices_processed: appliedPayments.length,
        applied_payments: appliedPayments,
        receipt_number: receiptNumber,
        combined_receipt: combinedReceipt,
        
        // Enhanced summary for UI
        summary: {
          paid_months: paidMonths,
          months_covered: appliedPayments.filter(p => p.is_monthly && p.status === 'paid').length,
          remaining_invoices: remainingInvoices,
          remaining_balance: parseFloat(totalRemainingAmount || 0),
          payment_mode: payment_mode,
        },
        
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    logger.error('Error recording smart payment:', error);
    return next(error);
  }
};

// Get available months for manual selection
const getAvailableMonths = async (req, res, next) => {
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

    // Get school to determine starting month
    const school = await School.findByPk(req.schoolId);
    const startingMonth = school.starting_month || 6; // Default to June

    // Get monthly payment invoices using shared utility
    let monthlyInvoices = [];
    try {
      monthlyInvoices = await getStudentInvoices(student_id, req.schoolId, { 
        academic_year, 
        payment_model: 'monthly' 
      });
    } catch (error) {
      logger.error('Error fetching student invoices:', error);
      throw new ApiError(500, 'Error fetching student invoices');
    }

    // Get available payment months (enforcing sequence rules)
    let availablePaymentInvoices = [];
    let earliestPending = null;
    
    try {
      // Filter out invoices with missing month/year data
      const validMonthlyInvoices = monthlyInvoices.filter(invoice => {
        return invoice.month && invoice.year && 
               typeof invoice.month === 'number' && 
               typeof invoice.year === 'number' &&
               invoice.month >= 1 && invoice.month <= 12 &&
               invoice.year >= 2000 && invoice.year <= 2100;
      });
      
      if (validMonthlyInvoices.length === 0) {
        logger.info(`No valid monthly invoices found for student ${student_id}`);
        availablePaymentInvoices = [];
        earliestPending = null;
      } else {
        availablePaymentInvoices = getAvailablePaymentMonths(validMonthlyInvoices, startingMonth, 12);
        earliestPending = getEarliestPendingMonth(validMonthlyInvoices, startingMonth);
      }
    } catch (error) {
      logger.error('Error calculating available payment months:', error);
      logger.error('Monthly invoices data:', JSON.stringify(monthlyInvoices, null, 2));
      throw new ApiError(500, 'Error calculating available payment months');
    }

    // Group by month and calculate totals
    const monthGroups = {};
    availablePaymentInvoices.forEach(invoice => {
      const monthKey = `${invoice.month}-${invoice.year}`;
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = {
          month: invoice.month,
          year: invoice.year,
          month_key: monthKey,
          invoices: [],
          total_amount: 0,
          paid_amount: 0,
          balance_amount: 0,
          fee_types: new Set(),
          is_earliest_pending: false,
        };
      }
      
      monthGroups[monthKey].invoices.push(invoice);
      monthGroups[monthKey].total_amount += parseFloat(invoice.total_amount || 0);
      monthGroups[monthKey].paid_amount += parseFloat(invoice.paid_amount || 0);
      monthGroups[monthKey].balance_amount += parseFloat(invoice.balance_amount || 0);
      monthGroups[monthKey].fee_types.add(invoice.feeStructure?.feeType?.name || 'Unknown');
      
      // Mark if this is the earliest pending month
      if (earliestPending && invoice.id === earliestPending.id) {
        monthGroups[monthKey].is_earliest_pending = true;
      }
    });

    // Convert to array and format
    const availableMonths = Object.values(monthGroups).map(group => {
      try {
        return {
          month: group.month,
          year: group.year,
          month_key: group.month_key,
          display_name: `${getMonthName(group.month)} ${group.year}`,
          total_amount: group.total_amount,
          paid_amount: group.paid_amount,
          balance_amount: group.balance_amount,
          fee_types: Array.from(group.fee_types),
          invoice_count: group.invoices.length,
          status: group.balance_amount <= 0 ? 'paid' : group.paid_amount > 0 ? 'partial_paid' : 'pending',
          due_date: group.invoices[0]?.due_date,
          invoice_ids: group.invoices.map(inv => inv.id),
          is_earliest_pending: group.is_earliest_pending,
          can_pay: group.balance_amount > 0, // Can only pay if there's a balance
        };
      } catch (error) {
        logger.error('Error formatting month group:', error, group);
        return null;
      }
    }).filter(Boolean); // Remove any null entries

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: getStudentFullName(student),
          admission_number: student.admission_number,
          class: student.current_class,
          section: student.section,
        },
        available_months: availableMonths,
        summary: {
          total_months: availableMonths.length,
          pending_months: availableMonths.filter(m => m.status !== 'paid').length,
          total_balance: availableMonths.reduce((sum, m) => sum + m.balance_amount, 0),
          earliest_pending_month: earliestPending ? `${getMonthName(earliestPending.month)} ${earliestPending.year}` : null,
          payment_sequence_enforced: true,
          starting_month: startingMonth,
          academic_year: academic_year,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching available months:', error);
    return next(error);
  }
};

// Get grouped student invoices for better UI display
const getGroupedStudentInvoices = async (req, res, next) => {
  try {
    const { student_id, academic_year, status } = req.query;

    if (!student_id) {
      throw new ApiError(400, 'Student ID is required');
    }

    // Get student
    const student = await Student.findOne({
      where: {
        id: student_id,
        school_id: req.schoolId,
      },
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Get all invoices for the student
    const invoices = await getStudentInvoices(student_id, req.schoolId, { 
      academic_year,
      status: status ? [status] : undefined,
      includeStudent: false,
      branchId: req.user.role === 'branch_admin' ? req.user.branch_id : null
    });

    // Group invoices by receipt_number for paid/partial_paid invoices
    const groupedInvoices = {};
    const ungroupedInvoices = [];

    invoices.forEach(invoice => {
      if (invoice.receipt_number && ['paid', 'partial_paid'].includes(invoice.status)) {
        if (!groupedInvoices[invoice.receipt_number]) {
          groupedInvoices[invoice.receipt_number] = {
            receipt_number: invoice.receipt_number,
            invoices: [],
            total_amount: 0,
            total_paid: 0,
            total_balance: 0,
            payment_date: invoice.last_payment_date,
            payment_method: invoice.payment_method,
            transaction_id: invoice.transaction_id,
            status: invoice.status,
          };
        }
        groupedInvoices[invoice.receipt_number].invoices.push(invoice);
        groupedInvoices[invoice.receipt_number].total_amount += parseFloat(invoice.total_amount || 0);
        groupedInvoices[invoice.receipt_number].total_paid += parseFloat(invoice.paid_amount || 0);
        groupedInvoices[invoice.receipt_number].total_balance += parseFloat(invoice.balance_amount || 0);
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
        ...group,
        months_covered: group.invoices.length,
        month_range: monthRange,
        year: years[0],
        month_names: monthNames,
        status: group.total_balance <= 0 ? 'paid' : 'partial_paid',
      };
    });

    // Sort by payment date (newest first)
    groupedArray.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: getStudentFullName(student),
          admission_number: student.admission_number,
          current_class: student.current_class,
          section: student.section,
        },
        grouped_invoices: groupedArray,
        ungrouped_invoices: ungroupedInvoices,
        summary: {
          total_invoices: invoices.length,
          total_grouped: groupedArray.length,
          total_ungrouped: ungroupedInvoices.length,
          total_paid: groupedArray.reduce((sum, group) => sum + group.total_paid, 0),
          total_balance: ungroupedInvoices.reduce((sum, inv) => sum + parseFloat(inv.balance_amount || 0), 0),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching grouped student invoices:', error);
    return next(error);
  }
};

// Get paginated student fee invoice summaries (optimized for performance)
const getStudentFeeInvoiceSummary = async (req, res, next) => {
  try {
    const {
      academic_year,
      class_name,
      class_id,
      section,
      stream,
      stream_id,
      status,
      branch_id,
      page = 1,
      limit = 10,
      payment_model,
      search,
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build student filter
    const studentWhereClause = {
      school_id: req.schoolId,
    };

    // Handle branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see students from their assigned branch
      studentWhereClause.branch_id = req.user.branch_id;
    } else if (branch_id) {
      // Super admin and school admin can filter by specific branch if provided
      studentWhereClause.branch_id = branch_id;
    }

    // Handle class filtering - support both class_name and class_id
    if (class_id) {
      // If class_id is provided, get the class name from the Class model
      const classRecord = await Class.findByPk(class_id);
      if (classRecord) {
        studentWhereClause.current_class = classRecord.name;
      }
    } else if (class_name) {
      const classCode = class_name.replace(/^Class\s+/i, '').trim();
      studentWhereClause.current_class = {
        [Op.or]: [class_name, classCode]
      };
    }
    if (section) studentWhereClause.section = section;

    // Handle stream filtering - support both stream name and stream_id
    if (stream_id) {
      // If stream_id is provided, filter by stream_id directly
      studentWhereClause.stream_id = stream_id;
    } else if (stream) {
      // If stream name is provided, we need to find the stream ID first
      const streamRecord = await Stream.findOne({
        where: {
          name: stream,
          school_id: req.schoolId,
          ...(branch_id && { branch_id: branch_id })
        }
      });
      if (streamRecord) {
        studentWhereClause.stream_id = streamRecord.id;
      }
    }

    // Handle academic year filtering - filter students by their current academic year
    if (academic_year && academic_year.trim() !== '') {
      studentWhereClause.academic_year = academic_year;
    }

    // Add search filter
    if (search) {
      studentWhereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { admission_number: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Check if invoice-level filters are applied
    const hasInvoiceFilters = (status && status.trim() !== '') || 
                              (payment_model && payment_model.trim() !== '');

    let students, totalStudents;

    if (hasInvoiceFilters) {
      // If status or payment_model filters are applied, we need to get students who have matching invoices
      // First, get all students (without pagination) to find those with matching invoices
      const allStudents = await Student.findAll({
        where: studentWhereClause,
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Stream,
            as: 'stream',
            attributes: ['id', 'name', 'code'],
          },
        ],
        order: [['first_name', 'ASC'], ['last_name', 'ASC']],
      });

      // Get student IDs
      const allStudentIds = allStudents.map(student => student.id);

      // Build invoice filter to find students with matching invoices
      const invoiceFilter = {
        student_id: { [Op.in]: allStudentIds },
        school_id: req.schoolId,
      };

      // Apply invoice filters (excluding academic_year as it's handled separately)
      if (status && status.trim() !== '') {
        invoiceFilter.status = status;
      }
      if (payment_model && payment_model.trim() !== '') {
        invoiceFilter.payment_model = payment_model;
      }

      // Get students who have matching invoices
      const studentsWithInvoices = await FeeInvoice.findAll({
        where: invoiceFilter,
        attributes: ['student_id'],
        group: ['student_id'],
        raw: true,
      });

      const studentIdsWithInvoices = studentsWithInvoices.map(s => s.student_id);
      
      // Filter students to only those with matching invoices
      const filteredStudents = allStudents.filter(student => 
        studentIdsWithInvoices.includes(student.id)
      );

      totalStudents = filteredStudents.length;
      
      // Apply pagination to filtered students
      const startIndex = offset;
      const endIndex = startIndex + parseInt(limit);
      students = filteredStudents.slice(startIndex, endIndex);
    } else {
      // No status/payment_model filters - use normal pagination
      const result = await Student.findAndCountAll({
        where: studentWhereClause,
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Stream,
            as: 'stream',
            attributes: ['id', 'name', 'code'],
          },
        ],
        order: [['first_name', 'ASC'], ['last_name', 'ASC']],
        limit: parseInt(limit),
        offset: offset,
      });
      
      students = result.rows;
      totalStudents = result.count;
    }

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          current_page: parseInt(page),
          total_pages: 0,
          total_students: 0,
          students: [],
        },
      });
    }

    // Get student IDs
    const studentIds = students.map(student => student.id);

    // Build invoice filter for summary calculations only
    const invoiceWhereClause = {
      student_id: { [Op.in]: studentIds },
      school_id: req.schoolId,
    };

    // Apply filters only if they are provided and not empty
    if (academic_year && academic_year.trim() !== '') {
      invoiceWhereClause.academic_year = academic_year;
    }
    if (status && status.trim() !== '') {
      invoiceWhereClause.status = status;
    }
    if (payment_model && payment_model.trim() !== '') {
      invoiceWhereClause.payment_model = payment_model;
    }

    // Use Sequelize aggregation for fast summary calculations
    const invoiceSummaries = await FeeInvoice.findAll({
      where: invoiceWhereClause,
      attributes: [
        'student_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_invoices'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount'],
        [sequelize.fn('SUM', sequelize.col('paid_amount')), 'paid_amount'],
        [sequelize.fn('SUM', sequelize.col('balance_amount')), 'balance_amount'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'paid' THEN 1 END")), 'paid_count'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'sent' THEN 1 END")), 'pending_count'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'overdue' THEN 1 END")), 'overdue_count'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'partial_paid' THEN 1 END")), 'partial_count'],
      ],
      group: ['student_id'],
      raw: true,
    });

    // Create a map for quick lookup
    const summaryMap = {};
    invoiceSummaries.forEach(summary => {
      summaryMap[summary.student_id] = {
        total_invoices: parseInt(summary.total_invoices) || 0,
        total_amount: parseFloat(summary.total_amount) || 0,
        paid_amount: parseFloat(summary.paid_amount) || 0,
        balance_amount: parseFloat(summary.balance_amount) || 0,
        paid_count: parseInt(summary.paid_count) || 0,
        pending_count: parseInt(summary.pending_count) || 0,
        overdue_count: parseInt(summary.overdue_count) || 0,
        partial_count: parseInt(summary.partial_count) || 0,
      };
    });

    // Build response data with students and their summaries only
    const studentsData = students
      .map(student => {
        const summary = summaryMap[student.id] || {
          total_invoices: 0,
          total_amount: 0,
          paid_amount: 0,
          balance_amount: 0,
          paid_count: 0,
          pending_count: 0,
          overdue_count: 0,
          partial_count: 0,
        };

        return {
          student_id: student.id,
          student_name: getStudentFullName(student),
          admission_number: student.admission_number,
          class_name: student.current_class,
          section: student.section,
          branch: student.branch,
          total_invoices: summary.total_invoices,
          total_amount: summary.total_amount,
          paid_amount: summary.paid_amount,
          balance_amount: summary.balance_amount,
          paid_count: summary.paid_count,
          pending_count: summary.pending_count,
          overdue_count: summary.overdue_count,
          partial_count: summary.partial_count,
          // Keep empty arrays for now - we'll populate them below
          invoices: [],
          grouped_invoices: [],
          ungrouped_invoices: [],
        };
      });





    // Now fetch detailed invoices for students who have them (only if needed)
    const studentsWithInvoices = studentsData.filter(student => student.total_invoices > 0);
    
    if (studentsWithInvoices.length > 0) {
      const studentIdsWithInvoices = studentsWithInvoices.map(student => student.student_id);
      
      // Fetch detailed invoices for students who have them
      const detailedInvoices = await FeeInvoice.findAll({
        where: {
          student_id: { [Op.in]: studentIdsWithInvoices },
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
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Stream,
            as: 'stream',
            attributes: ['id', 'name', 'code'],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      // Group invoices by student
      const studentInvoices = {};
      detailedInvoices.forEach(invoice => {
        const studentId = invoice.student_id;
        if (!studentInvoices[studentId]) {
          studentInvoices[studentId] = [];
        }
        studentInvoices[studentId].push(invoice);
      });

      // Group invoices by receipt_number for paid/partial_paid invoices
      const groupedInvoices = {};
      const ungroupedInvoices = [];

      detailedInvoices.forEach(invoice => {
        if (invoice.receipt_number && ['paid', 'partial_paid'].includes(invoice.status)) {
          if (!groupedInvoices[invoice.receipt_number]) {
            groupedInvoices[invoice.receipt_number] = {
              receipt_number: invoice.receipt_number,
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
              stream: invoice.stream,
              feeStructure: invoice.feeStructure,
              payment_model: invoice.payment_model,
            };
          }
          groupedInvoices[invoice.receipt_number].invoices.push(invoice);
          groupedInvoices[invoice.receipt_number].total_amount += parseFloat(invoice.total_amount || 0);
          groupedInvoices[invoice.receipt_number].total_paid += parseFloat(invoice.paid_amount || 0);
          groupedInvoices[invoice.receipt_number].total_balance += parseFloat(invoice.balance_amount || 0);
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
          id: group.receipt_number,
          receipt_number: group.receipt_number,
          invoice_number: group.invoices.map(inv => inv.invoice_number).join(', '),
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
          payment_date: group.payment_date,
          payment_method: group.payment_method,
          transaction_id: group.transaction_id,
          payment_model: group.payment_model,
          student: group.student,
          branch: group.branch,
          stream: group.stream,
          feeStructure: group.feeStructure,
          is_grouped: true
        };
      });

      // Sort by payment date (newest first)
      groupedArray.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

      // Update students with their detailed invoices
      studentsData.forEach(student => {
        const studentInvoicesList = studentInvoices[student.student_id] || [];
        student.invoices = studentInvoicesList;
        
        student.grouped_invoices = groupedArray.filter(group => group.student?.id === student.student_id);
        student.ungrouped_invoices = ungroupedInvoices.filter(inv => inv.student_id === student.student_id);
      });
    }

    // Calculate total pages based on filtered students when invoice filters are applied
    const totalPages = hasInvoiceFilters 
      ? Math.ceil(studentsData.length / parseInt(limit))
      : Math.ceil(totalStudents / parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_students: hasInvoiceFilters ? studentsData.length : totalStudents,
        students: studentsData,
      },
    });
  } catch (error) {
    logger.error('Error fetching student fee invoice summary:', error);
    return next(error);
  }
};

module.exports = {
  getStudentDues,
  getStudentFeeLedger,
  recordSmartPayment,
  getAvailableMonths,
  getGroupedStudentInvoices,
  getStudentFeeInvoiceSummary,
}; 