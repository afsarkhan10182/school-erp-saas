const { body, param, query } = require('express-validator');

const createSubjectGroupValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subject group name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject group name must be between 2 and 100 characters'),
  
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Subject group code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Subject group code must be between 2 and 20 characters')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Subject group code can only contain letters, numbers, hyphens, and underscores'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('total_credit_hours')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Total credit hours must be between 0 and 50'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
  
  body('class_id')
    .optional()
    .isUUID()
    .withMessage('Invalid class ID format'),
  
  body('branch_id')
    .optional()
    .isUUID()
    .withMessage('Invalid branch ID format'),
  
  body('school_id')
    .optional()
    .isUUID()
    .withMessage('Invalid school ID format'),
];

const updateSubjectGroupValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid subject group ID format'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subject group name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject group name must be between 2 and 100 characters'),
  
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subject group code cannot be empty')
    .isLength({ min: 2, max: 20 })
    .withMessage('Subject group code must be between 2 and 20 characters')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Subject group code can only contain letters, numbers, hyphens, and underscores'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('total_credit_hours')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Total credit hours must be between 0 and 50'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
  
  body('class_id')
    .optional()
    .isUUID()
    .withMessage('Invalid class ID format'),
  
  body('branch_id')
    .optional()
    .isUUID()
    .withMessage('Invalid branch ID format'),
];

const addSubjectsToGroupValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid subject group ID format'),
  
  body('subjects')
    .isArray({ min: 1 })
    .withMessage('Subjects must be an array with at least one subject'),
  
  body('subjects.*.subject_id')
    .isUUID()
    .withMessage('Invalid subject ID format'),
  
  body('subjects.*.sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  
  body('subjects.*.is_required')
    .optional()
    .isBoolean()
    .withMessage('is_required must be a boolean value'),
  
  body('subjects.*.weightage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Weightage must be between 0 and 100'),
];

const removeSubjectsFromGroupValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid subject group ID format'),
  
  body('subject_ids')
    .isArray({ min: 1 })
    .withMessage('Subject IDs must be an array with at least one subject ID'),
  
  body('subject_ids.*')
    .isUUID()
    .withMessage('Invalid subject ID format'),
];

module.exports = {
  createSubjectGroupValidator,
  updateSubjectGroupValidator,
  addSubjectsToGroupValidator,
  removeSubjectsFromGroupValidator,
};
