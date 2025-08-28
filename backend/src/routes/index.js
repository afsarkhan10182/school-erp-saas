const express = require('express');
const authRoutes = require('./auth/auth.routes');
const userRoutes = require('./user/user.routes');
const schoolRoutes = require('./school/school.routes');
const branchRoutes = require('./school/branch.routes');
const subscriptionRoutes = require('./subscription/subscription.routes');
const dashboardRoutes = require('./dashboard/dashboard.routes');
const healthRoutes = require('./health/health');
const studentRoutes = require('./student.routes');
const feeTypeRoutes = require('./fee-type.routes');
const feeStructureRoutes = require('./fee-structure.routes');
const feeInvoiceRoutes = require('./fee-invoice.routes');

const academicYearRoutes = require('./academic-year.routes');
const classRoutes = require('./class.routes');
const sectionRoutes = require('./section.routes');
const streamRoutes = require('./stream.routes');

// Settings routes
const { schoolConfigurationRoutes, academicSettingsRoutes } = require('./settings');

const router = express.Router();

// Health check routes (no auth required)
router.use('/health', healthRoutes);

// API routes with authentication
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/schools', schoolRoutes);
router.use('/branches', branchRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/dashboard', dashboardRoutes);

// Student and Fee Management routes
router.use('/students', studentRoutes);
router.use('/fee-types', feeTypeRoutes);
router.use('/fee-structures', feeStructureRoutes);
router.use('/fee-invoices', feeInvoiceRoutes);


// Academic Management routes
router.use('/academic-years', academicYearRoutes);
router.use('/classes', classRoutes);
router.use('/sections', sectionRoutes);
router.use('/streams', streamRoutes);

// Settings routes
router.use('/school/configuration', schoolConfigurationRoutes);
router.use('/academic/settings', academicSettingsRoutes);

module.exports = router;
