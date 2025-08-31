const { body, param, query } = require('express-validator');

const createExamValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Exam name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Exam name must be between 2 and 200 characters'),
  
  body('exam_type')
    .trim()
    .notEmpty()
    .withMessage('Exam type is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Exam type must be between 2 and 50 characters'),
  
  body('subject_id')
    .isUUID()
    .withMessage('Invalid subject ID format'),
  
  body('class_id')
    .isUUID()
    .withMessage('Invalid class ID format'),
  
  body('section_id')
    .optional()
    .isUUID()
    .withMessage('Invalid section ID format'),
  
  body('exam_date')
    .isISO8601()
    .withMessage('Invalid exam date format'),
  
  body('start_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('end_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  
  body('total_marks')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Total marks must be between 1 and 1000'),
  
  body('passing_marks')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Passing marks must be between 0 and 1000'),
  
  body('academic_year')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in YYYY-YYYY format'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
  
  body('school_id')
    .optional()
    .isUUID()
    .withMessage('Invalid school ID format'),
  
  body('branch_id')
    .optional()
    .isUUID()
    .withMessage('Invalid branch ID format'),
];

const updateExamValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid exam ID format'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Exam name cannot be empty')
    .isLength({ min: 2, max: 200 })
    .withMessage('Exam name must be between 2 and 200 characters'),
  
  body('exam_type')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Exam type cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Exam type must be between 2 and 50 characters'),
  
  body('subject_id')
    .optional()
    .isUUID()
    .withMessage('Invalid subject ID format'),
  
  body('class_id')
    .optional()
    .isUUID()
    .withMessage('Invalid class ID format'),
  
  body('section_id')
    .optional()
    .isUUID()
    .withMessage('Invalid section ID format'),
  
  body('exam_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid exam date format'),
  
  body('start_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('end_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  
  body('total_marks')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Total marks must be between 1 and 1000'),
  
  body('passing_marks')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Passing marks must be between 0 and 1000'),
  
  body('academic_year')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Academic year cannot be empty')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in YYYY-YYYY format'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
  
  body('school_id')
    .optional()
    .isUUID()
    .withMessage('Invalid school ID format'),
  
  body('branch_id')
    .optional()
    .isUUID()
    .withMessage('Invalid branch ID format'),
];

module.exports = {
  createExamValidator,
  updateExamValidator,
};
