const express = require('express');
const {
  generateInvoices,
  getInvoices,
  getInvoiceById,
  recordPayment,
  recordSmartPayment,
  recordFlexibleInstallmentPayment,
  updateInvoice,
  cancelInvoice,
  getFeeCollectionSummary,
  getFeeInvoiceReport,
  exportFeeInvoicesReport,
  applyLateFees,
  getFeeStats,
  getStudentDues,
  getStudentFeeLedger,
  getBreakdown,
  adjustInvoice,
  generateReceiptForInvoice,
  getReceiptForInvoice,
  getInvoicePayments,
  getPaymentById,
  getPaymentReceipt,
  getStudentPayments,
  getEnhancedPaymentReceipts,
  getGroupedReceipts,
  getAvailableMonths,
  getGroupedStudentInvoices,
  getGroupedInvoices,
  getCombinedReceiptByGroupId,
  getCollections
} = require('../controllers/fee-invoice');
const { verifyToken, setSchoolContext, requireRole } = require('../middleware/auth');
const router = express.Router();

// Middleware to ensure authentication
router.use(verifyToken);

// Middleware to ensure school context is set
router.use(setSchoolContext);

// POST endpoint to generate invoices for students (admin only)
router.post('/generate', requireRole('super_admin', 'school_admin', 'accountant'), generateInvoices);



// POST endpoint for smart payment allocation (amount-based with receipt grouping)
router.post('/smart-payment', requireRole('super_admin', 'school_admin', 'accountant'), recordSmartPayment);

// POST endpoint for flexible installment payment (Branch 2 - Installment model)
router.post('/flexible-installment', requireRole('super_admin', 'school_admin', 'accountant'), recordFlexibleInstallmentPayment);

// GET endpoint to retrieve all invoices
router.get('/', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getInvoices);

// GET endpoint to retrieve student dues for quick collection
router.get('/student-dues', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getStudentDues);

// GET endpoint to retrieve available months for manual selection
router.get('/available-months', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getAvailableMonths);

// GET endpoint to retrieve grouped student invoices for better UI display
router.get('/grouped-student-invoices', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getGroupedStudentInvoices);

// GET endpoint to retrieve grouped invoices for better UI display
router.get('/grouped', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getGroupedInvoices);

// GET endpoint to retrieve combined receipt for a receipt group
router.get('/grouped-receipts/:receiptGroupId', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getCombinedReceiptByGroupId);

// GET endpoint to retrieve student fee ledger
router.get('/student-ledger', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getStudentFeeLedger);

// GET endpoint to retrieve enhanced payment receipts for a student
router.get('/enhanced-payment-receipts', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getEnhancedPaymentReceipts);

// GET endpoint to retrieve grouped receipts for a student (for cleaner invoice listing)
router.get('/grouped-receipts', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getGroupedReceipts);

// GET endpoint to retrieve fee breakdown for a student and fee structure
router.get('/breakdown', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getBreakdown);

// GET endpoint to retrieve fee collection summary
router.get('/summary', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getFeeCollectionSummary);

// GET endpoint to retrieve fee statistics
router.get('/stats', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getFeeStats);

// GET endpoint to retrieve fee invoice report with pagination and filtering
router.get('/report', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getFeeInvoiceReport);

// GET endpoint to export fee invoices report
router.get('/export', requireRole('super_admin', 'school_admin', 'accountant'), exportFeeInvoicesReport);

// GET endpoint to retrieve collections (payments)
router.get('/collections', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getCollections);

// GET endpoint to retrieve a specific invoice by ID
router.get('/:id', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getInvoiceById);

// PUT endpoint to update an invoice (admin only)
router.put('/:id', requireRole('super_admin', 'school_admin', 'accountant'), updateInvoice);

// POST endpoint to record payment for an invoice
router.post('/:id/payment', requireRole('super_admin', 'school_admin', 'accountant'), recordPayment);

// GET endpoint to get all payments for an invoice
router.get('/:id/payments', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getInvoicePayments);

// POST endpoint to generate receipt for an invoice
router.post('/:id/receipt', requireRole('super_admin', 'school_admin', 'accountant'), generateReceiptForInvoice);

// GET endpoint to get receipt for an invoice
router.get('/:id/receipt', requireRole('super_admin', 'school_admin', 'accountant'), getReceiptForInvoice);

// PUT endpoint to cancel an invoice (admin only)
router.put('/:id/cancel', requireRole('super_admin', 'school_admin'), cancelInvoice);

// POST endpoint to apply late fees to an invoice (admin only)
router.post('/:id/late-fees', requireRole('super_admin', 'school_admin', 'accountant'), applyLateFees);

// POST endpoint to manually adjust invoice (admin only)
router.post('/:id/adjust', requireRole('super_admin', 'school_admin'), adjustInvoice);

// Payment-specific routes
// GET endpoint to get a specific payment by ID
router.get('/payment/:paymentId', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getPaymentById);

// GET endpoint to get receipt for a specific payment
router.get('/payment/:paymentId/receipt', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getPaymentReceipt);

// GET endpoint to get all payments for a student
router.get('/student/:studentId/payments', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getStudentPayments);

module.exports = router;
