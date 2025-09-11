const { body, param, query } = require('express-validator');

const createSubjectValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subject name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject name must be between 2 and 100 characters'),

  body('code')
    .trim()
    .notEmpty()
    .withMessage('Subject code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Subject code must be between 2 and 20 characters')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Subject code can only contain letters, numbers, hyphens, and underscores'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('category')
    .optional()
    .isIn(['core', 'elective', 'extra_curricular', 'language', 'science', 'arts', 'commerce'])
    .withMessage(
      'Invalid category. Must be one of: core, elective, extra_curricular, language, science, arts, commerce'
    ),

  body('credit_hours')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Credit hours must be between 1 and 10'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),

  body('class_id').optional().isUUID().withMessage('Invalid class ID format'),

  body('branch_id').optional().isUUID().withMessage('Invalid branch ID format'),

  body('school_id').optional().isUUID().withMessage('Invalid school ID format')
];

const updateSubjectValidator = [
  param('id').isUUID().withMessage('Invalid subject ID format'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subject name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject name must be between 2 and 100 characters'),

  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subject code cannot be empty')
    .isLength({ min: 2, max: 20 })
    .withMessage('Subject code must be between 2 and 20 characters')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Subject code can only contain letters, numbers, hyphens, and underscores'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('category')
    .optional()
    .isIn(['core', 'elective', 'extra_curricular', 'language', 'science', 'arts', 'commerce'])
    .withMessage(
      'Invalid category. Must be one of: core, elective, extra_curricular, language, science, arts, commerce'
    ),

  body('credit_hours')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Credit hours must be between 1 and 10'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),

  body('class_id').optional().isUUID().withMessage('Invalid class ID format'),

  body('branch_id').optional().isUUID().withMessage('Invalid branch ID format')
];

const getSubjectByIdValidator = [param('id').isUUID().withMessage('Invalid subject ID format')];

const deleteSubjectValidator = [param('id').isUUID().withMessage('Invalid subject ID format')];

const getSubjectsForDropdownValidator = [
  query('class_id').optional().isUUID().withMessage('Invalid class ID format'),

  query('branch_id').optional().isUUID().withMessage('Invalid branch ID format'),

  query('category')
    .optional()
    .isIn(['core', 'elective', 'extra_curricular', 'language', 'science', 'arts', 'commerce'])
    .withMessage(
      'Invalid category. Must be one of: core, elective, extra_curricular, language, science, arts, commerce'
    )
];

module.exports = {
  createSubjectValidator,
  updateSubjectValidator,
  getSubjectByIdValidator,
  deleteSubjectValidator,
  getSubjectsForDropdownValidator
};
