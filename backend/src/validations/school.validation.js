const { body } = require('express-validator');

const createSchoolValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('School name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('School name must be between 2 and 100 characters'),

  body('code')
    .trim()
    .notEmpty()
    .withMessage('School code is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('School code must be between 2 and 10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('School code must contain only uppercase letters and numbers'),

  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),

  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),

  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),

  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 50 })
    .withMessage('City must not exceed 50 characters'),

  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
    .isLength({ max: 50 })
    .withMessage('State must not exceed 50 characters'),

  body('country')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Country must not exceed 50 characters'),

  body('postal_code')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Postal code must not exceed 10 characters'),

  body('website').optional().isURL().withMessage('Please provide a valid website URL'),

  body('currency')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Currency must not exceed 10 characters'),

  body('currency_symbol')
    .optional()
    .isLength({ max: 5 })
    .withMessage('Currency symbol must not exceed 5 characters'),

  body('timezone')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Timezone must not exceed 50 characters'),

  body('subscription_plan')
    .optional()
    .isIn(['trial', 'basic', 'premium', 'enterprise', 'lifetime'])
    .withMessage('Invalid subscription plan'),

  body('max_students')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max students must be a positive integer'),

  body('max_staff')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max staff must be a positive integer'),

  body('max_branches')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max branches must be a positive integer')
];

const updateSchoolValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('School name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('School name must be between 2 and 100 characters'),

  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('School code cannot be empty')
    .isLength({ min: 2, max: 10 })
    .withMessage('School code must be between 2 and 10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('School code must contain only uppercase letters and numbers'),

  body('email').optional().isEmail().withMessage('Please provide a valid email').normalizeEmail(),

  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),

  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),

  body('city').optional().isLength({ max: 50 }).withMessage('City must not exceed 50 characters'),

  body('state').optional().isLength({ max: 50 }).withMessage('State must not exceed 50 characters'),

  body('country')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Country must not exceed 50 characters'),

  body('postal_code')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Postal code must not exceed 10 characters'),

  body('website').optional().isURL().withMessage('Please provide a valid website URL'),

  body('currency')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Currency must not exceed 10 characters'),

  body('currency_symbol')
    .optional()
    .isLength({ max: 5 })
    .withMessage('Currency symbol must not exceed 5 characters'),

  body('timezone')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Timezone must not exceed 50 characters'),

  body('subscription_plan')
    .optional()
    .isIn(['trial', 'basic', 'premium', 'enterprise', 'lifetime'])
    .withMessage('Invalid subscription plan'),

  body('max_students')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max students must be a positive integer'),

  body('max_staff')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max staff must be a positive integer'),

  body('max_branches')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max branches must be a positive integer'),

  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
];

module.exports = {
  createSchoolValidator,
  updateSchoolValidator
};
