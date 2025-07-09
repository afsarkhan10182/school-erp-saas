const { body } = require('express-validator');

const createUserValidator = [
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('role')
    .isIn(['super_admin', 'school_admin', 'branch_admin', 'teacher', 'student', 'parent', 'accountant', 'hr', 'receptionist', 'librarian', 'transport_manager', 'alumni'])
    .withMessage('Invalid role'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('school_id')
    .optional()
    .isUUID()
    .withMessage('Valid school ID is required'),
  
  body('branch_id')
    .optional()
    .isUUID()
    .withMessage('Valid branch ID is required'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status'),
];

const updateUserValidator = [
  body('first_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('last_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('role')
    .optional()
    .isIn(['super_admin', 'school_admin', 'branch_admin', 'teacher', 'student', 'parent', 'accountant', 'hr', 'receptionist', 'librarian', 'transport_manager', 'alumni'])
    .withMessage('Invalid role'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('school_id')
    .optional()
    .isUUID()
    .withMessage('Valid school ID is required'),
  
  body('branch_id')
    .optional()
    .isUUID()
    .withMessage('Valid branch ID is required'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status'),
];

module.exports = {
  createUserValidator,
  updateUserValidator,
}; 