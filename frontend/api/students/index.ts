// Students API - Main entry point
export { Student as Students, Student as StudentsAPI } from './students';
export { Attendance } from './attendance';
export { AttendanceNotifications } from './attendance-notifications';
export { FeeTypes } from './fee-types';
export { FeeStructures } from './fee-structures';
export { FeeInvoices } from './fee-invoices';
export { Invoices } from './invoices';
export { fetchCollectionsAPI } from './collections';
export {
  Promotions,
  StudentCategories,
  Parents,
  FeeFines,
  Homeworks,
  Library
} from './academic-services';

// Re-export types
export type { Student as StudentRecord, StudentFilters, StudentStats } from './students';
export type { AttendanceSession, AttendanceRecord, AttendanceReportParams } from './attendance';
export type {
  AbsenceNotificationData,
  LateArrivalNotificationData,
  AttendanceSummaryData
} from './attendance-notifications';
export type { FeeTypeParams, FeeTypeData } from './fee-types';
export type { FeeStructureParams, FeeStructureData } from './fee-structures';
export type { FeeInvoiceParams, PaymentData } from './fee-invoices';
export type { InvoiceParams, StudentSummaryParams } from './invoices';
