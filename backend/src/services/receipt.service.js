const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

/**
 * Generate professional receipt for fee payment (Enhanced for tuition fees focus)
 */
const generateReceipt = async (paymentData, schoolData, studentData) => {
  try {
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate remaining months and balance for school branch
    let remainingMonths = 0;
    let remainingBalance = 0;
    let totalMonths = 12;
    
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
          
          <table class="fee-table">
            <thead>
              <tr>
                <th>Particulars</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tuition Fees</td>
                <td>${data.payment_amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="summary-section">
            <div class="info-row">
              <span class="info-label">Total Amount:</span>
              <span class="info-value">₹${data.payment_amount.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span class="info-value">${data.payment_method.toUpperCase()}</span>
            </div>
            ${data.transaction_id ? `
            <div class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">${data.transaction_id}</span>
            </div>
            ` : ''}
          </div>
          
          ${isMonthlyPayment ? `
          <div class="remaining-info">
            <div class="remaining-title">Remaining Balance Information</div>
            <div class="info-row">
              <span class="info-label">Remaining Months:</span>
              <span class="info-value">${data.remaining_months} months</span>
            </div>
            <div class="info-row">
              <span class="info-label">Remaining Balance:</span>
              <span class="info-value">₹${data.remaining_balance.toLocaleString()}</span>
            </div>
          </div>
          ` : `
          <div class="remaining-info">
            <div class="remaining-title">Outstanding Balance</div>
            <div class="info-row">
              <span class="info-label">Remaining Amount:</span>
              <span class="info-value">₹${data.remaining_balance.toLocaleString()}</span>
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
 * Generate receipt for monthly payment (school branch)
 */
const generateMonthlyReceipt = async (monthlyPayment, schoolData, studentData) => {
  try {
    // Calculate remaining months and balance
    const totalMonths = monthlyPayment.feeStructure?.total_months || 12;
    const paidMonths = await calculatePaidMonths(monthlyPayment.student_id, monthlyPayment.fee_structure_id, monthlyPayment.academic_year);
    const remainingMonths = Math.max(0, totalMonths - paidMonths);
    const remainingBalance = remainingMonths * parseFloat(monthlyPayment.feeStructure?.monthly_payment_amount || 0);
    
    const paymentData = {
      receipt_number: monthlyPayment.receipt_number,
      invoice_number: `MONTH-${monthlyPayment.month}-${monthlyPayment.year}`,
      payment_amount: monthlyPayment.paid_amount,
      payment_method: monthlyPayment.payment_method,
      transaction_id: monthlyPayment.transaction_id,
      payment_date: monthlyPayment.payment_date,
      remaining_balance: remainingBalance,
      remaining_months: remainingMonths,
      fee_type_name: 'Tuition Fees', // Focus on tuition fees as requested
      academic_year: monthlyPayment.academic_year,
      month_paid: `${monthlyPayment.month}/${monthlyPayment.year}`,
      total_fees: totalMonths * parseFloat(monthlyPayment.feeStructure?.monthly_payment_amount || 0),
      monthly_amount: monthlyPayment.feeStructure?.monthly_payment_amount || 0,
      payment_model: 'monthly',
      months_paid: paidMonths
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
const calculatePaidMonths = async (studentId, feeStructureId, academicYear) => {
  try {
    const { MonthlyPayment } = require('../models');
    
    const paidMonths = await MonthlyPayment.count({
      where: {
        student_id: studentId,
        fee_structure_id: feeStructureId,
        academic_year: academicYear,
        status: 'paid'
      }
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
      payment_model: 'installment',
      installment_number: invoice.installment_number,
      total_installments: invoice.total_installments
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
  generateInstallmentReceipt,
  calculatePaidMonths
}; 