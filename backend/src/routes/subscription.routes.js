const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const SubscriptionController = require('../controllers/subscription.controller');

// All routes require authentication
router.use(verifyToken);

// Subscription Plans (Super Admin only)
router.get(
  '/plans',
  requireRole('super_admin'),
  SubscriptionController.getAllPlans
);

router.get(
  '/plans/:id',
  requireRole('super_admin'),
  SubscriptionController.getPlanById
);

router.post(
  '/plans',
  requireRole('super_admin'),
  SubscriptionController.createPlan
);

router.put(
  '/plans/:id',
  requireRole('super_admin'),
  SubscriptionController.updatePlan
);

router.delete(
  '/plans/:id',
  requireRole('super_admin'),
  SubscriptionController.deletePlan
);

// Schools with Subscriptions (Super Admin only)
router.get(
  '/schools',
  requireRole('super_admin'),
  SubscriptionController.getSchoolsWithSubscriptions
);

router.post(
  '/schools',
  requireRole('super_admin'),
  SubscriptionController.createSchoolWithSubscription
);

router.put(
  '/schools/:id/subscription',
  requireRole('super_admin'),
  SubscriptionController.updateSchoolSubscription
);

// Transactions (Super Admin only)
router.get(
  '/schools/:schoolId/transactions',
  requireRole('super_admin'),
  SubscriptionController.getSchoolTransactions
);

router.post(
  '/transactions',
  requireRole('super_admin'),
  SubscriptionController.createManualTransaction
);

// Subscription Status (Super Admin only)
router.get(
  '/schools/:schoolId/status',
  requireRole('super_admin'),
  SubscriptionController.checkSubscriptionStatus
);

// Subscription Statistics (Super Admin only)
router.get(
  '/stats',
  requireRole('super_admin'),
  SubscriptionController.getSubscriptionStats
);

module.exports = router; 