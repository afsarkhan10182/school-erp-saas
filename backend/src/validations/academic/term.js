const { body } = require('express-validator');

const createTermValidator = [
  // CodeIgniter Style - Only validate essential fields
  body('branch_id')
    .notEmpty()
    .withMessage('Branch is required')
    .isUUID()
    .withMessage('Branch ID must be a valid UUID'),

  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  // Optional fields for CodeIgniter approach
  body('code')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Code must be between 2 and 20 characters'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('start_date').optional().isISO8601().withMessage('Start date must be a valid date'),

  body('end_date').optional().isISO8601().withMessage('End date must be a valid date'),

  body('academic_year')
    .optional()
    .isLength({ min: 4, max: 10 })
    .withMessage('Academic year must be between 4 and 10 characters'),

  body('status')
    .optional()
    .isIn(['upcoming', 'active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: upcoming, active, completed, cancelled')
];

const updateTermValidator = [
  // CodeIgniter Style - Only validate essential fields
  body('branch_id').optional().isUUID().withMessage('Branch ID must be a valid UUID'),

  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  // Optional fields for CodeIgniter approach
  body('code')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Code must be between 2 and 20 characters'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('start_date').optional().isISO8601().withMessage('Start date must be a valid date'),

  body('end_date').optional().isISO8601().withMessage('End date must be a valid date'),

  body('academic_year')
    .optional()
    .isLength({ min: 4, max: 10 })
    .withMessage('Academic year must be between 4 and 10 characters'),

  body('status')
    .optional()
    .isIn(['upcoming', 'active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: upcoming, active, completed, cancelled')
];

module.exports = {
  createTermValidator,
  updateTermValidator
};
