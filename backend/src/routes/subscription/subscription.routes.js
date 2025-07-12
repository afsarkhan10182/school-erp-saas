const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../../middleware/auth');
const SubscriptionController = require('../../controllers/subscription/subscription.controller');

// All routes require authentication
router.use(verifyToken);

// Super Admin routes (can manage all subscription plans)
router.get(
  '/plans',
  authorize('super_admin'),
  SubscriptionController.getAllPlans
);

router.get(
  '/plans/:id',
  authorize('super_admin'),
  SubscriptionController.getPlanById
);

router.post(
  '/plans',
  authorize('super_admin'),
  SubscriptionController.createPlan
);

router.put(
  '/plans/:id',
  authorize('super_admin'),
  SubscriptionController.updatePlan
);

router.delete(
  '/plans/:id',
  authorize('super_admin'),
  SubscriptionController.deletePlan
);

// School subscription management
router.get(
  '/schools',
  authorize('super_admin'),
  SubscriptionController.getSchoolsWithSubscriptions
);

router.post(
  '/schools',
  authorize('super_admin'),
  SubscriptionController.createSchoolWithSubscription
);

router.put(
  '/schools/:id',
  authorize('super_admin'),
  SubscriptionController.updateSchoolSubscription
);

router.get(
  '/schools/:schoolId/transactions',
  authorize('super_admin'),
  SubscriptionController.getSchoolTransactions
);

router.post(
  '/transactions',
  authorize('super_admin'),
  SubscriptionController.createManualTransaction
);

router.get(
  '/schools/:schoolId/status',
  authorize('super_admin'),
  SubscriptionController.checkSubscriptionStatus
);

router.get(
  '/stats',
  authorize('super_admin'),
  SubscriptionController.getSubscriptionStats
);

module.exports = router; 