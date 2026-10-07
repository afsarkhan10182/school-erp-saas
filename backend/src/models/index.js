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
const Parent = require('./academic/parent.model');
const StudentParent = require('./academic/student-parent.model');
const FeeType = require('./financial/fee-type.model');
const FeeStructure = require('./financial/fee-structure.model');
const FeeInvoice = require('./financial/fee-invoice.model');
const FeePayment = require('./financial/fee-payment.model');
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
const { Exam, ExamResult, ExamSchedule, ExamHall, ExamPosition } = require('./academic/exams');
const MarkDistribution = require('./academic/mark-distribution.model');
const StudentPromotion = require('./academic/student-promotion.model');
const StudentCategory = require('./academic/student-category.model');
const Homework = require('./academic/homework.model');
const LibraryBook = require('./academic/library-book.model');
const LibraryIssue = require('./academic/library-issue.model');
const FeeFine = require('./financial/fee-fine.model');
const DynamicEntityRecord = require('./shared/dynamic-entity-record.model');
const SchoolOpsRecord = DynamicEntityRecord;
const CardTemplate = require('./academic/card-template.model');
const OnlineExam = require('./academic/online-exam.model');
const OnlineExamQuestion = require('./academic/online-exam-question.model');
const OnlineExamAttempt = require('./academic/online-exam-attempt.model');
const ExamSeating = require('./academic/exam-seating.model');
const ReportTemplate = require('./academic/exams/report-template.model')(sequelize);
const ExamReport = require('./academic/exams/exam-report.model')(sequelize);

// Administration models
const CertificateTemplate = require('./administration/certificate-template.model');

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
  Parent,
  StudentParent,
  FeeType,
  FeeStructure,
  FeeInvoice,
  FeePayment,
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
  ExamHall,
  ExamPosition,
  MarkDistribution,
  StudentPromotion,
  StudentCategory,
  Homework,
  LibraryBook,
  LibraryIssue,
  FeeFine,
  SchoolOpsRecord,
  DynamicEntityRecord: SchoolOpsRecord,
  CardTemplate,
  OnlineExam,
  OnlineExamQuestion,
  OnlineExamAttempt,
  ExamSeating,
  ReportTemplate,
  ExamReport,
  CertificateTemplate,
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

// Export all models after associations are established
module.exports = {
  sequelize,
  ...models
};
