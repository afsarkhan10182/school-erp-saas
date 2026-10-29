const { sequelize } = require('~/config/database');
const User = require('./core/user.model');
const School = require('./administration/school.model');
const Branch = require('./administration/branch.model');
const SubscriptionPlan = require('./administration/subscription-plan.model');
const Module = require('./administration/module.model');
const PlanModule = require('./administration/plan-module.model');
const Transaction = require('./financial/transaction.model');
const SubscriptionRenewalRequest = require('./administration/subscription-renewal-request.model');
const Student = require('./academic/student.model');
const StudentImportBatch = require('./academic/student-import-batch.model');
const StudentImportBatchRow = require('./academic/student-import-batch-row.model');
const Parent = require('./academic/parent.model');
const StudentParent = require('./academic/student-parent.model');
const FeeType = require('./financial/fee-type.model');
const FeeStructure = require('./financial/fee-structure.model');
const FeeInvoice = require('./financial/fee-invoice.model');
const FeePayment = require('./financial/fee-payment.model');
const FeeInvoiceAdjustment = require('./financial/fee-invoice-adjustment.model');
const AcademicYear = require('./academic/academic-year.model');

// Academic models
const AcademicCalendar = require('./academic/academic-calendar.model');
const Term = require('./academic/term.model');
const Class = require('./academic/class.model');
const Section = require('./academic/section.model');
const Stream = require('./academic/stream.model');
const Subject = require('./academic/subjects/subject.model');
const SubjectTeacher = require('./academic/subjects/subject-teacher.model');
const SubjectGroup = require('./academic/subjects/subject-group.model');
const SubjectGroupSubject = require('./academic/subjects/subject-group-subject.model');
const ClassSubjectAssignment = require('./academic/subjects/class-subject-assignment.model');
const ClassTeacher = require('./academic/class-teacher.model');
const GradingSystem = require('./academic/exams/grading-system.model');
const GradeScale = require('./academic/exams/grade-scale.model');
const AttendanceSession = require('./academic/attendance/attendance-session.model');
const AttendanceRecord = require('./academic/attendance/attendance-record.model');
const Timetable = require('./academic/timetable/timetable.model');
const TimetableSlot = require('./academic/timetable/timetable-slot.model');
const { Exam, ExamResult, ExamSchedule, ExamSubjectMark, ExamHall, ExamPosition } = require('./academic/exams');
const MarkDistribution = require('./academic/mark-distribution.model');
const StudentPromotion = require('./academic/student-promotion.model');
const StudentCategory = require('./academic/student-category.model');
const Homework = require('./academic/homework.model');
const HomeworkSubmission = require('./academic/homework-submission.model');
const LiveClass = require('./academic/live-class.model');
const LiveClassAttendance = require('./academic/live-class-attendance.model');
const SyllabusUnit = require('./academic/syllabus-unit.model');
const ParentTeacherMeeting = require('./academic/parent-teacher-meeting.model');
const ParentTeacherMeetingStudent = require('./academic/parent-teacher-meeting-student.model');
const GatePass = require('./academic/gate-pass.model');
const LibraryBook = require('./academic/library-book.model');
const LibraryIssue = require('./academic/library-issue.model');
const LibraryBookRequest = require('./academic/library-book-request.model');
const LibraryImportBatch = require('./academic/library-import-batch.model');
const LibraryImportBatchRow = require('./academic/library-import-batch-row.model');
const FeeFine = require('./financial/fee-fine.model');
const DynamicEntityRecord = require('./shared/dynamic-entity-record.model');
const SchoolOpsRecord = DynamicEntityRecord;
const CardTemplate = require('./academic/card-template.model');
const OnlineExam = require('./academic/online-exam.model');
const OnlineExamQuestion = require('./academic/online-exam-question.model');
const OnlineExamAttempt = require('./academic/online-exam-attempt.model');
const ExamSeating = require('./academic/exam-seating.model');
const ReportTemplate = require('./academic/exams/report-template.model')(sequelize);
const ReportCardSetup = require('./academic/exams/report-card-setup.model');
const ReportCardSetupExam = require('./academic/exams/report-card-setup-exam.model');
const ExamReport = require('./academic/exams/exam-report.model')(sequelize);
const StudentReportCardArchive = require('./academic/exams/student-report-card-archive.model');

// Administration models
const CertificateTemplate = require('./administration/certificate-template.model');
const SettingsChangeLog = require('./administration/settings-change-log.model');
const AuditEvent = require('./administration/audit-event.model');

// Transport models
const Vehicle = require('./transport/vehicle.model');
const TransportRoute = require('./transport/transport-route.model');
const VehicleRoute = require('./transport/vehicle-route.model');
const StudentTransport = require('./transport/student-transport.model');

// Hostel models
const Hostel = require('./hostel/hostel.model');
const RoomType = require('./hostel/room-type.model');
const HostelRoom = require('./hostel/hostel-room.model');
const HostelAllocation = require('./hostel/hostel-allocation.model');

// Inventory models
const ItemCategory = require('./inventory/item-category.model');
const Supplier = require('./inventory/supplier.model');
const Store = require('./inventory/store.model');
const InventoryItem = require('./inventory/inventory-item.model');
const ItemIssue = require('./inventory/item-issue.model');

// Accounting models
const AccountCategory = require('./accounting/account-category.model');
const SchoolTransaction = require('./accounting/school-transaction.model');

// Alumni models
const Alumni = require('./alumni/alumni.model');
const AlumniEvent = require('./alumni/alumni-event.model');

// Initialize associations
const models = {
  Alumni,
  AlumniEvent,
  User,
  School,
  Branch,
  SubscriptionPlan,
  Module,
  PlanModule,
  Transaction,
  SubscriptionRenewalRequest,
  Student,
  StudentImportBatch,
  StudentImportBatchRow,
  Parent,
  StudentParent,
  FeeType,
  FeeStructure,
  FeeInvoice,
  FeePayment,
  FeeInvoiceAdjustment,
  AcademicYear,
  AcademicCalendar,
  Term,
  Class,
  Section,
  Stream,
  Subject,
  SubjectTeacher,
  SubjectGroup,
  SubjectGroupSubject,
  ClassSubjectAssignment,
  ClassTeacher,
  GradingSystem,
  GradeScale,
  AttendanceSession,
  AttendanceRecord,
  Timetable,
  TimetableSlot,
  Exam,
  ExamResult,
  ExamSchedule,
  ExamSubjectMark,
  ExamHall,
  ExamPosition,
  MarkDistribution,
  StudentPromotion,
  StudentCategory,
  Homework,
  HomeworkSubmission,
  LiveClass,
  LiveClassAttendance,
  SyllabusUnit,
  ParentTeacherMeeting,
  ParentTeacherMeetingStudent,
  GatePass,
  LibraryBook,
  LibraryIssue,
  LibraryBookRequest,
  LibraryImportBatch,
  LibraryImportBatchRow,
  FeeFine,
  SchoolOpsRecord,
  DynamicEntityRecord: SchoolOpsRecord,
  CardTemplate,
  OnlineExam,
  OnlineExamQuestion,
  OnlineExamAttempt,
  ExamSeating,
  ReportTemplate,
  ReportCardSetup,
  ReportCardSetupExam,
  ExamReport,
  StudentReportCardArchive,
  CertificateTemplate,
  SettingsChangeLog,
  AuditEvent,
  Vehicle,
  TransportRoute,
  VehicleRoute,
  StudentTransport,
  Hostel,
  RoomType,
  HostelRoom,
  HostelAllocation,
  ItemCategory,
  Supplier,
  Store,
  InventoryItem,
  ItemIssue,
  AccountCategory,
  SchoolTransaction
};

// Call associate function for each unique model if it exists
const visitedModels = new Set();
Object.values(models).forEach(model => {
  if (model && model.associate && !visitedModels.has(model)) {
    visitedModels.add(model);
    model.associate(models);
  }
});

require('~/services/shared/audit-trail.service').registerAuditHooks(models, AuditEvent);

// Export all models after associations are established
module.exports = {
  sequelize,
  ...models
};
