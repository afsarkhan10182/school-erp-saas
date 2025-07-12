const express = require('express');
const {
  generateInvoices,
  getInvoices,
  getInvoiceById,
  recordPayment,
  updateInvoice,
  cancelInvoice,
  getFeeCollectionSummary,
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
router.get('/', getInvoices);

// GET endpoint to retrieve fee collection summary
router.get('/summary', getFeeCollectionSummary);

// GET endpoint to retrieve a specific invoice by ID
router.get('/:id', getInvoiceById);

// PUT endpoint to update an invoice (admin only)
router.put('/:id', requireRole('super_admin', 'school_admin', 'accountant'), updateInvoice);

// POST endpoint to record payment for an invoice
router.post('/:id/payment', requireRole('super_admin', 'school_admin', 'accountant'), recordPayment);

// PUT endpoint to cancel an invoice (admin only)
router.put('/:id/cancel', requireRole('super_admin', 'school_admin'), cancelInvoice);

module.exports = router;
