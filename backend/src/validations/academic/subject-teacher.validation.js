const { body, param } = require('express-validator');

const createSubjectTeacherValidator = [
  body('subject_id')
    .isUUID()
    .withMessage('Subject ID must be a valid UUID')
    .notEmpty()
    .withMessage('Subject ID is required'),
  
  body('teacher_id')
    .isUUID()
    .withMessage('Teacher ID must be a valid UUID')
    .notEmpty()
    .withMessage('Teacher ID is required'),
  
  body('class_id')
    .optional()
    .isUUID()
    .withMessage('Class ID must be a valid UUID'),
  
  body('section_id')
    .optional()
    .isUUID()
    .withMessage('Section ID must be a valid UUID'),
  
  body('is_primary')
    .optional()
    .isBoolean()
    .withMessage('Is primary must be a boolean'),
  
  body('academic_year')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY')
    .notEmpty()
    .withMessage('Academic year is required'),
  
  body('school_id')
    .isUUID()
    .withMessage('School ID must be a valid UUID')
    .notEmpty()
    .withMessage('School ID is required'),
  
  body('branch_id')
    .isUUID()
    .withMessage('Branch ID must be a valid UUID')
    .notEmpty()
    .withMessage('Branch ID is required')
];

const updateSubjectTeacherValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid subject-teacher ID'),
  
  body('subject_id')
    .optional()
    .isUUID()
    .withMessage('Subject ID must be a valid UUID'),
  
  body('teacher_id')
    .optional()
    .isUUID()
    .withMessage('Teacher ID must be a valid UUID'),
  
  body('class_id')
    .optional()
    .isUUID()
    .withMessage('Class ID must be a valid UUID'),
  
  body('section_id')
    .optional()
    .isUUID()
    .withMessage('Section ID must be a valid UUID'),
  
  body('is_primary')
    .optional()
    .isBoolean()
    .withMessage('Is primary must be a boolean'),
  
  body('academic_year')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  
  body('school_id')
    .optional()
    .isUUID()
    .withMessage('School ID must be a valid UUID'),
  
  body('branch_id')
    .optional()
    .isUUID()
    .withMessage('Branch ID must be a valid UUID')
];

module.exports = {
  createSubjectTeacherValidator,
  updateSubjectTeacherValidator
};
