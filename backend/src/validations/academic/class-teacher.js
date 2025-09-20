const { body } = require('express-validator');

const createClassTeacherValidator = [
  body('class_id').isUUID().withMessage('Class ID must be a valid UUID'),

  body('section_id')
    .optional({ nullable: true })
    .custom(value => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    })
    .withMessage('Section ID must be a valid UUID or null'),

  body('stream_id')
    .optional({ nullable: true })
    .custom(value => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    })
    .withMessage('Stream ID must be a valid UUID or null'),

  body('teacher_id').isUUID().withMessage('Teacher ID must be a valid UUID'),

  body('academic_year')
    .notEmpty()
    .withMessage('Academic year is required')
    .isLength({ min: 4, max: 10 })
    .withMessage('Academic year must be between 4 and 10 characters')
];

const updateClassTeacherValidator = [
  body('class_id').optional().isUUID().withMessage('Class ID must be a valid UUID'),

  body('section_id')
    .optional({ nullable: true })
    .custom(value => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    })
    .withMessage('Section ID must be a valid UUID or null'),

  body('stream_id')
    .optional({ nullable: true })
    .custom(value => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    })
    .withMessage('Stream ID must be a valid UUID or null'),

  body('teacher_id').optional().isUUID().withMessage('Teacher ID must be a valid UUID'),

  body('academic_year')
    .optional()
    .isLength({ min: 4, max: 10 })
    .withMessage('Academic year must be between 4 and 10 characters')
];

module.exports = {
  createClassTeacherValidator,
  updateClassTeacherValidator
};
