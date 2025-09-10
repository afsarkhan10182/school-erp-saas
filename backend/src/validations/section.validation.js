const { body } = require('express-validator');

const createSectionValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Section name is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Section name must be between 1 and 10 characters')
    .matches(/^[A-Za-z0-9\s\-]+$/)
    .withMessage('Section name can only contain letters, numbers, spaces, and hyphens'),

  body('capacity')
    .isInt({ min: 1, max: 200 })
    .withMessage('Capacity must be a number between 1 and 200'),

  body('class_id').isUUID().withMessage('Valid class ID is required'),

  body('branch_id').optional().isUUID().withMessage('Branch ID must be a valid UUID'),

  body('class_teacher_id').optional().isUUID().withMessage('Class teacher ID must be a valid UUID'),

  body('is_active').optional().isBoolean().withMessage('Active status must be a boolean value')
];

const updateSectionValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Section name cannot be empty')
    .isLength({ min: 1, max: 10 })
    .withMessage('Section name must be between 1 and 10 characters')
    .matches(/^[A-Za-z0-9\s\-]+$/)
    .withMessage('Section name can only contain letters, numbers, spaces, and hyphens'),

  body('capacity')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Capacity must be a number between 1 and 200'),

  body('class_teacher_id').optional().isUUID().withMessage('Class teacher ID must be a valid UUID'),

  body('is_active').optional().isBoolean().withMessage('Active status must be a boolean value')
];

module.exports = {
  createSectionValidator,
  updateSectionValidator
};
