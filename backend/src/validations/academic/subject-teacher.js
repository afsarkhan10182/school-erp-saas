const { body, param } = require('express-validator');
const { SubjectTeacher } = require('~/models');

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

  body('class_id').optional().isUUID().withMessage('Class ID must be a valid UUID'),

  body('section_id').optional().isUUID().withMessage('Section ID must be a valid UUID'),

  body('stream_id').optional().isUUID().withMessage('Stream ID must be a valid UUID'),

  body('is_primary').optional().isBoolean().withMessage('Is primary must be a boolean'),

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
    .withMessage('Branch ID is required'),

  // Custom validation to check for duplicate assignments
  body().custom(async (value, { req }) => {
    const {
      subject_id,
      teacher_id,
      class_id,
      section_id,
      stream_id,
      academic_year,
      school_id,
      branch_id
    } = req.body;

    // Check for existing assignment with same combination
    const existingAssignment = await SubjectTeacher.findOne({
      where: {
        subject_id,
        teacher_id,
        class_id: class_id || null,
        section_id: section_id || null,
        stream_id: stream_id || null,
        academic_year,
        school_id,
        branch_id
      }
    });

    if (existingAssignment) {
      throw new Error(
        'This teacher is already assigned to this subject for the selected class, section, and stream. Please choose a different combination.'
      );
    }

    return true;
  })
];

const updateSubjectTeacherValidator = [
  param('id').isUUID().withMessage('Invalid subject-teacher ID'),

  body('subject_id').optional().isUUID().withMessage('Subject ID must be a valid UUID'),

  body('teacher_id').optional().isUUID().withMessage('Teacher ID must be a valid UUID'),

  body('class_id').optional().isUUID().withMessage('Class ID must be a valid UUID'),

  body('section_id').optional().isUUID().withMessage('Section ID must be a valid UUID'),

  body('stream_id').optional().isUUID().withMessage('Stream ID must be a valid UUID'),

  body('is_primary').optional().isBoolean().withMessage('Is primary must be a boolean'),

  body('academic_year')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),

  body('school_id').optional().isUUID().withMessage('School ID must be a valid UUID'),

  body('branch_id').optional().isUUID().withMessage('Branch ID must be a valid UUID'),

  // Custom validation to check for duplicate assignments on update
  body().custom(async (value, { req }) => {
    const {
      subject_id,
      teacher_id,
      class_id,
      section_id,
      stream_id,
      academic_year,
      school_id,
      branch_id
    } = req.body;
    const { id } = req.params;

    // Only check if any of the key fields are being updated
    if (
      subject_id ||
      teacher_id ||
      class_id !== undefined ||
      section_id !== undefined ||
      stream_id !== undefined ||
      academic_year ||
      school_id ||
      branch_id
    ) {
      const whereClause = {
        id: { [require('sequelize').Op.ne]: id } // Exclude current record
      };

      // Add fields to check if they're provided
      if (subject_id) whereClause.subject_id = subject_id;
      if (teacher_id) whereClause.teacher_id = teacher_id;
      if (class_id !== undefined) whereClause.class_id = class_id || null;
      if (section_id !== undefined) whereClause.section_id = section_id || null;
      if (stream_id !== undefined) whereClause.stream_id = stream_id || null;
      if (academic_year) whereClause.academic_year = academic_year;
      if (school_id) whereClause.school_id = school_id;
      if (branch_id) whereClause.branch_id = branch_id;

      const existingAssignment = await SubjectTeacher.findOne({
        where: whereClause
      });

      if (existingAssignment) {
        throw new Error(
          'This teacher is already assigned to this subject for the selected class, section, and stream. Please choose a different combination.'
        );
      }
    }

    return true;
  })
];

module.exports = {
  createSubjectTeacherValidator,
  updateSubjectTeacherValidator
};
