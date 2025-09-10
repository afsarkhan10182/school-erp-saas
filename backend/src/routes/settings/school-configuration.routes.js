const express = require('express');
const router = express.Router();
const SchoolConfigurationController = require('~/controllers/settings/school-configuration.controller');
const ReceiptSettingsController = require('~/controllers/settings/receipt-settings.controller');
const FeeSettingsController = require('~/controllers/settings/fee-settings.controller');
const { verifyToken, authorize, setSchoolContext } = require('~/middleware/auth');
const { uploadFields } = require('~/middleware/upload');

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(setSchoolContext);

// Get school configuration
router.get(
  '/',
  authorize(['school_admin', 'super_admin']),
  SchoolConfigurationController.getSchoolConfiguration
);

// Update school configuration
router.put(
  '/',
  authorize(['school_admin', 'super_admin']),
  SchoolConfigurationController.updateSchoolConfiguration
);

// Get receipt settings
router.get(
  '/receipt-settings',
  authorize(['school_admin', 'super_admin']),
  ReceiptSettingsController.getReceiptSettings
);

// Update receipt settings
router.put(
  '/receipt-settings',
  authorize(['school_admin', 'super_admin']),
  uploadFields([
    { name: 'schoolLogo', maxCount: 1 },
    { name: 'receiptLogo', maxCount: 1 },
    { name: 'branchLogos', maxCount: 10 } // Allow multiple branch logos
  ]),
  ReceiptSettingsController.updateReceiptSettings
);

// Get fee settings
router.get(
  '/fee-settings',
  authorize(['school_admin', 'super_admin']),
  FeeSettingsController.getFeeSettings
);

// Update fee settings
router.put(
  '/fee-settings',
  authorize(['school_admin', 'super_admin']),
  FeeSettingsController.updateFeeSettings
);

module.exports = router;
