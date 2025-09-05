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
  getInvoiceById: core.getInvoiceById,
  updateInvoice: core.updateInvoice,
  cancelInvoice: core.cancelInvoice,
  adjustInvoice: core.adjustInvoice,
  getGroupedInvoices: core.getGroupedInvoices,

  // Payment operations
  calculateLateFees: payments.calculateLateFees,
  applyLateFees: payments.applyLateFees,
  recordPayment: payments.recordPayment,
  getInvoicePayments: payments.getInvoicePayments,
  getPaymentById: payments.getPaymentById,
  getStudentPayments: payments.getStudentPayments,
  getCollections: payments.getCollections,

  // Reports and analytics
  getFeeCollectionSummary: reports.getFeeCollectionSummary,
  exportFeeInvoicesReportLegacy: reports.exportFeeInvoicesReportLegacy,
  getFeeInvoiceReport: reports.getFeeInvoiceReport,
  getFeeInvoiceReportGrouped: reports.getFeeInvoiceReportGrouped,
  exportFeeInvoicesReport: reports.exportFeeInvoicesReport,
  getFeeStats: reports.getFeeStats,

  // Student operations
  getStudentDues: students.getStudentDues,
  getStudentFeeLedger: students.getStudentFeeLedger,
  recordSmartPayment: students.recordSmartPayment,
  getAvailableMonths: students.getAvailableMonths,
  getGroupedStudentInvoices: students.getGroupedStudentInvoices,
  getStudentFeeInvoiceSummary: students.getStudentFeeInvoiceSummary,

  // Receipt operations
  getGroupedReceipts: receipts.getGroupedReceipts,
  getCombinedReceiptByGroupId: receipts.getCombinedReceiptByGroupId,
  getReceiptByNumber: receipts.getReceiptByNumber,
  getReceiptForInvoice: receipts.getReceiptForInvoice,
  // On-demand receipt functions
  getReceiptData: receipts.getReceiptData,
  getCombinedReceiptData: receipts.getCombinedReceiptData,
  getInvoiceReceiptData: receipts.getInvoiceReceiptData,
  // Receipts report
  getReceiptsReport: receipts.getReceiptsReport,

  // Advanced payment operations
  getBreakdown: advancedPayments.getBreakdown,
  recordFlexibleInstallmentPayment: advancedPayments.recordFlexibleInstallmentPayment,
}; 