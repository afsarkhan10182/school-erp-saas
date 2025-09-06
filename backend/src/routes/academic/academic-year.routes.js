const express = require('express');
const {
  getAllAcademicYears,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  setCurrentAcademicYear,
  getCurrentAcademicYear,
  getAcademicYearsForDropdown,
  syncSchoolsToCurrentAcademicYear
} = require('../../controllers/academic/academic-year.controller');
const { verifyToken, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { createAcademicYear: createAcademicYearValidation, updateAcademicYear: updateAcademicYearValidation } = require('../../validations/academic/academic-year.validation');

const router = express.Router();

// Middleware to ensure authentication
router.use(verifyToken);

// GET /api/academic-years - Get all academic years (super admin and school admin can view)
router.get('/', authorize(['super_admin', 'school_admin']), getAllAcademicYears);

// GET /api/academic-years/dropdown - Get all academic years for dropdown (all authenticated users)
router.get('/dropdown', getAcademicYearsForDropdown);

// GET /api/academic-years/current - Get current academic year (all authenticated users)
router.get('/current', getCurrentAcademicYear);

// GET /api/academic-years/:id - Get academic year by ID (super admin and school admin can view)
router.get('/:id', authorize(['super_admin', 'school_admin']), getAcademicYearById);

// POST /api/academic-years/ - Create new academic year (super admin only)
router.post('/', 
  authorize(['super_admin']), 
  validate(createAcademicYearValidation), 
  createAcademicYear
);

// PUT /api/academic-years/:id - Update academic year (super admin only)
router.put('/:id', 
  authorize(['super_admin']), 
  validate(updateAcademicYearValidation), 
  updateAcademicYear
);

// DELETE /api/academic-years/:id - Delete academic year (super admin only)
router.delete('/:id', authorize(['super_admin']), deleteAcademicYear);

// POST /api/academic-years/:id/set-current - Set academic year as current (super admin only)
router.post('/:id/set-current', 
  authorize(['super_admin']), 
  setCurrentAcademicYear
);

// POST /api/academic-years/sync-schools - Sync all schools to current academic year (super admin only)
router.post('/sync-schools', 
  authorize(['super_admin']), 
  syncSchoolsToCurrentAcademicYear
);

module.exports = router;
