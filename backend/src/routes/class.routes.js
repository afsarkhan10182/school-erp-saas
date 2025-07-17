const express = require('express');
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassesForDropdown,
  getClassStats,
} = require('../controllers/class.controller');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Middleware to ensure authentication
router.use(verifyToken);

// GET /api/classes - Get all classes with filtering and pagination
router.get('/', authorize(['super_admin', 'school_admin', 'branch_admin']), getAllClasses);

// GET /api/classes/dropdown - Get all classes for dropdown
router.get('/dropdown', authorize(['super_admin', 'school_admin', 'branch_admin']), getClassesForDropdown);

// GET /api/classes/stats - Get class statistics
router.get('/stats', authorize(['super_admin', 'school_admin', 'branch_admin']), getClassStats);

// GET /api/classes/:id - Get class by ID
router.get('/:id', authorize(['super_admin', 'school_admin', 'branch_admin']), getClassById);

// POST /api/classes - Create new class
router.post('/', authorize(['super_admin', 'school_admin', 'branch_admin']), createClass);

// PUT /api/classes/:id - Update class
router.put('/:id', authorize(['super_admin', 'school_admin', 'branch_admin']), updateClass);

// DELETE /api/classes/:id - Delete class (soft delete)
router.delete('/:id', authorize(['super_admin', 'school_admin', 'branch_admin']), deleteClass);

module.exports = router;
