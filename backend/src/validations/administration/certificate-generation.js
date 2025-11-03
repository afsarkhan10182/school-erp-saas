const { body } = require('express-validator');

/**
 * Validation rules for generating student certificates
 */
const generateStudentCertificatesValidator = [
  body('student_ids')
    .isArray({ min: 1 })
    .withMessage('Student IDs must be a non-empty array')
    .custom(value => {
      if (!value.every(id => typeof id === 'string' && id.length > 0)) {
        throw new Error('All student IDs must be non-empty strings');
      }
      return true;
    }),

  body('template_id')
    .notEmpty()
    .withMessage('Template ID is required')
    .isUUID()
    .withMessage('Template ID must be a valid UUID'),

  body('print_date')
    .notEmpty()
    .withMessage('Print date is required')
    .isISO8601()
    .withMessage('Print date must be a valid date'),

  body('branch_id').optional({ checkFalsy: true }).isUUID().withMessage('Branch ID must be a valid UUID'),

  body('class_id').optional({ checkFalsy: true }).isUUID().withMessage('Class ID must be a valid UUID'),

  body('section_id').optional({ checkFalsy: true }).isUUID().withMessage('Section ID must be a valid UUID')
];

/**
 * Validation rules for generating employee certificates
 */
const generateEmployeeCertificatesValidator = [
  body('employee_ids')
    .isArray({ min: 1 })
    .withMessage('Employee IDs must be a non-empty array')
    .custom(value => {
      if (!value.every(id => typeof id === 'string' && id.length > 0)) {
        throw new Error('All employee IDs must be non-empty strings');
      }
      return true;
    }),

  body('template_id')
    .notEmpty()
    .withMessage('Template ID is required')
    .isUUID()
    .withMessage('Template ID must be a valid UUID'),

  body('print_date')
    .notEmpty()
    .withMessage('Print date is required')
    .isISO8601()
    .withMessage('Print date must be a valid date'),

  body('branch_id').optional().isUUID().withMessage('Branch ID must be a valid UUID')
];

module.exports = {
  generateStudentCertificatesValidator,
  generateEmployeeCertificatesValidator
};
