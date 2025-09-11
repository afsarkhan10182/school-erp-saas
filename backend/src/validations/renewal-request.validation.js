const { body, query } = require('express-validator');

const createRenewalRequest = [
  body('requested_plan_code')
    .notEmpty()
    .withMessage('Requested plan code is required')
    .isString()
    .withMessage('Requested plan code must be a string'),

  body('request_type')
    .optional()
    .isIn(['renewal', 'upgrade', 'downgrade', 'change_plan'])
    .withMessage('Request type must be one of: renewal, upgrade, downgrade, change_plan'),

  body('billing_cycle')
    .optional()
    .isIn(['monthly', 'yearly', 'lifetime'])
    .withMessage('Billing cycle must be one of: monthly, yearly, lifetime'),

  body('request_reason')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Request reason cannot exceed 1000 characters')
];

const reviewRenewalRequest = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['approved', 'rejected', 'cancelled'])
    .withMessage('Status must be one of: approved, rejected, cancelled'),

  body('admin_notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters'),

  body('admin_response')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Admin response cannot exceed 1000 characters')
];

const getRenewalRequests = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Status must be one of: pending, approved, rejected, cancelled'),

  query('school_id').optional().isUUID().withMessage('School ID must be a valid UUID'),

  query('request_type')
    .optional()
    .isIn(['renewal', 'upgrade', 'downgrade', 'change_plan'])
    .withMessage('Request type must be one of: renewal, upgrade, downgrade, change_plan')
];

module.exports = {
  createRenewalRequest,
  reviewRenewalRequest,
  getRenewalRequests
};
