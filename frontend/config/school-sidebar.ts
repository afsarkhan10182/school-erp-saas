/**
 * School-admin sidebar layout grouped by workflow:
 * Admission | Student Details | Parents | Academic | … (not one flat Students dump)
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
  const schoolStaff = isSuperAdmin || isAdmin || isBranchAdmin;
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
            link('enquiry', 'Enquiry', '/ops/enquiry', I.ClipboardList, 'reception'),
            link('postal', 'Postal Record', '/ops/postal', I.Mail, 'reception'),
            link('call-log', 'Call Log', '/ops/call_log', I.Phone, 'reception'),
            link('complaint', 'Complaint', '/ops/complaint', I.MessageSquare, 'reception'),
            link('visitors', 'Visitor Book', '/ops/visitor', I.UserCheck, 'reception')
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
            link('create-admission', 'Create Admission', '/students/create', I.UserPlus, 'students'),
            link('online-admission', 'Online Admission', '/students/online-admission', I.Globe, 'students'),
            link('admission-queue', 'Admission Queue', '/ops/admission_application', I.ClipboardList, 'students'),
            link('admission-report', 'Admission Report', '/reports/student-extra?tab=admissions', I.FileText, 'reports'),
            link('multiple-import', 'Multiple Import', '/students/import', I.ClipboardList, 'students'),
            link('student-categories', 'Category', '/students/categories', I.Tag, 'students')
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
          title: 'Students',
          icon: I.GraduationCap,
          requiredModule: 'students',
          children: [
            link('all-students', 'Student List', '/students', I.Users, 'students'),
            link('bulk-edit', 'Bulk Edit', '/students/bulk-edit', I.Edit3, 'students'),
            link('disable-reasons', 'Deactivate Reason', '/ops/disable_reason', I.Tag, 'students'),
            link('branch-transfer', 'Branch Transfer', '/students/transfer', I.TrendingUp, 'students'),
            link('custom-fields', 'Custom Fields', '/ops/custom_field', I.Tag, 'students')
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
          children: [link('parents-list', 'Parents List', '/parents', I.Users, 'students')]
        }
      ]
    });
  }

  // —— Cards ——
  if (schoolStaff) {
    groups.push({
      id: 'cards',
      title: 'Card Management',
      items: [
        {
          id: 'cards-menu',
          title: 'ID / Admit Cards',
          icon: I.Award,
          requiredModule: 'students',
          children: [
            link('id-card-templates', 'ID / Admit Templates', '/cards/templates', I.FileText, 'students'),
            link('id-cards', 'Generate Cards', '/cards', I.Award, 'students')
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
            link('certificate-templates', 'Templates', '/certificates/templates', I.FileText, 'certificates'),
            link('generate-students', 'Generate Student', '/certificates/generate-students', I.GraduationCap, 'certificates'),
            link('generate-employees', 'Generate Employee', '/certificates/generate-employees', I.Users, 'certificates')
          ]
        }
      ]
    });
  }

  // —— Human Resource ——
  if (schoolStaff || isAdmin) {
    const hrChildren: SidebarItem[] = [];
    if (isSuperAdmin || isAdmin) {
      hrChildren.push(link('staff-list', 'Employee List', '/users', I.Users));
    }
    hrChildren.push(
      link('hr-dept', 'Department', '/ops/staff_department', I.Building, 'hr'),
      link('hr-desig', 'Designation', '/ops/staff_designation', I.Award, 'hr'),
      link('hr-leave-cat', 'Leave Category', '/ops/leave_category', I.Tag, 'hr'),
      link('hr-leave', 'Leave Request', '/ops/leave_request', I.ClipboardList, 'hr'),
      link('hr-salary', 'Salary Template', '/ops/salary_template', I.Wallet, 'hr'),
      link('hr-salary-assign', 'Salary Assign', '/ops/salary_assignment', I.Users, 'hr'),
      link('hr-payroll', 'Salary Payment', '/ops/salary_payment', I.DollarSign, 'hr'),
      link('hr-advance-salary', 'Advance Salary', '/ops/advance_salary', I.Receipt, 'hr'),
      link('hr-awards', 'Award', '/ops/staff_award', I.Trophy, 'hr')
    );
    groups.push({
      id: 'hr',
      title: 'Human Resource',
      items: [
        {
          id: 'hr-menu',
          title: 'Employees & Payroll',
          icon: I.Users,
          children: hrChildren
        }
      ]
    });
  }

  // —— Academic ——
  if (schoolStaff) {
    const academicChildren: SidebarItem[] = [];
    if (isSuperAdmin) {
      academicChildren.push(link('academic-years', 'Academic Years', '/academic/years', I.Calendar));
    }
    academicChildren.push(
      link('classes', 'Classes', '/academic/classes', I.GraduationCap),
      link('sections', 'Sections', '/academic/sections', I.Users)
    );
    if (streamsEnabled) {
      academicChildren.push(link('streams', 'Streams', '/academic/streams', I.BookOpen));
    }
    academicChildren.push(
      link('class-management', 'Class Assignments', '/academic/class-assignments', I.BookOpen, 'academic_management'),
      link('subjects', 'Subjects', '/academic/subjects', I.BookOpen, 'academic_management'),
      link('class-assignments', 'Class & Teacher Assignments', '/academic/class-assignments', I.UserCheck, 'academic_management'),
      link('teacher-workload', 'Teacher Workload', '/academic/workload', I.Users, 'academic_management'),
      link('timetable', 'Class Schedule', '/academic/timetable', I.Calendar, 'academic_management'),
      link('academic-calendar', 'Academic Calendar', '/academic/calendar', I.Calendar, 'academic_management'),
      link('teacher-workload', 'Teacher Workload', '/academic/workload', I.ClipboardList, 'academic_management'),
      link('student-promotion', 'Promotion', '/students/promotion', I.TrendingUp, 'students')
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

  // —— Attachments / Live class / Homework ——
  if (schoolStaff || isTeacher) {
    groups.push({
      id: 'learning',
      title: 'Learning',
      items: [
        {
          id: 'attachments-menu',
          title: 'Attachments',
          icon: I.Paperclip,
          requiredModule: 'attachments',
          children: [link('attachments', 'Study Material', '/ops/attachment', I.Paperclip, 'attachments')]
        },
        {
          id: 'liveclass-menu',
          title: 'Live Class',
          icon: I.Video,
          requiredModule: 'liveclass',
          children: [link('live-class', 'Rooms', '/ops/live_class', I.Video, 'liveclass')]
        },
        {
          id: 'homework-menu',
          title: 'Homework',
          icon: I.ClipboardList,
          requiredModule: 'homework',
          children: [
            link('homework-list', 'Homework', '/homework', I.ClipboardList, 'homework'),
            link('homework-eval', 'Evaluation', '/ops/homework_evaluation', I.CheckCircle, 'homework')
          ]
        }
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
          title: 'Exams',
          icon: I.FileText,
          requiredModule: 'exams',
          children: [
            link('exam-setup', 'Exam Setup', '/exams/setup', I.Settings, 'exams'),
            link('exams', 'Exams', '/exams', I.BookOpen, 'exams'),
            link('exam-schedules', 'Exam Schedule', '/exams/schedules', I.Calendar, 'exams'),
            link('marks-entry', 'Marks Entry', '/exams/marks-entry', I.Edit3, 'exams'),
            link('exam-results', 'Exam Results', '/exams/results', I.BarChart3, 'exams'),
            link('positions', 'Positions', '/exams/positions', I.Trophy, 'exams'),
            link('publication', 'Publication', '/exams/publication', I.Globe, 'exams'),
            link('exam-seating', 'Seating Arrangement', '/exams/seating', I.Users, 'exams'),
            link('exam-seating-overview', 'Seating Overview', '/exams/seating/overview', I.FileText, 'exams'),
            link('exam-seating-calendar', 'Seating Calendar', '/exams/seating/calendar', I.Calendar, 'exams'),
            link('exam-seat-stickers', 'Seat Stickers', '/exams/seating/stickers', I.Tag, 'exams'),
            link('marksheet-templates', 'Marksheet Template', '/ops/marksheet_template', I.FileText, 'exams'),
            link('online-exam', 'Online Exam', '/exams/online', I.Video, 'exams'),
            link('question-bank', 'Question Bank', '/ops/exam_question', I.ClipboardList, 'exams')
          ]
        }
      ]
    });
  }

  // —— Hostel & Transport ——
  if (schoolStaff) {
    groups.push({
      id: 'hostel-transport',
      title: 'Hostel & Transport',
      items: [
        {
          id: 'hostel-menu',
          title: 'Hostel',
          icon: I.Building,
          requiredModule: 'hostel',
          children: [
            link('hostel-list', 'Hostel', '/ops/hostel', I.Building, 'hostel'),
            link('hostel-rooms', 'Room', '/ops/hostel_room', I.BedDouble, 'hostel'),
            link('hostel-category', 'Category', '/ops/hostel_category', I.Tag, 'hostel'),
            link('hostel-alloc', 'Allocation', '/ops/hostel_allocation', I.Users, 'hostel')
          ]
        },
        {
          id: 'transport-menu',
          title: 'Transport',
          icon: I.Bus,
          requiredModule: 'transport',
          children: [
            link('tr-route', 'Route', '/ops/transport_route', I.Bus, 'transport'),
            link('tr-vehicle', 'Vehicle', '/ops/transport_vehicle', I.Truck, 'transport'),
            link('tr-stop', 'Stoppage', '/ops/transport_stop', I.MapPin, 'transport'),
            link('tr-assign', 'Assign Vehicle', '/ops/transport_assignment', I.Users, 'transport'),
            link('tr-fees', 'Fees Setup', '/ops/transport_fee_setup', I.DollarSign, 'transport')
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
            link('attendance-sessions', 'Student', '/attendance', I.ClipboardList, 'attendance'),
            link('subject-attendance', 'Subject Wise', '/ops/subject_attendance', I.ClipboardList, 'attendance'),
            link('staff-attendance', 'Employee', '/ops/staff_attendance', I.UserCheck, 'attendance'),
            link('exam-attendance', 'Exam Attendance', '/ops/exam_attendance', I.CheckCircle, 'attendance'),
            link('attendance-analytics', 'Analytics', '/attendance/analytics', I.BarChart3, 'attendance')
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
            link('library-books', 'Books & Issue', '/library', I.BookOpen, 'library'),
            link('library-categories', 'Category', '/ops/library_category', I.Tag, 'library')
          ]
        }
      ]
    });
  }

  // —— Events / Alumni ——
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
            link('event-types', 'Event Type', '/ops/event_type', I.Tag, 'events'),
            link('events', 'Events', '/ops/event', I.Calendar, 'events')
          ]
        },
        {
          id: 'alumni-menu',
          title: 'Alumni',
          icon: I.GraduationCap,
          requiredModule: 'alumni',
          children: [link('alumni', 'Alumni List', '/ops/alumni', I.GraduationCap, 'alumni')]
        }
      ]
    });
  }

  // —— Communication ——
  if (schoolStaff) {
    groups.push({
      id: 'communication',
      title: 'Communication',
      items: [
        {
          id: 'comm-menu',
          title: 'SMS / Email / Mailbox',
          icon: I.Megaphone,
          requiredModule: 'communication',
          children: [
            link('sms', 'Send SMS', '/ops/sms_campaign', I.Megaphone, 'communication'),
            link('email', 'Send Email', '/ops/email_campaign', I.Mail, 'communication'),
            link('mailbox', 'Mailbox', '/ops/mailbox', I.MessageSquare, 'communication')
          ]
        }
      ]
    });
  }

  // —— Student Accounting / Fees ——
  if (feeStaff) {
    groups.push({
      id: 'fees',
      title: 'Student Accounting',
      items: [
        {
          id: 'fee-management',
          title: 'Fees',
          icon: I.DollarSign,
          requiredModule: 'fees',
          children: [
            link('fee-types', 'Fee Type', '/fees/types', I.Tag, 'fees'),
            link('fee-groups', 'Fee Group', '/ops/fee_group', I.List, 'fees'),
            link('fee-structures', 'Fee Structure', '/fees/structures', I.List, 'fees'),
            link('fee-allocation', 'Fees Allocation', '/ops/fee_allocation', I.ClipboardList, 'fees'),
            link('invoices', 'Fees Invoice', '/fees/invoices', I.Receipt, 'fees'),
            link('due-invoices', 'Due Invoice', '/fees/due', I.FileText, 'fees'),
            link('fine-setup', 'Fine Setup', '/fees/fines', I.Tag, 'fees'),
            link('fee-reminders', 'Fees Reminder', '/ops/fee_reminder', I.Mail, 'fees'),
            link('offline-payments', 'Offline Payments', '/ops/offline_payment', I.CreditCard, 'fees')
          ]
        }
      ]
    });
  }

  // —— Office Accounting ——
  if (schoolStaff || isAccountant) {
    groups.push({
      id: 'accounting',
      title: 'Office Accounting',
      items: [
        {
          id: 'acct-menu',
          title: 'Accounts',
          icon: I.Wallet,
          requiredModule: 'accounting',
          children: [
            link('acct-accounts', 'Accounts', '/ops/account', I.Wallet, 'accounting'),
            link('acct-heads', 'Voucher Head', '/ops/account_head', I.Wallet, 'accounting'),
            link('acct-vouchers', 'Deposit / Expense', '/ops/voucher', I.Receipt, 'accounting')
          ]
        }
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
            link('inv-cat', 'Category', '/ops/inventory_category', I.Tag, 'inventory'),
            link('inv-unit', 'Unit', '/ops/inventory_unit', I.Tag, 'inventory'),
            link('inv-prod', 'Product', '/ops/inventory_product', I.Package, 'inventory'),
            link('inv-store', 'Store', '/ops/inventory_store', I.Warehouse, 'inventory'),
            link('inv-sup', 'Supplier', '/ops/inventory_supplier', I.Users, 'inventory'),
            link('inv-pur', 'Purchase', '/ops/inventory_purchase', I.ClipboardList, 'inventory'),
            link('inv-sale', 'Sales', '/ops/inventory_sale', I.DollarSign, 'inventory'),
            link('inv-issue', 'Issue', '/ops/inventory_issue', I.Package, 'inventory')
          ]
        }
      ]
    });
  }

  // —— Reports ——
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
                link('reports-suite', 'Full Reports Suite', '/reports/suite', I.BarChart3, 'reports'),
                link('student-report', 'Student Report', '/reports/students', I.BarChart3, 'students'),
                link('student-extra', 'Credentials / Admission / Sibling', '/reports/student-extra', I.FileBarChart, 'students')
              ]
            },
            {
              id: 'fee-reports',
              title: 'Fees Reports',
              icon: I.DollarSign,
              requiredModule: 'fees',
              children: [
                link('fee-management-report', 'Fee Management', '/reports/fees', I.PieChart, 'fees'),
                link('receipt-reports', 'Receipts', '/reports/receipts', I.Receipt, 'fees')
              ]
            },
            {
              id: 'attendance-reports-group',
              title: 'Attendance Reports',
              icon: I.UserCheck,
              requiredModule: 'attendance',
              children: [
                link('attendance-reports', 'Attendance Reports', '/reports/attendance', I.UserCheck, 'attendance')
              ]
            },
            {
              id: 'exam-reports-group',
              title: 'Examination',
              icon: I.BookOpen,
              requiredModule: 'exams',
              children: [
                link('single-exam-report-card', 'Single Exam Report Card', '/exams/report-cards', I.FileText, 'exams'),
                link('tabulation-sheet', 'Tabulation Sheet', '/reports/exams?tab=tabulation', I.FileBarChart, 'exams'),
                link('multi-exam-progress-report', 'Multi Exam Progress Report', '/reports/exams?tab=progress', I.BarChart3, 'exams')
              ]
            },
            {
              id: 'ops-reports-group',
              title: 'Ops Reports',
              icon: I.FileBarChart,
              requiredModule: 'reports',
              children: [
                link('library-reports', 'Library', '/reports/suite?module=library', I.BookOpen, 'library'),
                link('hostel-reports', 'Hostel', '/reports/suite?module=hostel', I.Home, 'hostel'),
                link('transport-reports', 'Transport', '/reports/suite?module=transport', I.Bus, 'transport'),
                link('hr-reports', 'HR / Leave', '/reports/suite?module=hr', I.Users, 'hr'),
                link('inventory-reports', 'Inventory', '/reports/suite?module=inventory', I.Package, 'inventory'),
                link('accounting-reports', 'Accounting', '/reports/suite?module=accounting', I.Wallet, 'accounting')
              ]
            }
          ]
        }
      ]
    });
  }

  // —— Website ——
  if (schoolStaff) {
    groups.push({
      id: 'website',
      title: 'Website',
      items: [
        {
          id: 'website-menu',
          title: 'Frontend CMS',
          icon: I.Globe,
          requiredModule: 'website',
          children: [
            link('cms', 'Pages', '/ops/cms_page', I.Globe, 'website'),
            link('domain', 'Custom Domain', '/ops/domain_request', I.Globe, 'website'),
            link('translations', 'Translations', '/ops/translation', I.FileText, 'website')
          ]
        }
      ]
    });
  }

  if (isTeacher) {
    groups.push({
      id: 'teacher-dashboard',
      title: 'My Schedule',
      items: [
        link('my-timetable', 'My Timetable', '/academic/timetables', I.Clock, 'academic_management')
      ]
    });
  }

  if (isStudent || isParent) {
    groups.push({
      id: 'portal',
      title: 'My Portal',
      items: [
        link('my-portal', 'Dashboard', '/portal', I.Home),
        link('portal-online-exams', 'Online Exams', '/portal/online-exams', I.ClipboardList, 'exams')
      ]
    });
  }

  // Settings
  if (isSuperAdmin || isAdmin) {
    const settingsItems: SidebarItem[] = [];
    if (isSuperAdmin) {
      settingsItems.push(
        link('settings-main', 'Settings', '/settings', I.Settings),
        link('profile', 'Profile', '/settings/profile', I.User)
      );
    } else {
      settingsItems.push(
        link('school-settings', 'School Settings', '/settings', I.Settings),
        link('subscription', 'Subscription', '/settings/subscription', I.CreditCard),
        link('profile', 'Profile', '/settings/profile', I.User)
      );
    }
    groups.push({ id: 'settings', title: 'Settings', items: settingsItems });
  } else if (isBranchAdmin || isTeacher || isLibrarian || isReceptionist || isAccountant) {
    groups.push({
      id: 'settings',
      title: 'Settings',
      items: [link('profile', 'Profile', '/settings/profile', I.User)]
    });
  }

  return groups;
}
