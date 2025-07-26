const { body } = require('express-validator');

const createBranchValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Branch name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Branch name must be between 2 and 100 characters'),
  
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Branch code is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Branch code must be between 2 and 10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Branch code must contain only uppercase letters and numbers'),
  
  body('school_id')
    .isUUID()
    .withMessage('Valid school ID is required'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('currency')
    .trim()
    .notEmpty()
    .withMessage('Currency is required')
    .isLength({ max: 10 })
    .withMessage('Currency must not exceed 10 characters'),
  
  body('currency_symbol')
    .trim()
    .notEmpty()
    .withMessage('Currency symbol is required')
    .isLength({ max: 5 })
    .withMessage('Currency symbol must not exceed 5 characters'),
  
  body('address')
    .optional({ checkFalsy: true })
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
    .optional({ checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('Country must not exceed 50 characters'),
  
  body('postal_code')
    .optional({ checkFalsy: true })
    .isLength({ max: 10 })
    .withMessage('Postal code must not exceed 10 characters'),
  
  body('principal_name')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Principal name must not exceed 100 characters'),
  
  body('principal_email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid principal email')
    .normalizeEmail(),
  
  body('principal_phone')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please provide a valid principal phone number'),
  
  body('is_main_branch')
    .optional()
    .isBoolean()
    .withMessage('is_main_branch must be a boolean'),
];

const updateBranchValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Branch name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Branch name must be between 2 and 100 characters'),
  
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Branch code cannot be empty')
    .isLength({ min: 2, max: 10 })
    .withMessage('Branch code must be between 2 and 10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Branch code must contain only uppercase letters and numbers'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('currency')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Currency cannot be empty')
    .isLength({ max: 10 })
    .withMessage('Currency must not exceed 10 characters'),
  
  body('currency_symbol')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Currency symbol cannot be empty')
    .isLength({ max: 5 })
    .withMessage('Currency symbol must not exceed 5 characters'),
  
  body('address')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty')
    .isLength({ max: 50 })
    .withMessage('City must not exceed 50 characters'),
  
  body('state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('State cannot be empty')
    .isLength({ max: 50 })
    .withMessage('State must not exceed 50 characters'),
  
  body('country')
    .optional({ checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('Country must not exceed 50 characters'),
  
  body('postal_code')
    .optional({ checkFalsy: true })
    .isLength({ max: 10 })
    .withMessage('Postal code must not exceed 10 characters'),
  
  body('principal_name')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Principal name must not exceed 100 characters'),
  
  body('principal_email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid principal email')
    .normalizeEmail(),
  
  body('principal_phone')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please provide a valid principal phone number'),
  
  body('is_main_branch')
    .optional()
    .isBoolean()
    .withMessage('is_main_branch must be a boolean'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status'),
];

module.exports = {
  createBranchValidator,
  updateBranchValidator,
}; 