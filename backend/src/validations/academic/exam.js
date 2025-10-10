const { body, param, query } = require('express-validator');

// Simple exam creation - only basic fields needed
const createExamValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Exam name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Exam name must be between 2 and 200 characters'),

  body('exam_type_id')
    .notEmpty()
    .withMessage('Exam type is required')
    .isUUID()
    .withMessage('Invalid exam type ID format'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('academic_year')
    .optional()
    .trim()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in YYYY-YYYY format'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value')
];

const updateExamValidator = [
  param('id').isUUID().withMessage('Invalid exam ID format'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Exam name cannot be empty')
    .isLength({ min: 2, max: 200 })
    .withMessage('Exam name must be between 2 and 200 characters'),

  body('exam_type_id').optional().isUUID().withMessage('Invalid exam type ID format'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('academic_year')
    .optional()
    .trim()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in YYYY-YYYY format'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),

  body('exam_status_id').optional().isUUID().withMessage('Invalid exam status ID format')
];

module.exports = {
  createExamValidator,
  updateExamValidator
};
