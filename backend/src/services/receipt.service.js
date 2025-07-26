const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

/**
 * Generate professional receipt for fee payment (Enhanced for tuition fees focus)
 */
const generateReceipt = async (paymentData, schoolData, studentData) => {
  try {
    const receiptNumber = paymentData.receipt_number || `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate remaining months and balance for school branch
    let remainingMonths = 0;
    let remainingBalance = 0;
    let totalMonths = paymentData.total_months || 12;
    
    if (paymentData.payment_model === 'monthly') {
      // For monthly payments, calculate remaining months
      const paidMonths = paymentData.months_paid || 1;
      remainingMonths = totalMonths - paidMonths;
      remainingBalance = (paymentData.monthly_amount || 0) * remainingMonths;
    } else {
      // For installment payments, show remaining installments
      remainingBalance = paymentData.remaining_balance || 0;
    }
    
    // Create receipt data structure
    const receiptData = {
      receipt_number: receiptNumber,
      invoice_number: paymentData.invoice_number,
      student_name: `${studentData.first_name} ${studentData.last_name}`,
      admission_number: studentData.admission_number,
      roll_number: studentData.roll_number,
      class_name: studentData.current_class,
      section: studentData.section,
      payment_amount: paymentData.payment_amount,
      payment_method: paymentData.payment_method,
      transaction_id: paymentData.transaction_id,
      payment_date: paymentData.payment_date || new Date(),
      remaining_balance: remainingBalance,
      remaining_months: remainingMonths,
      school_name: schoolData.name,
      school_address: schoolData.address,
      school_logo: schoolData.logo_url,
      fee_type_name: 'Tuition Fees', // Focus on tuition fees as requested
      academic_year: paymentData.academic_year,
      month_paid: paymentData.month_paid,
      total_fees: paymentData.total_fees,
      monthly_amount: paymentData.monthly_amount,
      payment_model: paymentData.payment_model,
      monthly_payments: paymentData.monthly_payments, // Pass through monthly payments for enhanced receipts
      total_months_paid: paymentData.total_months_paid, // Pass through total months paid
      months_covered: paymentData.months_covered, // Pass through months covered for enhanced receipts
      monthly_fee: paymentData.monthly_fee, // Pass through monthly fee for enhanced receipts
      generated_at: new Date()
    };

    // Generate HTML template for receipt
    const receiptHtml = generateReceiptHtml(receiptData, schoolData);
    
    // Save receipt data (in real implementation, save to database)
    const receiptPath = path.join(__dirname, '../../../uploads/receipts', `${receiptData.receipt_number}.html`);
    const receiptDir = path.dirname(receiptPath);
    
    if (!fs.existsSync(receiptDir)) {
      fs.mkdirSync(receiptDir, { recursive: true });
    }
    
    fs.writeFileSync(receiptPath, receiptHtml);
    
    logger.info(`Receipt generated successfully: ${receiptNumber}`);
    
    return {
      receipt_number: receiptNumber,
      receipt_html: receiptHtml,
      receipt_data: receiptData,
      receipt_path: receiptPath
    };
  } catch (error) {
    logger.error('Error generating receipt:', error);
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
  const isEnhancedPayment = data.payment_model === 'enhanced';
  
  // Debug logging for receipt generation
  console.log('🔍 Generating receipt HTML with data:', {
    payment_model: data.payment_model,
    isMonthlyPayment,
    month_paid: data.month_paid,
    monthly_amount: data.monthly_amount,
    months_paid: data.months_paid,
    remaining_months: data.remaining_months,
    total_yearly_amount: data.total_yearly_amount
  });
  
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
          text-align: center;
          padding: 15px;
          border-bottom: 2px solid #333;
          background: #f8f9fa;
        }
        .school-logo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin: 0 auto 10px;
          display: block;
          border: 2px solid #333;
        }
        .trust-name {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
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
          ${data.school_logo ? `<img src="${data.school_logo}" alt="School Logo" class="school-logo">` : ''}
          <div class="trust-name">HAJI OMAR MOOSA EDUCATIONAL TRUST</div>
          <div class="school-name">${data.school_name}</div>
          <div class="school-type">${schoolType}</div>
          <div class="school-address">${data.school_address || '27, 5th Nizampura, Kotergate, Opp. Ram Bhavan Hotel, Bhiwandi.'}</div>
        </div>
        
        <div class="receipt-title">FEE RECEIPT</div>
        
        <div class="receipt-info">
          <div class="info-row">
            <span class="info-label">Receipt No:</span>
            <span class="info-value">${data.receipt_number}</span>
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
          
          ${isEnhancedPayment ? `
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
                  <td>${payment.month}/${payment.year}</td>
                  <td>${payment.fee_structure}</td>
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
                <td>Tuition Fees${isMonthlyPayment && data.month_paid ? ` (${data.month_paid})` : ''}</td>
                <td>${data.payment_amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          `}
          
          <div class="summary-section">
            <div class="info-row">
              <span class="info-label">Total Amount:</span>
              <span class="info-value">₹${(data.payment_amount || 0).toLocaleString()}</span>
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
          
          ${isEnhancedPayment ? `
          <div class="remaining-info">
            <div class="remaining-title">Enhanced Payment Summary</div>
            <div class="info-row">
              <span class="info-label">Months Covered:</span>
              <span class="info-value">${data.months_covered || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Monthly Fee:</span>
              <span class="info-value">₹${(data.monthly_fee || 0).toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Amount Paid:</span>
              <span class="info-value">₹${(data.payment_amount || 0).toLocaleString()}</span>
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

/**
 * Generate consolidated receipt for enhanced payment (multiple monthly payments)
 */
const generateConsolidatedReceipt = async (monthlyPaymentDetails, schoolData, studentData, paymentMethod, totalPaymentAmount, transactionId, paymentDate) => {
  try {
    // Calculate total remaining balance across all monthly payments
    const totalRemainingBalance = monthlyPaymentDetails.reduce((sum, detail) => {
      const remainingBalance = Math.max(0, detail.paymentBalance - detail.amountToApply);
      return sum + remainingBalance;
    }, 0);

    // Get month names for display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const monthsCovered = monthlyPaymentDetails.map(detail => 
      `${monthNames[detail.monthlyPayment.month - 1]} ${detail.monthlyPayment.year}`
    ).join(', ');

    const paymentData = {
      receipt_number: `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      invoice_number: `ENHANCED-${Date.now()}`,
      payment_amount: totalPaymentAmount,
      payment_method: paymentMethod || 'cash',
      transaction_id: transactionId,
      payment_date: paymentDate || new Date(),
      remaining_balance: totalRemainingBalance,
      fee_type_name: 'Tuition Fees (Multiple Months)',
              academic_year: monthlyPaymentDetails[0]?.monthlyPayment.academic_year || '2025-2026',
      payment_model: 'enhanced',
      monthly_payments: monthlyPaymentDetails.map(detail => ({
        month: detail.monthlyPayment.month,
        year: detail.monthlyPayment.year,
        amount: detail.amountToApply,
        fee_structure: detail.monthlyPayment.feeStructure?.name || 'Unknown',
        class_name: detail.monthlyPayment.feeStructure?.class_name,
        section: detail.monthlyPayment.feeStructure?.section,
      })),
      total_months_paid: monthlyPaymentDetails.length,
      months_covered: monthsCovered,
      monthly_fee: monthlyPaymentDetails[0]?.monthlyPayment.feeStructure?.monthly_payment_amount || 0,
      total_fees: monthlyPaymentDetails.reduce((sum, detail) => sum + parseFloat(detail.monthlyPayment.feeStructure?.monthly_payment_amount || 0), 0),
    };

    return await generateReceipt(paymentData, schoolData, studentData);
  } catch (error) {
    logger.error('Error generating consolidated receipt:', error);
    throw error;
  }
};

/**
 * Generate receipt for monthly payment (school branch)
 */
const generateMonthlyReceipt = async (monthlyPayment, schoolData, studentData, paymentMethod = null, paymentAmount = null, transactionId = null, paymentDate = null) => {
  try {
    // Calculate remaining months and balance
    const totalMonths = monthlyPayment.feeStructure?.total_months || 12;
    const paidMonths = await calculatePaidMonths(monthlyPayment.student_id, monthlyPayment.fee_structure_id, monthlyPayment.academic_year, monthlyPayment);
    const remainingMonths = Math.max(0, totalMonths - paidMonths);
    const remainingBalance = remainingMonths * parseFloat(monthlyPayment.feeStructure?.monthly_payment_amount || 0);
    
    // Debug logging
    console.log('🔍 Individual Receipt Calculation:', {
      student_id: monthlyPayment.student_id,
      fee_structure_id: monthlyPayment.fee_structure_id,
      total_months: totalMonths,
      monthly_fee: parseFloat(monthlyPayment.feeStructure?.monthly_payment_amount || 0),
      total_paid_months: paidMonths,
      remaining_months: remainingMonths,
      remaining_balance: remainingBalance
    });
    
    const paymentData = {
      receipt_number: monthlyPayment.receipt_number,
      invoice_number: `MONTH-${monthlyPayment.month}-${monthlyPayment.year}`,
      payment_amount: paymentAmount || monthlyPayment.paid_amount,
      payment_method: paymentMethod || monthlyPayment.payment_method || 'cash',
      transaction_id: transactionId || monthlyPayment.transaction_id,
      payment_date: paymentDate || monthlyPayment.payment_date || new Date(),
      remaining_balance: remainingBalance,
      remaining_months: remainingMonths,
      fee_type_name: 'Tuition Fees', // Focus on tuition fees as requested
      academic_year: monthlyPayment.academic_year,
      month_paid: `${monthlyPayment.month}/${monthlyPayment.year}`,
      total_fees: totalMonths * parseFloat(monthlyPayment.feeStructure?.monthly_payment_amount || 0),
      monthly_amount: monthlyPayment.feeStructure?.monthly_payment_amount || 0,
      payment_model: 'monthly',
      months_paid: paidMonths,
      total_months: totalMonths
    };

    return await generateReceipt(paymentData, schoolData, studentData);
  } catch (error) {
    logger.error('Error generating monthly receipt:', error);
    throw error;
  }
};

/**
 * Calculate total paid months for a student
 */
const calculatePaidMonths = async (studentId, feeStructureId, academicYear, currentInvoices = null) => {
  try {
    const { FeePayment, FeeInvoice } = require('../models');
    
    // Get all paid invoices for this student and fee structure
    const paidInvoices = await FeeInvoice.findAll({
      where: {
        student_id: studentId,
        fee_structure_id: feeStructureId,
        academic_year: academicYear,
        payment_model: 'monthly',
        status: ['paid', 'partial_paid']
      },
      include: [{
        model: FeePayment,
        as: 'payments',
        where: {
          payment_status: 'completed'
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
    
    // If we have current invoices being paid, add them to the count
    if (currentInvoices) {
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
    
    // Debug logging
    console.log('🔍 calculatePaidMonths:', {
      student_id: studentId,
      fee_structure_id: feeStructureId,
      academic_year: academicYear,
      paid_invoices_count: paidInvoices.length,
      current_invoices: currentInvoices ? (Array.isArray(currentInvoices) ? currentInvoices.length : 1) : 0,
      unique_months: Array.from(uniqueMonths),
      total_paid_months: paidMonths
    });
    
    return paidMonths;
  } catch (error) {
    logger.error('Error calculating paid months:', error);
    return 0;
  }
};

/**
 * Generate receipt for installment payment (senior branch)
 */
const generateInstallmentReceipt = async (invoice, paymentAmount, paymentMethod, transactionId, schoolData, studentData) => {
  try {
    const remainingBalance = Math.max(0, parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount) - parseFloat(paymentAmount));
    
    // Calculate month information for monthly payments
    let monthInfo = {};
    if (invoice.payment_model === 'monthly') {
      // For monthly payments, calculate remaining months and month details
      const totalMonths = invoice.feeStructure?.total_months || 12; // Get from fee structure
      const monthlyAmount = parseFloat(invoice.total_amount); // This is the monthly amount for monthly payments
      
      // Calculate actual paid months from database (including current payment)
      const paidMonths = await calculatePaidMonths(invoice.student_id, invoice.fee_structure_id, invoice.academic_year, invoice);
      const remainingMonths = Math.max(0, totalMonths - paidMonths);
      
      // Get month name
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      monthInfo = {
        month_paid: invoice.month ? `${monthNames[invoice.month - 1]} ${invoice.year}` : 'N/A',
        month_number: invoice.month,
        year: invoice.year,
        remaining_months: remainingMonths,
        total_months: totalMonths,
        months_paid: paidMonths,
        monthly_amount: monthlyAmount,
        total_yearly_amount: monthlyAmount * totalMonths
      };
      
      // Debug logging
      console.log('🔍 Monthly payment receipt data:', {
        invoice_id: invoice.id,
        payment_model: invoice.payment_model,
        month: invoice.month,
        year: invoice.year,
        month_paid: monthInfo.month_paid,
        monthly_amount: monthInfo.monthly_amount,
        months_paid: monthInfo.months_paid,
        remaining_months: monthInfo.remaining_months,
        total_yearly_amount: monthInfo.total_yearly_amount
      });
    }
    
    const paymentData = {
      receipt_number: `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      invoice_number: invoice.invoice_number,
      payment_amount: paymentAmount,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      payment_date: new Date(),
      remaining_balance: remainingBalance,
      fee_type_name: 'Tuition Fees', // Focus on tuition fees as requested
      academic_year: invoice.academic_year,
      total_fees: invoice.total_amount,
      payment_model: invoice.payment_model,
      installment_number: invoice.installment_number,
      total_installments: invoice.total_installments,
      // Add month information for monthly payments
      ...monthInfo
    };

    return await generateReceipt(paymentData, schoolData, studentData);
  } catch (error) {
    logger.error('Error generating installment receipt:', error);
    throw error;
  }
};

module.exports = {
  generateReceipt,
  generateMonthlyReceipt,
  generateConsolidatedReceipt,
  generateInstallmentReceipt,
  calculatePaidMonths
}; 