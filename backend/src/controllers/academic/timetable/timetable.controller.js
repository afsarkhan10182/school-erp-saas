const httpStatus = require('http-status');
const ApiError = require('~/utils/shared/ApiError');
const { success, error, asyncHandler } = require('~/utils/shared/apiResponse');
const { Timetable, TimetableSlot } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const TimetableService = require('~/services/academic/timetable.service');

class TimetableController {
  /**
   * Create a new timetable
   */
  static createTimetable = asyncHandler(async (req, res) => {
    const timetableData = {
      ...req.body,
      school_id: req.schoolId,
      branch_id: req.branchId || req.user.branch_id
    };

    const timetable = await TimetableService.createTimetable(timetableData, req.user.id);

    success(res, { timetable }, 'Timetable created successfully', httpStatus.CREATED);
  });

  /**
   * Get all timetables with pagination and filtering
   */
  static getAllTimetables = asyncHandler(async (req, res) => {
    const params = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      class_id: req.query.class_id,
      section_id: req.query.section_id,
      academic_year: req.query.academic_year,
      is_active: req.query.is_active,
      branch_id: req.query.branch_id
    };

    const result = await TimetableService.getAllTimetables(params, req.user);

    success(res, result, 'Timetables retrieved successfully');
  });

  /**
   * Get timetable by ID with slots
   */
  static getTimetableById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const timetable = await TimetableService.getTimetableById(id, req.user);

    success(res, { timetable }, 'Timetable retrieved successfully');
  });

  /**
   * Update timetable
   */
  static updateTimetable = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const timetable = await TimetableService.updateTimetable(id, updateData, req.user);

    success(res, { timetable }, 'Timetable updated successfully');
  });

  /**
   * Delete timetable
   */
  static deleteTimetable = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await TimetableService.deleteTimetable(id, req.user);

    success(res, result, 'Timetable deleted successfully');
  });

  /**
   * Add timetable slot
   */
  static addTimetableSlot = asyncHandler(async (req, res) => {
    const { id: timetableId } = req.params;
    const slotData = req.body;

    const slot = await TimetableService.addTimetableSlot(timetableId, slotData, req.user);

    success(res, { slot }, 'Timetable slot added successfully', httpStatus.CREATED);
  });

  /**
   * Update timetable slot
   */
  static updateTimetableSlot = asyncHandler(async (req, res) => {
    const { slotId } = req.params;
    const updateData = req.body;

    const slot = await TimetableService.updateTimetableSlot(slotId, updateData, req.user);

    success(res, { slot }, 'Timetable slot updated successfully');
  });

  /**
   * Delete timetable slot
   */
  static deleteTimetableSlot = asyncHandler(async (req, res) => {
    const { slotId } = req.params;
    const result = await TimetableService.deleteTimetableSlot(slotId, req.user);

    success(res, result, 'Timetable slot deleted successfully');
  });

  /**
   * Get timetable for a specific class/section
   */
  static getTimetableForClass = asyncHandler(async (req, res) => {
    const { classId, sectionId } = req.params;
    const { academic_year } = req.query;

    const timetable = await TimetableService.getTimetableForClass(
      classId,
      sectionId,
      academic_year,
      req.user
    );

    success(res, { timetable }, 'Timetable retrieved successfully');
  });

  /**
   * Get teacher-wise timetable
   */
  static getTeacherTimetable = asyncHandler(async (req, res) => {
    const { teacherId } = req.params;
    const { academic_year } = req.query;

    const timetable = await TimetableService.getTeacherTimetable(
      teacherId,
      academic_year,
      req.user
    );

    success(res, { timetable }, 'Teacher timetable retrieved successfully');
  });

  /**
   * Get current user's (teacher) timetable
   */
  static getMyTimetable = asyncHandler(async (req, res) => {
    const { academic_year } = req.query;

    const timetable = await TimetableService.getTeacherTimetable(
      req.user.id,
      academic_year,
      req.user
    );

    success(res, { timetable }, 'Your timetable retrieved successfully');
  });

  /**
   * Get all teacher timetables for admin view
   */
  static getAllTeacherTimetables = asyncHandler(async (req, res) => {
    const params = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      teacher_id: req.query.teacher_id,
      academic_year: req.query.academic_year
    };

    const result = await TimetableService.getAllTeacherTimetables(params, req.user);

    success(res, result, 'Teacher timetables retrieved successfully');
  });
}

module.exports = TimetableController;
