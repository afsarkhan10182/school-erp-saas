const express = require('express');
const {
  generateInvoices,
  getInvoices,
  getInvoiceById,
  recordPayment,
  updateInvoice,
  cancelInvoice,
  getFeeCollectionSummary,
  getFeeInvoiceReport,
  exportFeeInvoicesReport,
  applyLateFees,
  getFeeStats,
  getStudentDues,
  getStudentFeeLedger,
  adjustInvoice,
  generateReceipt,
  getReceipt,
  getInvoicePayments,
  getPaymentById,
  getPaymentReceipt,
  getStudentPayments
} = require('../controllers/fee-invoice.controller');
const { verifyToken, setSchoolContext, requireRole } = require('../middleware/auth');
const router = express.Router();

// Middleware to ensure authentication
router.use(verifyToken);

// Middleware to ensure school context is set
router.use(setSchoolContext);

// POST endpoint to generate invoices for students (admin only)
router.post('/generate', requireRole('super_admin', 'school_admin', 'accountant'), generateInvoices);

// GET endpoint to retrieve all invoices
router.get('/', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getInvoices);

// GET endpoint to retrieve student dues for quick collection
router.get('/student-dues', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getStudentDues);

// GET endpoint to retrieve student fee ledger
router.get('/student-ledger', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getStudentFeeLedger);

// GET endpoint to retrieve fee collection summary
router.get('/summary', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getFeeCollectionSummary);

// GET endpoint to retrieve fee statistics
router.get('/stats', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getFeeStats);

// GET endpoint to retrieve fee invoice report with pagination and filtering
router.get('/report', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getFeeInvoiceReport);

// GET endpoint to export fee invoices report
router.get('/export', requireRole('super_admin', 'school_admin', 'accountant'), exportFeeInvoicesReport);

// GET endpoint to retrieve a specific invoice by ID
router.get('/:id', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getInvoiceById);

// PUT endpoint to update an invoice (admin only)
router.put('/:id', requireRole('super_admin', 'school_admin', 'accountant'), updateInvoice);

// POST endpoint to record payment for an invoice
router.post('/:id/payment', requireRole('super_admin', 'school_admin', 'accountant'), recordPayment);

// GET endpoint to get all payments for an invoice
router.get('/:id/payments', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), getInvoicePayments);

// POST endpoint to generate receipt for an invoice (legacy - now use payment receipts)
router.post('/:id/receipt', requireRole('super_admin', 'school_admin', 'accountant'), generateReceipt);

// GET endpoint to get receipt for an invoice (legacy - now use payment receipts)
router.get('/:id/receipt', requireRole('super_admin', 'school_admin', 'accountant'), getReceipt);

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
