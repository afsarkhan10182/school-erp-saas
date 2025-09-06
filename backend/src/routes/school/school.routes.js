const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const SchoolController = require('../../controllers/school/school.controller');
const {
  createSchoolValidator,
  updateSchoolValidator,
} = require('../../validations/school.validation');
const { uploadFields } = require('../../middleware/upload');

// All routes require authentication
router.use(verifyToken);

// Super Admin routes (can manage all schools)
router.post(
  '/',
  authorize(['super_admin']),
  uploadFields([
    { name: 'logo', maxCount: 1 },
    { name: 'system_logo', maxCount: 1 },
    { name: 'text_logo', maxCount: 1 },
    { name: 'printing_logo', maxCount: 1 },
    { name: 'report_card_design', maxCount: 1 },
  ]),
  validate(createSchoolValidator),
  SchoolController.createSchool
);

router.get(
  '/',
  authorize(['super_admin', 'school_admin']),
  SchoolController.getAllSchools
);

router.get(
  '/my-school',
  authorize(['school_admin', 'branch_admin']),
  SchoolController.getMySchool
);

router.put(
  '/my-school',
  authorize(['school_admin']),
  uploadFields([
    { name: 'logo', maxCount: 1 },
    { name: 'system_logo', maxCount: 1 },
    { name: 'text_logo', maxCount: 1 },
    { name: 'printing_logo', maxCount: 1 },
    { name: 'report_card_design', maxCount: 1 },
  ]),
  validate(updateSchoolValidator),
  SchoolController.updateMySchool
);

// School staff management
router.get(
  '/:id/staff',
  authorize(['super_admin', 'school_admin']),
  SchoolController.getSchoolStaff
);

router.get(
  '/:id',
  authorize(['super_admin', 'school_admin']),
  SchoolController.getSchoolById
);

router.put(
  '/:id',
  authorize(['super_admin']),
  uploadFields([
    { name: 'logo', maxCount: 1 },
    { name: 'system_logo', maxCount: 1 },
    { name: 'text_logo', maxCount: 1 },
    { name: 'printing_logo', maxCount: 1 },
    { name: 'report_card_design', maxCount: 1 },
  ]),
  validate(updateSchoolValidator),
  SchoolController.updateSchool
);

router.delete(
  '/:id',
  authorize(['super_admin']),
  SchoolController.deleteSchool
);

router.patch(
  '/:id/suspend',
  authorize(['super_admin']),
  SchoolController.suspendSchool
);

router.patch(
  '/:id/reactivate',
  authorize(['super_admin']),
  SchoolController.reactivateSchool
);

router.post(
  '/:id/reactivate',
  authorize(['super_admin']),
  SchoolController.reactivateSchool
);

// Module management routes (Super Admin controls, School Admin and Branch Admin view-only)
router.get(
  '/:id/modules',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  SchoolController.getSchoolModules
);

router.put(
  '/:id/modules',
  authorize(['super_admin']), // Only Super Admin can update modules
  SchoolController.updateSchoolModules
);

// Subscription plan routes
router.get(
  '/subscription-plans',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  SchoolController.getSubscriptionPlans
);

router.post(
  '/:id/request-upgrade',
  authorize(['school_admin']), // Only School Admin can request upgrades
  SchoolController.requestUpgrade
);

module.exports = router; 