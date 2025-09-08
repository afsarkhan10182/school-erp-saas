const { body } = require("express-validator");

const createClassSubjectMappingValidator = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("code")
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 2, max: 20 })
    .withMessage("Code must be between 2 and 20 characters")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage(
      "Code can only contain letters, numbers, hyphens, and underscores"
    ),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("class_id")
    .notEmpty()
    .withMessage("Class ID is required")
    .isUUID()
    .withMessage("Class ID must be a valid UUID"),

  body("academic_year")
    .notEmpty()
    .withMessage("Academic year is required")
    .matches(/^\d{4}-\d{4}$/)
    .withMessage("Academic year must be in YYYY-YYYY format"),

  body("subject_ids")
    .optional()
    .isArray()
    .withMessage("Subject IDs must be an array"),

  body("subject_ids.*")
    .optional()
    .isUUID()
    .withMessage("Each subject ID must be a valid UUID"),

  body("total_credit_hours")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Total credit hours must be between 0 and 100"),
];

const updateClassSubjectMappingValidator = [
  body("name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("code")
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage("Code must be between 2 and 20 characters")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage(
      "Code can only contain letters, numbers, hyphens, and underscores"
    ),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("subject_ids")
    .optional()
    .isArray()
    .withMessage("Subject IDs must be an array"),

  body("subject_ids.*")
    .optional()
    .isUUID()
    .withMessage("Each subject ID must be a valid UUID"),

  body("total_credit_hours")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Total credit hours must be between 0 and 100"),
];

module.exports = {
  createClassSubjectMappingValidator,
  updateClassSubjectMappingValidator,
};
