const express = require('express');
const authRoutes = require('./core/auth/auth.routes');
const userRoutes = require('./core/users/user.routes');
const schoolRoutes = require('./administration/schools/school.routes');
const branchRoutes = require('./administration/schools/branch.routes');
const subscriptionRoutes = require('./administration/subscriptions/subscription.routes');
const dashboardRoutes = require('./shared/dashboard.routes');
const healthRoutes = require('./shared/health.routes');
const studentRoutes = require('./academic/student.routes');
const feeTypeRoutes = require('./financial/fee-type.routes');
const feeStructureRoutes = require('./financial/fee-structure.routes');
const feeInvoiceRoutes = require('./financial/fee-invoice.routes');

const academicYearRoutes = require('./academic/academic-year.routes');
const academicCalendarRoutes = require('./academic/academic-calendar.routes');
const classRoutes = require('./academic/class.routes');
const sectionRoutes = require('./academic/section.routes');
const streamRoutes = require('./academic/stream.routes');
const attendanceRoutes = require('./academic/attendance/attendance.routes');
const attendanceNotificationRoutes = require('./academic/attendance/attendance-notification.routes');

// Academic subject routes
const subjectRoutes = require('./academic/subjects/subject.routes');
const subjectTeacherRoutes = require('./academic/subjects/subject-teacher.routes');
const subjectGroupRoutes = require('./academic/subjects/subject-group.routes');
const classSubjectAssignmentRoutes = require('./academic/subjects/class-subject-assignment.routes');
const classTeacherRoutes = require('./academic/class-teacher.routes');

// Academic term routes
const termRoutes = require('./academic/term.routes');

// Academic exam routes
const examRoutes = require('./academic/exams/exam.routes');
const examScheduleRoutes = require('./academic/exams/exam-schedule.routes');
const examHallRoutes = require('./academic/exams/exam-hall.routes');
const examResultRoutes = require('./academic/exams/exam-result.routes');
const examReportRoutes = require('./academic/exams/exam-report.routes');
const examReportsRoutes = require('./academic/exam-reports');
const examPositionsRoutes = require('./academic/exam-positions');
const examPublicationRoutes = require('./academic/exam-publication');
const gradingSystemRoutes = require('./academic/grading-system.routes');
const marksEntryRoutes = require('./academic/marks-entry');
const markDistributionRoutes = require('./academic/mark-distributions.routes');

// Academic timetable routes
const timetableRoutes = require('./academic/timetable/timetable.routes');
const exportRoutes = require('./shared/export.routes');

// Settings routes
const settingsRoutes = require('./administration/settings/system-setting.routes');

// Certificate template routes
const certificateTemplateRoutes = require('./administration/certificate-template.routes');

// Certificate generation routes
const certificateGenerationRoutes = require('./administration/certificate-generation.routes');
const studentPromotionRoutes = require('./academic/student-promotion.routes');
const studentCategoryRoutes = require('./academic/student-category.routes');
const parentRoutes = require('./academic/parent.routes');
const feeFineRoutes = require('./financial/fee-fine.routes');
const homeworkRoutes = require('./academic/homework.routes');
const libraryRoutes = require('./academic/library.routes');
const schoolOpsRoutes = require('./shared/school-ops.routes');
const publicSchoolOpsRoutes = require('./shared/public-school-ops.routes');
const portalRoutes = require('./shared/portal.routes');
const reportsRoutes = require('./shared/reports.routes');
const cardTemplateRoutes = require('./academic/card-template.routes');
const examSeatingRoutes = require('./academic/exam-seating.routes');
const onlineExamRoutes = require('./academic/online-exam.routes');

// Upload routes
const uploadRoutes = require('./shared/uploads.routes');

const router = express.Router();

// Health check routes (no auth required)
router.use('/health', healthRoutes);
router.use('/public', publicSchoolOpsRoutes);

// API routes with authentication
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/schools', schoolRoutes);
router.use('/branches', branchRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/dashboard', dashboardRoutes);

// Student and Fee Management routes
router.use('/students', studentRoutes);
router.use('/student-promotions', studentPromotionRoutes);
router.use('/student-categories', studentCategoryRoutes);
router.use('/parents', parentRoutes);
router.use('/fee-fines', feeFineRoutes);
router.use('/homeworks', homeworkRoutes);
router.use('/library', libraryRoutes);
router.use('/school-ops', schoolOpsRoutes);
router.use('/portal', portalRoutes);
router.use('/reports', reportsRoutes);
router.use('/cards', cardTemplateRoutes);
router.use('/exam-seatings', examSeatingRoutes);
router.use('/online-exams', onlineExamRoutes);
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
router.use('/class-subject-assignments', classSubjectAssignmentRoutes);
router.use('/class-teachers', classTeacherRoutes);

// Academic exam term routes
router.use('/exam-terms', termRoutes);

// Academic exam routes
router.use('/exams', examRoutes);
router.use('/exam-schedules', examScheduleRoutes);
router.use('/exam-halls', examHallRoutes);
router.use('/exam-positions', examPositionsRoutes);
router.use('/exam-results', examResultRoutes);
// Mount specific routes first (before catch-all routes)
// examReportsRoutes must come first to handle /download/:reportId before catch-all routes
router.use('/exam-reports', examReportsRoutes);
router.use('/exam-reports', examReportRoutes);
router.use('/exam-publication', examPublicationRoutes);
router.use('/grading-systems', gradingSystemRoutes);
router.use('/marks-entry', marksEntryRoutes);
router.use('/mark-distributions', markDistributionRoutes);

// Academic timetable routes
router.use('/timetables', timetableRoutes);

// Attendance routes
router.use('/attendance', attendanceRoutes);

// Attendance Notification routes
router.use('/attendance-notifications', attendanceNotificationRoutes);

// Export routes
router.use('/export', exportRoutes);
// Settings routes - consolidated namespace
router.use('/settings', settingsRoutes);

// Certificate template routes
router.use('/certificate-templates', certificateTemplateRoutes);

// Certificate generation routes
router.use('/certificates', certificateGenerationRoutes);

// Upload routes
router.use('/uploads', uploadRoutes);

module.exports = router;
