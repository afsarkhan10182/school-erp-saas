const express = require('express');
const {
  getAllClassSubjectMappings,
  getClassSubjectMappingById,
  createClassSubjectMapping,
  updateClassSubjectMapping,
  deleteClassSubjectMapping,
  getSubjectsByClass,
  getClassesBySubject,
} = require('~/controllers/academic/subjects/class-subject-mapping.controller');
const { verifyToken, authorize } = require('~/middleware/auth');
const { validate } = require('~/middleware/validate');
const { createClassSubjectMappingValidator, updateClassSubjectMappingValidator } = require('~/validations/academic/class-subject-mapping.validation');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

/**
 * @route   GET /api/class-subject-mappings
 * @desc    Get all class-subject mappings with filtering and pagination
 * @access  Private (school_admin, branch_admin)
 */
router.get('/', 
  authorize(['school_admin', 'branch_admin']),
  getAllClassSubjectMappings
);

/**
 * @route   GET /api/class-subject-mappings/class/:class_id
 * @desc    Get subjects for a specific class
 * @access  Private (school_admin, branch_admin, teacher)
 */
router.get('/class/:class_id', 
  authorize(['school_admin', 'branch_admin', 'teacher']),
  getSubjectsByClass
);

/**
 * @route   GET /api/class-subject-mappings/subject/:subject_id
 * @desc    Get classes for a specific subject
 * @access  Private (school_admin, branch_admin, teacher)
 */
router.get('/subject/:subject_id', 
  authorize(['school_admin', 'branch_admin', 'teacher']),
  getClassesBySubject
);

/**
 * @route   GET /api/class-subject-mappings/:id
 * @desc    Get class-subject mapping by ID
 * @access  Private (school_admin, branch_admin, teacher)
 */
router.get('/:id', 
  authorize(['school_admin', 'branch_admin', 'teacher']),
  getClassSubjectMappingById
);

/**
 * @route   POST /api/class-subject-mappings
 * @desc    Create new class-subject mapping
 * @access  Private (school_admin, branch_admin)
 */
router.post('/', 
  authorize(['school_admin', 'branch_admin']),
  validate(createClassSubjectMappingValidator),
  createClassSubjectMapping
);

/**
 * @route   PUT /api/class-subject-mappings/:id
 * @desc    Update class-subject mapping
 * @access  Private (school_admin, branch_admin)
 */
router.put('/:id', 
  authorize(['school_admin', 'branch_admin']),
  validate(updateClassSubjectMappingValidator),
  updateClassSubjectMapping
);

/**
 * @route   DELETE /api/class-subject-mappings/:id
 * @desc    Delete class-subject mapping
 * @access  Private (school_admin, branch_admin)
 */
router.delete('/:id', 
  authorize(['school_admin', 'branch_admin']),
  deleteClassSubjectMapping
);

module.exports = router;
