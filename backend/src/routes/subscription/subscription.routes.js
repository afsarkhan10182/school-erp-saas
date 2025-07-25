const express = require('express');
const router = express.Router();
const SubscriptionController = require('../../controllers/subscription/subscription.controller');
const { verifyToken, authorize } = require('../../middleware/auth');
const { upload } = require('../../middleware/upload');

// All routes require authentication
router.use(verifyToken);

// Subscription Plans Routes (Super Admin Only)
router.get('/plans', authorize(['super_admin']), SubscriptionController.getAllPlans);
router.get('/plans/:id', authorize(['super_admin']), SubscriptionController.getPlanById);
router.post('/plans', authorize(['super_admin']), SubscriptionController.createPlan);
router.put('/plans/:id', authorize(['super_admin']), SubscriptionController.updatePlan);
router.delete('/plans/:id', authorize(['super_admin']), SubscriptionController.deletePlan);

// Schools with Subscriptions Routes (Super Admin Only)
router.get('/schools', authorize(['super_admin']), SubscriptionController.getSchoolsWithSubscriptions);
router.get('/schools/:id', authorize(['super_admin']), SubscriptionController.getSchoolWithSubscription);
router.post('/schools', 
  authorize(['super_admin']), 
  upload.fields([
    { name: 'system_logo', maxCount: 1 },
    { name: 'text_logo', maxCount: 1 },
    { name: 'printing_logo', maxCount: 1 },
    { name: 'report_card_design', maxCount: 1 }
  ]), 
  SubscriptionController.createSchoolWithSubscription
);
router.put('/schools/:id', 
  authorize(['super_admin']), 
  upload.fields([
    { name: 'system_logo', maxCount: 1 },
    { name: 'text_logo', maxCount: 1 },
    { name: 'printing_logo', maxCount: 1 },
    { name: 'report_card_design', maxCount: 1 }
  ]), 
  SubscriptionController.updateSchoolSubscription
);

// School Transactions Routes (Super Admin Only)
router.get('/schools/:schoolId/transactions', authorize(['super_admin']), SubscriptionController.getSchoolTransactions);
router.post('/schools/:schoolId/transactions', authorize(['super_admin']), SubscriptionController.createManualTransaction);

// Subscription Status Check (Super Admin Only)
router.get('/schools/:schoolId/status', authorize(['super_admin']), SubscriptionController.checkSubscriptionStatus);

// Renewal Requests Routes
// Create renewal request (School Admin Only)
router.post('/renewal-requests', authorize(['school_admin', 'branch_admin']), SubscriptionController.createRenewalRequest);

// Get renewal requests (Super Admin Only)
router.get('/renewal-requests', authorize(['super_admin']), SubscriptionController.getRenewalRequests);

// Get school renewal requests (School Admin Only)
router.get('/school/renewal-requests', authorize(['school_admin', 'branch_admin']), SubscriptionController.getSchoolRenewalRequests);

// Review renewal request (Super Admin Only)
router.put('/renewal-requests/:id/review', authorize(['super_admin']), SubscriptionController.reviewRenewalRequest);

// Subscription Statistics (Super Admin Only)
router.get('/stats', authorize(['super_admin']), SubscriptionController.getSubscriptionStats);

module.exports = router; 