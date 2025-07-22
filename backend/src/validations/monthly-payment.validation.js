const { body, query } = require('express-validator');

const generateMonthlyPayments = [
  body('fee_structure_id')
    .isUUID()
    .withMessage('Fee structure ID must be a valid UUID'),
  body('academic_year')
    .isLength({ max: 10 })
    .withMessage('Academic year must not exceed 10 characters')
    .notEmpty()
    .withMessage('Academic year is required'),
  body('class_id')
    .optional()
    .isUUID()
    .withMessage('Class ID must be a valid UUID'),
  body('section_id')
    .optional()
    .isUUID()
    .withMessage('Section ID must be a valid UUID'),
  body('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be an integer between 2020 and 2030')
    .notEmpty()
    .withMessage('Year is required'),
  body('months')
    .isArray({ min: 1, max: 12 })
    .withMessage('Months must be an array with 1 to 12 items')
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('Months must be an array');
      }
      for (const month of value) {
        if (!Number.isInteger(month) || month < 1 || month > 12) {
          throw new Error('Each month must be an integer between 1 and 12');
        }
      }
      return true;
    })
    .withMessage('Each month must be an integer between 1 and 12')
];

const recordMonthlyPayment = [
  body('payment_amount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be a positive number')
    .custom((value) => {
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        throw new Error('Payment amount can have maximum 2 decimal places');
      }
      return true;
    })
    .withMessage('Payment amount can have maximum 2 decimal places')
    .notEmpty()
    .withMessage('Payment amount is required'),
  body('payment_method')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Payment method must not exceed 50 characters'),
  body('transaction_id')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Transaction ID must not exceed 100 characters'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

const getMonthlyPayments = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be an integer greater than 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('academic_year')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Academic year must not exceed 10 characters'),
  query('status')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      const validStatuses = ['pending', 'partial', 'paid', 'overdue'];
      if (!validStatuses.includes(value)) {
        throw new Error('Status must be one of: pending, partial, paid, overdue');
      }
      return true;
    })
    .withMessage('Status must be one of: pending, partial, paid, overdue'),
  query('student_id')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('Student ID must be a valid UUID');
      }
      return true;
    })
    .withMessage('Student ID must be a valid UUID'),
  query('fee_structure_id')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('Fee structure ID must be a valid UUID');
      }
      return true;
    })
    .withMessage('Fee structure ID must be a valid UUID'),
  query('month')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      const month = parseInt(value);
      if (isNaN(month) || month < 1 || month > 12) {
        throw new Error('Month must be an integer between 1 and 12');
      }
      return true;
    })
    .withMessage('Month must be an integer between 1 and 12'),
  query('year')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      const year = parseInt(value);
      if (isNaN(year) || year < 2020 || year > 2030) {
        throw new Error('Year must be an integer between 2020 and 2030');
      }
      return true;
    })
    .withMessage('Year must be an integer between 2020 and 2030')
];

const getStudentMonthlyPayments = [
  query('student_id')
    .isUUID()
    .withMessage('Student ID must be a valid UUID')
    .notEmpty()
    .withMessage('Student ID is required'),
  query('academic_year')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Academic year must not exceed 10 characters'),
  query('fee_structure_id')
    .optional()
    .isUUID()
    .withMessage('Fee structure ID must be a valid UUID')
];

module.exports = {
  generateMonthlyPayments,
  recordMonthlyPayment,
  getMonthlyPayments,
  getStudentMonthlyPayments
}; 