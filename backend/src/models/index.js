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
const {
  Exam,
  ExamResult,
  ExamType,
  ExamStatus,
  ExamSchedule,
  ExamHall
} = require('./academic/exams');
const MarkDistribution = require('./academic/mark-distribution.model');

// Initialize associations
const models = {
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
  ExamType,
  ExamStatus,
  ExamSchedule,
  ExamHall,
  MarkDistribution
};

// Call associate function for each model if it exists
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export all models after associations are established
module.exports = {
  sequelize,
  ...models
};
