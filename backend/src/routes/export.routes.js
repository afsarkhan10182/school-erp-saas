const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleValidation');

/**
 * Generic Export Routes
 * Supports multiple formats and report types
 */

// GET /api/export/:reportType/:format
// Example: /api/export/students/excel?includeSummary=true&status=active
router.get('/:reportType/:format', 
  authenticateToken, 
  requireRole('school_admin', 'branch_admin', 'super_admin'),
  exportController.exportReport
);

// GET /api/export/:reportType (defaults to excel format)
router.get('/:reportType', 
  authenticateToken, 
  requireRole('school_admin', 'branch_admin', 'super_admin'),
  (req, res, next) => {
    req.params.format = 'excel';
    return exportController.exportReport(req, res, next);
  }
);

module.exports = router;
