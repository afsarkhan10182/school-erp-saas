const express = require('express');
const {
  createFeeStructure,
  createSectionBasedFeeStructures,
  getFeeStructures,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  cloneFeeStructure,
  getFeeStructuresWithContext,
} = require('../controllers/fee-structure.controller');
const { verifyToken, setSchoolContext, setBranchContext, requireRole } = require('../middleware/auth');
const { validateModuleAccess, checkSubscriptionStatus } = require('../middleware/subscriptionValidation');
const router = express.Router();

// Middleware to ensure authentication
router.use(verifyToken);

// Middleware to ensure school context is set
router.use(setSchoolContext);

// Middleware to ensure branch context is set
router.use(setBranchContext);

// Middleware to check subscription status and validate module access
router.use(checkSubscriptionStatus);
router.use(validateModuleAccess('fees'));

// POST endpoint to create a new fee structure (admin only)
router.post('/', requireRole('super_admin', 'school_admin', 'branch_admin'), createFeeStructure);

// POST endpoint to create multiple section-based fee structures (admin only)
router.post('/section-based', requireRole('super_admin', 'school_admin', 'branch_admin'), createSectionBasedFeeStructures);



// GET endpoint to retrieve all fee structures
router.get('/', getFeeStructures);

// GET endpoint to retrieve fee structures with complete context (for invoice generation)
// This must come before /:id route to prevent conflicts
router.get('/with-context', getFeeStructuresWithContext);

// GET endpoint to retrieve a specific fee structure by ID
router.get('/:id', getFeeStructureById);

// PUT endpoint to update a fee structure (admin only)
router.put('/:id', requireRole('super_admin', 'school_admin', 'branch_admin'), updateFeeStructure);

// DELETE endpoint to delete a fee structure (admin only)
router.delete('/:id', requireRole('super_admin', 'school_admin', 'branch_admin'), deleteFeeStructure);

// POST endpoint to clone a fee structure (admin only)
router.post('/:id/clone', requireRole('super_admin', 'school_admin', 'branch_admin'), cloneFeeStructure);

module.exports = router;
