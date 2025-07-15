const express = require('express');
const {
  createFeeStructure,
  getFeeStructures,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  cloneFeeStructure,
} = require('../controllers/fee-structure.controller');
const { verifyToken, setSchoolContext, requireRole } = require('../middleware/auth');
const router = express.Router();

// Middleware to ensure authentication
router.use(verifyToken);

// Middleware to ensure school context is set
router.use(setSchoolContext);

// POST endpoint to create a new fee structure (admin only)
router.post('/', requireRole('super_admin', 'school_admin'), createFeeStructure);

// GET endpoint to retrieve all fee structures
router.get('/', getFeeStructures);

// GET endpoint to retrieve a specific fee structure by ID
router.get('/:id', getFeeStructureById);

// PUT endpoint to update a fee structure (admin only)
router.put('/:id', requireRole('super_admin', 'school_admin'), updateFeeStructure);

// DELETE endpoint to delete a fee structure (admin only)
router.delete('/:id', requireRole('super_admin', 'school_admin'), deleteFeeStructure);

// POST endpoint to clone a fee structure (admin only)
router.post('/:id/clone', requireRole('super_admin', 'school_admin'), cloneFeeStructure);

module.exports = router;
