const express = require('express');
const authRoutes = require('./auth/auth.routes');
const userRoutes = require('./user/user.routes');
const schoolRoutes = require('./school/school.routes');
const branchRoutes = require('./school/branch.routes');
const subscriptionRoutes = require('./subscription/subscription.routes');
const dashboardRoutes = require('./dashboard/dashboard.routes');
const healthRoutes = require('./health/health');

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

module.exports = router;
