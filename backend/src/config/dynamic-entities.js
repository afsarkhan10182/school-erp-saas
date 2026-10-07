/**
 * Dynamic entities registry.
 * Each entity maps to a subscription module code so Super Admin can enable/disable
 * per plan (plan_modules) and per school (disabled_modules).
 *
 * API: requireModuleAccess(entity.module)
 * UI: MODULE_ENTITY_DEFINITIONS[entity].module + sidebar requiredModule
 */
const STAFF_ROLES = [
  'super_admin',
  'admin',
  'branch_admin',
  'accountant',
  'teacher',
  'librarian',
  'receptionist'
];

const ENTITIES = {
  disable_reason: { module: 'students', roles: STAFF_ROLES },
  admission_application: {
    module: 'students',
    roles: STAFF_ROLES,
    actions: ['approve', 'reject']
  },
  fee_group: { module: 'fees', roles: STAFF_ROLES },
  fee_allocation: { module: 'fees', roles: STAFF_ROLES },
  fee_reminder: { module: 'fees', roles: STAFF_ROLES },
  offline_payment: {
    module: 'fees',
    roles: STAFF_ROLES,
    actions: ['approve', 'reject']
  },
  staff_department: { module: 'hr', roles: STAFF_ROLES },
  staff_designation: { module: 'hr', roles: STAFF_ROLES },
  leave_category: { module: 'hr', roles: STAFF_ROLES },
  leave_request: { module: 'hr', roles: STAFF_ROLES, actions: ['approve', 'reject'] },
  salary_template: { module: 'hr', roles: STAFF_ROLES },
  salary_assignment: { module: 'hr', roles: STAFF_ROLES },
  salary_payment: { module: 'hr', roles: STAFF_ROLES },
  advance_salary: { module: 'hr', roles: STAFF_ROLES, actions: ['approve', 'reject'] },
  staff_award: { module: 'hr', roles: STAFF_ROLES },
  exam_seating: { module: 'exams', roles: STAFF_ROLES },
  marksheet_template: { module: 'exams', roles: STAFF_ROLES },
  online_exam: { module: 'exams', roles: STAFF_ROLES },
  exam_question: { module: 'exams', roles: STAFF_ROLES },
  attachment: { module: 'attachments', roles: STAFF_ROLES },
  live_class: { module: 'liveclass', roles: STAFF_ROLES },
  transport_route: { module: 'transport', roles: STAFF_ROLES },
  transport_vehicle: { module: 'transport', roles: STAFF_ROLES },
  transport_stop: { module: 'transport', roles: STAFF_ROLES },
  transport_assignment: { module: 'transport', roles: STAFF_ROLES },
  transport_fee_setup: { module: 'transport', roles: STAFF_ROLES },
  hostel: { module: 'hostel', roles: STAFF_ROLES },
  hostel_category: { module: 'hostel', roles: STAFF_ROLES },
  hostel_room: { module: 'hostel', roles: STAFF_ROLES },
  hostel_allocation: { module: 'hostel', roles: STAFF_ROLES },
  enquiry: { module: 'reception', roles: STAFF_ROLES },
  postal: { module: 'reception', roles: STAFF_ROLES },
  call_log: { module: 'reception', roles: STAFF_ROLES },
  complaint: { module: 'reception', roles: STAFF_ROLES },
  visitor: { module: 'reception', roles: STAFF_ROLES, actions: ['checkout'] },
  account: { module: 'accounting', roles: STAFF_ROLES },
  account_head: { module: 'accounting', roles: STAFF_ROLES },
  voucher: { module: 'accounting', roles: STAFF_ROLES },
  inventory_product: { module: 'inventory', roles: STAFF_ROLES },
  inventory_category: { module: 'inventory', roles: STAFF_ROLES },
  inventory_unit: { module: 'inventory', roles: STAFF_ROLES },
  inventory_store: { module: 'inventory', roles: STAFF_ROLES },
  inventory_supplier: { module: 'inventory', roles: STAFF_ROLES },
  inventory_purchase: { module: 'inventory', roles: STAFF_ROLES },
  inventory_sale: { module: 'inventory', roles: STAFF_ROLES },
  inventory_issue: { module: 'inventory', roles: STAFF_ROLES },
  event_type: { module: 'events', roles: STAFF_ROLES },
  event: { module: 'events', roles: STAFF_ROLES },
  alumni: { module: 'alumni', roles: STAFF_ROLES },
  sms_campaign: { module: 'communication', roles: STAFF_ROLES },
  email_campaign: { module: 'communication', roles: STAFF_ROLES },
  mailbox: { module: 'communication', roles: STAFF_ROLES },
  cms_page: { module: 'website', roles: STAFF_ROLES },
  custom_field: { module: 'students', roles: STAFF_ROLES },
  translation: { module: 'website', roles: STAFF_ROLES },
  domain_request: { module: 'website', roles: STAFF_ROLES },
  subject_attendance: { module: 'attendance', roles: STAFF_ROLES },
  staff_attendance: { module: 'attendance', roles: STAFF_ROLES },
  exam_attendance: { module: 'attendance', roles: STAFF_ROLES },
  homework_evaluation: { module: 'homework', roles: STAFF_ROLES },
  library_category: { module: 'library', roles: STAFF_ROLES },
  reception_config: { module: 'reception', roles: STAFF_ROLES },
  student_deactivation: { module: 'students', roles: STAFF_ROLES },
  parent_deactivation: { module: 'students', roles: STAFF_ROLES },
  employee_deactivation: { module: 'hr', roles: STAFF_ROLES },
  attachment_type: { module: 'attachments', roles: STAFF_ROLES },
  exam_term: { module: 'exams', roles: STAFF_ROLES },
  exam_question_group: { module: 'exams', roles: STAFF_ROLES },
  sms_template: { module: 'communication', roles: STAFF_ROLES },
  email_template: { module: 'communication', roles: STAFF_ROLES },
  sms_log: { module: 'communication', roles: STAFF_ROLES },
  auto_notification: { module: 'communication', roles: STAFF_ROLES },
  payment_type: { module: 'fees', roles: STAFF_ROLES },
  alumni_event: { module: 'alumni', roles: STAFF_ROLES },
  frontend_setting: { module: 'website', roles: STAFF_ROLES },
  frontend_menu: { module: 'website', roles: STAFF_ROLES },
  frontend_section: { module: 'website', roles: STAFF_ROLES },
  frontend_slider: { module: 'website', roles: STAFF_ROLES },
  frontend_features: { module: 'website', roles: STAFF_ROLES },
  frontend_testimonial: { module: 'website', roles: STAFF_ROLES },
  frontend_service: { module: 'website', roles: STAFF_ROLES },
  frontend_faq: { module: 'website', roles: STAFF_ROLES },
  gallery_category: { module: 'website', roles: STAFF_ROLES },
  gallery: { module: 'website', roles: STAFF_ROLES },
  news: { module: 'website', roles: STAFF_ROLES }
};

const NEW_MODULES = [
  {
    code: 'homework',
    name: 'Homework',
    description: 'Assign homework, due dates, and class/subject tracking',
    category: 'academic',
    sort_order: 40
  },
  {
    code: 'attachments',
    name: 'Attachments',
    description: 'Study material uploads by class and subject',
    category: 'academic',
    sort_order: 41
  },
  {
    code: 'liveclass',
    name: 'Live Class',
    description: 'Online class rooms and join links',
    category: 'academic',
    sort_order: 42
  },
  {
    code: 'hostel',
    name: 'Hostel',
    description: 'Hostels, rooms and student allocation',
    category: 'administrative',
    sort_order: 50
  },
  {
    code: 'accounting',
    name: 'Office Accounting',
    description: 'Account heads, deposits, expenses and vouchers',
    category: 'financial',
    sort_order: 51
  },
  {
    code: 'inventory',
    name: 'Inventory',
    description: 'Products, stores, purchase, sales and issue',
    category: 'administrative',
    sort_order: 52
  },
  {
    code: 'events',
    name: 'Events',
    description: 'School events and event types',
    category: 'administrative',
    sort_order: 53
  },
  {
    code: 'alumni',
    name: 'Alumni',
    description: 'Alumni records and alumni events',
    category: 'administrative',
    sort_order: 54
  },
  {
    code: 'communication',
    name: 'Communication',
    description: 'SMS, email campaigns and internal mailbox',
    category: 'communication',
    sort_order: 55
  },
  {
    code: 'website',
    name: 'Website',
    description: 'Public site pages, domain requests and translations',
    category: 'administrative',
    sort_order: 56
  },
  {
    code: 'reception',
    name: 'Front Office',
    description: 'Enquiry, postal, call log, complaint and visitors',
    category: 'administrative',
    sort_order: 57
  }
];

/**
 * Feature → module for enable/disable (plan + per-school).
 * Dedicated APIs also use requireModuleAccess / validateModuleAccess with these codes.
 */
const FEATURE_MODULES = {
  students: [
    'admission',
    'parents',
    'promotion',
    'categories',
    'bulk-edit',
    'transfer',
    'cards',
    'online-admission',
    'student_deactivation',
    'parent_deactivation'
  ],
  fees: ['due-invoices', 'fine-setup', 'fee-groups', 'fee-allocation', 'payment_type'],
  exams: ['exam-reports', 'seating', 'online-exam', 'marksheet-template', 'exam_term', 'exam_question_group'],
  homework: ['homework', 'homework-evaluation'],
  library: ['books', 'issues', 'library-category'],
  reception: ['enquiry', 'postal', 'call-log', 'complaint', 'visitor', 'reception_config'],
  hr: ['department', 'designation', 'leave', 'salary', 'awards', 'employee_deactivation'],
  transport: ['routes', 'vehicles', 'stops', 'assignments'],
  hostel: ['hostel', 'rooms', 'allocation'],
  accounting: ['account-heads', 'vouchers'],
  inventory: ['products', 'stores', 'purchase', 'sales', 'issue'],
  events: ['event-types', 'events'],
  alumni: ['alumni', 'alumni_event'],
  communication: ['sms', 'email', 'mailbox', 'sms_template', 'email_template', 'sms_log', 'auto_notification'],
  website: [
    'cms',
    'translations',
    'domain',
    'frontend_setting',
    'frontend_menu',
    'frontend_section',
    'frontend_slider',
    'frontend_features',
    'frontend_testimonial',
    'frontend_service',
    'frontend_faq',
    'gallery_category',
    'gallery',
    'news'
  ],
  attachments: ['attachments', 'attachment_type'],
  liveclass: ['live-class'],
  attendance: ['subject-attendance', 'staff-attendance', 'exam-attendance']
};

module.exports = { ENTITIES, NEW_MODULES, STAFF_ROLES, FEATURE_MODULES };
