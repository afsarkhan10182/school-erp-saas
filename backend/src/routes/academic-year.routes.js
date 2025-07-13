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
} = require('../controllers/academic-year.controller');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Middleware to ensure authentication
router.use(verifyToken);

// GET /api/academic-years - Get all academic years with filtering and pagination
router.get('/', authorize('super_admin', 'school_admin'), getAllAcademicYears);

// GET /api/academic-years/dropdown - Get all academic years for dropdown
router.get('/dropdown', authorize('super_admin', 'school_admin'), getAcademicYearsForDropdown);

// GET /api/academic-years/current - Get current academic year for a school
router.get('/current', authorize('super_admin', 'school_admin'), getCurrentAcademicYear);

// GET /api/academic-years/:id - Get academic year by ID
router.get('/:id', authorize('super_admin', 'school_admin'), getAcademicYearById);

// POST /api/academic-years/ - Create new academic year
router.post('/', authorize('super_admin', 'school_admin'), createAcademicYear);

// PUT /api/academic-years/:id - Update academic year
router.put('/:id', authorize('super_admin', 'school_admin'), updateAcademicYear);

// DELETE /api/academic-years/:id - Delete academic year (soft delete)
router.delete('/:id', authorize('super_admin', 'school_admin'), deleteAcademicYear);

// POST /api/academic-years/:id/set-current - Set current academic year
router.post('/:id/set-current', authorize('super_admin', 'school_admin'), setCurrentAcademicYear);

module.exports = router;
