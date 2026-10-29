/**
 * SaaS module codes — features are gated by these so a school can enable/disable
 * via subscription plan + per-school toggles (/saas/schools/:id/modules).
 *
 * Flow:
 * 1. Module row in DB (`modules` table)
 * 2. Attached to plan (`plan_modules`) when creating/editing a plan
 * 3. School inherits plan modules on create; Super Admin can disable per school
 * 4. Sidebar (requiredModule) + route guard + API middleware all check the same codes
 */
export const MODULE_CODES = {
  students: 'students',
  fees: 'fees',
  exams: 'exams',
  attendance: 'attendance',
  academic_management: 'academic_management',
  homework: 'homework',
  library: 'library',
  hr: 'hr',
  transport: 'transport',
  hostel: 'hostel',
  accounting: 'accounting',
  inventory: 'inventory',
  events: 'events',
  alumni: 'alumni',
  communication: 'communication',
  website: 'website',
  reception: 'reception',
  attachments: 'attachments',
  liveclass: 'liveclass',
  certificates: 'certificates',
  reports: 'reports',
  settings: 'settings'
} as const;

export type ModuleCode = (typeof MODULE_CODES)[keyof typeof MODULE_CODES];

/**
 * Dedicated pages → module. Dynamic entities (`/[module]/:entity`) resolve via MODULE_ENTITY_DEFINITIONS.module.
 */
export const ROUTE_MODULE_MAP: Record<string, ModuleCode> = {
  '/fees': 'fees',
  '/fees/types': 'fees',
  '/fees/structures': 'fees',
  '/fees/invoices': 'fees',
  '/fees/collections': 'fees',
  '/fees/due': 'fees',
  '/fees/fines': 'fees',
  '/reports/fees': 'fees',
  '/reports/receipts': 'fees',
  '/fee-ledger': 'fees',

  '/students': 'students',
  '/students/create': 'students',
  '/students/import': 'students',
  '/students/promotion': 'students',
  '/students/categories': 'students',
  '/students/bulk-edit': 'students',
  '/students/transfer': 'students',
  '/reception/gate-passes': 'reception',
  '/students/online-admission': 'students',
  '/parents': 'students',
  '/cards': 'students',
  '/cards/templates': 'students',
  '/reports/students': 'students',
  '/reports/student-360': 'students',
  '/reports/student-extra': 'students',
  '/attendance': 'attendance',
  '/attendance/analytics': 'attendance',
  '/reports/attendance': 'attendance',

  '/exams': 'exams',
  '/exams/setup': 'exams',
  '/exams/setup/exam-halls': 'exams',
  '/exams/setup/grades-range': 'exams',
  '/exams/setup/grading-systems': 'exams',
  '/exams/setup/mark-distributions': 'exams',
  '/exams/schedules': 'exams',
  '/exams/schedules/add': 'exams',
  '/exams/schedules/create': 'exams',
  '/exams/publication': 'exams',
  '/exams/positions': 'exams',
  '/exams/report-cards': 'exams',
  '/exams/report-card-setups': 'exams',
  '/exams/marks-entry': 'exams',
  '/exams/results': 'exams',
  '/exams/types': 'exams',
  '/exams/seating': 'exams',
  '/exams/online': 'exams',
  '/reports/exams': 'exams',

  '/academic': 'academic_management',
  '/academic/classes': 'academic_management',
  '/academic/sections': 'academic_management',
  '/academic/streams': 'academic_management',
  '/academic/years': 'academic_management',
  '/academic/calendar': 'academic_management',
  '/academic/subjects': 'academic_management',
  '/academic/class-assignments': 'academic_management',
  '/academic/timetable': 'academic_management',
  '/academic/timetables': 'academic_management',
  '/academic/workload': 'academic_management',
  '/academic/ptm': 'academic_management',
  '/academic/study-materials': 'attachments',
  '/academic/classwork': 'attachments',
  '/settings/audit-trail': 'settings',

  '/homework': 'homework',
  '/library': 'library',
  '/reports/library': 'library',
  '/visitors': 'reception',
  '/reception': 'reception',

  '/hr': 'hr',
  '/reports/hr': 'hr',

  '/transport': 'transport',
  '/reports/transport': 'transport',
  '/hostel': 'hostel',
  '/inventory': 'inventory',
  '/accounting': 'accounting',
  '/events': 'events',
  '/alumni': 'alumni',
  '/communication': 'communication',
  '/website': 'website',
  '/attachments': 'attachments',
  '/live-class': 'liveclass',

  '/reports': 'reports',
  '/reports/suite': 'reports',
  '/reports/advanced': 'reports',
  '/certificates': 'certificates'
};
