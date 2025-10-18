const express = require('express');
const router = express.Router();
const SchoolConfigurationController = require('~/controllers/administration/settings/school-configuration.controller');
const AcademicSettingsController = require('~/controllers/administration/settings/academic-settings.controller');
const ReceiptSettingsController = require('~/controllers/administration/settings/receipt-settings.controller');
const FeeSettingsController = require('~/controllers/administration/settings/fee-settings.controller');
const SystemSettingsController = require('~/controllers/administration/settings/system-settings.controller');
const { verifyToken, authorize, setSchoolContext } = require('~/middleware/core/auth');
const { uploadFields } = require('~/middleware/shared/upload');

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(setSchoolContext);

// School Information Settings
router.get(
  '/school',
  authorize(['admin', 'super_admin']),
  SchoolConfigurationController.getSchoolConfiguration
);

router.put(
  '/school',
  authorize(['admin', 'super_admin']),
  uploadFields([{ name: 'schoolLogo', maxCount: 1 }]),
  SchoolConfigurationController.updateSchoolConfiguration
);

// Academic Settings
router.get(
  '/academic',
  authorize(['admin', 'super_admin']),
  AcademicSettingsController.getAcademicSettings
);

router.put(
  '/academic',
  authorize(['admin', 'super_admin']),
  AcademicSettingsController.updateAcademicSettings
);

// Fee & Finance Settings
router.get(
  '/fee',
  authorize(['admin', 'super_admin']),
  FeeSettingsController.getFeeSettings
);

router.put(
  '/fee',
  authorize(['admin', 'super_admin']),
  FeeSettingsController.updateFeeSettings
);

// Branding & Receipt Settings
router.get(
  '/branding',
  authorize(['admin', 'super_admin']),
  ReceiptSettingsController.getReceiptSettings
);

router.put(
  '/branding',
  authorize(['admin', 'super_admin']),
  uploadFields([
    { name: 'schoolLogo', maxCount: 1 },
    { name: 'receiptLogo', maxCount: 1 },
    { name: 'branchLogos', maxCount: 10 } // Allow multiple branch logos
  ]),
  ReceiptSettingsController.updateReceiptSettings
);

// System Preferences
router.get(
  '/system',
  authorize(['admin', 'super_admin']),
  SystemSettingsController.getSystemSettings
);

router.put(
  '/system',
  authorize(['admin', 'super_admin']),
  SystemSettingsController.updateSystemSettings
);

// Legacy endpoints for backward compatibility (can be removed later)
router.get(
  '/school/configuration',
  authorize(['admin', 'super_admin']),
  SchoolConfigurationController.getSchoolConfiguration
);

router.put(
  '/school/configuration',
  authorize(['admin', 'super_admin']),
  uploadFields([{ name: 'schoolLogo', maxCount: 1 }]),
  SchoolConfigurationController.updateSchoolConfiguration
);

router.get(
  '/school/configuration/receipt-settings',
  authorize(['admin', 'super_admin']),
  ReceiptSettingsController.getReceiptSettings
);

router.put(
  '/school/configuration/receipt-settings',
  authorize(['admin', 'super_admin']),
  uploadFields([
    { name: 'schoolLogo', maxCount: 1 },
    { name: 'receiptLogo', maxCount: 1 },
    { name: 'branchLogos', maxCount: 10 }
  ]),
  ReceiptSettingsController.updateReceiptSettings
);

router.get(
  '/school/configuration/fee-settings',
  authorize(['admin', 'super_admin']),
  FeeSettingsController.getFeeSettings
);

router.put(
  '/school/configuration/fee-settings',
  authorize(['admin', 'super_admin']),
  FeeSettingsController.updateFeeSettings
);

router.get(
  '/academic/settings',
  authorize(['admin', 'super_admin']),
  AcademicSettingsController.getAcademicSettings
);

router.put(
  '/academic/settings',
  authorize(['admin', 'super_admin']),
  AcademicSettingsController.updateAcademicSettings
);

module.exports = router;
