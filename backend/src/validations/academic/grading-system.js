const { body } = require('express-validator');

const createGradingSystemValidator = [
  //  - Only 5 essential fields
  body('branch_id')
    .notEmpty()
    .withMessage('Branch is required')
    .isUUID()
    .withMessage('Branch ID must be a valid UUID'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Grading system name is required')
    .isLength({ max: 100 })
    .withMessage('Grading system name cannot exceed 100 characters'),

  body('grade_point')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Grade point must be between 0 and 10'),

  body('min_percentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Min percentage must be between 0 and 100'),

  body('max_percentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Max percentage must be between 0 and 100'),

  // Optional fields for backend compatibility
  body('description').optional().trim().isLength({ max: 500 }),
  body('grade_type').optional().isIn(['letter', 'number', 'percentage', 'custom']),
  body('passing_percentage').optional().isFloat({ min: 0, max: 100 }),
  body('max_grade_points').optional().isFloat({ min: 0, max: 10 }),
  body('is_active').optional().isBoolean(),
  body('is_default').optional().isBoolean(),
  body('created_by').optional().isUUID(),
  body('updated_by').optional().isUUID(),

  // Custom validation for percentage range
  body().custom(value => {
    const minPerc = parseFloat(value.min_percentage);
    const maxPerc = parseFloat(value.max_percentage);

    if (minPerc > maxPerc) {
      throw new Error('Min percentage cannot be greater than max percentage');
    }
    return true;
  })
];

const updateGradingSystemValidator = [
  //  - Only 5 essential fields (all optional for updates)
  body('branch_id').optional().isUUID().withMessage('Branch ID must be a valid UUID'),

  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Grading system name cannot exceed 100 characters'),

  body('grade_point')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Grade point must be between 0 and 10'),

  body('min_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Min percentage must be between 0 and 100'),

  body('max_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Max percentage must be between 0 and 100'),

  // Optional fields for backend compatibility
  body('description').optional().trim().isLength({ max: 500 }),
  body('grade_type').optional().isIn(['letter', 'number', 'percentage', 'custom']),
  body('passing_percentage').optional().isFloat({ min: 0, max: 100 }),
  body('max_grade_points').optional().isFloat({ min: 0, max: 10 }),
  body('is_active').optional().isBoolean(),
  body('is_default').optional().isBoolean(),
  body('updated_by').optional().isUUID(),

  // Custom validation for percentage range (only if both provided)
  body().custom(value => {
    if (value.min_percentage !== undefined && value.max_percentage !== undefined) {
      const minPerc = parseFloat(value.min_percentage);
      const maxPerc = parseFloat(value.max_percentage);

      if (minPerc > maxPerc) {
        throw new Error('Min percentage cannot be greater than max percentage');
      }
    }
    return true;
  })
];

module.exports = {
  createGradingSystemValidator,
  updateGradingSystemValidator
};
