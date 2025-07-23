// Core invoice operations
const core = require('./core');

// Payment operations
const payments = require('./payments');

// Reports and analytics
const reports = require('./reports');

// Student operations
const students = require('./students');

// Receipt operations
const receipts = require('./receipts');

// Advanced payment operations
const advancedPayments = require('./advanced-payments');

// Export all functions
module.exports = {
  // Core operations
  generateInvoices: core.generateInvoices,
  getInvoices: core.getInvoices,
  getInvoiceById: core.getInvoiceById,
  updateInvoice: core.updateInvoice,
  cancelInvoice: core.cancelInvoice,
  adjustInvoice: core.adjustInvoice,
  getGroupedInvoices: core.getGroupedInvoices,

  // Payment operations
  calculateLateFees: payments.calculateLateFees,
  applyLateFees: payments.applyLateFees,
  generateReceipt: payments.generateReceipt,
  recordPayment: payments.recordPayment,
  getInvoicePayments: payments.getInvoicePayments,
  getPaymentById: payments.getPaymentById,
  getPaymentReceipt: payments.getPaymentReceipt,
  getStudentPayments: payments.getStudentPayments,
  getCollections: payments.getCollections,

  // Reports and analytics
  getFeeCollectionSummary: reports.getFeeCollectionSummary,
  exportFeeInvoicesReportLegacy: reports.exportFeeInvoicesReportLegacy,
  getFeeInvoiceReport: reports.getFeeInvoiceReport,
  exportFeeInvoicesReport: reports.exportFeeInvoicesReport,
  getFeeStats: reports.getFeeStats,

  // Student operations
  getStudentDues: students.getStudentDues,
  getStudentFeeLedger: students.getStudentFeeLedger,
  recordSmartPayment: students.recordSmartPayment,
  getAvailableMonths: students.getAvailableMonths,
  getGroupedStudentInvoices: students.getGroupedStudentInvoices,

  // Receipt operations
  generateReceiptForInvoice: receipts.generateReceiptForInvoice,
  getReceiptForInvoice: receipts.getReceiptForInvoice,
  getEnhancedPaymentReceipts: receipts.getEnhancedPaymentReceipts,
  getGroupedReceipts: receipts.getGroupedReceipts,
  getCombinedReceiptByGroupId: receipts.getCombinedReceiptByGroupId,

  // Advanced payment operations
  getBreakdown: advancedPayments.getBreakdown,
  recordFlexibleInstallmentPayment: advancedPayments.recordFlexibleInstallmentPayment,
}; 