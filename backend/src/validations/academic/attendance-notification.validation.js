const { body, param } = require('express-validator');

const createAttendanceNotificationValidator = [
  body('student_id').isUUID().withMessage('Invalid student ID format'),

  body('parent_id').isUUID().withMessage('Invalid parent ID format'),

  body('notification_type')
    .isIn(['absent', 'late', 'irregular', 'custom'])
    .withMessage('Notification type must be one of: absent, late, irregular, custom'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),

  body('sent_date').isISO8601().withMessage('Invalid sent date format'),

  body('is_sent').optional().isBoolean().withMessage('is_sent must be a boolean value'),

  body('sent_via')
    .optional()
    .isIn(['sms', 'email', 'push', 'whatsapp'])
    .withMessage('Sent via must be one of: sms, email, push, whatsapp'),

  body('school_id').optional().isUUID().withMessage('Invalid school ID format'),

  body('branch_id').optional().isUUID().withMessage('Invalid branch ID format')
];

const updateAttendanceNotificationValidator = [
  param('id').isUUID().withMessage('Invalid attendance notification ID format'),

  body('student_id').optional().isUUID().withMessage('Invalid student ID format'),

  body('parent_id').optional().isUUID().withMessage('Invalid parent ID format'),

  body('notification_type')
    .optional()
    .isIn(['absent', 'late', 'irregular', 'custom'])
    .withMessage('Notification type must be one of: absent, late, irregular, custom'),

  body('message')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Message cannot be empty')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),

  body('sent_date').optional().isISO8601().withMessage('Invalid sent date format'),

  body('is_sent').optional().isBoolean().withMessage('is_sent must be a boolean value'),

  body('sent_via')
    .optional()
    .isIn(['sms', 'email', 'push', 'whatsapp'])
    .withMessage('Sent via must be one of: sms, email, push, whatsapp'),

  body('school_id').optional().isUUID().withMessage('Invalid school ID format'),

  body('branch_id').optional().isUUID().withMessage('Invalid branch ID format')
];

module.exports = {
  createAttendanceNotificationValidator,
  updateAttendanceNotificationValidator
};
