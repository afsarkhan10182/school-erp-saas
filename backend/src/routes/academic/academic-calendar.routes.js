const express = require('express');
const router = express.Router();
const {
  checkWorkingDay,
  getCalendar,
  upsertCalendarEntry,
  bulkCreateCalendar,
} = require('../../controllers/academic/academic-calendar.controller');
const { verifyToken, authorize, setSchoolContext } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { createAcademicCalendarValidator, updateAcademicCalendarValidator } = require('../../validations/academic/academic-calendar.validation');

// Apply middleware
router.use(verifyToken, setSchoolContext);

// Check if a date is a working day (all authenticated users)
router.get('/check-working-day', checkWorkingDay);

// Get academic calendar for a date range (super admin, school admin, branch admin)
router.get('/', authorize(['super_admin', 'school_admin', 'branch_admin']), getCalendar);

// Create or update calendar entry (super admin, school admin, branch admin)
router.post('/', authorize(['super_admin', 'school_admin', 'branch_admin']), upsertCalendarEntry);

// Bulk create calendar entries (super admin, school admin, branch admin)
router.post('/bulk', authorize(['super_admin', 'school_admin', 'branch_admin']), bulkCreateCalendar);

module.exports = router;
