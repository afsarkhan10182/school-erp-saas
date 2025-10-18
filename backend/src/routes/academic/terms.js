const express = require('express');
const router = express.Router();
const {
  getAllTerms,
  getTermById,
  createTerm,
  updateTerm,
  deleteTerm
} = require('~/controllers/academic/terms/term.controller');
const { authenticateToken } = require('~/middleware/core/auth.middleware');
const { validateSchoolAccess } = require('~/middleware/core/school.middleware');

// Apply authentication to all routes
router.use(authenticateToken);
router.use(validateSchoolAccess);

// GET /api/terms - Get all terms
router.get('/', getAllTerms);

// GET /api/terms/:id - Get term by ID
router.get('/:id', getTermById);

// POST /api/terms - Create new term
router.post('/', createTerm);

// PUT /api/terms/:id - Update term
router.put('/:id', updateTerm);

// DELETE /api/terms/:id - Delete term
router.delete('/:id', deleteTerm);

module.exports = router;
