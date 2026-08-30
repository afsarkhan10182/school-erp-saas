/**
 * Ops entity field defs for SchoolCrudPage.
 * `module` must match backend ENTITIES / modules.code so enable/disable works
 * from plan + school modules UI.
 */
export type FieldType = 'text' | 'textarea' | 'date' | 'number' | 'select' | 'checkbox';

export interface OpsField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  lookup?: 'classes' | 'students' | 'users' | 'staff' | `entity:${string}`;
}

export interface OpsEntity {
  title: string;
  description: string;
  module: string;
  fields: OpsField[];
  columns: Array<{ key: string; label: string }>;
  actions?: Array<{ id: string; label: string }>;
}

export const SCHOOL_OPS_ENTITIES: Record<string, OpsEntity> = {
  disable_reason: {
    title: 'Disable reasons',
    description: 'Reasons used when disabling a student',
    module: 'students',
    fields: [
      { key: 'title', label: 'Reason', type: 'text', required: true },
      { key: 'notes', label: 'Details', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Reason' },
      { key: 'notes', label: 'Details' }
    ]
  },
  admission_application: {
    title: 'Online admission',
    description: 'Applications from the public form',
    module: 'students',
    fields: [
      { key: 'first_name', label: 'First name', type: 'text', required: true },
      { key: 'last_name', label: 'Last name', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'class_id', label: 'Class', type: 'select', lookup: 'classes' },
      { key: 'date_of_birth', label: 'Date of birth', type: 'date' },
      { key: 'gender', label: 'Gender', type: 'select', options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' }
      ] }
    ],
    columns: [
      { key: 'title', label: 'Applicant' },
      { key: 'status', label: 'Status' },
      { key: 'date_value', label: 'Applied' }
    ],
    actions: [
      { id: 'approve', label: 'Approve' },
      { id: 'reject', label: 'Reject' }
    ]
  },
  fee_group: {
    title: 'Fee groups',
    description: 'Bundle fee types for allocation',
    module: 'fees',
    fields: [
      { key: 'title', label: 'Group name', type: 'text', required: true },
      { key: 'notes', label: 'Description', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Name' },
      { key: 'notes', label: 'Description' }
    ]
  },
  fee_allocation: {
    title: 'Fee allocation',
    description: 'Attach a fee group to students',
    module: 'fees',
    fields: [
      { key: 'title', label: 'Label', type: 'text', required: true },
      { key: 'student_id', label: 'Student', type: 'select', lookup: 'students', required: true },
      { key: 'notes', label: 'Fee group / notes', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Label' },
      { key: 'student', label: 'Student' },
      { key: 'notes', label: 'Group' }
    ]
  },
  fee_reminder: {
    title: 'Fee reminders',
    description: 'Overdue reminder log (SMS/email later from this queue)',
    module: 'fees',
    fields: [
      { key: 'title', label: 'Subject', type: 'text', required: true },
      { key: 'student_id', label: 'Student', type: 'select', lookup: 'students' },
      { key: 'notes', label: 'Message', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Subject' },
      { key: 'status', label: 'Status' },
      { key: 'date_value', label: 'Date' }
    ]
  },
  offline_payment: {
    title: 'Offline payments',
    description: 'Parent proof of payment for office approval',
    module: 'fees',
    fields: [
      { key: 'title', label: 'Reference', type: 'text', required: true },
      { key: 'student_id', label: 'Student', type: 'select', lookup: 'students', required: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'notes', label: 'Proof / notes', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Reference' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' }
    ],
    actions: [
      { id: 'approve', label: 'Approve' },
      { id: 'reject', label: 'Reject' }
    ]
  },
  staff_department: {
    title: 'Departments',
    description: 'Staff departments',
    module: 'hr',
    fields: [
      { key: 'title', label: 'Name', type: 'text', required: true },
      { key: 'notes', label: 'Description', type: 'textarea' }
    ],
    columns: [{ key: 'title', label: 'Name' }]
  },
  staff_designation: {
    title: 'Designations',
    description: 'Staff designations',
    module: 'hr',
    fields: [
      { key: 'title', label: 'Name', type: 'text', required: true },
      { key: 'notes', label: 'Description', type: 'textarea' }
    ],
    columns: [{ key: 'title', label: 'Name' }]
  },
  leave_category: {
    title: 'Leave categories',
    description: 'Leave types',
    module: 'hr',
    fields: [
      { key: 'title', label: 'Name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'select', required: true, options: [{ label: 'All staff', value: 'all' }, { label: 'Admin', value: 'admin' }, { label: 'Teacher', value: 'teacher' }, { label: 'Accountant', value: 'accountant' }, { label: 'Librarian', value: 'librarian' }, { label: 'Student', value: 'student' }, { label: 'Receptionist', value: 'receptionist' }] },
      { key: 'leave_days', label: 'Days', type: 'number', required: true }
    ],
    columns: [{ key: 'title', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'leave_days', label: 'Days' }]
  },
  leave_request: {
    title: 'Leave requests',
    description: 'Staff leave applications',
    module: 'hr',
    fields: [
      { key: 'title', label: 'Subject', type: 'text', required: true },
      { key: 'category_id', label: 'Leave category', type: 'select', lookup: 'entity:leave_category', required: true },
      { key: 'user_id', label: 'Staff', type: 'select', lookup: 'staff', required: true },
      { key: 'date_value', label: 'Date of start', type: 'date', required: true },
      { key: 'end_date', label: 'Date of end', type: 'date', required: true },
      { key: 'notes', label: 'Reason', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Subject' },
      { key: 'category_id_label', label: 'Category' },
      { key: 'user_id_label', label: 'Applicant' },
      { key: 'status', label: 'Status' },
      { key: 'date_value', label: 'Start' },
      { key: 'end_date', label: 'End' }
    ],
    actions: [
      { id: 'approve', label: 'Approve' },
      { id: 'reject', label: 'Reject' }
    ]
  },
  salary_template: {
    title: 'Salary templates',
    description: 'Payroll templates',
    module: 'hr',
    fields: [
      { key: 'title', label: 'Template', type: 'text', required: true },
      { key: 'amount', label: 'Basic salary', type: 'number', required: true },
      { key: 'overtime_rate', label: 'Overtime rate per hour', type: 'number' },
      { key: 'allowance_name', label: 'Allowance name', type: 'text' },
      { key: 'allowance_amount', label: 'Allowance amount', type: 'number' },
      { key: 'deduction_name', label: 'Deduction name', type: 'text' },
      { key: 'deduction_amount', label: 'Deduction amount', type: 'number' }
    ],
    columns: [
      { key: 'title', label: 'Template' },
      { key: 'amount', label: 'Basic' }, { key: 'overtime_rate', label: 'Overtime / hour' }
    ]
  },
  salary_payment: {
    title: 'Salary payments',
    description: 'Record salary disbursement',
    module: 'hr',
    fields: [
      { key: 'title', label: 'Payroll reference', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'select', required: true, options: [{ label: 'Admin', value: 'admin' }, { label: 'Teacher', value: 'teacher' }, { label: 'Accountant', value: 'accountant' }, { label: 'Librarian', value: 'librarian' }, { label: 'Receptionist', value: 'receptionist' }] },
      { key: 'user_id', label: 'Employee', type: 'select', lookup: 'staff', required: true },
      { key: 'template_id', label: 'Salary template', type: 'select', lookup: 'entity:salary_template' },
      { key: 'month_year', label: 'Month', type: 'text', required: true },
      { key: 'amount', label: 'Net salary', type: 'number', required: true },
      { key: 'payment_method', label: 'Payment method', type: 'select', options: [{ label: 'Cash', value: 'cash' }, { label: 'Cheque', value: 'cheque' }, { label: 'Bank transfer', value: 'bank_transfer' }, { label: 'UPI', value: 'upi' }] },
      { key: 'date_value', label: 'Payment date', type: 'date' },
      { key: 'notes', label: 'Remarks', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Reference' },
      { key: 'user_id_label', label: 'Employee' },
      { key: 'month_year', label: 'Month' },
      { key: 'amount', label: 'Net salary' },
      { key: 'date_value', label: 'Paid on' }
    ]
  },
  salary_assignment: {
    title: 'Salary assignments', description: 'Assign a salary template to an employee', module: 'hr',
    fields: [{ key: 'title', label: 'Assignment reference', type: 'text', required: true }, { key: 'user_id', label: 'Employee', type: 'select', lookup: 'staff', required: true }, { key: 'template_id', label: 'Salary template', type: 'select', lookup: 'entity:salary_template', required: true }, { key: 'date_value', label: 'Effective from', type: 'date', required: true }],
    columns: [{ key: 'title', label: 'Reference' }, { key: 'template_id_label', label: 'Template' }, { key: 'date_value', label: 'Effective from' }]
  },
  staff_award: {
    title: 'Staff awards',
    description: 'Awards and recognition',
    module: 'hr',
    fields: [
      { key: 'title', label: 'Award', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'select', required: true, options: [{ label: 'Admin', value: 'admin' }, { label: 'Teacher', value: 'teacher' }, { label: 'Accountant', value: 'accountant' }, { label: 'Librarian', value: 'librarian' }, { label: 'Student', value: 'student' }, { label: 'Receptionist', value: 'receptionist' }] },
      { key: 'class_id', label: 'Class', type: 'select', lookup: 'classes' },
      { key: 'user_id', label: 'Winner', type: 'select', lookup: 'users', required: true },
      { key: 'gift_item', label: 'Gift item', type: 'text', required: true },
      { key: 'amount', label: 'Cash prize', type: 'number' },
      { key: 'notes', label: 'Award reason', type: 'textarea', required: true },
      { key: 'date_value', label: 'Given date', type: 'date', required: true }
    ],
    columns: [
      { key: 'title', label: 'Award' },
      { key: 'user_id_label', label: 'Winner' },
      { key: 'role', label: 'Role' },
      { key: 'gift_item', label: 'Gift' }, { key: 'amount', label: 'Cash prize' }, { key: 'date_value', label: 'Date' }
    ]
  },
  advance_salary: {
    title: 'Advance salary',
    description: 'Employee advance salary applications',
    module: 'hr',
    fields: [
      { key: 'title', label: 'Application reference', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'select', required: true, options: [{ label: 'Admin', value: 'admin' }, { label: 'Teacher', value: 'teacher' }, { label: 'Accountant', value: 'accountant' }, { label: 'Librarian', value: 'librarian' }, { label: 'Receptionist', value: 'receptionist' }] },
      { key: 'user_id', label: 'Applicant', type: 'select', lookup: 'staff', required: true },
      { key: 'month_year', label: 'Deduct month', type: 'text', required: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'notes', label: 'Reason', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Reference' },
      { key: 'user_id_label', label: 'Applicant' },
      { key: 'role', label: 'Role' },
      { key: 'month_year', label: 'Deduct month' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' }
    ],
    actions: [
      { id: 'approve', label: 'Approve' },
      { id: 'reject', label: 'Reject' }
    ]
  },
  exam_seating: {
    title: 'Exam seating',
    description: 'Hall seat assignment',
    module: 'exams',
    fields: [
      { key: 'title', label: 'Label', type: 'text', required: true },
      { key: 'student_id', label: 'Student', type: 'select', lookup: 'students' },
      { key: 'notes', label: 'Hall / seat', type: 'text' },
      { key: 'date_value', label: 'Exam date', type: 'date' }
    ],
    columns: [
      { key: 'title', label: 'Label' },
      { key: 'notes', label: 'Seat' },
      { key: 'date_value', label: 'Date' }
    ]
  },
  marksheet_template: {
    title: 'Marksheet templates',
    description: 'Printed marksheet layout notes',
    module: 'exams',
    fields: [
      { key: 'title', label: 'Template name', type: 'text', required: true },
      { key: 'notes', label: 'Layout notes', type: 'textarea' }
    ],
    columns: [{ key: 'title', label: 'Name' }]
  },
  online_exam: {
    title: 'Online exams',
    description: 'Computer-based exams',
    module: 'exams',
    fields: [
      { key: 'title', label: 'Exam name', type: 'text', required: true },
      { key: 'class_id', label: 'Class', type: 'select', lookup: 'classes' },
      { key: 'date_value', label: 'Date', type: 'date' },
      { key: 'notes', label: 'Instructions', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Exam' },
      { key: 'date_value', label: 'Date' },
      { key: 'status', label: 'Status' }
    ]
  },
  exam_question: {
    title: 'Question bank',
    description: 'Questions for online exams',
    module: 'exams',
    fields: [
      { key: 'title', label: 'Question', type: 'textarea', required: true },
      { key: 'notes', label: 'Options / answer', type: 'textarea' }
    ],
    columns: [{ key: 'title', label: 'Question' }]
  },
  attachment: {
    title: 'Study material',
    description: 'Attachments by class',
    module: 'attachments',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'class_id', label: 'Class', type: 'select', lookup: 'classes' },
      { key: 'notes', label: 'Link or notes', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'class', label: 'Class' }
    ]
  },
  live_class: {
    title: 'Live classes',
    description: 'Rooms and join links',
    module: 'liveclass',
    fields: [
      { key: 'title', label: 'Room name', type: 'text', required: true },
      { key: 'class_id', label: 'Class', type: 'select', lookup: 'classes' },
      { key: 'notes', label: 'Join link', type: 'text' },
      { key: 'date_value', label: 'Date', type: 'date' }
    ],
    columns: [
      { key: 'title', label: 'Room' },
      { key: 'notes', label: 'Link' },
      { key: 'date_value', label: 'Date' }
    ]
  },
  transport_route: {
    title: 'Transport routes',
    description: 'Bus routes',
    module: 'transport',
    fields: [
      { key: 'title', label: 'Route name', type: 'text', required: true },
      { key: 'start_place', label: 'Start place', type: 'text', required: true },
      { key: 'stop_place', label: 'Stop place', type: 'text', required: true },
      { key: 'notes', label: 'Remarks', type: 'textarea' }
    ],
    columns: [{ key: 'title', label: 'Route' }, { key: 'start_place', label: 'Start' }, { key: 'stop_place', label: 'Destination' }]
  },
  transport_vehicle: {
    title: 'Vehicles',
    description: 'Transport vehicles',
    module: 'transport',
    fields: [
      { key: 'title', label: 'Vehicle number', type: 'text', required: true },
      { key: 'capacity', label: 'Capacity', type: 'number', required: true },
      { key: 'insurance_renewal', label: 'Insurance renewal date', type: 'date' },
      { key: 'driver_name', label: 'Driver name', type: 'text', required: true },
      { key: 'driver_phone', label: 'Driver phone', type: 'text', required: true },
      { key: 'driver_license', label: 'Driver licence', type: 'text', required: true }
    ],
    columns: [
      { key: 'title', label: 'Vehicle' },
      { key: 'capacity', label: 'Capacity' }, { key: 'driver_name', label: 'Driver' }
    ]
  },
  transport_stop: {
    title: 'Stoppages',
    description: 'Route stops',
    module: 'transport',
    fields: [
      { key: 'title', label: 'Stoppage', type: 'text', required: true },
      { key: 'stop_time', label: 'Stop time', type: 'text', required: true },
      { key: 'amount', label: 'Route fare', type: 'number', required: true }
    ],
    columns: [{ key: 'title', label: 'Stop' }, { key: 'stop_time', label: 'Time' }, { key: 'amount', label: 'Fare' }]
  },
  transport_assignment: {
    title: 'Transport assignment',
    description: 'Assign vehicles to transport routes',
    module: 'transport',
    fields: [
      { key: 'title', label: 'Assignment name', type: 'text', required: true },
      { key: 'route_id', label: 'Transport route', type: 'select', lookup: 'entity:transport_route', required: true },
      { key: 'vehicle_id', label: 'Vehicle', type: 'select', lookup: 'entity:transport_vehicle', required: true }
    ],
    columns: [
      { key: 'title', label: 'Assignment' }, { key: 'route_id_label', label: 'Route' }, { key: 'vehicle_id_label', label: 'Vehicle' }
    ]
  },
  transport_fee_setup: {
    title: 'Transport fees setup',
    description: 'Monthly due dates and late-fee rules',
    module: 'transport',
    fields: [
      { key: 'title', label: 'Month', type: 'select', required: true, options: ['January','February','March','April','May','June','July','August','September','October','November','December'].map(value => ({ label: value, value })) },
      { key: 'date_value', label: 'Due date', type: 'date', required: true },
      { key: 'fine_type', label: 'Fine type', type: 'select', options: [{ label: 'No fine', value: 'none' }, { label: 'Fixed amount', value: 'fixed' }, { label: 'Percentage', value: 'percentage' }] },
      { key: 'amount', label: 'Fine value', type: 'number' },
      { key: 'fee_frequency', label: 'Late-fee frequency', type: 'select', options: [{ label: 'Fixed', value: 'fixed' }, { label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }, { label: 'Monthly', value: 'monthly' }, { label: 'Annually', value: 'annually' }] },
      { key: 'apply_for_all_months', label: 'Apply this rule to all months', type: 'checkbox' }
    ],
    columns: [{ key: 'title', label: 'Month' }, { key: 'date_value', label: 'Due date' }, { key: 'fine_type', label: 'Fine type' }, { key: 'amount', label: 'Fine value' }]
  },
  hostel: {
    title: 'Hostels',
    description: 'Hostel buildings',
    module: 'hostel',
    fields: [
      { key: 'title', label: 'Hostel name', type: 'text', required: true },
      { key: 'category_id', label: 'Category', type: 'select', lookup: 'entity:hostel_category', required: true },
      { key: 'watchman_name', label: 'Watchman name', type: 'text', required: true },
      { key: 'hostel_address', label: 'Hostel address', type: 'textarea' },
      { key: 'notes', label: 'Remarks', type: 'textarea' }
    ],
    columns: [{ key: 'title', label: 'Name' }, { key: 'category_id_label', label: 'Category' }, { key: 'watchman_name', label: 'Watchman' }]
  },
  hostel_category: {
    title: 'Hostel categories', description: 'Categories for hostels and rooms', module: 'hostel',
    fields: [{ key: 'title', label: 'Name', type: 'text', required: true }, { key: 'category_for', label: 'Category for', type: 'select', required: true, options: [{ label: 'Boys', value: 'boys' }, { label: 'Girls', value: 'girls' }, { label: 'Both', value: 'both' }] }, { key: 'notes', label: 'Remarks', type: 'textarea' }],
    columns: [{ key: 'title', label: 'Name' }, { key: 'category_for', label: 'Type' }, { key: 'notes', label: 'Remarks' }]
  },
  hostel_room: {
    title: 'Hostel rooms',
    description: 'Rooms and capacity',
    module: 'hostel',
    fields: [
      { key: 'title', label: 'Room', type: 'text', required: true },
      { key: 'hostel_id', label: 'Hostel', type: 'select', lookup: 'entity:hostel', required: true },
      { key: 'category_id', label: 'Category', type: 'select', lookup: 'entity:hostel_category', required: true },
      { key: 'number_of_beds', label: 'Number of beds', type: 'number', required: true },
      { key: 'amount', label: 'Cost per bed', type: 'number', required: true },
      { key: 'notes', label: 'Remarks', type: 'textarea' }
    ],
    columns: [{ key: 'title', label: 'Room' }, { key: 'hostel_id_label', label: 'Hostel' }, { key: 'number_of_beds', label: 'Beds' }, { key: 'amount', label: 'Cost / bed' }]
  },
  hostel_allocation: {
    title: 'Hostel allocation',
    description: 'Assign rooms to students',
    module: 'hostel',
    fields: [
      { key: 'title', label: 'Allocation reference', type: 'text', required: true },
      { key: 'student_id', label: 'Student', type: 'select', lookup: 'students', required: true },
      { key: 'hostel_id', label: 'Hostel', type: 'select', lookup: 'entity:hostel', required: true },
      { key: 'room_id', label: 'Room', type: 'select', lookup: 'entity:hostel_room', required: true }
    ],
    columns: [
      { key: 'title', label: 'Label' },
      { key: 'hostel_id_label', label: 'Hostel' }, { key: 'room_id_label', label: 'Room' }
    ]
  },
  enquiry: {
    title: 'Admission enquiry',
    description: 'Leads and follow-up',
    module: 'reception',
    fields: [
      { key: 'title', label: 'Name', type: 'text', required: true },
      { key: 'reference_no', label: 'Phone', type: 'text' },
      { key: 'class_id', label: 'Interested class', type: 'select', lookup: 'classes' },
      { key: 'notes', label: 'Follow up', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Name' },
      { key: 'reference_no', label: 'Phone' },
      { key: 'status', label: 'Status' }
    ]
  },
  postal: {
    title: 'Postal record',
    description: 'Inward and outward post',
    module: 'reception',
    fields: [
      { key: 'title', label: 'Subject', type: 'text', required: true },
      { key: 'status', label: 'Direction', type: 'select', options: [
        { label: 'Inward', value: 'inward' },
        { label: 'Outward', value: 'outward' }
      ] },
      { key: 'date_value', label: 'Date', type: 'date' },
      { key: 'notes', label: 'Details', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Subject' },
      { key: 'status', label: 'Direction' },
      { key: 'date_value', label: 'Date' }
    ]
  },
  call_log: {
    title: 'Call log',
    description: 'Phone register',
    module: 'reception',
    fields: [
      { key: 'title', label: 'Caller / number', type: 'text', required: true },
      { key: 'date_value', label: 'Date', type: 'date' },
      { key: 'notes', label: 'Purpose', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Caller' },
      { key: 'date_value', label: 'Date' }
    ]
  },
  complaint: {
    title: 'Complaints',
    description: 'Complaint register',
    module: 'reception',
    fields: [
      { key: 'title', label: 'Subject', type: 'text', required: true },
      { key: 'notes', label: 'Details', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: [
        { label: 'Open', value: 'open' },
        { label: 'Closed', value: 'closed' }
      ] }
    ],
    columns: [
      { key: 'title', label: 'Subject' },
      { key: 'status', label: 'Status' }
    ]
  },
  visitor: {
    title: 'Visitors',
    description: 'Visitor register',
    module: 'reception',
    fields: [
      { key: 'title', label: 'Visitor name', type: 'text', required: true },
      { key: 'reference_no', label: 'Phone', type: 'text' },
      { key: 'notes', label: 'Purpose / person to meet', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Name' },
      { key: 'reference_no', label: 'Phone' },
      { key: 'status', label: 'Status' }
    ],
    actions: [{ id: 'checkout', label: 'Mark exit' }]
  },
  account: {
    title: 'Accounts',
    description: 'Office accounting cash and bank accounts',
    module: 'accounting',
    fields: [
      { key: 'title', label: 'Account name', type: 'text', required: true },
      { key: 'reference_no', label: 'Account number', type: 'text' },
      { key: 'opening_balance', label: 'Opening balance', type: 'number' },
      { key: 'notes', label: 'Description', type: 'textarea' }
    ],
    columns: [{ key: 'title', label: 'Account name' }, { key: 'reference_no', label: 'Account number' }, { key: 'opening_balance', label: 'Opening balance' }]
  },
  account_head: {
    title: 'Voucher heads',
    description: 'Income and expense voucher heads',
    module: 'accounting',
    fields: [
      { key: 'title', label: 'Name', type: 'text', required: true },
      { key: 'voucher_type', label: 'Type', type: 'select', required: true, options: [{ label: 'Income', value: 'income' }, { label: 'Expense', value: 'expense' }] }
    ],
    columns: [{ key: 'title', label: 'Name' }, { key: 'voucher_type', label: 'Type' }]
  },
  voucher: {
    title: 'Vouchers',
    description: 'Deposit and expense vouchers',
    module: 'accounting',
    fields: [
      { key: 'title', label: 'Narration', type: 'text', required: true },
      { key: 'account_id', label: 'Account', type: 'select', lookup: 'entity:account', required: true },
      { key: 'voucher_type', label: 'Voucher type', type: 'select', required: true, options: [{ label: 'Deposit', value: 'deposit' }, { label: 'Expense', value: 'expense' }] },
      { key: 'voucher_head_id', label: 'Voucher head', type: 'select', lookup: 'entity:account_head', required: true },
      { key: 'reference_no', label: 'Ref no', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'date_value', label: 'Date', type: 'date', required: true },
      { key: 'pay_via', label: 'Pay via', type: 'select', options: [{ label: 'Cash', value: 'cash' }, { label: 'Cheque', value: 'cheque' }, { label: 'Bank transfer', value: 'bank_transfer' }, { label: 'UPI', value: 'upi' }] },
      { key: 'notes', label: 'Description', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Narration' },
      { key: 'account_id_label', label: 'Account' },
      { key: 'voucher_type', label: 'Type' },
      { key: 'voucher_head_id_label', label: 'Head' },
      { key: 'reference_no', label: 'Ref no' },
      { key: 'amount', label: 'Amount' },
      { key: 'date_value', label: 'Date' }
    ]
  },
  inventory_product: {
    title: 'Products',
    description: 'Inventory items',
    module: 'inventory',
    fields: [
      { key: 'title', label: 'Product', type: 'text', required: true },
      { key: 'reference_no', label: 'Product code', type: 'text', required: true },
      { key: 'category_id', label: 'Product category', type: 'select', lookup: 'entity:inventory_category', required: true },
      { key: 'purchase_unit_id', label: 'Purchase unit', type: 'select', lookup: 'entity:inventory_unit', required: true },
      { key: 'sales_unit_id', label: 'Sales unit', type: 'select', lookup: 'entity:inventory_unit', required: true },
      { key: 'unit_ratio', label: 'Unit ratio', type: 'number', required: true },
      { key: 'purchase_price', label: 'Purchase price', type: 'number', required: true },
      { key: 'amount', label: 'Sales price', type: 'number', required: true },
      { key: 'notes', label: 'Remarks', type: 'text' }
    ],
    columns: [
      { key: 'title', label: 'Product' },
      { key: 'reference_no', label: 'Code' },
      { key: 'category_id_label', label: 'Category' },
      { key: 'purchase_price', label: 'Purchase price' },
      { key: 'amount', label: 'Sales price' }
    ]
  },
  inventory_category: {
    title: 'Product categories',
    description: 'Inventory categories',
    module: 'inventory',
    fields: [{ key: 'title', label: 'Category', type: 'text', required: true }],
    columns: [{ key: 'title', label: 'Category' }]
  },
  inventory_unit: {
    title: 'Units',
    description: 'Inventory product units',
    module: 'inventory',
    fields: [{ key: 'title', label: 'Unit name', type: 'text', required: true }],
    columns: [{ key: 'title', label: 'Unit name' }]
  },
  inventory_store: {
    title: 'Stores',
    description: 'Warehouses',
    module: 'inventory',
    fields: [
      { key: 'title', label: 'Store', type: 'text', required: true },
      { key: 'reference_no', label: 'Store code', type: 'text', required: true },
      { key: 'mobile_no', label: 'Mobile no', type: 'text', required: true },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'notes', label: 'Description', type: 'text' }
    ],
    columns: [{ key: 'title', label: 'Store' }, { key: 'reference_no', label: 'Store code' }, { key: 'mobile_no', label: 'Mobile no' }]
  },
  inventory_supplier: {
    title: 'Suppliers',
    description: 'Vendors',
    module: 'inventory',
    fields: [
      { key: 'title', label: 'Supplier', type: 'text', required: true },
      { key: 'reference_no', label: 'Contact number', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'company_name', label: 'Company name', type: 'text' },
      { key: 'product_list', label: 'Product list', type: 'text' },
      { key: 'notes', label: 'Address', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Supplier' },
      { key: 'reference_no', label: 'Contact number' },
      { key: 'email', label: 'Email' },
      { key: 'company_name', label: 'Company' }
    ]
  },
  inventory_purchase: {
    title: 'Purchases',
    description: 'Stock inward',
    module: 'inventory',
    fields: [
      { key: 'title', label: 'Bill no', type: 'text', required: true },
      { key: 'supplier_id', label: 'Supplier', type: 'select', lookup: 'entity:inventory_supplier', required: true },
      { key: 'store_id', label: 'Store', type: 'select', lookup: 'entity:inventory_store', required: true },
      { key: 'purchase_status', label: 'Purchase status', type: 'select', required: true, options: [{ label: 'Ordered', value: 'ordered' }, { label: 'Received', value: 'received' }, { label: 'Pending', value: 'pending' }] },
      { key: 'payment_status', label: 'Payment status', type: 'select', required: true, options: [{ label: 'Paid', value: 'paid' }, { label: 'Unpaid', value: 'unpaid' }, { label: 'Partial', value: 'partial' }] },
      { key: 'date_value', label: 'Purchase date', type: 'date', required: true },
      { key: 'product_id', label: 'Product', type: 'select', lookup: 'entity:inventory_product', required: true },
      { key: 'unit_price', label: 'Unit price', type: 'number', required: true },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true },
      { key: 'discount', label: 'Discount', type: 'number' },
      { key: 'amount', label: 'Net payable', type: 'number', required: true },
      { key: 'paid_amount', label: 'Paid', type: 'number' },
      { key: 'notes', label: 'Remarks', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Bill' },
      { key: 'supplier_id_label', label: 'Supplier' },
      { key: 'store_id_label', label: 'Store' },
      { key: 'payment_status', label: 'Payment' },
      { key: 'amount', label: 'Net payable' }
    ]
  },
  inventory_sale: {
    title: 'Sales',
    description: 'Stock sales',
    module: 'inventory',
    fields: [
      { key: 'title', label: 'Bill no', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'select', required: true, options: [{ label: 'Student', value: 'student' }, { label: 'Teacher', value: 'teacher' }, { label: 'Accountant', value: 'accountant' }, { label: 'Parent', value: 'parent' }, { label: 'Other', value: 'other' }] },
      { key: 'user_id', label: 'Sale to', type: 'select', lookup: 'users' },
      { key: 'payment_status', label: 'Payment status', type: 'select', required: true, options: [{ label: 'Paid', value: 'paid' }, { label: 'Unpaid', value: 'unpaid' }, { label: 'Partial', value: 'partial' }] },
      { key: 'date_value', label: 'Date', type: 'date', required: true },
      { key: 'product_id', label: 'Product', type: 'select', lookup: 'entity:inventory_product', required: true },
      { key: 'unit_price', label: 'Unit price', type: 'number', required: true },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true },
      { key: 'discount', label: 'Discount', type: 'number' },
      { key: 'amount', label: 'Net payable', type: 'number', required: true },
      { key: 'paid_amount', label: 'Paid', type: 'number' },
      { key: 'notes', label: 'Payment remarks', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Invoice' },
      { key: 'user_id_label', label: 'Sale to' },
      { key: 'payment_status', label: 'Payment' },
      { key: 'amount', label: 'Net payable' }
    ]
  },
  inventory_issue: {
    title: 'Stock issue',
    description: 'Issue items internally',
    module: 'inventory',
    fields: [
      { key: 'title', label: 'Issue reference', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'select', required: true, options: [{ label: 'Student', value: 'student' }, { label: 'Teacher', value: 'teacher' }, { label: 'Accountant', value: 'accountant' }, { label: 'Parent', value: 'parent' }, { label: 'Other', value: 'other' }] },
      { key: 'class_id', label: 'Class', type: 'select', lookup: 'classes' },
      { key: 'user_id', label: 'Issue to', type: 'select', lookup: 'users' },
      { key: 'date_value', label: 'Date of issue', type: 'date', required: true },
      { key: 'due_date', label: 'Due date', type: 'date', required: true },
      { key: 'product_id', label: 'Product', type: 'select', lookup: 'entity:inventory_product', required: true },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true },
      { key: 'notes', label: 'Remark', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Issue' },
      { key: 'user_id_label', label: 'Issue to' },
      { key: 'product_id_label', label: 'Product' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'date_value', label: 'Date' }
    ]
  },
  event_type: {
    title: 'Event types',
    description: 'Event categories',
    module: 'events',
    fields: [{ key: 'title', label: 'Type', type: 'text', required: true }],
    columns: [{ key: 'title', label: 'Type' }]
  },
  event: {
    title: 'Events',
    description: 'School events',
    module: 'events',
    fields: [
      { key: 'title', label: 'Event', type: 'text', required: true },
      { key: 'date_value', label: 'Date', type: 'date' },
      { key: 'notes', label: 'Details', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Event' },
      { key: 'date_value', label: 'Date' }
    ]
  },
  alumni: {
    title: 'Alumni',
    description: 'Former students',
    module: 'alumni',
    fields: [
      { key: 'title', label: 'Name', type: 'text', required: true },
      { key: 'reference_no', label: 'Batch / year', type: 'text' },
      { key: 'notes', label: 'Contact', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Name' },
      { key: 'reference_no', label: 'Batch' }
    ]
  },
  sms_campaign: {
    title: 'SMS campaigns',
    description: 'Bulk SMS queue',
    module: 'communication',
    fields: [
      { key: 'title', label: 'Campaign', type: 'text', required: true },
      { key: 'notes', label: 'Message', type: 'textarea', required: true }
    ],
    columns: [
      { key: 'title', label: 'Campaign' },
      { key: 'status', label: 'Status' }
    ]
  },
  email_campaign: {
    title: 'Email campaigns',
    description: 'Bulk email queue',
    module: 'communication',
    fields: [
      { key: 'title', label: 'Subject', type: 'text', required: true },
      { key: 'notes', label: 'Body', type: 'textarea', required: true }
    ],
    columns: [
      { key: 'title', label: 'Subject' },
      { key: 'status', label: 'Status' }
    ]
  },
  mailbox: {
    title: 'Mailbox',
    description: 'Internal messages',
    module: 'communication',
    fields: [
      { key: 'title', label: 'Subject', type: 'text', required: true },
      { key: 'user_id', label: 'To staff', type: 'select', lookup: 'users' },
      { key: 'notes', label: 'Message', type: 'textarea', required: true }
    ],
    columns: [
      { key: 'title', label: 'Subject' },
      { key: 'date_value', label: 'Date' }
    ]
  },
  cms_page: {
    title: 'Website pages',
    description: 'Public site content',
    module: 'website',
    fields: [
      { key: 'title', label: 'Page title', type: 'text', required: true },
      { key: 'notes', label: 'Content', type: 'textarea' }
    ],
    columns: [{ key: 'title', label: 'Page' }]
  },
  custom_field: {
    title: 'Custom fields',
    description: 'Configure extra fields and validation for student and parent forms',
    module: 'students',
    fields: [
      { key: 'title', label: 'Field name', type: 'text', required: true },
      { key: 'applies_to', label: 'Applies to', type: 'select', required: true, options: [
        { label: 'Student', value: 'student' },
        { label: 'Parent / guardian', value: 'parent' }
      ] },
      { key: 'field_type', label: 'Field type', type: 'select', required: true, options: [
        { label: 'Text', value: 'text' },
        { label: 'Long text', value: 'textarea' },
        { label: 'Number', value: 'number' },
        { label: 'Date', value: 'date' },
        { label: 'Dropdown', value: 'select' },
        { label: 'Checkbox', value: 'checkbox' }
      ] },
      { key: 'notes', label: 'Dropdown options (one per line)', type: 'textarea' },
      { key: 'sort_order', label: 'Display order', type: 'number' },
      { key: 'is_required', label: 'Required field', type: 'checkbox' },
      { key: 'show_on_admission', label: 'Show on student admission', type: 'checkbox' },
      { key: 'show_on_public_admission', label: 'Show on online admission', type: 'checkbox' },
      { key: 'is_active', label: 'Active', type: 'checkbox' }
    ],
    columns: [
      { key: 'title', label: 'Field' },
      { key: 'applies_to', label: 'Form' },
      { key: 'field_type', label: 'Type' },
      { key: 'is_required', label: 'Required' },
      { key: 'show_on_admission', label: 'Student form' },
      { key: 'show_on_public_admission', label: 'Online form' }
    ]
  },
  translation: {
    title: 'Translations',
    description: 'UI language strings',
    module: 'website',
    fields: [
      { key: 'title', label: 'Key', type: 'text', required: true },
      { key: 'notes', label: 'Value', type: 'textarea' }
    ],
    columns: [{ key: 'title', label: 'Key' }]
  },
  domain_request: {
    title: 'Custom domain',
    description: 'School domain requests',
    module: 'website',
    fields: [
      { key: 'title', label: 'Domain', type: 'text', required: true },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Domain' },
      { key: 'status', label: 'Status' }
    ]
  },
  subject_attendance: {
    title: 'Subject-wise attendance',
    description: 'Period attendance sessions',
    module: 'attendance',
    fields: [
      { key: 'title', label: 'Label', type: 'text', required: true },
      { key: 'class_id', label: 'Class', type: 'select', lookup: 'classes', required: true },
      { key: 'date_value', label: 'Date', type: 'date', required: true },
      { key: 'notes', label: 'Subject / period / present count', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Label' },
      { key: 'date_value', label: 'Date' }
    ]
  },
  staff_attendance: {
    title: 'Staff attendance',
    description: 'Employee present/absent',
    module: 'attendance',
    fields: [
      { key: 'title', label: 'Label', type: 'text', required: true },
      { key: 'user_id', label: 'Staff', type: 'select', lookup: 'users', required: true },
      { key: 'date_value', label: 'Date', type: 'date', required: true },
      { key: 'status', label: 'Status', type: 'select', options: [
        { label: 'Present', value: 'present' },
        { label: 'Absent', value: 'absent' },
        { label: 'Leave', value: 'leave' }
      ] }
    ],
    columns: [
      { key: 'title', label: 'Label' },
      { key: 'status', label: 'Status' },
      { key: 'date_value', label: 'Date' }
    ]
  },
  exam_attendance: {
    title: 'Exam attendance',
    description: 'Present in the exam hall',
    module: 'attendance',
    fields: [
      { key: 'title', label: 'Label', type: 'text', required: true },
      { key: 'student_id', label: 'Student', type: 'select', lookup: 'students', required: true },
      { key: 'date_value', label: 'Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: [
        { label: 'Present', value: 'present' },
        { label: 'Absent', value: 'absent' }
      ] }
    ],
    columns: [
      { key: 'title', label: 'Label' },
      { key: 'status', label: 'Status' }
    ]
  },
  homework_evaluation: {
    title: 'Homework evaluation',
    description: 'Marks / remarks on submitted homework',
    module: 'homework',
    fields: [
      { key: 'title', label: 'Homework', type: 'text', required: true },
      { key: 'student_id', label: 'Student', type: 'select', lookup: 'students', required: true },
      { key: 'notes', label: 'Remarks / marks', type: 'textarea' }
    ],
    columns: [
      { key: 'title', label: 'Homework' },
      { key: 'notes', label: 'Remarks' }
    ]
  },
  library_category: {
    title: 'Book categories',
    description: 'Library categories',
    module: 'library',
    fields: [{ key: 'title', label: 'Category', type: 'text', required: true }],
    columns: [{ key: 'title', label: 'Category' }]
  }
};
