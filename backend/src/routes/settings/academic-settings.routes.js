const express = require('express');
const router = express.Router();
const AcademicSettingsController = require('../../controllers/settings/academic-settings.controller');
const { verifyToken, authorize } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get academic settings
router.get('/', 
  authorize(['school_admin', 'super_admin']), 
  AcademicSettingsController.getAcademicSettings
);

// Update academic settings
router.put('/', 
  authorize(['school_admin', 'super_admin']), 
  AcademicSettingsController.updateAcademicSettings
);

module.exports = router;
