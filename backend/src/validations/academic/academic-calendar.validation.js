const { body, param, query } = require('express-validator');

const createAcademicCalendarValidator = [
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('day_type')
    .isIn(['working', 'holiday', 'weekend', 'exam', 'event'])
    .withMessage('Day type must be one of: working, holiday, weekend, exam, event'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('academic_year')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in YYYY-YYYY format'),
  
  body('is_working_day')
    .optional()
    .isBoolean()
    .withMessage('is_working_day must be a boolean value'),
  
  body('school_id')
    .optional()
    .isUUID()
    .withMessage('Invalid school ID format'),
  
  body('branch_id')
    .optional()
    .isUUID()
    .withMessage('Invalid branch ID format'),
];

const updateAcademicCalendarValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid academic calendar ID format'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('day_type')
    .optional()
    .isIn(['working', 'holiday', 'weekend', 'exam', 'event'])
    .withMessage('Day type must be one of: working, holiday, weekend, exam, event'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('academic_year')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Academic year cannot be empty')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in YYYY-YYYY format'),
  
  body('is_working_day')
    .optional()
    .isBoolean()
    .withMessage('is_working_day must be a boolean value'),
  
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
  createAcademicCalendarValidator,
  updateAcademicCalendarValidator,
};
