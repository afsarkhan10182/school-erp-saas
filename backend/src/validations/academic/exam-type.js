const { body, param } = require('express-validator');

const createExamTypeValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Exam type name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Exam type name must be between 2 and 100 characters'),

  body('code')
    .trim()
    .notEmpty()
    .withMessage('Exam type code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Exam type code must be between 2 and 20 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('weightage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Weightage must be between 0 and 100'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),

  body('school_id').optional().isUUID().withMessage('Invalid school ID format'),

  body('branch_id').optional().isUUID().withMessage('Invalid branch ID format')
];

const updateExamTypeValidator = [
  param('id').isUUID().withMessage('Invalid exam type ID format'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Exam type name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Exam type name must be between 2 and 100 characters'),

  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Exam type code cannot be empty')
    .isLength({ min: 2, max: 20 })
    .withMessage('Exam type code must be between 2 and 20 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('weightage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Weightage must be between 0 and 100'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),

  body('school_id').optional().isUUID().withMessage('Invalid school ID format'),

  body('branch_id').optional().isUUID().withMessage('Invalid branch ID format')
];

module.exports = {
  createExamTypeValidator,
  updateExamTypeValidator
};
