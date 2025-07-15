const { body, param, query } = require('express-validator');

const createAcademicYear = [
  body('name')
    .trim()
    .isLength({ min: 7, max: 50 })
    .withMessage('Academic year name must be between 7 and 50 characters')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format: 2024-2025')
    .custom((value) => {
      const [startYear, endYear] = value.split('-').map(Number);
      if (endYear !== startYear + 1) {
        throw new Error('Academic year must be consecutive years (e.g., 2024-2025)');
      }
      return true;
    }),
  
  body('is_current')
    .optional()
    .isBoolean()
    .withMessage('is_current must be a boolean value'),
];

const updateAcademicYear = [
  param('id')
    .isUUID()
    .withMessage('Academic year ID must be a valid UUID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 7, max: 50 })
    .withMessage('Academic year name must be between 7 and 50 characters')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format: 2024-2025')
    .custom((value) => {
      const [startYear, endYear] = value.split('-').map(Number);
      if (endYear !== startYear + 1) {
        throw new Error('Academic year must be consecutive years (e.g., 2024-2025)');
      }
      return true;
    }),
  
  body('is_current')
    .optional()
    .isBoolean()
    .withMessage('is_current must be a boolean value'),
];

const getAcademicYear = [
  param('id')
    .isUUID()
    .withMessage('Academic year ID must be a valid UUID'),
];

const getAllAcademicYears = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('is_current')
    .optional()
    .isBoolean()
    .withMessage('is_current must be a boolean value'),
];

module.exports = {
  createAcademicYear,
  updateAcademicYear,
  getAcademicYear,
  getAllAcademicYears,
}; 