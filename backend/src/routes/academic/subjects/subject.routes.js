const express = require('express');
const {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsForDropdown,
  getSubjectStats,
} = require('~/controllers/academic/subjects/subject.controller');
const { verifyToken, authorize } = require('~/middleware/auth');
const { validate } = require('~/middleware/validate');
const { createSubjectValidator, updateSubjectValidator } = require('~/validations/academic/subject.validation');

const router = express.Router();

// Middleware to ensure authentication
router.use(verifyToken);

// GET /api/subjects - Get all subjects with role-based access control
router.get('/', authorize(['super_admin', 'school_admin', 'branch_admin']), getAllSubjects);

// GET /api/subjects/dropdown - Get all subjects for dropdown
router.get('/dropdown', authorize(['super_admin', 'school_admin', 'branch_admin']), getSubjectsForDropdown);

// GET /api/subjects/stats - Get subject statistics
router.get('/stats', authorize(['super_admin', 'school_admin', 'branch_admin']), getSubjectStats);

// GET /api/subjects/:id - Get subject by ID
router.get('/:id', authorize(['super_admin', 'school_admin', 'branch_admin']), getSubjectById);

// POST /api/subjects - Create new subject
router.post('/', 
  authorize(['super_admin', 'school_admin', 'branch_admin']), 
  validate(createSubjectValidator), 
  createSubject
);

// PUT /api/subjects/:id - Update subject
router.put('/:id', 
  authorize(['super_admin', 'school_admin', 'branch_admin']), 
  validate(updateSubjectValidator), 
  updateSubject
);

// DELETE /api/subjects/:id - Delete subject
router.delete('/:id', authorize(['super_admin', 'school_admin', 'branch_admin']), deleteSubject);

module.exports = router;
