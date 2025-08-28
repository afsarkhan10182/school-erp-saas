const express = require('express');
const router = express.Router();
const academicCalendarController = require('../controllers/academic-calendar.controller');
const { verifyToken, authorize, setSchoolContext } = require('../middleware/auth');

// Apply middleware
router.use(verifyToken, setSchoolContext);

// Check if a date is a working day (all authenticated users)
router.get('/check-working-day', academicCalendarController.checkWorkingDay);

// Get academic calendar for a date range (super admin, school admin, branch admin)
router.get('/', authorize(['super_admin', 'school_admin', 'branch_admin']), academicCalendarController.getCalendar);

// Create or update calendar entry (super admin, school admin, branch admin)
router.post('/', authorize(['super_admin', 'school_admin', 'branch_admin']), academicCalendarController.upsertCalendarEntry);

// Bulk create calendar entries (super admin, school admin, branch admin)
router.post('/bulk', authorize(['super_admin', 'school_admin', 'branch_admin']), academicCalendarController.bulkCreateCalendar);

module.exports = router;
