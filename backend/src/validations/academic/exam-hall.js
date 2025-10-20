const { body, query, param } = require('express-validator');

const createExamHallValidation = [
  body('name')
    .notEmpty()
    .withMessage('Exam hall name is required')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1'),
  body('branch_id')
    .notEmpty()
    .withMessage('Branch is required')
    .isUUID()
    .withMessage('Invalid branch ID')
];

const updateExamHallValidation = [
  param('id').isUUID().withMessage('Invalid exam hall ID'),
  body('name').optional().isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('branch_id').optional().isUUID().withMessage('Invalid branch ID')
];

const getExamHallValidation = [param('id').isUUID().withMessage('Invalid exam hall ID')];

const deleteExamHallValidation = [param('id').isUUID().withMessage('Invalid exam hall ID')];

const getAllExamHallsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('branch_id').optional().isUUID().withMessage('Invalid branch ID'),
  query('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

const checkHallAvailabilityValidation = [
  query('hallId')
    .notEmpty()
    .withMessage('Hall ID is required')
    .isUUID()
    .withMessage('Invalid hall ID'),
  query('examDate')
    .notEmpty()
    .withMessage('Exam date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  query('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format'),
  query('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format'),
  query('excludeScheduleId').optional().isUUID().withMessage('Invalid schedule ID')
];

module.exports = {
  createExamHallValidation,
  updateExamHallValidation,
  getExamHallValidation,
  deleteExamHallValidation,
  getAllExamHallsValidation,
  checkHallAvailabilityValidation
};
