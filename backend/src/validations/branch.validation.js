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
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  
  body('city')
    .optional()
    .isLength({ max: 50 })
    .withMessage('City must not exceed 50 characters'),
  
  body('state')
    .optional()
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
  
  body('principal_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Principal name must not exceed 100 characters'),
  
  body('principal_email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid principal email')
    .normalizeEmail(),
  
  body('principal_phone')
    .optional()
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
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  
  body('city')
    .optional()
    .isLength({ max: 50 })
    .withMessage('City must not exceed 50 characters'),
  
  body('state')
    .optional()
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
  
  body('principal_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Principal name must not exceed 100 characters'),
  
  body('principal_email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid principal email')
    .normalizeEmail(),
  
  body('principal_phone')
    .optional()
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