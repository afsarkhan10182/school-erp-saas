const { body } = require('express-validator');

const createTermValidator = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('start_date')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  body('end_date')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('academic_year_id')
    .notEmpty()
    .withMessage('Academic year ID is required')
    .isUUID()
    .withMessage('Academic year ID must be a valid UUID'),

  body('status')
    .optional()
    .isIn(['upcoming', 'active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: upcoming, active, completed, cancelled')
];

const updateTermValidator = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('start_date').optional().isISO8601().withMessage('Start date must be a valid date'),

  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.start_date && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['upcoming', 'active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: upcoming, active, completed, cancelled')
];

module.exports = {
  createTermValidator,
  updateTermValidator
};
