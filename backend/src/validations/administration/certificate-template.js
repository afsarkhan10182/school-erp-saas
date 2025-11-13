const { body, param, query } = require('express-validator');

const createCertificateTemplateValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Certificate name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Certificate name must be between 2 and 255 characters'),
  
  body('user_type')
    .isIn(['student', 'employee'])
    .withMessage('User type must be either student or employee'),
  
  body('page_layout')
    .optional()
    .isIn(['portrait', 'landscape'])
    .withMessage('Page layout must be either portrait or landscape'),
  
  body('qr_code_text')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('QR code text must not exceed 100 characters'),
  
  body('user_photo_style')
    .optional()
    .isIn(['square', 'round'])
    .withMessage('User photo style must be either square or round'),
  
  body('photo_size')
    .optional()
    .isInt({ min: 50, max: 300 })
    .withMessage('Photo size must be between 50 and 300 pixels'),
  
  body('top_space')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Top space cannot be negative'),
  
  body('bottom_space')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bottom space cannot be negative'),
  
  body('left_space')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Left space cannot be negative'),
  
  body('right_space')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Right space cannot be negative'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Certificate content is required'),
  
  body('branch_id')
    .isUUID()
    .withMessage('Branch ID must be a valid UUID')
];

const updateCertificateTemplateValidator = [
  param('id')
    .isUUID()
    .withMessage('Template ID must be a valid UUID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Certificate name must be between 2 and 255 characters'),
  
  body('user_type')
    .optional()
    .isIn(['student', 'employee'])
    .withMessage('User type must be either student or employee'),
  
  body('page_layout')
    .optional()
    .isIn(['portrait', 'landscape'])
    .withMessage('Page layout must be either portrait or landscape'),
  
  body('qr_code_text')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('QR code text must not exceed 100 characters'),
  
  body('user_photo_style')
    .optional()
    .isIn(['square', 'round'])
    .withMessage('User photo style must be either square or round'),
  
  body('photo_size')
    .optional()
    .isInt({ min: 50, max: 300 })
    .withMessage('Photo size must be between 50 and 300 pixels'),
  
  body('top_space')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Top space cannot be negative'),
  
  body('bottom_space')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bottom space cannot be negative'),
  
  body('left_space')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Left space cannot be negative'),
  
  body('right_space')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Right space cannot be negative'),
  
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Certificate content cannot be empty'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
];

const getCertificateTemplateValidator = [
  param('id')
    .isUUID()
    .withMessage('Template ID must be a valid UUID')
];

const deleteCertificateTemplateValidator = [
  param('id')
    .isUUID()
    .withMessage('Template ID must be a valid UUID')
];

const getCertificateTemplatesValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('user_type')
    .optional()
    .isIn(['student', 'employee'])
    .withMessage('User type must be either student or employee'),
  
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
];

module.exports = {
  createCertificateTemplateValidator,
  updateCertificateTemplateValidator,
  getCertificateTemplateValidator,
  deleteCertificateTemplateValidator,
  getCertificateTemplatesValidator
};
