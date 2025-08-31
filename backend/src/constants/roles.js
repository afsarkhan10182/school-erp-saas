/**
 * Role constants for better maintainability and consistency
 * Used across middleware and route definitions
 */

// Academic module roles
const ACADEMIC_ROLES = ['teacher', 'branch_admin', 'school_admin', 'super_admin'];
const ACADEMIC_ADMIN_ROLES = ['branch_admin', 'school_admin', 'super_admin'];
const ACADEMIC_SUPER_ADMIN_ROLES = ['school_admin', 'super_admin'];

// Subject management roles
const SUBJECT_ROLES = ['teacher', 'branch_admin', 'school_admin', 'super_admin'];
const SUBJECT_ADMIN_ROLES = ['branch_admin', 'school_admin', 'super_admin'];

// Exam management roles
const EXAM_ROLES = ['teacher', 'branch_admin', 'school_admin', 'super_admin'];
const EXAM_ADMIN_ROLES = ['branch_admin', 'school_admin', 'super_admin'];

// Timetable management roles
const TIMETABLE_ROLES = ['teacher', 'branch_admin', 'school_admin', 'super_admin'];
const TIMETABLE_ADMIN_ROLES = ['branch_admin', 'school_admin', 'super_admin'];

// Attendance management roles
const ATTENDANCE_ROLES = ['teacher', 'branch_admin', 'school_admin', 'super_admin'];
const ATTENDANCE_ADMIN_ROLES = ['branch_admin', 'school_admin', 'super_admin'];

// Report card roles
const REPORT_CARD_ROLES = ['teacher', 'branch_admin', 'school_admin', 'super_admin'];

// Teacher-specific roles (for teacher-only endpoints)
const TEACHER_ROLES = ['teacher'];

module.exports = {
  ACADEMIC_ROLES,
  ACADEMIC_ADMIN_ROLES,
  ACADEMIC_SUPER_ADMIN_ROLES,
  SUBJECT_ROLES,
  SUBJECT_ADMIN_ROLES,
  EXAM_ROLES,
  EXAM_ADMIN_ROLES,
  TIMETABLE_ROLES,
  TIMETABLE_ADMIN_ROLES,
  ATTENDANCE_ROLES,
  ATTENDANCE_ADMIN_ROLES,
  REPORT_CARD_ROLES,
  TEACHER_ROLES
};
