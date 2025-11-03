const express = require('express');
const router = express.Router();
const {
  checkWorkingDay,
  getCalendar,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  upsertCalendarEntry,
  bulkCreateCalendar
} = require('~/controllers/academic/academic-calendar.controller');
const { verifyToken, authorize, setSchoolContext } = require('~/middleware/core/auth');
const { validate } = require('~/middleware/shared/validate');
const {
  createAcademicCalendarValidator,
  updateAcademicCalendarValidator
} = require('~/validations/academic/academic-calendar');

// Apply middleware
router.use(verifyToken, setSchoolContext);

// Check if a date is a working day (all authenticated users)
router.get('/check-working-day', checkWorkingDay);

// Get academic calendar for a date range (super admin, school admin, branch admin)
router.get('/', authorize(['super_admin', 'admin', 'branch_admin']), getCalendar);

// Get calendar event by ID (super admin, school admin, branch admin)
router.get(
  '/:id',
  authorize(['super_admin', 'admin', 'branch_admin']),
  getCalendarEventById
);

// Create new calendar event (super admin, school admin, branch admin)
router.post(
  '/',
  authorize(['super_admin', 'admin', 'branch_admin']),
  validate(createAcademicCalendarValidator),
  createCalendarEvent
);

// Update calendar event (super admin, school admin, branch admin)
router.put(
  '/:id',
  authorize(['super_admin', 'admin', 'branch_admin']),
  validate(updateAcademicCalendarValidator),
  updateCalendarEvent
);

// Delete calendar event (super admin, school admin, branch admin)
router.delete(
  '/:id',
  authorize(['super_admin', 'admin', 'branch_admin']),
  deleteCalendarEvent
);

// Create or update calendar entry (super admin, school admin, branch admin)
router.post(
  '/upsert',
  authorize(['super_admin', 'admin', 'branch_admin']),
  upsertCalendarEntry
);

// Bulk create calendar entries (super admin, school admin, branch admin)
router.post(
  '/bulk',
  authorize(['super_admin', 'admin', 'branch_admin']),
  bulkCreateCalendar
);

module.exports = router;
