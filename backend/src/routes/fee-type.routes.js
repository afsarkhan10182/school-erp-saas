const express = require('express');
const {
  createFeeType,
  getFeeTypes,
  getFeeTypeById,
  updateFeeType,
  deleteFeeType,
  restoreFeeType,
} = require('../controllers/fee-type.controller');
const { verifyToken, setSchoolContext, setBranchContext, requireRole } = require('../middleware/auth');
const router = express.Router();

// Middleware to ensure authentication
router.use(verifyToken);

// Middleware to ensure school context is set
router.use(setSchoolContext);

// Middleware to ensure branch context is set
router.use(setBranchContext);

// POST endpoint to create a new fee type (admin only)
router.post('/', requireRole('super_admin', 'school_admin'), createFeeType);

// GET endpoint to retrieve all fee types
router.get('/', getFeeTypes);

// GET endpoint to retrieve a specific fee type by ID
router.get('/:id', getFeeTypeById);

// PUT endpoint to update a fee type (admin only)
router.put('/:id', requireRole('super_admin', 'school_admin'), updateFeeType);

// DELETE endpoint to delete a fee type (admin only)
router.delete('/:id', requireRole('super_admin', 'school_admin'), deleteFeeType);

// PATCH endpoint to restore a soft-deleted fee type (admin only)
router.patch('/:id/restore', requireRole('super_admin', 'school_admin'), restoreFeeType);

module.exports = router;
