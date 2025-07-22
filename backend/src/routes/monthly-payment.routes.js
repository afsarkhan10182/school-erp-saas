const express = require('express');
const router = express.Router();
const { verifyToken, setSchoolContext, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const monthlyPaymentController = require('../controllers/monthly-payment.controller');
const monthlyPaymentValidation = require('../validations/monthly-payment.validation');

// Middleware to ensure authentication
router.use(verifyToken);

// Middleware to ensure school context is set
router.use(setSchoolContext);

// Generate monthly payments
router.post('/generate', requireRole('super_admin', 'school_admin', 'accountant'), validate(monthlyPaymentValidation.generateMonthlyPayments), monthlyPaymentController.generateMonthlyPayments);

// Get monthly payments with filtering and pagination
router.get('/', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), validate(monthlyPaymentValidation.getMonthlyPayments), monthlyPaymentController.getMonthlyPayments);

// Get student monthly payments (must come before /:id route)
router.get('/student/payments', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), validate(monthlyPaymentValidation.getStudentMonthlyPayments), monthlyPaymentController.getStudentMonthlyPayments);

// Get monthly payment by ID
router.get('/:id', requireRole('super_admin', 'school_admin', 'branch_admin', 'accountant'), monthlyPaymentController.getMonthlyPaymentById);

// Record payment for a monthly payment
router.post('/:id/payment', requireRole('super_admin', 'school_admin', 'accountant'), validate(monthlyPaymentValidation.recordMonthlyPayment), monthlyPaymentController.recordMonthlyPayment);

// Generate receipt for a monthly payment
router.post('/:id/receipt', requireRole('super_admin', 'school_admin', 'accountant'), monthlyPaymentController.generateReceipt);

// Test endpoint
router.get('/test', requireRole('super_admin', 'school_admin', 'accountant'), monthlyPaymentController.testMonthlyPaymentSystem);

module.exports = router; 