const { body } = require('express-validator');

const createAssignmentValidator = [
  body('class_id')
    .notEmpty()
    .withMessage('Class ID is required')
    .isUUID()
    .withMessage('Class ID must be a valid UUID'),

  body('subject_id')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isUUID()
    .withMessage('Subject ID must be a valid UUID'),

  body('section_id').optional().isUUID().withMessage('Section ID must be a valid UUID'),

  body('stream_id').optional().isUUID().withMessage('Stream ID must be a valid UUID'),

  body('academic_year')
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in YYYY-YYYY format')
];

const bulkCreateAssignmentsValidator = [
  body('assignments').isArray({ min: 1 }).withMessage('Assignments must be a non-empty array'),

  body('assignments.*.class_id')
    .notEmpty()
    .withMessage('Class ID is required for each assignment')
    .isUUID()
    .withMessage('Class ID must be a valid UUID'),

  body('assignments.*.subject_id')
    .notEmpty()
    .withMessage('Subject ID is required for each assignment')
    .isUUID()
    .withMessage('Subject ID must be a valid UUID'),

  body('assignments.*.section_id')
    .optional()
    .custom(value => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      // If value exists, validate as UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    })
    .withMessage('Section ID must be a valid UUID'),

  body('assignments.*.stream_id')
    .optional()
    .custom(value => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      // If value exists, validate as UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    })
    .withMessage('Stream ID must be a valid UUID'),

  body('assignments.*.academic_year')
    .notEmpty()
    .withMessage('Academic year is required for each assignment')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in YYYY-YYYY format')
];

module.exports = {
  createAssignmentValidator,
  bulkCreateAssignmentsValidator
};
