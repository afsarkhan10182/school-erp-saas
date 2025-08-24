const { FeeInvoice, FeeStructure, FeeType, Student, Parent, School, FeePayment, Branch } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { logger } = require('../../utils/logger');
const { Op } = require('sequelize');
const { generateInstallmentReceipt } = require('../../services/receipt.service');
const { generateUniqueInvoiceNumber, getClassCode } = require('./core');
const { createDateRange } = require('../../utils/dateUtils');

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

// Get receipt for a specific invoice
const getReceiptForInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

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
          model: FeePayment,
          as: 'payments',
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if (!invoice.payments || invoice.payments.length === 0) {
      throw new ApiError(404, 'No payments found for this invoice');
    }

    // If there's only one payment, return it directly
    if (invoice.payments.length === 1) {
      const payment = invoice.payments[0];
      
      // Use the new on-demand approach
      const { generateReceiptData } = require('../../services/receipt.service');
      const receiptData = await generateReceiptData(payment.id);

      return res.status(200).json({
        success: true,
        data: {
          ...receiptData,
          payment: {
            id: payment.id,
            payment_number: payment.payment_number,
            payment_amount: payment.payment_amount,
            payment_method: payment.payment_method,
            payment_date: payment.payment_date,
          },
          // Include invoice information for month details
          invoice: {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            payment_model: invoice.payment_model,
            month: invoice.month,
            year: invoice.year,
            total_amount: invoice.total_amount,
            paid_amount: invoice.paid_amount,
            balance_amount: invoice.balance_amount,
            academic_year: invoice.academic_year,
            class_name: invoice.class_name,
            section: invoice.section,
          },
        },
      });
    } else {
      // Multiple payments - return all payments with their receipts
      const paymentsWithReceipts = [];
      
      for (const payment of invoice.payments) {
        // Use the new on-demand approach for each payment
        const { generateReceiptData } = require('../../services/receipt.service');
        const receiptData = await generateReceiptData(payment.id);
        
        paymentsWithReceipts.push({
          payment: {
            id: payment.id,
            payment_number: payment.payment_number,
            payment_amount: payment.payment_amount,
            payment_method: payment.payment_method,
            payment_date: payment.payment_date,
            created_at: payment.created_at,
          },
          receipt: receiptData
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          invoice: {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            payment_model: invoice.payment_model,
            month: invoice.month,
            year: invoice.year,
            total_amount: invoice.total_amount,
            paid_amount: invoice.paid_amount,
            balance_amount: invoice.balance_amount,
            academic_year: invoice.academic_year,
            class_name: invoice.class_name,
            section: invoice.section,
          },
          payments: paymentsWithReceipts,
          total_payments: paymentsWithReceipts.length,
          has_multiple_payments: true,
        },
      });
    }
  } catch (error) {
    logger.error('Error fetching receipt for invoice:', error);
    return next(error);
  }
};

// Get enhanced payment receipts with detailed information
const getEnhancedPaymentReceipts = async (req, res, next) => {
  try {
    const { student_id, academic_year, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      school_id: req.schoolId,
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      whereClause['$invoice.branch_id$'] = req.user.branch_id;
    }

    if (student_id) whereClause.student_id = student_id;
    if (academic_year) whereClause['$invoice.academic_year$'] = academic_year;

    const { count, rows: payments } = await FeePayment.findAndCountAll({
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

    const receipts = payments.map(payment => ({
      id: payment.id,
      payment_number: payment.payment_number,
      receipt_number: payment.receipt_number,
      payment_amount: parseFloat(payment.payment_amount || 0),
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      transaction_id: payment.transaction_id,
      receipt_data: payment.receipt_data,
      invoice: {
        id: payment.invoice.id,
        invoice_number: payment.invoice.invoice_number,
        fee_type: payment.invoice.feeStructure?.feeType?.name || 'Unknown',
        class_name: payment.invoice.class_name,
        section: payment.invoice.section,
        academic_year: payment.invoice.academic_year,
        total_amount: parseFloat(payment.invoice.total_amount || 0),
        balance_amount: parseFloat(payment.invoice.balance_amount || 0),
      },
      student: {
        id: payment.invoice.student.id,
        name: getStudentFullName(payment.invoice.student),
        admission_number: payment.invoice.student.admission_number,
        class: payment.invoice.student.current_class,
        section: payment.invoice.student.section,
      },
      created_at: payment.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: {
        receipts,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching enhanced payment receipts:', error);
    return next(error);
  }
};

// Get grouped receipts by date range
const getGroupedReceipts = async (req, res, next) => {
  try {
    const { from_date, to_date, student_id, class_name, section } = req.query;

    if (!from_date || !to_date) {
      throw new ApiError(400, 'From date and to date are required');
    }

    const { fromDateTime, toDateTime } = createDateRange(from_date, to_date);
    
    const whereClause = {
      school_id: req.schoolId,
      payment_date: {
        [Op.between]: [fromDateTime, toDateTime],
      },
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      whereClause['$invoice.branch_id$'] = req.user.branch_id;
    }

    if (student_id) whereClause.student_id = student_id;

    const includeClause = [
      {
        model: FeeInvoice,
        as: 'invoice',
        include: [
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
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code'],
          },
        ],
      },
    ];

    // Add student filters
    if (class_name) includeClause[0].include[0].where.current_class = class_name;
    if (section) includeClause[0].include[0].where.section = section;
    
    // Handle student branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      includeClause[0].include[0].where.branch_id = req.user.branch_id;
    }

    const payments = await FeePayment.findAll({
      where: whereClause,
      include: includeClause,
      order: [['payment_date', 'ASC']],
    });

    // Group payments by date
    const groupedPayments = {};
    let totalAmount = 0;
    let totalPayments = 0;

    payments.forEach(payment => {
      const dateKey = payment.payment_date.toISOString().split('T')[0];
      
      if (!groupedPayments[dateKey]) {
        groupedPayments[dateKey] = {
          date: dateKey,
          payments: [],
          total_amount: 0,
          payment_count: 0,
        };
      }

      groupedPayments[dateKey].payments.push({
        id: payment.id,
        payment_number: payment.payment_number,
        receipt_number: payment.receipt_number,
        payment_amount: parseFloat(payment.payment_amount || 0),
        payment_method: payment.payment_method,
        student_name: getStudentFullName(payment.invoice.student),
        admission_number: payment.invoice.student.admission_number,
        class: payment.invoice.student.current_class,
        section: payment.invoice.student.section,
        invoice_number: payment.invoice.invoice_number,
        branch_name: payment.invoice.branch?.name || payment.invoice.student?.branch?.name || 'N/A',
        created_at: payment.created_at,
      });

      groupedPayments[dateKey].total_amount += parseFloat(payment.payment_amount || 0);
      groupedPayments[dateKey].payment_count += 1;
      totalAmount += parseFloat(payment.payment_amount || 0);
      totalPayments += 1;
    });

    // Convert to array and sort by date
    const groupedArray = Object.values(groupedPayments).sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          total_amount: totalAmount,
          total_payments: totalPayments,
          date_range: {
            from_date,
            to_date,
          },
        },
        grouped_payments: groupedArray,
      },
    });
  } catch (error) {
    logger.error('Error fetching grouped receipts:', error);
    return next(error);
  }
};

// Generate combined receipt for multiple invoices (smart payment)
const generateCombinedReceipt = async (invoices, totalPaymentAmount, paymentMethod, transactionId, school, student, receiptGroupId, paymentDate = null) => {
  try {
    if (!invoices || invoices.length === 0) {
      throw new Error('No invoices provided for combined receipt');
    }

    // Use the provided receipt group ID instead of generating a new one
    const receiptNumber = receiptGroupId || `GROUP-${invoices.map(inv => inv.invoice_number).join('-')}`;
    
    // Calculate totals
    const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0);
    
    // Group invoices by month/year for monthly payments
    const monthlyPayments = invoices.filter(inv => inv.payment_model === 'monthly');
    const installmentPayments = invoices.filter(inv => inv.payment_model === 'installment');
    
    // Calculate months being paid in this receipt
    let remainingMonths = 0;
    let totalMonths = 12;
    let monthlyFeeAmount = 0;
    let monthsPaidInThisReceipt = 0;
    let totalPaidMonthsAfterThisReceipt = 0;
    
    if (monthlyPayments.length > 0) {
      // Count the months being paid in THIS receipt
      monthsPaidInThisReceipt = monthlyPayments.length;
      
      // Get the fee structure from the first monthly payment to get total months and monthly fee
      const firstMonthlyPayment = monthlyPayments[0];
      const feeStructure = firstMonthlyPayment.feeStructure;
      totalMonths = feeStructure?.total_months || 12;
      monthlyFeeAmount = parseFloat(feeStructure?.monthly_payment_amount || 0);
      
      const { calculatePaidMonths } = require('../../services/receipt.service');
      
      // Calculate total paid months across all fee structures for this student
      // If paymentDate is provided, calculate historical state; otherwise include current receipt
      const totalPaidMonths = await calculatePaidMonths(
        student.id, 
        firstMonthlyPayment.fee_structure_id, 
        firstMonthlyPayment.academic_year,
        paymentDate ? null : monthlyPayments, // Only include current invoices if not historical
        paymentDate // Pass payment date for historical calculation
      );
      
      // Use the calculated total (no need to add manually)
      totalPaidMonthsAfterThisReceipt = totalPaidMonths;
      remainingMonths = Math.max(0, totalMonths - totalPaidMonthsAfterThisReceipt);
      
      // Debug logging
      console.log('🔍 Combined Receipt Calculation:', {
        student_id: student.id,
        fee_structure_id: firstMonthlyPayment.fee_structure_id,
        total_months: totalMonths,
        monthly_fee: monthlyFeeAmount,
        total_paid_months: totalPaidMonths,
        months_in_this_receipt: monthsPaidInThisReceipt,
        remaining_months: remainingMonths,
        remaining_balance: remainingMonths * monthlyFeeAmount
      });
    }
    
    // Get branch information from the first invoice
    const branch = invoices[0].branch;
    
    // Create receipt data
    const receiptData = {
      receipt_number: receiptNumber,
      invoice_number: invoices.length === 1 ? invoices[0].invoice_number : invoices.map(inv => inv.invoice_number).join(', '),
      student_name: getStudentFullName(student),
      student_id: student.id,
      admission_number: student.admission_number,
      school_name: school.name,
      school_address: school.address,
      branch_name: branch?.name || null,
      branch_code: branch?.code || null,
      branch: branch ? {
        id: branch.id,
        name: branch.name,
        code: branch.code
      } : null,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod,
      transaction_id: transactionId,
      total_payment_amount: totalPaymentAmount,
      total_amount: totalAmount,
      total_paid: totalPaid,
      fee_type_name: monthlyPayments.length > 0 ? monthlyPayments[0].feeStructure?.feeType?.name || 'Tuition Fees' : 'Multiple Fee Types',
      invoices: invoices,
      monthly_payments: monthlyPayments,
      installment_payments: installmentPayments,
      paid_months: monthlyPayments.map(inv => ({
        month: inv.month,
        year: inv.year,
        amount: inv.total_amount,
        fee_type: inv.feeStructure?.feeType?.name
      })),
      remaining_months: remainingMonths,
      remaining_balance: monthlyFeeAmount > 0 ? remainingMonths * monthlyFeeAmount : totalAmount - totalPaid,
      total_months: totalMonths,
      months_paid: totalPaidMonthsAfterThisReceipt,
      receipt_group_id: receiptGroupId // Add receipt_group_id to the receipt data
    };

    // Generate HTML receipt (for internal use only - PDF, email, etc.)
    const receiptHtml = generateCombinedReceiptHtml(receiptData, school);

    // Note: Receipt data storage is handled in the service layer to avoid circular references

    return {
      receipt_number: receiptData.receipt_number,
      receipt_data: receiptData
    };
  } catch (error) {
    logger.error('Error generating combined receipt:', error);
    throw error;
  }
};

// Generate HTML for combined receipt
const generateCombinedReceiptHtml = (data, school) => {
  const paidMonthsText = data.paid_months.map(pm => 
    `${getMonthName(pm.month)} ${pm.year}`
  ).join(', ');

  return `
    <div class="receipt" style="width: 400px; background: white; border: 1px solid #ddd; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div class="header" style="text-align: center; padding: 15px; border-bottom: 2px solid #333; background: #f8f9fa;">
        <div class="trust-name" style="font-size: 18px; font-weight: bold; color: #000;">${school.trust_name || 'School Trust'}</div>
        <div class="school-name" style="font-size: 16px; font-weight: bold; color: #000;">${school.name}</div>
        <div class="school-type" style="font-size: 14px; color: #000;">${school.school_type || 'Educational Institution'}</div>
        <div class="school-address" style="font-size: 12px; color: #000;">${school.address}</div>
      </div>
      
      <div style="padding: 20px;">
        <div class="receipt-title" style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #000;">MULTIPLE MONTHS PAYMENT RECEIPT</div>
        
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span class="info-label" style="font-weight: bold; color: #000;">Invoice No:</span>
            <span class="info-value" style="color: #000;">${data.invoice_number || 'N/A'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span class="info-label" style="font-weight: bold; color: #000;">Date:</span>
            <span class="info-value" style="color: #000;">${data.payment_date}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span class="info-label" style="font-weight: bold; color: #000;">Student Name:</span>
            <span class="info-value" style="color: #000;">${data.student_name}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span class="info-label" style="font-weight: bold; color: #000;">Admission No:</span>
            <span class="info-value" style="color: #000;">${data.admission_number}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span class="info-label" style="font-weight: bold; color: #000;">Payment Method:</span>
            <span class="info-value" style="color: #000;">${data.payment_method.toUpperCase()}</span>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="margin-bottom: 10px; color: #000;">Months Covered: ${paidMonthsText}</h4>
          <table class="fee-table" style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="border: 1px solid #000; padding: 8px; text-align: left; color: #000;">Month</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: left; color: #000;">Fee Type</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; color: #000;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.paid_months.map(pm => `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; color: #000;">${getMonthName(pm.month)} ${pm.year}</td>
                  <td style="border: 1px solid #000; padding: 8px; color: #000;">${pm.fee_type}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #000;">₹${pm.amount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="summary-section" style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="font-weight: bold; color: #000;">Total Amount:</span>
            <span style="font-weight: bold; color: #000;">₹${data.total_payment_amount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="color: #000;">Payment Method:</span>
            <span style="color: #000;">${data.payment_method.toUpperCase()}</span>
          </div>
          ${data.transaction_id ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="color: #000;">Transaction ID:</span>
            <span style="color: #000;">${data.transaction_id}</span>
          </div>
          ` : ''}
        </div>
        
        
        <div class="remaining-info" style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <div class="remaining-title" style="font-weight: bold; margin-bottom: 10px; color: #000;">Monthly Payment Summary</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="color: #000;">Remaining Months:</span>
            <span style="color: #000;">${data.remaining_months || 0} months</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #000;">Remaining Balance:</span>
            <span style="color: #000;">₹${(data.remaining_balance || 0).toLocaleString()}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <div style="border-top: 1px solid #000; width: 150px; margin: 0 auto; padding-top: 10px;">
            <span style="font-size: 12px; color: #000;">Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Helper function to get month name
const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};

// Get combined receipt for a specific receipt group
const getCombinedReceiptByGroupId = async (req, res, next) => {
  try {
    const { receiptGroupId } = req.params;

    if (!receiptGroupId) {
      throw new ApiError(400, 'Receipt group ID is required');
    }

    // Build where clause based on user role
    const whereClause = {
      receipt_group_id: receiptGroupId,
      school_id: req.schoolId,
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      whereClause.branch_id = req.user.branch_id;
    }

    // Find all invoices with this receipt group ID
    const invoices = await FeeInvoice.findAll({
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
          ],
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: FeePayment,
          as: 'payments',
          where: {
            payment_status: 'completed'
          },
          required: true,
          order: [['payment_date', 'ASC']],
        }
      ],
      order: [['month', 'ASC'], ['year', 'ASC']],
    });

    if (invoices.length === 0) {
      throw new ApiError(404, 'No invoices found for this receipt group');
    }

    // Check if there's stored receipt data in any of the payments
    let storedReceiptData = null;
    for (const invoice of invoices) {
      if (invoice.payments && invoice.payments.length > 0) {
        for (const payment of invoice.payments) {
          if (payment.receipt_data && payment.receipt_data.receipt_group_id === receiptGroupId) {
            storedReceiptData = payment.receipt_data;
            break;
          }
        }
        if (storedReceiptData) break;
      }
    }

    // If we have stored receipt data, use it but ensure branch information is included
    if (storedReceiptData) {
      logger.info(`Using stored receipt data for group ${receiptGroupId} - preserving historical state`);
      
      // Get branch information from the first invoice
      const branch = invoices[0].branch;
      
      // Ensure branch information is included in the stored receipt data
      const enhancedReceiptData = {
        ...storedReceiptData,
        branch_name: branch?.name || storedReceiptData.branch_name || null,
        branch_code: branch?.code || storedReceiptData.branch_code || null,
        branch: branch ? {
          id: branch.id,
          name: branch.name,
          code: branch.code
        } : storedReceiptData.branch || null,
      };
      
      return res.status(200).json({
        success: true,
        data: enhancedReceiptData,
      });
    }

    // If no stored data, generate on-demand (fallback for old receipts)
    logger.info(`No stored receipt data found for group ${receiptGroupId}, generating on-demand`);
    
    // Get school and student data
    const school = await School.findByPk(req.schoolId);
    const student = invoices[0].student;

    // Calculate total payment amount
    const totalPaymentAmount = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.paid_amount || 0), 0);

    // Get the payment date from the first payment for historical calculation
    const paymentDate = invoices[0].payments && invoices[0].payments.length > 0 
      ? invoices[0].payments[0].payment_date 
      : null;

    // Generate combined receipt
    const combinedReceipt = await generateCombinedReceipt(
      invoices,
      totalPaymentAmount,
      invoices[0].payment_method || 'cash',
      invoices[0].transaction_id,
      school,
      student,
      receiptGroupId, // Pass the original receipt group ID
      paymentDate // Pass payment date for historical calculation
    );

    return res.status(200).json({
      success: true,
      data: combinedReceipt.receipt_data || combinedReceipt,
    });
  } catch (error) {
    logger.error('Error fetching combined receipt:', error);
    return next(error);
  }
};

// Get receipt data for a specific payment (on-demand approach)
const getReceiptData = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      throw new ApiError(400, 'Payment ID is required');
    }

    // Build where clause based on user role
    const whereClause = {
      id: paymentId,
      school_id: req.schoolId,
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      whereClause['$invoice.branch_id$'] = req.user.branch_id;
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
          model: School,
          as: 'school',
        },
      ],
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    // Generate receipt data on-demand
    const { generateReceiptData } = require('../../services/receipt.service');
    const receiptData = await generateReceiptData(paymentId);

    return res.status(200).json({
      success: true,
      data: receiptData,
    });
  } catch (error) {
    logger.error('Error fetching receipt data:', error);
    return next(error);
  }
};

// Get combined receipt data for multiple payments (on-demand approach)
const getCombinedReceiptData = async (req, res, next) => {
  try {
    const { paymentIds } = req.body;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      throw new ApiError(400, 'Payment IDs array is required');
    }

    // Build where clause based on user role
    const whereClause = {
      id: paymentIds,
      school_id: req.schoolId,
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      whereClause['$invoice.branch_id$'] = req.user.branch_id;
    }

    const payments = await FeePayment.findAll({
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
          model: School,
          as: 'school',
        },
      ],
      order: [['payment_date', 'ASC']],
    });

    if (payments.length === 0) {
      throw new ApiError(404, 'No payments found');
    }

    // Generate combined receipt data on-demand
    const { generateCombinedReceiptData: generateReceiptData } = require('../../services/receipt.service');
    const receiptData = await generateReceiptData(paymentIds);

    return res.status(200).json({
      success: true,
      data: receiptData,
    });
  } catch (error) {
    logger.error('Error fetching combined receipt data:', error);
    return next(error);
  }
};

// Get receipt data for an invoice (on-demand approach)
const getInvoiceReceiptData = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, 'Invoice ID is required');
    }

    // Build where clause based on user role
    const whereClause = {
      id: id,
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
          model: FeePayment,
          as: 'payments',
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if (!invoice.payments || invoice.payments.length === 0) {
      throw new ApiError(404, 'No payments found for this invoice');
    }

    // If there's only one payment, return its receipt data
    if (invoice.payments.length === 1) {
      const { generateReceiptData } = require('../../services/receipt.service');
      const receiptData = await generateReceiptData(invoice.payments[0].id);

      return res.status(200).json({
        success: true,
        data: receiptData,
      });
    } else {
      // Multiple payments - return combined receipt data
      const paymentIds = invoice.payments.map(payment => payment.id);
      const { generateCombinedReceiptData: generateReceiptData } = require('../../services/receipt.service');
      const receiptData = await generateReceiptData(paymentIds);

      return res.status(200).json({
        success: true,
        data: receiptData,
      });
    }
  } catch (error) {
    logger.error('Error fetching invoice receipt data:', error);
    return next(error);
  }
};

// Simple receipts report for dedicated receipts page
const getReceiptsReport = async (req, res, next) => {
  try {
    const { 
      from_date, 
      to_date, 
      payment_method, 
      class_id, 
      section, 
      search,
      branch_id,
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      school_id: req.schoolId,
    };

    // Add branch filter for branch admins
    if (req.user.role === 'branch_admin') {
      whereClause['$invoice.branch_id$'] = req.user.branch_id;
    }

    // Date filter
    if (from_date && to_date) {
      const { fromDateTime, toDateTime } = createDateRange(from_date, to_date);
      whereClause.payment_date = {
        [Op.between]: [fromDateTime, toDateTime],
      };
    }

    // Payment method filter
    if (payment_method) {
      whereClause.payment_method = payment_method;
    }

    // Branch filter
    if (branch_id) {
      whereClause['$invoice.student.branch_id$'] = branch_id;
    }

    const includeClause = [
      {
        model: FeeInvoice,
        as: 'invoice',
        include: [
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
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
      },
    ];

    // Add student filters
    if (class_id) {
      if (!includeClause[0].include[0].where) includeClause[0].include[0].where = {};
      includeClause[0].include[0].where.class_id = class_id;
      if (!includeClause[0].where) includeClause[0].where = {};
      includeClause[0].where.student_id = { [Op.not]: null };
    }
    if (section) {
      if (!includeClause[0].include[0].where) includeClause[0].include[0].where = {};
      includeClause[0].include[0].where.section = section;
    }
    
    // Add search filter
    if (search) {
      if (!includeClause[0].include[0].where) {
        includeClause[0].include[0].where = {};
      }
      includeClause[0].include[0].where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { admission_number: { [Op.iLike]: `%${search}%` } },
        { roll_number: { [Op.iLike]: `%${search}%` } },
      ];
      if (!includeClause[0].where) {
        includeClause[0].where = {};
      }
      includeClause[0].where.student_id = { [Op.not]: null };
    }

    // Handle student branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      if (!includeClause[0].include[0].where) includeClause[0].include[0].where = {};
      includeClause[0].include[0].where.branch_id = req.user.branch_id;
    }

    // Ensure we only get payments with valid student data
    if (!includeClause[0].include[0].where) includeClause[0].include[0].where = {};
    includeClause[0].include[0].where.id = { [Op.not]: null };
    if (!includeClause[0].where) includeClause[0].where = {};
    includeClause[0].where.student_id = { [Op.not]: null };

    // Get all payments
    const allPayments = await FeePayment.findAll({
      where: whereClause,
      include: includeClause,
      order: [['payment_date', 'DESC']],
    });

    // Group by receipt_group_id if exists, otherwise show individual
    const groupedReceipts = {};
    const individualReceipts = [];

    allPayments.forEach(payment => {
      const receiptGroupId = payment.invoice?.receipt_group_id;
      
      if (receiptGroupId) {
        if (!groupedReceipts[receiptGroupId]) {
          groupedReceipts[receiptGroupId] = {
            receipt_group_id: receiptGroupId,
            payments: [],
            total_amount: 0,
            payment_date: payment.payment_date,
            payment_method: payment.payment_method,
            student: payment.invoice?.student,
            branch: payment.invoice?.student?.branch,
            fee_types: new Set(),
            month_count: 0,
            months: []
          };
        }
        
        groupedReceipts[receiptGroupId].payments.push(payment);
        groupedReceipts[receiptGroupId].total_amount += parseFloat(payment.payment_amount || 0);
        groupedReceipts[receiptGroupId].fee_types.add(payment.invoice?.feeStructure?.feeType?.name || 'N/A');
        groupedReceipts[receiptGroupId].month_count += 1;
        
        // Add month information if available
        if (payment.invoice?.month && payment.invoice?.year) {
          groupedReceipts[receiptGroupId].months.push({
            month: payment.invoice.month,
            year: payment.invoice.year
          });
        }
      } else {
        individualReceipts.push(payment);
      }
    });

    // Convert grouped receipts to simple format
    const groupedReceiptsArray = Object.values(groupedReceipts).map(group => ({
      id: group.receipt_group_id,
      receipt_number: group.receipt_group_id,
      payment_date: group.payment_date,
      payment_amount: group.total_amount,
      payment_method: group.payment_method,
      student: {
        id: group.student?.id,
        name: group.student?.first_name && group.student?.last_name 
          ? `${group.student?.first_name} ${group.student?.last_name}`.trim()
          : group.student?.first_name || group.student?.last_name || null,
        admission_number: group.student?.admission_number,
        roll_number: group.student?.roll_number,
        current_class: group.student?.current_class,
        section: group.student?.section,
      },
      fee_type: Array.from(group.fee_types).join(', '),
      branch: group.branch?.name,
      month_count: group.month_count,
      months: group.months
    }));

    // Format individual receipts
    const individualReceiptsArray = individualReceipts.map(payment => ({
      id: payment.id,
      receipt_number: payment.receipt_number || `RCP-${payment.id}`,
      payment_date: payment.payment_date,
      payment_amount: parseFloat(payment.payment_amount),
      payment_method: payment.payment_method,
      student: {
        id: payment.invoice?.student?.id,
        name: payment.invoice?.student?.first_name && payment.invoice?.student?.last_name 
          ? `${payment.invoice?.student?.first_name} ${payment.invoice?.student?.last_name}`.trim()
          : payment.invoice?.student?.first_name || payment.invoice?.student?.last_name || null,
        admission_number: payment.invoice?.student?.admission_number,
        roll_number: payment.invoice?.student?.roll_number,
        current_class: payment.invoice?.student?.current_class,
        section: payment.invoice?.student?.section,
      },
      fee_type: payment.invoice?.feeStructure?.feeType?.name || 'N/A',
      branch: payment.invoice?.student?.branch?.name,
      month_count: 1
    }));

    // Combine and sort all receipts
    const allReceipts = [...groupedReceiptsArray, ...individualReceiptsArray]
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

    // Filter out receipts with incomplete student data
    let finalReceipts = allReceipts;
    if (class_id || search) {
      finalReceipts = allReceipts.filter(receipt => 
        receipt.student && 
        receipt.student.id && 
        receipt.student.name && 
        receipt.student.name.trim() !== '' &&
        receipt.student.name !== 'Student data unavailable'
      );
    }

    // Apply pagination
    const totalRecords = finalReceipts.length;
    const totalPages = Math.ceil(totalRecords / parseInt(limit));
    const paginatedReceipts = finalReceipts.slice(offset, offset + parseInt(limit));

    // Calculate summary data
    const totalCollected = finalReceipts.reduce((sum, receipt) => sum + receipt.payment_amount, 0);
    const totalReceipts = finalReceipts.length;

    // Payment method breakdown
    const paymentMethodBreakdown = {};
    finalReceipts.forEach(receipt => {
      const method = receipt.payment_method || 'cash';
      if (!paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method] = { amount: 0, count: 0 };
      }
      paymentMethodBreakdown[method].amount += receipt.payment_amount;
      paymentMethodBreakdown[method].count += 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        payments: paginatedReceipts,
        summary: {
          total_collected: totalCollected,
          total_receipts: totalReceipts,
          payment_methods: Object.entries(paymentMethodBreakdown).map(([method, data]) => ({
            payment_method: method,
            amount: data.amount,
            count: data.count
          })),
        },
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_records: totalRecords,
          per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching receipts report:', error);
    return next(error);
  }
};

module.exports = {
  getReceiptForInvoice,
  getEnhancedPaymentReceipts,
  getGroupedReceipts,
  generateCombinedReceipt,
  getCombinedReceiptByGroupId,
  // New on-demand endpoints
  getReceiptData,
  getCombinedReceiptData,
  getInvoiceReceiptData,
  // Receipts report
  getReceiptsReport,
}; 