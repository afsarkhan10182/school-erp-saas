const { body } = require('express-validator');

const createGradingSystemValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Grading system name is required')
    .isLength({ max: 100 })
    .withMessage('Grading system name cannot exceed 100 characters'),

  body('code')
    .trim()
    .notEmpty()
    .withMessage('Grading system code is required')
    .isLength({ max: 20 })
    .withMessage('Grading system code cannot exceed 20 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('grade_type')
    .optional()
    .isIn(['letter', 'number', 'percentage', 'custom'])
    .withMessage('Grade type must be one of: letter, number, percentage, custom'),

  body('passing_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Passing percentage must be between 0 and 100'),

  body('max_grade_points')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Max grade points must be between 0 and 10'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),

  body('is_default').optional().isBoolean().withMessage('is_default must be a boolean value'),

  body('gradeScales').isArray({ min: 1 }).withMessage('At least one grade scale is required'),

  // Validate each grade scale
  body('gradeScales.*.grade')
    .trim()
    .notEmpty()
    .withMessage('Grade is required')
    .isLength({ max: 10 })
    .withMessage('Grade cannot exceed 10 characters'),

  body('gradeScales.*.min_percentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Minimum percentage must be between 0 and 100'),

  body('gradeScales.*.max_percentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Maximum percentage must be between 0 and 100'),

  body('gradeScales.*.grade_points')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Grade points must be between 0 and 10'),

  body('gradeScales.*.description')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Description cannot exceed 100 characters'),

  body('gradeScales.*.is_passing')
    .optional()
    .isBoolean()
    .withMessage('is_passing must be a boolean value'),

  // Custom validation for grade scale ranges
  body().custom(value => {
    if (value.gradeScales && Array.isArray(value.gradeScales)) {
      // Sort scales by min_percentage
      const scales = [...value.gradeScales].sort((a, b) => a.min_percentage - b.min_percentage);

      // Check for overlapping ranges
      for (let i = 0; i < scales.length - 1; i++) {
        if (scales[i].max_percentage >= scales[i + 1].min_percentage) {
          throw new Error('Grade scale ranges cannot overlap');
        }
      }

      // Check that min_percentage <= max_percentage for each scale
      for (const scale of scales) {
        if (scale.min_percentage > scale.max_percentage) {
          throw new Error('Minimum percentage cannot be greater than maximum percentage');
        }
      }
    }
    return true;
  })
];

const updateGradingSystemValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Grading system name cannot exceed 100 characters'),

  body('code')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Grading system code cannot exceed 20 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('grade_type')
    .optional()
    .isIn(['letter', 'number', 'percentage', 'custom'])
    .withMessage('Grade type must be one of: letter, number, percentage, custom'),

  body('passing_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Passing percentage must be between 0 and 100'),

  body('max_grade_points')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Max grade points must be between 0 and 10'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),

  body('is_default').optional().isBoolean().withMessage('is_default must be a boolean value'),

  body('gradeScales')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one grade scale is required'),

  // Validate each grade scale if provided
  body('gradeScales.*.grade')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Grade cannot exceed 10 characters'),

  body('gradeScales.*.min_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Minimum percentage must be between 0 and 100'),

  body('gradeScales.*.max_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Maximum percentage must be between 0 and 100'),

  body('gradeScales.*.grade_points')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Grade points must be between 0 and 10'),

  body('gradeScales.*.description')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Description cannot exceed 100 characters'),

  body('gradeScales.*.is_passing')
    .optional()
    .isBoolean()
    .withMessage('is_passing must be a boolean value'),

  // Custom validation for grade scale ranges (only if gradeScales provided)
  body().custom(value => {
    if (value.gradeScales && Array.isArray(value.gradeScales)) {
      // Sort scales by min_percentage
      const scales = [...value.gradeScales].sort((a, b) => a.min_percentage - b.min_percentage);

      // Check for overlapping ranges
      for (let i = 0; i < scales.length - 1; i++) {
        if (scales[i].max_percentage >= scales[i + 1].min_percentage) {
          throw new Error('Grade scale ranges cannot overlap');
        }
      }

      // Check that min_percentage <= max_percentage for each scale
      for (const scale of scales) {
        if (scale.min_percentage > scale.max_percentage) {
          throw new Error('Minimum percentage cannot be greater than maximum percentage');
        }
      }
    }
    return true;
  })
];

module.exports = {
  createGradingSystemValidator,
  updateGradingSystemValidator
};
