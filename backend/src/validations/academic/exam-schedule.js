const { body, query, param } = require('express-validator');

const createExamScheduleValidation = [
  body('exam_id')
    .notEmpty()
    .withMessage('Exam ID is required')
    .isUUID()
    .withMessage('Invalid exam ID'),
  body('exam_date')
    .notEmpty()
    .withMessage('Exam date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('start_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  body('end_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  body('duration_minutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  body('exam_hall_id').optional().isUUID().withMessage('Invalid exam hall ID'),
  body('invigilator_id').optional().isUUID().withMessage('Invalid invigilator ID'),
  body('status_id')
    .notEmpty()
    .withMessage('Status is required')
    .isUUID()
    .withMessage('Invalid status ID'),
  body('special_instructions')
    .optional()
    .isString()
    .withMessage('Special instructions must be a string'),
  body('rescheduled_reason')
    .optional()
    .isString()
    .withMessage('Rescheduled reason must be a string')
];

const updateExamScheduleValidation = [
  param('id').isUUID().withMessage('Invalid schedule ID'),
  body('exam_date').optional().isISO8601().withMessage('Invalid date format'),
  body('start_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  body('end_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  body('duration_minutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  body('exam_hall_id').optional().isUUID().withMessage('Invalid exam hall ID'),
  body('invigilator_id').optional().isUUID().withMessage('Invalid invigilator ID'),
  body('status_id').optional().isUUID().withMessage('Invalid status ID')
];

const getExamScheduleValidation = [param('id').isUUID().withMessage('Invalid schedule ID')];

const deleteExamScheduleValidation = [param('id').isUUID().withMessage('Invalid schedule ID')];

const getAllExamSchedulesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('exam_id').optional().isUUID().withMessage('Invalid exam ID'),
  query('branch_id').optional().isUUID().withMessage('Invalid branch ID'),
  query('exam_hall_id').optional().isUUID().withMessage('Invalid exam hall ID'),
  query('status_id').optional().isUUID().withMessage('Invalid status ID'),
  query('invigilator_id').optional().isUUID().withMessage('Invalid invigilator ID'),
  query('date_from').optional().isISO8601().withMessage('Invalid date format'),
  query('date_to').optional().isISO8601().withMessage('Invalid date format')
];

module.exports = {
  createExamScheduleValidation,
  updateExamScheduleValidation,
  getExamScheduleValidation,
  deleteExamScheduleValidation,
  getAllExamSchedulesValidation
};

