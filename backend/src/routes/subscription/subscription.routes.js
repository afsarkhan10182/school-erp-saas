const express = require('express');
const router = express.Router();
const SubscriptionController = require('../../controllers/subscription/subscription.controller');
const { verifyToken, authorize } = require('../../middleware/auth');
const { upload } = require('../../middleware/upload');
const { validate } = require('../../middleware/validate');
const renewalRequestValidation = require('../../validations/renewal-request.validation');

// All routes require authentication
router.use(verifyToken);

// Subscription Plans Routes
router.get('/plans', authorize(['super_admin']), SubscriptionController.getAllPlans);
// Active plans for schools (School Admin/Branch Admin/Super Admin)
router.get('/plans/active', authorize(['school_admin', 'branch_admin', 'super_admin']), SubscriptionController.getActivePlansForSchools);
router.get('/plans/:id', authorize(['super_admin']), SubscriptionController.getPlanById);
router.post('/plans', authorize(['super_admin']), SubscriptionController.createPlan);
router.put('/plans/:id', authorize(['super_admin']), SubscriptionController.updatePlan);
router.delete('/plans/:id', authorize(['super_admin']), SubscriptionController.deletePlan);

// Available modules (for plan creation and management)
router.get('/available-modules', authorize(['super_admin', 'school_admin', 'branch_admin']), SubscriptionController.getAvailableModules);

// Module Management Routes (Super Admin Only)
router.get('/modules', authorize(['super_admin']), SubscriptionController.getAllModules);
router.post('/modules', authorize(['super_admin']), SubscriptionController.createModule);
router.put('/modules/:id', authorize(['super_admin']), SubscriptionController.updateModule);

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

// Check School Usage (Super Admin and School Admin)
router.get('/schools/:schoolId/usage', authorize(['super_admin', 'school_admin']), SubscriptionController.checkSchoolUsage);
router.get('/usage', authorize(['school_admin', 'branch_admin']), SubscriptionController.checkSchoolUsage);

// Renewal Requests Routes
// Create renewal request (School Admin Only)
router.post('/renewal-requests', 
  authorize(['school_admin', 'branch_admin']), 
  validate(renewalRequestValidation.createRenewalRequest),
  SubscriptionController.createRenewalRequest
);

// Get renewal requests (Super Admin Only)
router.get('/renewal-requests', 
  authorize(['super_admin']), 
  validate(renewalRequestValidation.getRenewalRequests),
  SubscriptionController.getRenewalRequests
);

// Get school renewal requests (School Admin Only)
router.get('/school/renewal-requests', 
  authorize(['school_admin', 'branch_admin']), 
  validate(renewalRequestValidation.getRenewalRequests),
  SubscriptionController.getSchoolRenewalRequests
);

// Review renewal request (Super Admin Only)
router.put('/renewal-requests/:id/review', 
  authorize(['super_admin']), 
  validate(renewalRequestValidation.reviewRenewalRequest),
  SubscriptionController.reviewRenewalRequest
);

// Subscription Statistics (Super Admin Only)
router.get('/stats', authorize(['super_admin']), SubscriptionController.getSubscriptionStats);

// Check and update all subscription statuses (Super Admin Only)
router.post('/check-all-statuses', authorize(['super_admin']), SubscriptionController.checkAndUpdateAllStatuses);

// Sync schools with plans (Super Admin Only)
router.post('/sync-plan/:planCode', authorize(['super_admin']), SubscriptionController.syncSchoolsWithPlan);
router.post('/sync-all-plans', authorize(['super_admin']), SubscriptionController.syncAllSchoolsWithPlans);

module.exports = router; 