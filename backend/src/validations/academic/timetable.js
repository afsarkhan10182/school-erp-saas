const { body, param } = require('express-validator');

const createTimetableValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Timetable name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Timetable name must be between 2 and 100 characters'),

  body('class_id').isUUID().withMessage('Invalid class ID format'),

  body('section_id').optional().isUUID().withMessage('Invalid section ID format'),

  body('academic_year')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in YYYY-YYYY format'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),

  body('school_id').optional().isUUID().withMessage('Invalid school ID format'),

  body('branch_id').optional().isUUID().withMessage('Invalid branch ID format')
];

const createTimetableSlotValidator = [
  param('id').isUUID().withMessage('Invalid timetable ID format'),

  body('subject_id').isUUID().withMessage('Invalid subject ID format'),

  body('teacher_id').isUUID().withMessage('Invalid teacher ID format'),

  body('day_of_week')
    .isInt({ min: 1, max: 7 })
    .withMessage('Day of week must be between 1 (Monday) and 7 (Sunday)'),

  body('period_number')
    .isInt({ min: 1, max: 10 })
    .withMessage('Period number must be between 1 and 10'),

  body('start_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format (24-hour)'),

  body('end_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format (24-hour)')
    .custom((value, { req }) => {
      const startTime = req.body.start_time;
      if (startTime && value <= startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('room_number')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Room number must not exceed 20 characters'),

  body('is_break').optional().isBoolean().withMessage('is_break must be a boolean value')
];

const updateTimetableSlotValidator = [
  param('id').isUUID().withMessage('Invalid timetable ID format'),

  param('slotId').isUUID().withMessage('Invalid slot ID format'),

  body('subject_id').optional().isUUID().withMessage('Invalid subject ID format'),

  body('teacher_id').optional().isUUID().withMessage('Invalid teacher ID format'),

  body('day_of_week')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Day of week must be between 1 (Monday) and 7 (Sunday)'),

  body('period_number')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Period number must be between 1 and 10'),

  body('start_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format (24-hour)'),

  body('end_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format (24-hour)')
    .custom((value, { req }) => {
      const startTime = req.body.start_time;
      if (startTime && value <= startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('room_number')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Room number must not exceed 20 characters'),

  body('is_break').optional().isBoolean().withMessage('is_break must be a boolean value')
];

const updateTimetableValidator = [
  param('id').isUUID().withMessage('Invalid timetable ID format'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Timetable name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Timetable name must be between 2 and 100 characters'),

  body('class_id').optional().isUUID().withMessage('Invalid class ID format'),

  body('section_id').optional().isUUID().withMessage('Invalid section ID format'),

  body('academic_year')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Academic year cannot be empty')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in YYYY-YYYY format'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),

  body('school_id').optional().isUUID().withMessage('Invalid school ID format'),

  body('branch_id').optional().isUUID().withMessage('Invalid branch ID format')
];

module.exports = {
  createTimetableValidator,
  updateTimetableValidator,
  createTimetableSlotValidator,
  updateTimetableSlotValidator
};
