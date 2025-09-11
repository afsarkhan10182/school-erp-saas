const express = require('express');
const authRoutes = require('./auth/auth.routes');
const userRoutes = require('./user/user.routes');
const schoolRoutes = require('./school/school.routes');
const branchRoutes = require('./school/branch.routes');
const subscriptionRoutes = require('./subscription/subscription.routes');
const dashboardRoutes = require('./dashboard/dashboard.routes');
const healthRoutes = require('./health/health');
const studentRoutes = require('./student.routes');
const feeTypeRoutes = require('./fee-type.routes');
const feeStructureRoutes = require('./fee-structure.routes');
const feeInvoiceRoutes = require('./fee-invoice.routes');

const academicYearRoutes = require('./academic/academic-year.routes');
const academicCalendarRoutes = require('./academic/academic-calendar.routes');
const classRoutes = require('./class.routes');
const sectionRoutes = require('./section.routes');
const streamRoutes = require('./stream.routes');
const attendanceRoutes = require('./academic/attendance/attendance.routes');
const attendanceNotificationRoutes = require('./academic/attendance/attendance-notification.routes');

// Academic subject routes
const subjectRoutes = require('./academic/subjects/subject.routes');
const subjectTeacherRoutes = require('./academic/subjects/subject-teacher.routes');
const subjectGroupRoutes = require('./academic/subjects/subject-group.routes');
const classSubjectMappingRoutes = require('./academic/subjects/class-subject-mapping.routes');

// Academic term routes
const termRoutes = require('./academic/term.routes');

// Academic exam routes
const examRoutes = require('./academic/exams/exam.routes');
const examTypeRoutes = require('./academic/exams/exam-type.routes');
const gradingSystemRoutes = require('./academic/grading-system.routes');

// Academic timetable routes
const timetableRoutes = require('./academic/timetable/timetable.routes');
const templateRoutes = require('./template.routes');
const exportRoutes = require('./export.routes');

// Settings routes
const settingsRoutes = require('./settings/settings.routes');

// Upload routes
const uploadRoutes = require('./shared/uploads.routes');

const router = express.Router();

// Health check routes (no auth required)
router.use('/health', healthRoutes);

// API routes with authentication
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/schools', schoolRoutes);
router.use('/branches', branchRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/dashboard', dashboardRoutes);

// Student and Fee Management routes
router.use('/students', studentRoutes);
router.use('/fee-types', feeTypeRoutes);
router.use('/fee-structures', feeStructureRoutes);
router.use('/fee-invoices', feeInvoiceRoutes);

// Academic Management routes
router.use('/academic-years', academicYearRoutes);
router.use('/academic-calendar', academicCalendarRoutes);
router.use('/classes', classRoutes);
router.use('/sections', sectionRoutes);
router.use('/streams', streamRoutes);

// Academic subject routes
router.use('/subjects', subjectRoutes);
router.use('/subject-teachers', subjectTeacherRoutes);
router.use('/subject-groups', subjectGroupRoutes);
router.use('/class-subject-mappings', classSubjectMappingRoutes);

// Academic term routes
router.use('/terms', termRoutes);

// Academic exam routes
router.use('/exams', examRoutes);
router.use('/exam-types', examTypeRoutes);
router.use('/grading-systems', gradingSystemRoutes);

// Academic timetable routes
router.use('/timetables', timetableRoutes);

// Attendance routes
router.use('/attendance', attendanceRoutes);

// Attendance Notification routes
router.use('/attendance-notifications', attendanceNotificationRoutes);

// Template routes
router.use('/templates', templateRoutes);

// Export routes
router.use('/export', exportRoutes);
// Settings routes - consolidated namespace
router.use('/settings', settingsRoutes);

// Upload routes
router.use('/uploads', uploadRoutes);

module.exports = router;
