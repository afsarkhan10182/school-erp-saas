/**
 * School-admin sidebar layout grouped by workflow:
 * Full legacy parity and modern SaaS hierarchy
 */
import type { Component } from 'vue';

export type SidebarItem = {
  id: string;
  title: string;
  path?: string;
  icon?: Component;
  requiredModule?: string;
  children?: SidebarItem[];
};

export type SidebarGroup = {
  id: string;
  title: string;
  items: SidebarItem[];
};

type Icons = Record<string, Component>;

type Ctx = {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isBranchAdmin: boolean;
  isAccountant: boolean;
  isReceptionist: boolean;
  isTeacher: boolean;
  isLibrarian: boolean;
  isStudent: boolean;
  isParent: boolean;
  streamsEnabled: boolean;
  icons: Icons;
};

const link = (
  id: string,
  title: string,
  path: string,
  icon: Component,
  requiredModule?: string
): SidebarItem => ({ id, title, path, icon, requiredModule });

export function buildSchoolSidebar(ctx: Ctx): SidebarGroup[] {
  const {
    isSuperAdmin,
    isAdmin,
    isBranchAdmin,
    isAccountant,
    isReceptionist,
    isTeacher,
    isLibrarian,
    isStudent,
    isParent,
    streamsEnabled,
    icons: I
  } = ctx;

  const groups: SidebarGroup[] = [];
  // Treat school_admin same as admin for sidebar access
  const isSchoolAdmin = isAdmin;
  const schoolStaff = isSuperAdmin || isSchoolAdmin || isBranchAdmin;
  const feeStaff = schoolStaff || isAccountant;
  const studentStaff = schoolStaff || isReceptionist;

  if (isSuperAdmin) {
    groups.push({
      id: 'saas',
      title: 'SaaS Management',
      items: [
        {
          id: 'saas-management',
          title: 'School Subscriptions',
          icon: I.CreditCard,
          children: [
            link('customer-overview', 'Overview', '/saas', I.BarChart3),
            link('subscription-plans', 'Subscription Plans', '/saas/plans', I.List),
            link('renewal-requests', 'Renewal Requests', '/saas/renewal-requests', I.FileText)
          ]
        }
      ]
    });
    groups.push({
      id: 'school-mgmt',
      title: 'School Management',
      items: [
        link('manage-schools', 'Schools', '/saas', I.School),
        link('manage-branches', 'Branches', '/branches', I.Building2),
        link('config-management', 'Configuration', '/admin/config', I.Settings)
      ]
    });
  }

  // —— Front Office ——
  if (schoolStaff || isReceptionist) {
    groups.push({
      id: 'front-office',
      title: 'Front Office',
      items: [
        {
          id: 'reception',
          title: 'Reception',
          icon: I.UserCheck,
          requiredModule: 'reception',
          children: [
            link(
              'enquiry',
              'Admission Enquiry',
              '/reception/enquiry',
              I.ClipboardList,
              'reception'
            ),
            link('postal', 'Postal Record', '/reception/postal', I.Mail, 'reception'),
            link('call-log', 'Call Log', '/reception/call_log', I.Phone, 'reception'),
            link('visitors', 'Visitor Log', '/reception/visitor', I.UserCheck, 'reception'),
            link('complaint', 'Complaint', '/reception/complaint', I.MessageSquare, 'reception'),
            link(
              'config-reception',
              'Config Reception',
              '/reception/reception_config',
              I.Settings,
              'reception'
            )
          ]
        }
      ]
    });
  }

  // —— Admission ——
  if (studentStaff) {
    groups.push({
      id: 'admission',
      title: 'Admission',
      items: [
        {
          id: 'admission-menu',
          title: 'Admission',
          icon: I.Edit3,
          requiredModule: 'students',
          children: [
            link(
              'create-admission',
              'Create Admission',
              '/students/create',
              I.UserPlus,
              'students'
            ),
            link(
              'online-admission',
              'Online Admission',
              '/students/online-admission',
              I.Globe,
              'students'
            ),
            link(
              'admission-queue',
              'Admission Queue',
              '/students/admission_application',
              I.ClipboardList,
              'students'
            ),
            link(
              'multiple-import',
              'Multiple Import',
              '/students/import',
              I.ClipboardList,
              'students'
            ),
            link('student-categories', 'Category', '/students/categories', I.Tag, 'students'),
            link(
              'admission-report',
              'Admission Report',
              '/reports/student-extra?tab=admissions',
              I.FileText,
              'reports'
            )
          ]
        }
      ]
    });
  }

  // —— Student Details ——
  if (studentStaff) {
    groups.push({
      id: 'student-details',
      title: 'Student Details',
      items: [
        {
          id: 'students-menu',
          title: 'Student Details',
          icon: I.GraduationCap,
          requiredModule: 'students',
          children: [
            link('all-students', 'Student List', '/students', I.Users, 'students'),
            link('bulk-edit', 'Bulk Edit Students', '/students/bulk-edit', I.Edit3, 'students'),
            link(
              'general-register',
              'General Register',
              '/reports/student-extra?tab=register',
              I.FileText,
              'students'
            ),
            link(
              'login-deactivate-student',
              'Login Deactivate',
              '/students/student_deactivation',
              I.UserCheck,
              'students'
            ),
            link(
              'disable-reasons',
              'Deactivate Reason',
              '/students/disable_reason',
              I.Tag,
              'students'
            ),
            link(
              'branch-transfer',
              'Branch Transfer',
              '/students/transfer',
              I.TrendingUp,
              'students'
            ),
            link('custom-fields', 'Custom Fields', '/students/custom_field', I.Tag, 'students')
          ]
        }
      ]
    });
  }

  // —— Parents ——
  if (schoolStaff || isReceptionist) {
    groups.push({
      id: 'parents',
      title: 'Parents',
      items: [
        {
          id: 'parents-menu',
          title: 'Parents',
          icon: I.Users,
          requiredModule: 'students',
          children: [
            link('parents-list', 'Parents List', '/parents', I.Users, 'students'),
            link('add-parent', 'Add Parent', '/parents?action=create', I.UserPlus, 'students'),
            link(
              'parent-deactivate',
              'Login Deactivate',
              '/parents/parent_deactivation',
              I.UserCheck,
              'students'
            )
          ]
        }
      ]
    });
  }

  // —— Employee / Human Resource ——
  if (schoolStaff || isAdmin) {
    const hrChildren: SidebarItem[] = [];
    if (isSuperAdmin || isAdmin) {
      hrChildren.push(link('staff-list', 'Employee List', '/users', I.Users));
    }
    hrChildren.push(
      link('hr-dept', 'Add Department', '/hr/staff_department', I.Building, 'hr'),
      link('hr-desig', 'Add Designation', '/hr/staff_designation', I.Award, 'hr'),
      link('hr-add-employee', 'Add Employee', '/users/create', I.UserPlus, 'hr'),
      link('hr-deactivate', 'Login Deactivate', '/hr/employee_deactivation', I.UserCheck, 'hr'),
      link('hr-salary', 'Salary Template', '/hr/salary_template', I.Wallet, 'hr'),
      link('hr-salary-assign', 'Salary Assign', '/hr/salary_assignment', I.Users, 'hr'),
      link('hr-payroll', 'Salary Payment', '/hr/salary_payment', I.DollarSign, 'hr'),
      link('hr-advance-salary', 'Advance Salary', '/hr/advance_salary', I.Receipt, 'hr'),
      link('hr-leave-cat', 'Leave Category', '/hr/leave_category', I.Tag, 'hr'),
      link('hr-leave', 'Leave Application', '/hr/leave_request', I.ClipboardList, 'hr'),
      link('hr-awards', 'Award', '/hr/staff_award', I.Trophy, 'hr')
    );
    groups.push({
      id: 'hr',
      title: 'Human Resource',
      items: [
        {
          id: 'hr-menu',
          title: 'Human Resource',
          icon: I.Users,
          children: hrChildren
        }
      ]
    });
  }

  // —— Cards Management ——
  if (schoolStaff) {
    groups.push({
      id: 'cards',
      title: 'Card Management',
      items: [
        {
          id: 'cards-menu',
          title: 'Card Management',
          icon: I.Award,
          requiredModule: 'students',
          children: [
            link(
              'id-card-templates',
              'ID Card Template',
              '/cards/templates',
              I.FileText,
              'students'
            ),
            link('id-cards', 'Student ID Card', '/cards', I.Award, 'students'),
            link(
              'employee-id-card',
              'Employee ID Card',
              '/cards?type=employee',
              I.Users,
              'students'
            ),
            link(
              'admit-card-template',
              'Admit Card Template',
              '/cards/templates?type=admit',
              I.FileText,
              'students'
            ),
            link(
              'generate-admit-card',
              'Generate Admit Card',
              '/cards?type=admit',
              I.Award,
              'students'
            )
          ]
        }
      ]
    });
  }

  // —— Certificates ——
  if (schoolStaff) {
    groups.push({
      id: 'certificates',
      title: 'Certificates',
      items: [
        {
          id: 'certificate-management',
          title: 'Certificates',
          icon: I.Award,
          requiredModule: 'certificates',
          children: [
            link(
              'certificate-templates',
              'Certificate Template',
              '/certificates/templates',
              I.FileText,
              'certificates'
            ),
            link(
              'generate-students',
              'Generate Student',
              '/certificates/generate-students',
              I.GraduationCap,
              'certificates'
            ),
            link(
              'generate-employees',
              'Generate Employee',
              '/certificates/generate-employees',
              I.Users,
              'certificates'
            )
          ]
        }
      ]
    });
  }

  // —— Academic ——
  if (schoolStaff) {
    const academicChildren: SidebarItem[] = [];
    if (isSuperAdmin) {
      academicChildren.push(
        link('academic-years', 'Academic Years', '/academic/years', I.Calendar)
      );
    }
    academicChildren.push(
      link('classes', 'Control Classes', '/academic/classes', I.GraduationCap),
      link(
        'assign-class-teacher',
        'Assign Class Teacher',
        '/academic/class-assignments?tab=teacher',
        I.UserCheck,
        'academic_management'
      ),
      link('sections', 'Sections', '/academic/sections', I.Users),
      link('subjects', 'Subject', '/academic/subjects', I.BookOpen, 'academic_management'),
      link(
        'class-assign',
        'Class Assign',
        '/academic/class-assignments',
        I.BookOpen,
        'academic_management'
      )
    );
    if (streamsEnabled) {
      academicChildren.push(link('streams', 'Streams', '/academic/streams', I.BookOpen));
    }
    academicChildren.push(
      link('timetable', 'Class Schedule', '/academic/timetable', I.Calendar, 'academic_management'),
      link(
        'teacher-schedule',
        'Teacher Schedule',
        '/academic/timetables',
        I.Clock,
        'academic_management'
      ),
      link(
        'comprehensive-schedule',
        'Comprehensive Schedule',
        '/academic/timetable?view=comprehensive',
        I.Calendar,
        'academic_management'
      ),
      link(
        'teacher-conflicts',
        'Teacher Conflicts',
        '/academic/workload?tab=conflicts',
        I.Users,
        'academic_management'
      ),
      link('student-promotion', 'Promotion', '/students/promotion', I.TrendingUp, 'students'),
      link(
        'student-dropbox',
        'Student Dropbox',
        '/students/promotion?tab=dropbox',
        I.Tag,
        'students'
      ),
      link(
        'branch-transfer-acad',
        'Branch Transfer',
        '/students/transfer',
        I.TrendingUp,
        'students'
      )
    );
    groups.push({
      id: 'academic',
      title: 'Academic',
      items: [
        {
          id: 'academic-setup',
          title: 'Academic',
          icon: I.BookOpen,
          children: academicChildren
        }
      ]
    });
  }

  // —— Attachments / Live Class / Homework ——
  if (schoolStaff || isTeacher) {
    groups.push({
      id: 'learning',
      title: 'Live Class & Homework',
      items: [
        {
          id: 'liveclass-menu',
          title: 'Live Class',
          icon: I.Video,
          requiredModule: 'liveclass',
          children: [
            link(
              'live-class-rooms',
              'Live Class Rooms',
              '/academic/live_class',
              I.Video,
              'liveclass'
            ),
            link(
              'live-class-reports',
              'Live Class Reports',
              '/reports/suite?module=liveclass',
              I.FileBarChart,
              'liveclass'
            )
          ]
        },
        {
          id: 'attachments-menu',
          title: 'Upload Content',
          icon: I.Paperclip,
          requiredModule: 'attachments',
          children: [
            link(
              'attachments',
              'Upload Content',
              '/academic/attachment',
              I.Paperclip,
              'attachments'
            ),
            link(
              'attachment-type',
              'Attachment Type',
              '/academic/attachment_type',
              I.Tag,
              'attachments'
            )
          ]
        },
        {
          id: 'homework-menu',
          title: 'Homework',
          icon: I.ClipboardList,
          requiredModule: 'homework',
          children: [
            link('homework-list', 'Homework', '/homework', I.ClipboardList, 'homework'),
            link(
              'homework-eval',
              'Evaluation Report',
              '/homework/homework_evaluation',
              I.CheckCircle,
              'homework'
            )
          ]
        }
      ]
    });
  }

  if (isTeacher) {
    groups.push({
      id: 'teacher-workspace',
      title: 'Teaching',
      items: [
        link('teacher-dashboard', 'Dashboard', '/dashboard', I.Home),
        link('teacher-timetable', 'My Timetable', '/academic/timetable', I.Calendar, 'academic_management'),
        link('teacher-attendance', 'Attendance', '/attendance', I.ClipboardList, 'attendance'),
        link('teacher-exams', 'Exam Results', '/exams/results', I.BarChart3, 'exams')
      ]
    });
  }

  // —— Exams ——
  if (schoolStaff) {
    groups.push({
      id: 'exams',
      title: 'Examination',
      items: [
        {
          id: 'exam-management',
          title: 'Exam',
          icon: I.FileText,
          requiredModule: 'exams',
          children: [
            link('exam-term', 'Exam Term', '/exams/exam_term', I.Tag, 'exams'),
            link('exam-hall', 'Exam Hall', '/exams/setup/exam-halls', I.Building, 'exams'),
            link(
              'exam-distribution',
              'Distribution',
              '/exams/setup/mark-distributions',
              I.PieChart,
              'exams'
            ),
            link('exam-setup', 'Exam Setup', '/exams/setup', I.Settings, 'exams'),
            link(
              'marksheet-templates',
              'Marksheet Template',
              '/exams/marksheet_template',
              I.FileText,
              'exams'
            ),
            link('exam-schedules', 'Schedule', '/exams/schedules', I.Calendar, 'exams'),
            link('add-schedule', 'Add Schedule', '/exams/schedules/create', I.UserPlus, 'exams'),
            link(
              'comp-exam-schedule',
              'Comprehensive Schedule',
              '/exams/schedules?view=comprehensive',
              I.Calendar,
              'exams'
            ),
            link(
              'school-wide-schedule',
              'School Wide Schedule',
              '/exams/schedules?view=school',
              I.Calendar,
              'exams'
            ),
            link('exam-seating', 'Seating Arrangement', '/exams/seating', I.Users, 'exams'),
            link(
              'exam-seating-overview',
              'Seating Overview',
              '/exams/seating/overview',
              I.FileText,
              'exams'
            ),
            link(
              'exam-seating-calendar',
              'Seating Calendar',
              '/exams/seating/calendar',
              I.Calendar,
              'exams'
            ),
            link('exam-seat-stickers', 'Seat Stickers', '/exams/seating/stickers', I.Tag, 'exams'),
            link('marks-entry', 'Mark Entries', '/exams/marks-entry', I.Edit3, 'exams'),
            link('positions', 'Generate Position', '/exams/positions', I.Trophy, 'exams'),
            link('grades-range', 'Grades Range', '/exams/setup/grading-systems', I.Tag, 'exams'),
            link('online-exam', 'Online Exam', '/exams/online', I.Video, 'exams'),
            link(
              'question-bank',
              'Question Bank',
              '/exams/exam_question',
              I.ClipboardList,
              'exams'
            ),
            link('question-group', 'Question Group', '/exams/exam_question_group', I.Tag, 'exams'),
            link('exam-results', 'Exam Result', '/exams/results', I.BarChart3, 'exams')
          ]
        }
      ]
    });
  }

  // —— Supervision (Hostel & Transport) ——
  if (schoolStaff) {
    groups.push({
      id: 'hostel-transport',
      title: 'Supervision',
      items: [
        {
          id: 'hostel-menu',
          title: 'Hostel',
          icon: I.Building,
          requiredModule: 'hostel',
          children: [
            link('hostel-manage', 'Manage Hostels', '/hostel/manage', I.Building, 'hostel'),
            link('hostel-rooms', 'Rooms & Types', '/hostel/rooms', I.BedDouble, 'hostel'),
            link('hostel-allocations', 'Allocations', '/hostel/allocations', I.Users, 'hostel')
          ]
        },
        {
          id: 'transport-menu',
          title: 'Transport',
          icon: I.Bus,
          requiredModule: 'transport',
          children: [
            link('tr-route', 'Routes', '/transport/routes', I.Bus, 'transport'),
            link(
              'tr-vehicle',
              'Vehicles',
              '/transport/vehicles',
              I.Truck,
              'transport'
            ),
            link(
              'tr-alloc',
              'Allocations',
              '/transport/allocations',
              I.Users,
              'transport'
            ),
            link(
              'tr-report',
              'Allocation Report',
              '/reports/suite?module=transport',
              I.FileText,
              'transport'
            )
          ]
        }
      ]
    });
  }

  // —— Attendance ——
  if (schoolStaff) {
    groups.push({
      id: 'attendance',
      title: 'Attendance',
      items: [
        {
          id: 'attendance-management',
          title: 'Attendance',
          icon: I.ClipboardList,
          requiredModule: 'attendance',
          children: [
            link('attendance-student', 'Student', '/attendance', I.ClipboardList, 'attendance'),
            link(
              'subject-attendance',
              'Subject Wise',
              '/attendance/subject_attendance',
              I.ClipboardList,
              'attendance'
            ),
            link(
              'staff-attendance',
              'Employee',
              '/attendance/staff_attendance',
              I.UserCheck,
              'attendance'
            ),
            link(
              'exam-attendance',
              'Exam',
              '/attendance/exam_attendance',
              I.CheckCircle,
              'attendance'
            )
          ]
        }
      ]
    });
  }

  // —— Library ——
  if (schoolStaff || isLibrarian) {
    groups.push({
      id: 'library',
      title: 'Library',
      items: [
        {
          id: 'library-menu',
          title: 'Library',
          icon: I.BookOpen,
          requiredModule: 'library',
          children: [
            link('library-books', 'Books', '/library', I.BookOpen, 'library'),
            link(
              'import-books',
              'Import Books',
              '/library?action=import',
              I.ClipboardList,
              'library'
            ),
            link(
              'import-issues',
              'Import Book Issues',
              '/library?action=import_issues',
              I.ClipboardList,
              'library'
            ),
            link(
              'library-categories',
              'Books Category',
              '/library/library_category',
              I.Tag,
              'library'
            ),
            link('my-issued-book', 'My Issued Book', '/library?view=issued', I.BookOpen, 'library'),
            link('book-manage', 'Book Issue/return', '/library?view=manage', I.BookOpen, 'library')
          ]
        }
      ]
    });
  }

  // —— Events & Alumni ——
  if (schoolStaff) {
    groups.push({
      id: 'events-alumni',
      title: 'Events & Alumni',
      items: [
        {
          id: 'events-menu',
          title: 'Events',
          icon: I.Calendar,
          requiredModule: 'events',
          children: [
            link('event-types', 'Event Type', '/events/event_type', I.Tag, 'events'),
            link('events', 'Events', '/events/event', I.Calendar, 'events')
          ]
        },
        {
          id: 'alumni-menu',
          title: 'Alumni',
          icon: I.GraduationCap,
          requiredModule: 'alumni',
          children: [
            link('alumni-manage', 'Manage Alumni', '/alumni/directory', I.GraduationCap, 'alumni'),
            link('alumni-events', 'Events', '/alumni/events', I.Calendar, 'alumni')
          ]
        }
      ]
    });
  }

  // —— Send SMS / Email ——
  if (schoolStaff) {
    groups.push({
      id: 'communication',
      title: 'Send SMS / Email',
      items: [
        {
          id: 'comm-menu',
          title: 'Send SMS / Email',
          icon: I.Megaphone,
          requiredModule: 'communication',
          children: [
            link(
              'sms',
              'Send SMS / Email',
              '/communication/sms_campaign',
              I.Megaphone,
              'communication'
            ),
            link(
              'sms-report',
              'Sms / Email Report',
              '/reports/suite?module=communication',
              I.FileBarChart,
              'communication'
            ),
            link(
              'sms-template',
              'Sms Template',
              '/communication/sms_template',
              I.FileText,
              'communication'
            ),
            link(
              'email-template',
              'Email Template',
              '/communication/email_template',
              I.Mail,
              'communication'
            ),
            link(
              'student-birthday',
              'Student Birthday Wishes',
              '/communication/auto_notification?type=birthday_student',
              I.Gift,
              'communication'
            ),
            link(
              'staff-birthday',
              'Staff Birthday Wishes',
              '/communication/auto_notification?type=birthday_staff',
              I.Gift,
              'communication'
            )
          ]
        }
      ]
    });
  }

  // —— Fees & Offline Payments ——
  if (feeStaff) {
    groups.push({
      id: 'fees',
      title: 'Fees',
      items: [
        {
          id: 'fee-management',
          title: 'Fees',
          icon: I.DollarSign,
          requiredModule: 'fees',
          children: [
            link('payments-type', 'Payments Type', '/fees/payment_type', I.CreditCard, 'fees'),
            link(
              'offline-payments',
              'Offline Payments',
              '/fees/offline_payment',
              I.CreditCard,
              'fees'
            ),
            link('fee-types', 'Fees Type', '/fees/types', I.Tag, 'fees'),
            link('fee-groups', 'Fees Group', '/fees/fee_group', I.List, 'fees'),
            link('fine-setup', 'Fine Setup', '/fees/fines', I.Tag, 'fees'),
            link('fee-allocation', 'Fees Allocation', '/fees/allocation', I.ClipboardList, 'fees'),
            link('invoices', 'Fees Pay / Invoice', '/fees/invoices', I.Receipt, 'fees'),
            link('due-invoices', 'Due Fees Invoice', '/fees/due', I.FileText, 'fees'),
            link('fee-reminders', 'Fees Reminder', '/fees/fee_reminder', I.Mail, 'fees')
          ]
        }
      ]
    });
  }

  // —— Accounting ——
  if (schoolStaff || isAccountant) {
    groups.push({
      id: 'accounting',
      title: 'Accounting',
      items: [
        {
          id: 'acct-menu',
          title: 'Accounting',
          icon: I.Briefcase,
          requiredModule: 'accounting',
          children: [
            link('acct-categories', 'Categories', '/accounting/categories', I.Tag, 'accounting'),
            link('acct-income', 'Income', '/accounting/income', I.DollarSign, 'accounting'),
            link('acct-expense', 'Expense', '/accounting/expense', I.Receipt, 'accounting')
          ]
        }
      ]
    });
  }

  if (isStudent || isParent) {
    groups.push({
      id: 'portal',
      title: 'My Portal',
      items: [
        link('portal-home', 'Portal Home', '/portal', I.Home),
        link('portal-online-exams', 'Online Exams', '/portal/online-exams', I.FileText, 'exams')
      ]
    });
  }

  // —— Inventory ——
  if (schoolStaff) {
    groups.push({
      id: 'inventory',
      title: 'Inventory',
      items: [
        {
          id: 'inv-menu',
          title: 'Inventory',
          icon: I.Package,
          requiredModule: 'inventory',
          children: [
            link('inv-prod', 'Items', '/inventory/items', I.Package, 'inventory'),
            link('inv-cat', 'Categories', '/inventory/categories', I.Tag, 'inventory'),
            link('inv-store', 'Stores', '/inventory/stores', I.Warehouse, 'inventory'),
            link('inv-sup', 'Suppliers', '/inventory/suppliers', I.Users, 'inventory'),
            link('inv-issue', 'Issues', '/inventory/issues', I.ClipboardList, 'inventory')
          ]
        }
      ]
    });
  }

  // —— Reports Suite ——
  if (schoolStaff) {
    groups.push({
      id: 'reports',
      title: 'Reports',
      items: [
        {
          id: 'reports-menu',
          title: 'Reports',
          icon: I.BarChart3,
          requiredModule: 'reports',
          children: [
            {
              id: 'student-reports',
              title: 'Student Reports',
              icon: I.GraduationCap,
              requiredModule: 'students',
              children: [
                link(
                  'rep-login-cred',
                  'Login Credential',
                  '/reports/student-extra?tab=credentials',
                  I.FileText,
                  'students'
                ),
                link(
                  'rep-admission',
                  'Admission Report',
                  '/reports/student-extra?tab=admissions',
                  I.FileText,
                  'students'
                ),
                link(
                  'rep-class-sec',
                  'Class & Section Report',
                  '/reports/student-extra?tab=classsection',
                  I.FileText,
                  'students'
                ),
                link(
                  'rep-sibling',
                  'Sibling Report',
                  '/reports/student-extra?tab=siblings',
                  I.Users,
                  'students'
                )
              ]
            },
            {
              id: 'fee-reports',
              title: 'Fees Reports',
              icon: I.DollarSign,
              requiredModule: 'fees',
              children: [
                link('rep-fees', 'Fees Report', '/reports/fees', I.PieChart, 'fees'),
                link(
                  'rep-group-fees',
                  'Group Wise Fees Report',
                  '/reports/fees?type=group',
                  I.PieChart,
                  'fees'
                ),
                link('rep-receipts', 'Receipts Report', '/reports/receipts', I.Receipt, 'fees'),
                link(
                  'rep-due-fees',
                  'Due Fees Report',
                  '/reports/fees?type=due',
                  I.FileText,
                  'fees'
                ),
                link('rep-fine', 'Fine Report', '/reports/fees?type=fine', I.Tag, 'fees')
              ]
            },
            {
              id: 'acct-reports',
              title: 'Financial Reports',
              icon: I.Wallet,
              requiredModule: 'accounting',
              children: [
                link(
                  'rep-acct-stmt',
                  'Account Statement',
                  '/reports/suite?module=accounting&tab=statement',
                  I.FileText,
                  'accounting'
                ),
                link(
                  'rep-income',
                  'Income Reports',
                  '/reports/suite?module=accounting&tab=income',
                  I.BarChart3,
                  'accounting'
                ),
                link(
                  'rep-expense',
                  'Expense Reports',
                  '/reports/suite?module=accounting&tab=expense',
                  I.BarChart3,
                  'accounting'
                ),
                link(
                  'rep-transactions',
                  'Transitions Reports',
                  '/reports/suite?module=accounting&tab=transactions',
                  I.List,
                  'accounting'
                ),
                link(
                  'rep-balance',
                  'Balance Sheet',
                  '/reports/suite?module=accounting&tab=balance',
                  I.FileText,
                  'accounting'
                ),
                link(
                  'rep-inc-vs-exp',
                  'Income Vs Expense',
                  '/reports/suite?module=accounting&tab=incomevsexpense',
                  I.TrendingUp,
                  'accounting'
                )
              ]
            },
            {
              id: 'attendance-reports-group',
              title: 'Attendance Reports',
              icon: I.UserCheck,
              requiredModule: 'attendance',
              children: [
                link(
                  'rep-std-attn',
                  'Student Reports',
                  '/reports/attendance?tab=studentwise',
                  I.UserCheck,
                  'attendance'
                ),
                link(
                  'rep-std-daily',
                  'Student Daily Reports',
                  '/reports/attendance?tab=daily',
                  I.UserCheck,
                  'attendance'
                ),
                link(
                  'rep-std-overview',
                  'Student Overview Reports',
                  '/reports/attendance?tab=overview',
                  I.UserCheck,
                  'attendance'
                ),
                link(
                  'rep-subj-reports',
                  'Subject Wise Reports',
                  '/reports/attendance?tab=subject',
                  I.UserCheck,
                  'attendance'
                ),
                link(
                  'rep-emp-attn',
                  'Employee Reports',
                  '/reports/attendance?tab=employee',
                  I.UserCheck,
                  'attendance'
                ),
                link(
                  'rep-exam-attn',
                  'Exam Reports',
                  '/reports/attendance?tab=exam',
                  I.UserCheck,
                  'attendance'
                )
              ]
            },
            {
              id: 'hr-reports-group',
              title: 'Payroll & Leave Reports',
              icon: I.Users,
              requiredModule: 'hr',
              children: [
                link(
                  'rep-payroll',
                  'Payroll Summary',
                  '/reports/suite?module=hr&tab=payroll',
                  I.FileText,
                  'hr'
                ),
                link(
                  'rep-leave',
                  'Leave Reports',
                  '/reports/suite?module=hr&tab=leave',
                  I.ClipboardList,
                  'hr'
                )
              ]
            },
            {
              id: 'exam-reports-group',
              title: 'Examination Reports',
              icon: I.BookOpen,
              requiredModule: 'exams',
              children: [
                link(
                  'single-exam-report-card',
                  'Single Exam Report Card',
                  '/exams/report-cards',
                  I.FileText,
                  'exams'
                ),
                link(
                  'tabulation-sheet',
                  'Tabulation Sheet',
                  '/reports/exams?tab=tabulation',
                  I.FileBarChart,
                  'exams'
                ),
                link(
                  'multi-exam-progress-report',
                  'Multi Exam Progress Report',
                  '/reports/exams?tab=progress',
                  I.BarChart3,
                  'exams'
                )
              ]
            },
            {
              id: 'inv-reports-group',
              title: 'Inventory Reports',
              icon: I.Package,
              requiredModule: 'inventory',
              children: [
                link(
                  'rep-stock',
                  'Stock Report',
                  '/reports/suite?module=inventory&tab=stock',
                  I.Package,
                  'inventory'
                ),
                link(
                  'rep-purchase',
                  'Purchase Report',
                  '/reports/suite?module=inventory&tab=purchase',
                  I.ClipboardList,
                  'inventory'
                ),
                link(
                  'rep-sales',
                  'Sales Report',
                  '/reports/suite?module=inventory&tab=sales',
                  I.DollarSign,
                  'inventory'
                ),
                link(
                  'rep-issues',
                  'Issues Report',
                  '/reports/suite?module=inventory&tab=issue',
                  I.Package,
                  'inventory'
                )
              ]
            }
          ]
        }
      ]
    });
  }

  // —— Website / Frontend ——
  if (schoolStaff) {
    groups.push({
      id: 'website',
      title: 'Frontend',
      items: [
        {
          id: 'website-menu',
          title: 'Website',
          icon: I.Globe,
          requiredModule: 'website',
          children: [
            link('frontend-setting', 'Setting', '/website/frontend_setting', I.Settings, 'website'),
            link('frontend-menu', 'Menu', '/website/frontend_menu', I.List, 'website'),
            link(
              'frontend-section',
              'Page Section',
              '/website/frontend_section',
              I.Layers,
              'website'
            ),
            link('frontend-content', 'Manage Page', '/website/cms_page', I.Globe, 'website'),
            link('frontend-slider', 'Slider', '/website/frontend_slider', I.Image, 'website'),
            link('frontend-features', 'Features', '/website/frontend_features', I.Star, 'website'),
            link(
              'frontend-testimonial',
              'Testimonial',
              '/website/frontend_testimonial',
              I.MessageSquare,
              'website'
            ),
            link(
              'frontend-service',
              'Service',
              '/website/frontend_service',
              I.CheckCircle,
              'website'
            ),
            link('frontend-faq', 'Faq', '/website/frontend_faq', I.HelpCircle, 'website'),
            link(
              'frontend-gallery-cat',
              'Gallery Category',
              '/website/gallery_category',
              I.Tag,
              'website'
            ),
            link('frontend-gallery', 'Gallery', '/website/gallery', I.Image, 'website'),
            link('frontend-news', 'News', '/website/news', I.FileText, 'website')
          ]
        }
      ]
    });
  }

  // —— System Settings ——
  if (isSuperAdmin || isAdmin) {
    groups.push({
      id: 'settings',
      title: 'Settings',
      items: [
        {
          id: 'settings-menu',
          title: 'System Settings',
          icon: I.Settings,
          children: [
            link('global-settings', 'Global Settings', '/settings', I.Settings),
            link('school-settings', 'School Settings', '/settings?tab=school', I.School),
            link('role-permission', 'Role Permission', '/admin/config?tab=roles', I.Users),
            link('session-settings', 'Academic Years', '/academic/years', I.Calendar),
            link('translations', 'Translations', '/settings/translation', I.Globe),
            link('cron-job', 'Cron Job', '/admin/config?tab=cron', I.Clock),
            link('modules', 'Modules', '/admin/config?tab=modules', I.Layers),
            link(
              'system-student-field',
              'System Student Field',
              '/students/custom_field?tab=system',
              I.Tag
            ),
            link('custom-field', 'Custom Field', '/students/custom_field', I.Tag)
          ]
        }
      ]
    });
  }

  return groups;
}
