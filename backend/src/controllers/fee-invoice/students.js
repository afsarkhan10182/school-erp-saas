const { FeeInvoice, FeeStructure, FeeType, Student, Parent, School, FeePayment, Branch } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { logger } = require('../../utils/logger');
const { Op } = require('sequelize');
const { generateCombinedReceipt } = require('./receipts');
const { getAvailablePaymentMonths, getEarliestPendingMonth, getMonthName } = require('../../utils/academicYearUtils');
const { generateUniqueInvoiceNumber, getClassCode } = require('./core');



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

    // Get unpaid invoices using shared utility
    const invoices = await getStudentInvoices(student_id, req.schoolId, { 
      academic_year,
      branchId: req.user.role === 'branch_admin' ? req.user.branch_id : null
    });

    // Calculate totals
    const totalDues = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.balance_amount || 0), 0);
    const totalInvoices = invoices.length;
    
    // Calculate overdue amount
    const overdueInvoices = invoices.filter(invoice => invoice.status === 'overdue');
    const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.balance_amount || 0), 0);

    // Separate monthly payments from regular invoices
    const monthlyPayments = invoices.filter(invoice => 
      invoice.feeStructure?.payment_model === 'monthly'
    );
    
    const regularInvoices = invoices.filter(invoice => 
      invoice.feeStructure?.payment_model !== 'monthly'
    );

    // Group monthly payments by receipt_group_id for paid/partial_paid invoices
    const groupedMonthlyPayments = [];
    const ungroupedMonthlyPayments = [];
    
    // Group invoices that have receipt_group_id (paid/partial_paid)
    const groupedInvoices = {};
    monthlyPayments.forEach(invoice => {
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
          };
        }
        groupedInvoices[invoice.receipt_group_id].invoices.push(invoice);
        groupedInvoices[invoice.receipt_group_id].total_amount += parseFloat(invoice.total_amount || 0);
        groupedInvoices[invoice.receipt_group_id].total_paid += parseFloat(invoice.paid_amount || 0);
        groupedInvoices[invoice.receipt_group_id].total_balance += parseFloat(invoice.balance_amount || 0);
      } else {
        ungroupedMonthlyPayments.push(invoice);
      }
    });

    // Convert grouped invoices to array format with enhanced info
    Object.values(groupedInvoices).forEach(group => {
      const months = group.invoices.map(inv => inv.month).sort((a, b) => a - b);
      const years = [...new Set(group.invoices.map(inv => inv.year))];
      
      groupedMonthlyPayments.push({
        id: group.receipt_group_id, // Use receipt_group_id as ID for grouping
        receipt_group_id: group.receipt_group_id,
        invoice_number: `INV-${group.receipt_group_id.slice(-8)}`,
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
        month_names: group.invoices.map(inv => `${inv.month}/${inv.year}`).join(', '),
        display_name: `INV-${group.receipt_group_id.slice(-8)} → Paid for ${group.invoices.map(inv => `${inv.month}/${inv.year}`).join(', ')} (₹${group.total_paid.toLocaleString()})`,
        payment_date: group.payment_date,
        payment_method: group.payment_method,
        transaction_id: group.transaction_id,
        payment_model: 'monthly',
        feeStructure: group.invoices[0]?.feeStructure,
        is_grouped: true
      });
    });

    // Calculate monthly payment statistics
    const monthlyPaymentCount = ungroupedMonthlyPayments.length + groupedMonthlyPayments.length;
    const monthlyPaymentTotal = ungroupedMonthlyPayments.reduce((sum, invoice) => sum + parseFloat(invoice.balance_amount || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          total_dues: totalDues,
          overdue_amount: overdueAmount,
          invoice_count: totalInvoices,
          monthly_payment_count: monthlyPaymentCount,
          monthly_payment_total: monthlyPaymentTotal,
          regular_invoice_count: regularInvoices.length,
          regular_invoice_total: regularInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.balance_amount || 0), 0)
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
          ...ungroupedMonthlyPayments.map(invoice => ({
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

    // Group monthly payments by receipt_group_id for paid/partial_paid invoices
    const groupedMonthlyPayments = [];
    const ungroupedMonthlyPayments = [];
    
    // Group invoices that have receipt_group_id (paid/partial_paid)
    const groupedInvoices = {};
    monthlyPayments.forEach(invoice => {
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
          };
        }
        groupedInvoices[invoice.receipt_group_id].invoices.push(invoice);
        groupedInvoices[invoice.receipt_group_id].total_amount += parseFloat(invoice.total_amount || 0);
        groupedInvoices[invoice.receipt_group_id].total_paid += parseFloat(invoice.paid_amount || 0);
        groupedInvoices[invoice.receipt_group_id].total_balance += parseFloat(invoice.balance_amount || 0);
      } else {
        ungroupedMonthlyPayments.push(invoice);
      }
    });

    // Convert grouped invoices to array format with enhanced info
    Object.values(groupedInvoices).forEach(group => {
      const months = group.invoices.map(inv => inv.month).sort((a, b) => a - b);
      const years = [...new Set(group.invoices.map(inv => inv.year))];
      
      groupedMonthlyPayments.push({
        id: group.receipt_group_id, // Use receipt_group_id as ID for grouping
        receipt_group_id: group.receipt_group_id,
        invoice_number: `INV-${group.receipt_group_id.slice(-8)}`,
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
        month_names: group.invoices.map(inv => `${inv.month}/${inv.year}`).join(', '),
        display_name: `INV-${group.receipt_group_id.slice(-8)} → Paid for ${group.invoices.map(inv => `${inv.month}/${inv.year}`).join(', ')} (₹${group.total_paid.toLocaleString()})`,
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
          name: `${student.first_name} ${student.last_name}`,
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
              receipt_group_id: invoice.receipt_group_id,
              months_covered: invoice.months_covered,
              month_names: invoice.month_names,
              display_name: invoice.display_name,
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

    // Generate a common receipt group ID for this smart payment
    // Generate receipt group ID using the same pattern as invoices
    let classCode = 'GEN'; // Default fallback
    if (pendingInvoices[0]?.feeStructure?.class_name) {
      classCode = getClassCode(pendingInvoices[0].feeStructure);
    } else if (student.current_class) {
      const cleanName = student.current_class.replace(/^Class\s+/i, '').trim();
      classCode = cleanName.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      classCode = classCode.length >= 3 ? classCode : `${classCode}${'0'.repeat(3 - classCode.length)}`;
    }
    
    // Generate year-month format like individual invoices
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 1000000); // 6-digit random for uniqueness
    const receiptGroupId = `INV-GROUP-${yyyymm}-${classCode}-${String(random).padStart(6, '0')}`;
    
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
        // Generate receipt number using the same pattern as invoices
        let classCode = 'GEN'; // Default fallback
        if (pendingInvoices[0]?.feeStructure?.class_name) {
          classCode = getClassCode(pendingInvoices[0].feeStructure);
        } else if (student.current_class) {
          const cleanName = student.current_class.replace(/^Class\s+/i, '').trim();
          classCode = cleanName.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          classCode = classCode.length >= 3 ? classCode : `${classCode}${'0'.repeat(3 - classCode.length)}`;
        }

        // Create payment record for historical tracking
        const paymentData = {
          payment_number: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          receipt_number: generateUniqueInvoiceNumber(classCode),
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

        const payment = await FeePayment.create(paymentData);

        // Update invoice with receipt_group_id for grouping
        await invoice.update({
          paid_amount: newPaidAmount,
          balance_amount: newBalanceAmount,
          last_payment_date: payment_date || new Date(),
          status: newBalanceAmount <= 0 ? 'paid' : 'partial_paid',
          receipt_group_id: receiptGroupId, // Group all invoices under same receipt
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
          receipt_group_id: receiptGroupId,
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
    }).then(invoices => invoices.filter(invoice => invoice.receipt_group_id === receiptGroupId));

    // Get school data for receipt generation
    const school = await School.findByPk(req.schoolId);

    // Generate combined receipt
    const combinedReceipt = await generateCombinedReceipt(
      groupedInvoices,
      totalApplied,
      payment_method,
      transaction_id,
      school,
      student
    );

    return res.status(200).json({
      success: true,
      message: 'Smart payment recorded successfully',
      data: {
        student_id,
        student_name: `${student.first_name} ${student.last_name}`,
        total_payment_amount: parseFloat(payment_amount),
        total_applied_amount: totalApplied,
        remaining_amount: remainingAmount,
        invoices_processed: appliedPayments.length,
        applied_payments: appliedPayments,
        receipt_group_id: receiptGroupId,
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
          name: `${student.first_name} ${student.last_name}`,
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

    // Group invoices by receipt_group_id for paid/partial_paid invoices
    const groupedInvoices = {};
    const ungroupedInvoices = [];

    invoices.forEach(invoice => {
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
        ...group,
        months_covered: group.invoices.length,
        month_range: monthRange,
        year: years[0],
        month_names: monthNames,
        display_name: `${group.receipt_group_id.startsWith('INV-GROUP-') ? group.receipt_group_id : `INV-${group.receipt_group_id.slice(-8)}`} → Paid for ${monthNames} (₹${group.total_paid.toLocaleString()})`,
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
          name: `${student.first_name} ${student.last_name}`,
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

module.exports = {
  getStudentDues,
  getStudentFeeLedger,
  recordSmartPayment,
  getAvailableMonths,
  getGroupedStudentInvoices,
}; 