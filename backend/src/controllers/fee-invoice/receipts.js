const { FeeInvoice, FeeStructure, FeeType, Student, Parent, School, FeePayment, Branch } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { logger } = require('../../utils/logger');
const { Op } = require('sequelize');
const { generateInstallmentReceipt } = require('../../services/receipt.service');

// Generate receipt for a specific invoice
const generateReceiptForInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_amount, payment_method = 'cash', transaction_id } = req.body;

    if (!payment_amount || payment_amount <= 0) {
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
          ],
        },
      ],
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if (invoice.status === 'cancelled') {
      throw new ApiError(400, 'Cannot generate receipt for cancelled invoice');
    }

    // Get school data
    const school = await School.findByPk(req.schoolId);

    // Generate receipt
    const receipt = await generateInstallmentReceipt(
      invoice,
      payment_amount,
      payment_method,
      transaction_id,
      school,
      invoice.student
    );

    logger.info(`Receipt generated for invoice ${invoice.invoice_number}: ${receipt.receipt_number}`);

    return res.status(200).json({
      success: true,
      message: 'Receipt generated successfully',
      data: {
        receipt_number: receipt.receipt_number,
        receipt_html: receipt.receipt_html,
        receipt_data: {
          invoice_number: invoice.invoice_number,
          student_name: `${invoice.student.first_name} ${invoice.student.last_name}`,
          payment_amount: payment_amount,
          payment_method: payment_method,
          transaction_id: transaction_id,
          school_name: school.name,
          fee_type: invoice.feeStructure?.feeType?.name || 'Unknown',
          class_name: invoice.class_name,
          section: invoice.section,
        },
      },
    });
  } catch (error) {
    logger.error('Error generating receipt for invoice:', error);
    return next(error);
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
      
      // If receipt_html is missing, regenerate it
      let receiptHtml = payment.receipt_html;
      let receiptData = payment.receipt_data;
      
      if (!receiptHtml) {
        try {
          // Get school data for receipt regeneration
          const school = await School.findByPk(req.schoolId);
          
          // Regenerate receipt
          const receipt = await generateInstallmentReceipt(
            invoice,
            payment.payment_amount,
            payment.payment_method,
            payment.transaction_id,
            school,
            invoice.student
          );
          
          receiptHtml = receipt.receipt_html;
          receiptData = receipt.receipt_data;
          
          // Update the payment record with the regenerated receipt
          await payment.update({
            receipt_html: receiptHtml,
            receipt_data: receiptData
          });
          
          logger.info(`Receipt regenerated for payment ${payment.payment_number}`);
        } catch (error) {
          logger.error('Error regenerating receipt:', error);
          // Continue with null receipt_html if regeneration fails
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          receipt_number: payment.receipt_number,
          receipt_html: receiptHtml,
          receipt_data: receiptData,
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
        let receiptHtml = payment.receipt_html;
        let receiptData = payment.receipt_data;
        
        // If receipt_html is missing, regenerate it
        if (!receiptHtml) {
          try {
            // Get school data for receipt regeneration
            const school = await School.findByPk(req.schoolId);
            
            // Regenerate receipt
            const receipt = await generateInstallmentReceipt(
              invoice,
              payment.payment_amount,
              payment.payment_method,
              payment.transaction_id,
              school,
              invoice.student
            );
            
            receiptHtml = receipt.receipt_html;
            receiptData = receipt.receipt_data;
            
            // Update the payment record with the regenerated receipt
            await payment.update({
              receipt_html: receiptHtml,
              receipt_data: receiptData
            });
            
            logger.info(`Receipt regenerated for payment ${payment.payment_number}`);
          } catch (error) {
            logger.error('Error regenerating receipt:', error);
            // Continue with null receipt_html if regeneration fails
          }
        }
        
        paymentsWithReceipts.push({
          payment: {
            id: payment.id,
            payment_number: payment.payment_number,
            payment_amount: payment.payment_amount,
            payment_method: payment.payment_method,
            payment_date: payment.payment_date,
            created_at: payment.created_at,
          },
          receipt: {
            receipt_number: payment.receipt_number,
            receipt_html: receiptHtml,
            receipt_data: receiptData,
          }
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
      receipt_html: payment.receipt_html,
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
        name: `${payment.invoice.student.first_name} ${payment.invoice.student.last_name}`,
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
    const { start_date, end_date, student_id, class_name, section } = req.query;

    if (!start_date || !end_date) {
      throw new ApiError(400, 'Start date and end date are required');
    }

    const whereClause = {
      school_id: req.schoolId,
      payment_date: {
        [Op.between]: [new Date(start_date), new Date(end_date)],
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
        student_name: `${payment.invoice.student.first_name} ${payment.invoice.student.last_name}`,
        admission_number: payment.invoice.student.admission_number,
        class: payment.invoice.student.current_class,
        section: payment.invoice.student.section,
        invoice_number: payment.invoice.invoice_number,
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
            start_date,
            end_date,
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
const generateCombinedReceipt = async (invoices, totalPaymentAmount, paymentMethod, transactionId, school, student) => {
  try {
    if (!invoices || invoices.length === 0) {
      throw new Error('No invoices provided for combined receipt');
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
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
      
      // Calculate total paid months across all fee structures for this student (INCLUDING current receipt)
      const totalPaidMonths = await calculatePaidMonths(
        student.id, 
        firstMonthlyPayment.fee_structure_id, 
        firstMonthlyPayment.academic_year,
        monthlyPayments // Pass current invoices to include them in calculation
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
    
    // Create receipt data
    const receiptData = {
      receipt_number: receiptNumber,
      student_name: `${student.first_name} ${student.last_name}`,
      student_id: student.id,
      admission_number: student.admission_number,
      school_name: school.name,
      school_address: school.address,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod,
      transaction_id: transactionId,
      total_payment_amount: totalPaymentAmount,
      total_amount: totalAmount,
      total_paid: totalPaid,
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
      months_paid: totalPaidMonthsAfterThisReceipt
    };

    // Generate HTML receipt
    const receiptHtml = generateCombinedReceiptHtml(receiptData, school);

    return {
      receipt_number: receiptNumber,
      receipt_html: receiptHtml,
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
            <span class="info-label" style="font-weight: bold; color: #000;">Receipt No:</span>
            <span class="info-value" style="color: #000;">${data.receipt_number}</span>
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
      ],
      order: [['month', 'ASC'], ['year', 'ASC']],
    });

    if (invoices.length === 0) {
      throw new ApiError(404, 'No invoices found for this receipt group');
    }

    // Get school and student data
    const school = await School.findByPk(req.schoolId);
    const student = invoices[0].student;

    // Calculate total payment amount
    const totalPaymentAmount = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.paid_amount || 0), 0);

    // Generate combined receipt
    const combinedReceipt = await generateCombinedReceipt(
      invoices,
      totalPaymentAmount,
      invoices[0].payment_method || 'cash',
      invoices[0].transaction_id,
      school,
      student
    );

    return res.status(200).json({
      success: true,
      data: combinedReceipt,
    });
  } catch (error) {
    logger.error('Error fetching combined receipt:', error);
    return next(error);
  }
};

module.exports = {
  generateReceiptForInvoice,
  getReceiptForInvoice,
  getEnhancedPaymentReceipts,
  getGroupedReceipts,
  generateCombinedReceipt,
  getCombinedReceiptByGroupId,
}; 