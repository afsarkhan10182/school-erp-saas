const { body, param } = require('express-validator');

const createExamStatusValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Exam status name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Exam status name must be between 2 and 50 characters'),

  body('code')
    .trim()
    .notEmpty()
    .withMessage('Exam status code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Exam status code must be between 2 and 20 characters')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Exam status code can only contain letters, numbers, hyphens, and underscores'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code (e.g., #FF0000)'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),

  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),

  body('school_id').optional().isUUID().withMessage('Invalid school ID format')
];

const updateExamStatusValidator = [
  param('id').isUUID().withMessage('Invalid exam status ID format'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Exam status name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Exam status name must be between 2 and 50 characters'),

  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Exam status code cannot be empty')
    .isLength({ min: 2, max: 20 })
    .withMessage('Exam status code must be between 2 and 20 characters')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Exam status code can only contain letters, numbers, hyphens, and underscores'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code (e.g., #FF0000)'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),

  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),

  body('school_id').optional().isUUID().withMessage('Invalid school ID format')
];

module.exports = {
  createExamStatusValidator,
  updateExamStatusValidator
};
