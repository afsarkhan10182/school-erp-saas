const express = require('express');
const router = express.Router();
const SchoolConfigurationController = require('../../controllers/settings/school-configuration.controller');
const { verifyToken, authorize } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get school configuration
router.get('/', 
  authorize(['school_admin', 'super_admin']), 
  SchoolConfigurationController.getSchoolConfiguration
);

// Update school configuration
router.put('/', 
  authorize(['school_admin', 'super_admin']), 
  SchoolConfigurationController.updateSchoolConfiguration
);

module.exports = router;
