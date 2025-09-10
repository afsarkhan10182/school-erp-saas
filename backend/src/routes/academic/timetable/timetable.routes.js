const express = require('express');
const {
  verifyToken,
  setSchoolContext,
  setBranchContext,
  requireRole
} = require('~/middleware/auth');
const { requireModuleAccess } = require('~/middleware/moduleAccess');
const { validate } = require('~/middleware/validate');
const TimetableController = require('~/controllers/academic/timetable/timetable.controller');
const {
  createTimetableValidator,
  updateTimetableValidator,
  createTimetableSlotValidator,
  updateTimetableSlotValidator
} = require('~/validations/academic/timetable.validation');
const { TIMETABLE_ROLES, TIMETABLE_ADMIN_ROLES, TEACHER_ROLES } = require('~/constants/roles');

const router = express.Router();

/**
 * @route /api/timetables
 * @desc Timetable management routes
 * @access Private (authenticated users with timetable module access)
 */

// All timetable routes require auth, school/branch context, and timetable module access
router.use(verifyToken, setSchoolContext, setBranchContext, requireModuleAccess('timetables'));

// ===== TIMETABLE MANAGEMENT ROUTES =====

/**
 * @route POST /api/timetables
 * @desc Create a new timetable
 * @access Private (TIMETABLE_ROLES)
 * @body {string} name, {string} class_id, {string} section_id, {string} academic_year, {boolean} is_active
 */
router.post(
  '/',
  requireRole(...TIMETABLE_ROLES),
  validate(createTimetableValidator),
  TimetableController.createTimetable
);

/**
 * @route GET /api/timetables
 * @desc Get all timetables with pagination and filtering
 * @access Private (TIMETABLE_ROLES)
 * @query {number} page, {number} limit, {string} search, {string} class_id, {string} section_id
 */
router.get('/', TimetableController.getAllTimetables);

/**
 * @route GET /api/timetables/:id
 * @desc Get timetable by ID
 * @access Private (TIMETABLE_ROLES)
 * @param {string} id - Timetable ID
 */
router.get('/:id', TimetableController.getTimetableById);

/**
 * @route PUT /api/timetables/:id
 * @desc Update timetable
 * @access Private (TIMETABLE_ROLES)
 * @param {string} id - Timetable ID
 * @body {string} name, {string} class_id, {string} section_id, {string} academic_year, {boolean} is_active
 */
router.put(
  '/:id',
  requireRole(...TIMETABLE_ROLES),
  validate(updateTimetableValidator),
  TimetableController.updateTimetable
);

/**
 * @route DELETE /api/timetables/:id
 * @desc Delete timetable (soft delete)
 * @access Private (TIMETABLE_ADMIN_ROLES)
 * @param {string} id - Timetable ID
 */
router.delete('/:id', requireRole(...TIMETABLE_ADMIN_ROLES), TimetableController.deleteTimetable);

// ===== TEACHER TIMETABLE ROUTES =====

/**
 * @route GET /api/timetables/my-timetable
 * @desc Get current teacher's timetable
 * @access Private (TEACHER_ROLES)
 */
router.get('/my-timetable', requireRole(...TEACHER_ROLES), TimetableController.getMyTimetable);

/**
 * @route GET /api/timetables/teacher/:teacherId
 * @desc Get timetable for specific teacher
 * @access Private (TIMETABLE_ROLES)
 * @param {string} teacherId - Teacher ID
 */
router.get('/teacher/:teacherId', TimetableController.getTeacherTimetable);

/**
 * @route GET /api/timetables/teachers/all
 * @desc Get all teacher timetables
 * @access Private (TIMETABLE_ADMIN_ROLES)
 */
router.get(
  '/teachers/all',
  requireRole(...TIMETABLE_ADMIN_ROLES),
  TimetableController.getAllTeacherTimetables
);

// ===== TIMETABLE SLOT ROUTES (NESTED) =====

/**
 * @route POST /api/timetables/:id/slots
 * @desc Add slot to timetable
 * @access Private (TIMETABLE_ROLES)
 * @param {string} id - Timetable ID
 * @body {string} subject_id, {string} teacher_id, {number} day_of_week, {number} period_number, {string} start_time, {string} end_time
 */
router.post(
  '/:id/slots',
  requireRole(...TIMETABLE_ROLES),
  validate(createTimetableSlotValidator),
  TimetableController.addTimetableSlot
);

/**
 * @route PUT /api/timetables/:id/slots/:slotId
 * @desc Update timetable slot
 * @access Private (TIMETABLE_ROLES)
 * @param {string} id - Timetable ID
 * @param {string} slotId - Slot ID
 * @body {string} subject_id, {string} teacher_id, {number} day_of_week, {number} period_number, {string} start_time, {string} end_time
 */
router.put(
  '/:id/slots/:slotId',
  requireRole(...TIMETABLE_ROLES),
  validate(updateTimetableSlotValidator),
  TimetableController.updateTimetableSlot
);

/**
 * @route DELETE /api/timetables/:id/slots/:slotId
 * @desc Delete timetable slot
 * @access Private (TIMETABLE_ADMIN_ROLES)
 * @param {string} id - Timetable ID
 * @param {string} slotId - Slot ID
 */
router.delete(
  '/:id/slots/:slotId',
  requireRole(...TIMETABLE_ADMIN_ROLES),
  TimetableController.deleteTimetableSlot
);

// ===== SPECIAL ROUTES =====

/**
 * @route GET /api/timetables/class/:classId/section/:sectionId
 * @desc Get timetable for specific class/section
 * @access Private (TIMETABLE_ROLES)
 * @param {string} classId - Class ID
 * @param {string} sectionId - Section ID
 */
router.get('/class/:classId/section/:sectionId', TimetableController.getTimetableForClass);

module.exports = router;
