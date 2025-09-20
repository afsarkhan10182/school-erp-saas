const express = require('express');
const {
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  getSectionsForDropdown
} = require('~/controllers/academic/section.controller');
const { verifyToken, authorize } = require('~/middleware/core/auth');
const { validate } = require('~/middleware/shared/validate');
const {
  createSectionValidator,
  updateSectionValidator
} = require('~/validations/academic/section');

const router = express.Router();

// Middleware to ensure authentication
router.use(verifyToken);

// GET /api/sections - Get all sections with role-based access control
router.get('/', authorize(['super_admin', 'school_admin', 'branch_admin']), getAllSections);

// GET /api/sections/dropdown - Get all sections for dropdown
router.get(
  '/dropdown',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  getSectionsForDropdown
);

// GET /api/sections/:id - Get section by ID
router.get('/:id', authorize(['super_admin', 'school_admin', 'branch_admin']), getSectionById);

// POST /api/sections - Create new section
router.post(
  '/',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  validate(createSectionValidator),
  createSection
);

// PUT /api/sections/:id - Update section
router.put(
  '/:id',
  authorize(['super_admin', 'school_admin', 'branch_admin']),
  validate(updateSectionValidator),
  updateSection
);

// DELETE /api/sections/:id - Delete section (soft delete)
router.delete('/:id', authorize(['super_admin', 'school_admin', 'branch_admin']), deleteSection);

module.exports = router;
