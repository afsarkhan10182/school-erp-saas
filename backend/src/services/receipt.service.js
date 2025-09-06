const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { resolveUploadsPath } = require('../utils/pathHelper');
const { generateUniqueReceiptNumber, getClassCode } = require('../controllers/fee-invoice/core');

/**
 * Generate receipt data on-demand from payment ID
 * This is the new approach - no HTML/JSON storage in DB
 */
const generateReceiptData = async (paymentId) => {
  try {
    const { FeePayment, FeeInvoice, Student, FeeStructure, FeeType, School, Branch, Class } = require('../models');
    
    // Fetch payment with all related data from database
    const payment = await FeePayment.findByPk(paymentId, {
      include: [
        {
          model: FeeInvoice,
          as: 'invoice',
          include: [
            {
              model: Student,
              as: 'student',
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
                },
                {
                  model: Class,
                  as: 'class',
                  attributes: ['id', 'name', 'code'],
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
      throw new Error('Payment not found');
    }

    // If receipt data already exists, return it (preserves historical state)
    if (payment.receipt_data) {
      return payment.receipt_data;
    }

    const invoice = payment.invoice;
    const student = invoice.student;
    const school = payment.school;
    const feeStructure = invoice.feeStructure;

    // Calculate remaining balance and months
    let remainingBalance = 0;
    let remainingMonths = 0;
    let totalMonths = 12;
    let monthlyAmount = 0;

    if (invoice.payment_model === 'monthly') {
      totalMonths = feeStructure?.total_months || 12;
      monthlyAmount = parseFloat(feeStructure?.monthly_payment_amount || 0);
      
      // Calculate paid months for this student and fee structure
      // For current payments, don't use asOfDate to include the current payment
      const paidMonths = await calculatePaidMonths(
        student.id, 
        invoice.fee_structure_id, 
        invoice.academic_year,
        invoice
        // Don't pass payment.payment_date as asOfDate for current payments
      );
      
      remainingMonths = Math.max(0, totalMonths - paidMonths);
      remainingBalance = remainingMonths * monthlyAmount;

    } else {
      // For installment payments
      remainingBalance = Math.max(0, parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount));
    }

    // Generate receipt number if not exists
    let receiptNumber = payment.receipt_number;
    if (!receiptNumber) {
      // Generate unique receipt number with RCP prefix
      // Use the same class code logic as invoice generation to ensure consistency
      const classCode = await getClassCode(invoice.feeStructure, invoice.student);
      
      const tempReceipt = await generateUniqueReceiptNumber(classCode, { school_id: payment.school_id });
      receiptNumber = tempReceipt.receipt_number;
      
      // Update payment with receipt number
      await payment.update({ receipt_number: receiptNumber });
    }

    // Get receipt customization settings
    let receiptCustomization = {
      schoolName: school.name,
      schoolLogo: school.logo_url || '',
      receiptLogo: '',
      trustName: 'HAJI OMAR MOOSA EDUCATIONAL TRUST',
      showSchoolLogo: true,
      showReceiptLogo: true,
      showSchoolAddress: true,
      showSchoolContact: true,
      showBranchInfo: true,
      receiptFooter: '',
      defaultReceiptTitle: 'Fee Receipt'
    };

    // Use custom receipt settings if available (JSONB fields are automatically parsed)
    if (school.receipt_settings && Object.keys(school.receipt_settings).length > 0) {
      receiptCustomization = { ...receiptCustomization, ...school.receipt_settings };
    }

    // Get branch-specific receipt settings
    let branchReceiptSettings = {};
    if (student.branch) {
      branchReceiptSettings = {
        name: student.branch.receipt_name || student.branch.name,
        logo: student.branch.receipt_logo || '',
        address: student.branch.receipt_address || student.branch.address || '',
        contact: student.branch.receipt_contact || student.branch.phone || ''
      };
    }

    // Build receipt data structure with customization
    const receiptData = {
      receipt_number: receiptNumber,
      invoice_number: invoice.invoice_number, // Keep invoice number for reference
      student_name: `${student.first_name} ${student.last_name || ''}`,
      admission_number: student.admission_number,
      roll_number: student.roll_number,
      class_name: student.current_class,
      section: student.section,
      payment_amount: parseFloat(payment.payment_amount),
      payment_method: payment.payment_method,
      transaction_id: payment.transaction_id,
      payment_date: payment.payment_date,
      remaining_balance: remainingBalance,
      remaining_months: remainingMonths,
      // School information with customization
      school_name: receiptCustomization.schoolName || school.name,
      school_address: receiptCustomization.showSchoolAddress ? (receiptCustomization.schoolAddress || school.address) : null,
      school_logo: receiptCustomization.showSchoolLogo ? (receiptCustomization.schoolLogo || school.logo_url) : null,
      school_contact: receiptCustomization.showSchoolContact ? (school.phone || school.email) : null,
      // Trust information with customization
      receipt_logo: receiptCustomization.showReceiptLogo ? (receiptCustomization.receiptLogo || null) : null,
      trust_name: receiptCustomization.trustName || 'HAJI OMAR MOOSA EDUCATIONAL TRUST',
      // Branch information with customization
      branch_name: receiptCustomization.showBranchInfo ? (branchReceiptSettings.name || student.branch?.name) : null,
      branch_code: receiptCustomization.showBranchInfo ? (student.branch?.code) : null,
      branch: receiptCustomization.showBranchInfo && student.branch ? {
        id: student.branch.id,
        name: branchReceiptSettings.name || student.branch.name,
        code: student.branch.code,
        logo: branchReceiptSettings.logo,
        address: branchReceiptSettings.address,
        contact: branchReceiptSettings.contact
      } : null,
      // Receipt customization settings
      receipt_title: receiptCustomization.defaultReceiptTitle,
      receipt_footer: receiptCustomization.receiptFooter,
      customization: receiptCustomization,
      // Fee information
      fee_type_name: feeStructure?.feeType?.name || 'Tuition Fees',
      academic_year: invoice.academic_year,
      total_fees: parseFloat(invoice.total_amount),
      payment_model: invoice.payment_model,
      installment_number: invoice.installment_number,
      total_installments: invoice.total_installments,
      monthly_amount: monthlyAmount,
      total_months: totalMonths,
      generated_at: new Date()
    };

    // Add month-specific data for monthly payments
    if (invoice.payment_model === 'monthly' && invoice.month && invoice.year) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      receiptData.month_paid = `${monthNames[invoice.month - 1]} ${invoice.year}`;
      receiptData.month_number = invoice.month;
      receiptData.year = invoice.year;
    }

    // Store receipt data in the payment record for future reference
    if (payment && !payment.receipt_data) {
      await payment.update({ receipt_data: receiptData });
    }

    return receiptData;
  } catch (error) {
    logger.error('Error generating receipt data:', error);
    throw error;
  }
};

/**
 * Generate receipt data for multiple payments (combined receipt)
 */
const generateCombinedReceiptData = async (paymentIds) => {
  try {
    const { FeePayment, FeeInvoice, Student, FeeStructure, FeeType, School, Branch, Class } = require('../models');
    
    // Fetch all payments with related data
    const payments = await FeePayment.findAll({
      where: { id: paymentIds },
      include: [
        {
          model: FeeInvoice,
          as: 'invoice',
          include: [
            {
              model: Student,
              as: 'student',
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
                },
                {
                  model: Class,
                  as: 'class',
                  attributes: ['id', 'name', 'code'],
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
      throw new Error('No payments found');
    }

    const firstPayment = payments[0];
    
    // If receipt data already exists in the first payment, return it (preserves historical state)
    if (firstPayment.receipt_data) {
      return firstPayment.receipt_data;
    }
    const student = firstPayment.invoice.student;
    const school = firstPayment.school;

    // Calculate totals
    const totalPaymentAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.payment_amount), 0);
    const totalAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.invoice.total_amount), 0);

    // Group by monthly payments
    const monthlyPayments = payments.filter(payment => payment.invoice.payment_model === 'monthly');
    
    // Calculate remaining months and balance
    let remainingMonths = 0;
    let remainingBalance = 0;
    let totalMonths = 12;
    let monthlyFeeAmount = 0;

    if (monthlyPayments.length > 0) {
      const firstMonthlyPayment = monthlyPayments[0];
      const feeStructure = firstMonthlyPayment.invoice.feeStructure;
      totalMonths = feeStructure?.total_months || 12;
      monthlyFeeAmount = parseFloat(feeStructure?.monthly_payment_amount || 0);
      
      // For combined receipts, use the date of the first payment to get historical state
      const paidMonths = await calculatePaidMonths(
        student.id,
        firstMonthlyPayment.invoice.fee_structure_id,
        firstMonthlyPayment.invoice.academic_year,
        monthlyPayments.map(p => p.invoice),
        firstMonthlyPayment.payment_date
      );
      
      remainingMonths = Math.max(0, totalMonths - paidMonths);
      remainingBalance = remainingMonths * monthlyFeeAmount;
    } else {
      // For non-monthly payments, calculate remaining balance from total invoice amounts
      const totalInvoiceAmount = payments.reduce((sum, payment) => {
        return sum + parseFloat(payment.invoice.total_amount || 0);
      }, 0);
      remainingBalance = Math.max(0, totalInvoiceAmount - totalPaymentAmount);
    }

    // Generate receipt number
    // Try to get class code from fee structure's class first
    let classCode = firstPayment.invoice.feeStructure?.class?.code;
    
    // If no class code from fee structure, try to get it from invoice class name
    if (!classCode && firstPayment.invoice.class_name) {
      classCode = firstPayment.invoice.class_name.replace(/^Class\s+/i, '').trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    }
    
    // Fallback to GEN if still no class code
    if (!classCode) {
      classCode = 'GEN';
    }

    // Build combined receipt data
    const receiptData = {
      receipt_number: payments.length === 1 ? payments[0].receipt_number : `GROUP-${payments.map(p => p.receipt_number).join('-')}`,
      invoice_number: payments.length === 1 ? payments[0].invoice.invoice_number : payments.map(p => p.invoice.invoice_number).join(', '),
      invoice_numbers: payments.map(p => p.invoice.invoice_number).join(', '),
      student_name: `${student.first_name} ${student.last_name || ''}`,
      admission_number: student.admission_number,
      roll_number: student.roll_number,
      class_name: student.current_class,
      section: student.section,
      total_payment_amount: totalPaymentAmount,
      payment_method: firstPayment.payment_method,
      transaction_id: firstPayment.transaction_id,
      payment_date: firstPayment.payment_date,
      remaining_balance: remainingBalance,
      remaining_months: remainingMonths,
      school_name: school.name,
      school_address: school.address,
      school_logo: school.logo_url,
      branch_name: student.branch?.name || null,
      branch_code: student.branch?.code || null,
      branch: student.branch ? {
        id: student.branch.id,
        name: student.branch.name,
        code: student.branch.code
      } : null,
      fee_type_name: monthlyPayments.length > 0 ? monthlyPayments[0].invoice.feeStructure?.feeType?.name || 'Tuition Fees' : 'Multiple Fee Types',
      academic_year: firstPayment.invoice.academic_year,
      total_fees: totalAmount,
      payment_model: 'combined',
      monthly_amount: monthlyFeeAmount,
      total_months: totalMonths,
      generated_at: new Date(),
      months_covered: monthlyPayments.map(payment => 
        `${getMonthName(payment.invoice.month)} ${payment.invoice.year}`
      ).join(', '),
      payments: payments.map(payment => ({
        payment_id: payment.id,
        payment_number: payment.payment_number,
        payment_amount: parseFloat(payment.payment_amount),
        payment_method: payment.payment_method,
        payment_date: payment.payment_date,
        invoice_number: payment.invoice.invoice_number,
        fee_type: payment.invoice.feeStructure?.feeType?.name || 'Unknown',
        month: payment.invoice.month,
        year: payment.invoice.year,
      })),
      monthly_payments: monthlyPayments.map(payment => ({
        month: payment.invoice.month,
        year: payment.invoice.year,
        amount: parseFloat(payment.payment_amount),
        fee_type: payment.invoice.feeStructure?.feeType?.name || 'Unknown',
        class_name: payment.invoice.feeStructure?.class_name,
        section: payment.invoice.feeStructure?.section,
      })),
    };

    // Store receipt data in the first payment record for future reference
    if (payments.length > 0 && !payments[0].receipt_data) {
      await payments[0].update({ receipt_data: receiptData });
    }

    return receiptData;
  } catch (error) {
    logger.error('Error generating combined receipt data:', error);
    throw error;
  }
};

/**
 * Generate HTML template for receipt (Enhanced to match the image format)
 */
const generateReceiptHtml = (data, schoolData) => {
  const isJuniorCollege = data.class_name && data.class_name.toLowerCase().includes('junior');
  const schoolType = isJuniorCollege ? 'JUNIOR COLLEGE' : 'ENGLISH MEDIUM SCHOOL';
  const isMonthlyPayment = data.payment_model === 'monthly';
  const isCombinedPayment = data.payment_model === 'combined';
  
  const getLogoUrl = (filename) => {
    if (!filename) return '';
    if (filename.startsWith('http') || filename.startsWith('data:')) return filename;
    const baseUrl = process.env.NUXT_PUBLIC_API_BASE;
    const backendBase = baseUrl?.replace('/api', '');
    return `${backendBase}/uploads/logos/${filename}`;
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Fee Receipt - ${data.school_name}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background-color: #f5f5f5;
        }
        .receipt {
          width: 400px;
          background: white;
          border: 1px solid #ddd;
          margin: 0 auto;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          padding: 20px 15px;
          border-bottom: 2px solid #333;
          background: #f8f9fa;
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 15px;
        }
        .receipt-logo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 2px solid #333;
          object-fit: contain;
          background: white;
          flex-shrink: 0;
        }
        .school-logo {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid #333;
          object-fit: cover;
          flex-shrink: 0;
        }
        .header-content {
          flex: 1;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .trust-section {
          margin-bottom: 10px;
        }
        .trust-name {
          font-size: 12px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .school-section {
          margin-top: 5px;
        }
        .school-name {
          font-size: 16px;
          font-weight: bold;
          color: #000;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        .school-type {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .school-address {
          font-size: 11px;
          color: #666;
          margin-bottom: 10px;
        }
        .receipt-title {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          color: #000;
          margin: 15px 0;
          text-transform: uppercase;
        }
        .receipt-info {
          padding: 15px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
        }
        .info-label {
          font-weight: bold;
          color: #333;
        }
        .info-value {
          color: #000;
        }
        .fee-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .fee-table th, .fee-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-size: 11px;
        }
        .fee-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .summary-section {
          margin: 15px 0;
          padding: 10px;
          background-color: #f8f9fa;
          border: 1px solid #ddd;
        }
        .remaining-info {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 10px;
          margin: 15px 0;
          border-radius: 5px;
        }
        .remaining-title {
          font-weight: bold;
          color: #856404;
          margin-bottom: 5px;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
        }
        .signature {
          text-align: center;
          font-size: 11px;
        }
        .signature-line {
          width: 100px;
          border-top: 1px solid #000;
          margin: 5px auto;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          ${data.receipt_logo && data.receipt_logo.trim() !== '' ? `<img src="${getLogoUrl(data.receipt_logo)}" alt="Receipt Logo" class="receipt-logo" onerror="this.style.display='none'">` : ''}
          <div class="header-content">
            <div class="trust-section">
              <div class="trust-name">${data.trust_name}</div>
            </div>
            <div class="school-section">
              ${data.school_logo ? `<img src="${getLogoUrl(data.school_logo)}" alt="School Logo" class="school-logo" onerror="this.style.display='none'">` : ''}
              <div class="school-name">${data.school_name}</div>
              <div class="school-type">${schoolType}</div>
              <div class="school-address">${data.school_address || '27, 5th Nizampura, Kotergate, Opp. Ram Bhavan Hotel, Bhiwandi.'}</div>
            </div>
          </div>
        </div>
        
        <div class="receipt-title">${isCombinedPayment ? 'MULTIPLE PAYMENTS RECEIPT' : 'FEE RECEIPT'}</div>
        
        <div class="receipt-info">
          <div class="info-row">
            <span class="info-label">Invoice No:</span>
            <span class="info-value">${isCombinedPayment ? data.invoice_numbers : data.invoice_number}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${new Date(data.payment_date).toLocaleDateString('en-IN')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${isJuniorCollege ? 'Receive from' : 'Name of the Pupil'}:</span>
            <span class="info-value">${data.student_name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${isJuniorCollege ? 'Class' : 'Std. & Div.'}:</span>
            <span class="info-value">${data.class_name}${data.section ? ' - ' + data.section : ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Roll No:</span>
            <span class="info-value">${data.roll_number || 'N/A'}</span>
          </div>
          ${!isJuniorCollege ? `
          <div class="info-row">
            <span class="info-label">G.R. No:</span>
            <span class="info-value">${data.admission_number}</span>
          </div>
          ` : ''}
          
          ${isMonthlyPayment && data.month_paid ? `
          <div class="info-row">
            <span class="info-label">Month Paid:</span>
            <span class="info-value">${data.month_paid}</span>
          </div>
          ` : ''}
          
          ${isCombinedPayment ? `
          <table class="fee-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Fee Type</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${(data.monthly_payments || []).map(payment => `
                <tr>
                  <td>${getMonthName(payment.month)} ${payment.year}</td>
                  <td>${payment.fee_type}</td>
                  <td>${payment.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : `
          <table class="fee-table">
            <thead>
              <tr>
                <th>Particulars</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${data.fee_type_name}${isMonthlyPayment && data.month_paid ? ` (${data.month_paid})` : ''}</td>
                <td>${data.payment_amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          `}
          
          <div class="summary-section">
            <div class="info-row">
              <span class="info-label">Total Amount:</span>
              <span class="info-value">₹${(isCombinedPayment ? data.total_payment_amount : data.payment_amount).toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span class="info-value">${(data.payment_method || 'cash').toUpperCase()}</span>
            </div>
            ${data.transaction_id ? `
            <div class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">${data.transaction_id}</span>
            </div>
            ` : ''}
          </div>
          
          ${isCombinedPayment ? `
          <div class="remaining-info">
            <div class="remaining-title">Multiple Payments Summary</div>
            <div class="info-row">
              <span class="info-label">Payments Count:</span>
              <span class="info-value">${data.payments.length} payments</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Amount Paid:</span>
              <span class="info-value">₹${data.total_payment_amount.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Remaining Balance:</span>
              <span class="info-value">₹${(data.remaining_balance || 0).toLocaleString()}</span>
            </div>
          </div>
          ` : isMonthlyPayment ? `
          <div class="remaining-info">
            <div class="remaining-title">Monthly Payment Summary</div>
            <div class="info-row">
              <span class="info-label">Remaining Months:</span>
              <span class="info-value">${data.remaining_months || 0} months</span>
            </div>
            <div class="info-row">
              <span class="info-label">Remaining Balance:</span>
              <span class="info-value">₹${(data.remaining_balance || 0).toLocaleString()}</span>
            </div>
          </div>
          ` : `
          <div class="remaining-info">
            <div class="remaining-title">Outstanding Balance</div>
            <div class="info-row">
              <span class="info-label">Remaining Amount:</span>
              <span class="info-value">₹${(data.remaining_balance || 0).toLocaleString()}</span>
            </div>
          </div>
          `}
        </div>
        
        <div class="signature-section">
          <div class="signature">
            <div class="signature-line"></div>
            ${isJuniorCollege ? 'Cashier Signature' : 'Receiver\'s Signature'}
          </div>
          <div class="signature">
            <div class="signature-line"></div>
            Date
          </div>
        </div>
      </div>
    </body>
    </html>
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

/**
 * Calculate total paid months for a student
 * @param {string} studentId - Student ID
 * @param {string} feeStructureId - Fee structure ID
 * @param {string} academicYear - Academic year
 * @param {Array|Object} currentInvoices - Current invoices being paid (optional)
 * @param {Date} asOfDate - Calculate paid months as of this date (optional, defaults to current date)
 */
const calculatePaidMonths = async (studentId, feeStructureId, academicYear, currentInvoices = null, asOfDate = null) => {
  try {
    const { FeePayment, FeeInvoice } = require('../models');
    
    // Build where clause for paid invoices
    const whereClause = {
      student_id: studentId,
      fee_structure_id: feeStructureId,
      academic_year: academicYear,
      payment_model: 'monthly',
      status: ['paid', 'partial_paid']
    };

    // If asOfDate is provided, only count payments made on or before that date
    if (asOfDate) {
      whereClause['$payments.payment_date$'] = {
        [require('sequelize').Op.lte]: asOfDate
      };
    }
    
    // Get all paid invoices for this student and fee structure
    const paidInvoices = await FeeInvoice.findAll({
      where: whereClause,
      include: [{
        model: FeePayment,
        as: 'payments',
        where: {
          payment_status: 'completed',
          ...(asOfDate && {
            payment_date: {
              [require('sequelize').Op.lte]: asOfDate
            }
          })
        },
        required: true
      }],
      attributes: ['month', 'year']
    });
    
    // Count unique months that have been paid
    const uniqueMonths = new Set();
    paidInvoices.forEach(invoice => {
      uniqueMonths.add(`${invoice.month}-${invoice.year}`);
    });
    
    // If we have current invoices being paid and no asOfDate (current receipt generation)
    if (currentInvoices && !asOfDate) {
      if (Array.isArray(currentInvoices)) {
        // Handle array of invoices (for combined receipts)
        currentInvoices.forEach(invoice => {
          if (invoice.payment_model === 'monthly' && invoice.month && invoice.year) {
            uniqueMonths.add(`${invoice.month}-${invoice.year}`);
          }
        });
      } else {
        // Handle single invoice (for individual receipts)
        if (currentInvoices.payment_model === 'monthly' && currentInvoices.month && currentInvoices.year) {
          uniqueMonths.add(`${currentInvoices.month}-${currentInvoices.year}`);
        }
      }
    }
    
    const paidMonths = uniqueMonths.size;
    
    // Debug logging (commented out for performance)
    // logger.info(`Paid months calculation:`, {
    //   studentId,
    //   feeStructureId,
    //   academicYear,
    //   paidInvoicesCount: paidInvoices.length,
    //   uniqueMonths: Array.from(uniqueMonths),
    //   paidMonths,
    //   currentInvoices: currentInvoices ? (Array.isArray(currentInvoices) ? currentInvoices.length : 1) : 0,
    //   currentInvoiceData: currentInvoices ? (Array.isArray(currentInvoices) ? 
    //     currentInvoices.map(inv => ({ month: inv.month, year: inv.year, model: inv.payment_model })) : 
    //     { month: currentInvoices.month, year: currentInvoices.year, model: currentInvoices.payment_model }
    //   ) : null,
    //   asOfDate: asOfDate ? asOfDate.toISOString() : 'current'
    // });
    
    return paidMonths;
  } catch (error) {
    logger.error('Error calculating paid months:', error);
    return 0;
  }
};

module.exports = {
  // On-demand functions
  generateReceiptData,
  generateCombinedReceiptData,
  generateReceiptHtml,
  calculatePaidMonths,
}; 