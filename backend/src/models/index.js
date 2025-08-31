const { sequelize } = require('../config/database');
const User = require('./user.model');
const School = require('./school.model');
const Branch = require('./branch.model');
const SubscriptionPlan = require('./subscription-plan.model');
const Module = require('./module.model');
const PlanModule = require('./plan-module.model');
const Transaction = require('./transaction.model');
const SubscriptionRenewalRequest = require('./subscription-renewal-request.model');
const Student = require('./student.model');
const Parent = require('./parent.model');
const StudentParent = require('./student-parent.model');
const FeeType = require('./fee-type.model');
const FeeStructure = require('./fee-structure.model');
const FeeInvoice = require('./fee-invoice.model');
const FeePayment = require('./fee-payment.model');
const AcademicYear = require('./academic/academic-year.model');

// Academic models
const AcademicCalendar = require('./academic/academic-calendar.model');
const Class = require('./class.model');
const Section = require('./section.model');
const Stream = require('./stream.model');
const Subject = require('./academic/subjects/subject.model');
const SubjectTeacher = require('./academic/subjects/subject-teacher.model');
const SubjectGroup = require('./academic/subjects/subject-group.model');
const SubjectGroupSubject = require('./academic/subjects/subject-group-subject.model');
const GradingSystem = require('./academic/exams/grading-system.model');
const GradeScale = require('./academic/exams/grade-scale.model');
const AttendanceSession = require('./academic/attendance/attendance-session.model');
const AttendanceRecord = require('./academic/attendance/attendance-record.model');
const Timetable = require('./academic/timetable/timetable.model');
const TimetableSlot = require('./academic/timetable/timetable-slot.model');
const { Exam, ExamResult, ExamType, ExamStatus } = require('./academic/exams');

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
  Class,
  Section,
  Stream,
  Subject,
  SubjectTeacher,
  SubjectGroup,
  SubjectGroupSubject,
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
  ...models,
};
