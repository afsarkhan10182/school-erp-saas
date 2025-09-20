const { body, param, query } = require('express-validator');

const createAttendanceValidator = [
  body('session_id').isUUID().withMessage('Invalid session ID format'),

  body('student_id').isUUID().withMessage('Invalid student ID format'),

  body('status')
    .isIn(['present', 'absent', 'late', 'half_day', 'excused'])
    .withMessage('Status must be one of: present, absent, late, half_day, excused'),

  body('date').isISO8601().withMessage('Invalid date format'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters'),

  body('school_id').optional().isUUID().withMessage('Invalid school ID format'),

  body('branch_id').optional().isUUID().withMessage('Invalid branch ID format')
];

const updateAttendanceValidator = [
  param('id').isUUID().withMessage('Invalid attendance record ID format'),

  body('session_id').optional().isUUID().withMessage('Invalid session ID format'),

  body('student_id').optional().isUUID().withMessage('Invalid student ID format'),

  body('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'half_day', 'excused'])
    .withMessage('Status must be one of: present, absent, late, half_day, excused'),

  body('date').optional().isISO8601().withMessage('Invalid date format'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters'),

  body('school_id').optional().isUUID().withMessage('Invalid school ID format'),

  body('branch_id').optional().isUUID().withMessage('Invalid branch ID format')
];

module.exports = {
  createAttendanceValidator,
  updateAttendanceValidator
};
