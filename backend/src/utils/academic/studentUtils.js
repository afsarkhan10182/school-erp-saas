/**
 * Student utility functions
 */

/**
 * Sanitize enum fields to handle case sensitivity and validation
 * @param {Object} data - The data object containing enum fields
 * @returns {Object} - Sanitized data object
 */
const sanitizeEnumFields = data => {
  const sanitized = data;

  // Gender field sanitization
  if (sanitized.gender && sanitized.gender.trim() !== '') {
    const gender = sanitized.gender.toLowerCase();
    if (['male', 'female', 'other'].includes(gender)) {
      sanitized.gender = gender;
    } else {
      throw new Error(`Invalid gender value: ${sanitized.gender}`);
    }
  } else if (
    sanitized.gender === '' ||
    sanitized.gender === null ||
    sanitized.gender === undefined
  ) {
    throw new Error('Gender is required');
  }

  // Category field sanitization
  if (sanitized.category && sanitized.category.trim() !== '') {
    const category = sanitized.category.toLowerCase();
    if (['general', 'obc', 'sc', 'st', 'other'].includes(category)) {
      sanitized.category = category;
    } else {
      throw new Error(`Invalid category value: ${sanitized.category}`);
    }
  } else {
    // If category is empty, null, or undefined, set it to default value
    sanitized.category = 'general';
  }

  // Status field sanitization
  if (sanitized.status && sanitized.status.trim() !== '') {
    const status = sanitized.status.toLowerCase();
    if (['active', 'inactive', 'transferred', 'graduated', 'dropped'].includes(status)) {
      sanitized.status = status;
    } else {
      throw new Error(`Invalid status value: ${sanitized.status}`);
    }
  } else {
    // If status is empty, null, or undefined, set it to default value
    sanitized.status = 'active';
  }

  // Admission sought in field sanitization (for junior college)
  if (sanitized.admission_sought_in) {
    const stream = sanitized.admission_sought_in.toLowerCase();
    if (['arts', 'commerce', 'science'].includes(stream)) {
      sanitized.admission_sought_in = stream;
    } else {
      throw new Error(`Invalid admission_sought_in value: ${sanitized.admission_sought_in}`);
    }
  }

  return sanitized;
};

/**
 * Validate student data before creation/update
 * @param {Object} studentData - The student data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
const validateStudentData = studentData => {
  const errors = [];

  // Required fields validation
  const requiredFields = ['first_name', 'last_name', 'admission_number', 'date_of_birth', 'gender'];
  for (const field of requiredFields) {
    if (!studentData[field]) {
      errors.push(`${field} is required`);
    }
  }

  // Email validation
  if (studentData.email && !isValidEmail(studentData.email)) {
    errors.push('Invalid email format');
  }

  // Phone validation
  if (studentData.phone && !isValidPhone(studentData.phone)) {
    errors.push('Invalid phone number format');
  }

  // Aadhaar validation
  if (studentData.aadhaar_number && !isValidAadhaar(studentData.aadhaar_number)) {
    errors.push('Invalid Aadhaar number format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidPhone = phone => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Validate Aadhaar number format
 * @param {string} aadhaar - Aadhaar number to validate
 * @returns {boolean} - True if valid
 */
const isValidAadhaar = aadhaar => {
  const aadhaarRegex = /^[0-9]{12}$/;
  return aadhaarRegex.test(aadhaar.replace(/\D/g, ''));
};

/**
 * Generate admission number if not provided
 * @param {string} schoolId - School ID
 * @param {string} academicYear - Academic year
 * @returns {Promise<string>} - Generated admission number
 */
const generateAdmissionNumber = async (schoolId, academicYear) => {
  const { Student } = require('~/models');

  // Get the last admission number for this school and academic year
  const lastStudent = await Student.findOne({
    where: {
      school_id: schoolId,
      academic_year: academicYear
    },
    order: [['admission_number', 'DESC']],
    attributes: ['admission_number']
  });

  let nextNumber = 1;
  if (lastStudent && lastStudent.admission_number) {
    const lastNumber = parseInt(lastStudent.admission_number.split('-').pop());
    nextNumber = lastNumber + 1;
  }

  // Format: SCHOOL-YYYY-NNNN (e.g., SCH001-2024-0001)
  const schoolCode = schoolId.substring(0, 6).toUpperCase();
  const year = academicYear.split('-')[0];
  return `${schoolCode}-${year}-${nextNumber.toString().padStart(4, '0')}`;
};

/**
 * Generate roll number if not provided
 * @param {string} classId - Class ID
 * @param {string} sectionId - Section ID
 * @returns {Promise<string>} - Generated roll number
 */
const generateRollNumber = async (classId, sectionId) => {
  const { Student } = require('~/models');

  // Get the last roll number for this class and section
  const lastStudent = await Student.findOne({
    where: {
      class_id: classId,
      section_id: sectionId
    },
    order: [['roll_number', 'DESC']],
    attributes: ['roll_number']
  });

  let nextNumber = 1;
  if (lastStudent && lastStudent.roll_number) {
    const lastNumber = parseInt(lastStudent.roll_number);
    nextNumber = lastNumber + 1;
  }

  return nextNumber.toString();
};

module.exports = {
  sanitizeEnumFields,
  validateStudentData,
  isValidEmail,
  isValidPhone,
  isValidAadhaar,
  generateAdmissionNumber,
  generateRollNumber
};
