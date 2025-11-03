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
  body('status')
    .optional()
    .isIn(['scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Invalid status value'),
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
  body('status')
    .optional()
    .isIn(['scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Invalid status value')
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
  query('status')
    .optional()
    .isIn(['scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Invalid status value'),
  query('invigilator_id').optional().isUUID().withMessage('Invalid invigilator ID'),
  query('date_from').optional().isISO8601().withMessage('Invalid date format'),
  query('date_to').optional().isISO8601().withMessage('Invalid date format')
];

const createQuickScheduleValidation = [
  body('exam_id')
    .notEmpty()
    .withMessage('Exam ID is required')
    .isUUID()
    .withMessage('Invalid exam ID'),
  body('class_ids').isArray({ min: 1 }).withMessage('At least one class ID is required'),
  body('class_ids.*').isUUID().withMessage('Invalid class ID format'),
  body('section_ids').optional().isArray().withMessage('Section IDs must be an array'),
  body('section_ids.*').optional().isUUID().withMessage('Invalid section ID format'),
  body('starting_date')
    .notEmpty()
    .withMessage('Starting date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('starting_time')
    .notEmpty()
    .withMessage('Starting time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  body('duration_minutes')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  body('exam_hall_id').optional().isUUID().withMessage('Invalid exam hall ID'),
  body('mark_distribution.theory_marks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Theory marks must be non-negative'),
  body('mark_distribution.practical_marks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Practical marks must be non-negative'),
  body('mark_distribution.viva_marks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Viva marks must be non-negative'),
  body('mark_distribution.assignment_marks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Assignment marks must be non-negative'),
  body('total_marks').optional().isInt({ min: 1 }).withMessage('Total marks must be at least 1'),
  body('pass_marks').optional().isInt({ min: 0 }).withMessage('Pass marks must be non-negative')
];

module.exports = {
  createExamScheduleValidation,
  updateExamScheduleValidation,
  getExamScheduleValidation,
  deleteExamScheduleValidation,
  getAllExamSchedulesValidation,
  createQuickScheduleValidation
};
