require('module-alias/register');
require('dotenv').config();
const { randomUUID } = require('crypto');

const {
  sequelize,
  School,
  Branch,
  User,
  SubscriptionPlan,
  Module,
  PlanModule,
  AcademicYear,
  Class,
  Section,
  Subject,
  Student,
  Parent,
  StudentParent,
  Exam,
  Homework,
  LibraryBook,
  Term,
  ExamResult,
  FeeType,
  FeeStructure,
  FeeInvoice,
  FeePayment,
  AttendanceSession,
  AttendanceRecord,
  Timetable,
  TimetableSlot,
  TransportRoute,
  Vehicle,
  StudentTransport,
  Hostel,
  RoomType,
  HostelRoom,
  HostelAllocation,
  ItemCategory,
  InventoryItem,
  Store,
  Supplier,
  AccountCategory,
  SchoolTransaction,
  OnlineExam,
  OnlineExamQuestion,
  CertificateTemplate,
  ExamSchedule,
  ExamPosition,
  MarkDistribution
  ,AcademicCalendar, CardTemplate, ClassTeacher, ExamHall, GradingSystem, GradeScale,
  LibraryIssue, StudentCategory, Stream, SubjectTeacher,
  ClassSubjectAssignment, FeeFine, Alumni, AlumniEvent
  ,DynamicEntityRecord, ExamSeating, OnlineExamAttempt, StudentPromotion, ItemIssue, VehicleRoute, ExamReport
} = require('../src/models');

const DEMO_CODE = 'DEMOERP';
const PASSWORD = 'Demo@12345';
const accounts = [
  ['demo.admin@schoolerp.local', 'Demo', 'Admin', 'admin'],
  ['demo.branch@schoolerp.local', 'Demo', 'Branch Admin', 'branch_admin'],
  ['demo.teacher@schoolerp.local', 'Demo', 'Teacher', 'teacher'],
  ['demo.reception@schoolerp.local', 'Demo', 'Receptionist', 'receptionist'],
  ['demo.accountant@schoolerp.local', 'Demo', 'Accountant', 'accountant'],
  ['demo.librarian@schoolerp.local', 'Demo', 'Librarian', 'librarian'],
  ['demo.parent@schoolerp.local', 'Demo', 'Parent', 'parent'],
  ['demo.student@schoolerp.local', 'Demo', 'Student', 'student']
];

async function run() {
  const transaction = await sequelize.transaction();
  try {
    const existingAccounts = await User.findAll({
      where: { email: accounts.map(([email]) => email) },
      transaction
    });
    const existingDemo = await School.findOne({ where: { code: DEMO_CODE }, transaction });
    for (const account of existingAccounts) {
      if (account.school_id && (!existingDemo || account.school_id !== existingDemo.id)) {
        throw new Error(`Refusing to overwrite account outside demo school: ${account.email}`);
      }
    }

    if (existingDemo) {
      const schoolWhere = { school_id: existingDemo.id };
      await Homework.destroy({ where: schoolWhere, force: true, transaction });
      await LibraryIssue.destroy({ where: schoolWhere, force: true, transaction });
      await LibraryBook.destroy({ where: schoolWhere, force: true, transaction });
      await DynamicEntityRecord.destroy({ where: schoolWhere, force: true, transaction });
      await FeePayment.destroy({ where: schoolWhere, force: true, transaction });
      await FeeInvoice.destroy({ where: schoolWhere, force: true, transaction });
      await FeeStructure.destroy({ where: schoolWhere, force: true, transaction });
      await FeeType.destroy({ where: schoolWhere, force: true, transaction });
      await FeeFine.destroy({ where: schoolWhere, force: true, transaction });
      await ExamResult.destroy({ where: schoolWhere, force: true, transaction });
      await ExamSeating.destroy({ where: schoolWhere, force: true, transaction });
      await ExamPosition.destroy({ where: schoolWhere, force: true, transaction });
      await ExamReport.destroy({ where: schoolWhere, force: true, transaction });
      await ExamSchedule.destroy({ where: schoolWhere, force: true, transaction });
      await MarkDistribution.destroy({ where: schoolWhere, force: true, transaction });
      await sequelize.query(
        'DELETE FROM grade_scales WHERE grading_system_id IN (SELECT id FROM grading_systems WHERE school_id = :schoolId)',
        { replacements: { schoolId: existingDemo.id }, transaction }
      );
      await GradingSystem.destroy({ where: schoolWhere, force: true, transaction });
      await ExamHall.destroy({ where: schoolWhere, force: true, transaction });
      await sequelize.query(
        'DELETE FROM certificate_templates WHERE branch_id IN (SELECT id FROM branches WHERE school_id = :schoolId)',
        { replacements: { schoolId: existingDemo.id }, transaction }
      );
      await sequelize.query('DELETE FROM report_templates WHERE school_id = :schoolId', {
        replacements: { schoolId: existingDemo.id }, transaction
      });
      await Term.destroy({ where: schoolWhere, force: true, transaction });
      await ClassSubjectAssignment.destroy({ where: schoolWhere, force: true, transaction });
      await SubjectTeacher.destroy({ where: schoolWhere, force: true, transaction });
      await ClassTeacher.destroy({ where: schoolWhere, force: true, transaction });
      await AcademicCalendar.destroy({ where: schoolWhere, force: true, transaction });
      await CardTemplate.destroy({ where: schoolWhere, force: true, transaction });
      await AlumniEvent.destroy({ where: schoolWhere, force: true, transaction });
      await Alumni.destroy({ where: schoolWhere, force: true, transaction });
      await Stream.destroy({ where: schoolWhere, force: true, transaction });
      await Exam.destroy({ where: schoolWhere, force: true, transaction });
      await OnlineExamQuestion.destroy({ where: schoolWhere, force: true, transaction });
      await OnlineExam.destroy({ where: schoolWhere, force: true, transaction });
      await OnlineExamAttempt.destroy({ where: schoolWhere, force: true, transaction });
      await StudentPromotion.destroy({ where: schoolWhere, force: true, transaction });
      await AttendanceRecord.destroy({ where: schoolWhere, force: true, transaction });
      await AttendanceSession.destroy({ where: schoolWhere, force: true, transaction });
      await sequelize.query(
        'DELETE FROM timetable_slots WHERE timetable_id IN (SELECT id FROM timetables WHERE school_id = :schoolId)',
        { replacements: { schoolId: existingDemo.id }, transaction }
      );
      await Timetable.destroy({ where: schoolWhere, force: true, transaction });
      await StudentTransport.destroy({ where: schoolWhere, force: true, transaction });
      await HostelAllocation.destroy({ where: schoolWhere, force: true, transaction });
      await sequelize.query(
        'DELETE FROM student_parents WHERE student_id IN (SELECT id FROM students WHERE school_id = :schoolId)',
        { replacements: { schoolId: existingDemo.id }, transaction }
      );
      await Student.destroy({ where: schoolWhere, force: true, transaction });
      await StudentCategory.destroy({ where: schoolWhere, force: true, transaction });
      await HostelRoom.destroy({ where: schoolWhere, force: true, transaction });
      await RoomType.destroy({ where: schoolWhere, force: true, transaction });
      await Hostel.destroy({ where: schoolWhere, force: true, transaction });
      await InventoryItem.destroy({ where: schoolWhere, force: true, transaction });
      await ItemCategory.destroy({ where: schoolWhere, force: true, transaction });
      await Store.destroy({ where: schoolWhere, force: true, transaction });
      await Supplier.destroy({ where: schoolWhere, force: true, transaction });
      await SchoolTransaction.destroy({ where: schoolWhere, force: true, transaction });
      await AccountCategory.destroy({ where: schoolWhere, force: true, transaction });
      await ItemIssue.destroy({ where: schoolWhere, force: true, transaction });
      await sequelize.query(
        'DELETE FROM vehicle_routes WHERE vehicle_id IN (SELECT id FROM vehicles WHERE school_id = :schoolId)',
        { replacements: { schoolId: existingDemo.id }, transaction }
      );
      await Vehicle.destroy({ where: schoolWhere, force: true, transaction });
      await TransportRoute.destroy({ where: schoolWhere, force: true, transaction });
      await existingDemo.destroy({ force: true, transaction });
    }
    await User.destroy({
      where: { email: accounts.map(([email]) => email) },
      force: true,
      transaction
    });

    const [plan] = await SubscriptionPlan.findOrCreate({
      where: { code: 'DEMO' },
      defaults: {
        name: 'Demo plan',
        description: 'Local and presentation demo plan',
        max_students: -1,
        max_staff: -1,
        max_branches: -1,
        features: { all_modules: true },
        is_active: true
      },
      transaction
    });
    const availableModules = await Module.findAll({ where: { is_active: true }, transaction });
    for (const [sortOrder, module] of availableModules.entries()) {
      await PlanModule.findOrCreate({
        where: { subscription_plan_id: plan.id, module_id: module.id },
        defaults: { is_required: module.is_core, is_enabled: true, sort_order: sortOrder },
        transaction
      });
    }
    const school = await School.create({
      name: 'Demo International School',
      code: DEMO_CODE,
      email: 'demo.school@schoolerp.local',
      phone: '+91 90000 00000',
      address: '100 Demo Education Avenue',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postal_code: '400001',
      website: 'https://schoolerp.local/demo',
      status: 'active',
      subscription_plan: plan.code,
      max_students: -1,
      max_staff: -1,
      max_branches: -1,
      modules: ['academic', 'attendance', 'fees', 'exams', 'homework', 'library', 'transport', 'hostel', 'inventory', 'accounting', 'reports'],
      settings: { demo: true, demo_seed_code: DEMO_CODE },
      receipt_settings: { schoolName: 'Demo International School', defaultReceiptTitle: 'Fee Receipt' },
      fee_settings: { defaultCurrency: 'INR', defaultPaymentModel: 'monthly' }
    }, { transaction });
    const branch = await Branch.create({
      name: 'Main Branch', code: 'MAIN', email: 'demo.main@schoolerp.local',
      phone: '+91 90000 00001', address: school.address, city: school.city,
      state: school.state, country: school.country, postal_code: school.postal_code,
      principal_name: 'Dr. Demo Principal', principal_email: 'principal@schoolerp.local',
      is_main_branch: true, school_id: school.id
    }, { transaction });
    const branchTwo = await Branch.create({
      name: 'Second Branch', code: 'SECOND', email: 'demo.second@schoolerp.local',
      phone: '+91 90000 00002', address: '20 Riverside Road', city: school.city,
      state: school.state, country: school.country, postal_code: school.postal_code,
      principal_name: 'Prof. Demo Riverside', principal_email: 'riverside@schoolerp.local',
      is_main_branch: false, school_id: school.id
    }, { transaction });

    const users = {};
    for (const [email, first_name, last_name, role] of accounts) {
      users[role] = await User.create({
        email, password: PASSWORD, first_name, last_name, role,
        school_id: school.id, branch_id: branch.id, status: 'active', settings: { demo: true }
      }, { transaction });
    }
    await users.branch_admin.update({ branch_id: branchTwo.id }, { transaction });

    const year = await AcademicYear.findOrCreate({
      where: { code: '2026-2027' },
      defaults: { name: '2026-2027', start_date: '2026-06-01', end_date: '2027-05-31', is_current: true, status: 'active' },
      transaction
    }).then(([record]) => record);
    await school.update({ current_academic_year_id: year.id }, { transaction });

    const classOne = await Class.create({ name: 'Class 1', code: 'C1', numeric_value: 1, capacity: 30, school_id: school.id, branch_id: branch.id, created_by: users.admin.id }, { transaction });
    const section = await Section.create({ name: 'A', capacity: 30, class_id: classOne.id, school_id: school.id, branch_id: branch.id, class_teacher_id: users.teacher.id, created_by: users.admin.id }, { transaction });
    const subjects = {};
    for (const [name, code, category] of [['English', 'ENG', 'language'], ['Mathematics', 'MATH', 'core'], ['Science', 'SCI', 'science']]) {
      subjects[code] = await Subject.create({ name, code, category, class_id: classOne.id, school_id: school.id, branch_id: branch.id, created_by: users.admin.id }, { transaction });
    }
    const riversideClass = await Class.create({ name: 'Class 2', code: 'C2-SECOND', numeric_value: 2, capacity: 30, school_id: school.id, branch_id: branchTwo.id, created_by: users.admin.id }, { transaction });
    const secondSection = await Section.create({ name: 'A', capacity: 30, class_id: riversideClass.id, school_id: school.id, branch_id: branchTwo.id, created_by: users.admin.id }, { transaction });
    await Subject.create({ name: 'English', code: 'ENG-SECOND', category: 'language', class_id: riversideClass.id, school_id: school.id, branch_id: branchTwo.id, created_by: users.admin.id }, { transaction });
    const studentCategory = await StudentCategory.create({ name: 'Demo General', description: 'Default demo student category', school_id: school.id, branch_id: branch.id, created_by: users.admin.id }, { transaction });
    await Stream.create({ name: 'Science', code: 'SCI', description: 'Demo science stream', school_id: school.id, branch_id: branch.id, class_id: classOne.id, created_by: users.admin.id }, { transaction });
    await ClassSubjectAssignment.create({ class_id: classOne.id, subject_id: subjects.MATH.id, section_id: section.id, academic_year: year.code, school_id: school.id, branch_id: branch.id, created_by: users.admin.id }, { transaction });
    await SubjectTeacher.create({ subject_id: subjects.MATH.id, teacher_id: users.teacher.id, class_id: classOne.id, section_id: section.id, is_primary: true, academic_year: year.code, school_id: school.id, branch_id: branch.id, created_by: users.admin.id }, { transaction });
    await ClassTeacher.create({ class_id: classOne.id, section_id: section.id, teacher_id: users.teacher.id, academic_year: year.code, school_id: school.id, branch_id: branch.id, created_by: users.admin.id }, { transaction });

    const student = await Student.create({
      admission_number: 'DEMO-001', roll_number: '1', first_name: 'Sarah', last_name: 'Demo',
      date_of_birth: '2018-04-12', gender: 'female', nationality: 'Indian', address: school.address,
      city: school.city, state: school.state, postal_code: school.postal_code, admission_class: 'Class 1',
      current_class: 'Class 1', section: 'A', class_id: classOne.id, section_id: section.id,
      academic_year: year.code, school_id: school.id, branch_id: branch.id, user_id: users.student.id,
      created_by: users.admin.id, category_id: studentCategory.id
    }, { transaction });
    const studentTwo = await Student.create({
      admission_number: 'DEMO-002', roll_number: '2', first_name: 'Alex', last_name: 'Demo',
      date_of_birth: '2018-08-21', gender: 'male', nationality: 'Indian', address: school.address,
      city: school.city, state: school.state, postal_code: school.postal_code, admission_class: 'Class 1',
      current_class: 'Class 1', section: 'A', class_id: classOne.id, section_id: section.id,
      academic_year: year.code, school_id: school.id, branch_id: branch.id, created_by: users.admin.id, category_id: studentCategory.id
    }, { transaction });
    await Student.create({
      admission_number: 'DEMO-SECOND-001', roll_number: '1', first_name: 'Riya', last_name: 'Demo',
      date_of_birth: '2017-11-03', gender: 'female', nationality: 'Indian', address: school.address,
      city: school.city, state: school.state, postal_code: school.postal_code, admission_class: 'Class 2',
      current_class: 'Class 2', section: 'A', class_id: riversideClass.id, section_id: secondSection.id,
      academic_year: year.code, school_id: school.id, branch_id: branchTwo.id,
      created_by: users.admin.id
    }, { transaction });
    const parent = await Parent.create({
      guardian_name: 'Demo Parent', guardian_phone: '+91 90000 00002', guardian_email: users.parent.email,
      guardian_relation: 'Father', address: school.address, city: school.city, state: school.state,
      postal_code: school.postal_code, school_id: school.id, branch_id: branch.id, user_id: users.parent.id
    }, { transaction });
    await StudentParent.create({ student_id: student.id, parent_id: parent.id, relationship: 'father', is_primary: true }, { transaction });
    await StudentParent.create({ student_id: studentTwo.id, parent_id: parent.id, relationship: 'father', is_primary: true }, { transaction });

    const term = await Term.create({
      name: 'First Term', code: 'TERM1', description: 'First academic term',
      start_date: '2026-06-01', end_date: '2026-09-30', academic_year: year.code,
      is_active: true, school_id: school.id, branch_id: branch.id, created_by: users.admin.id
    }, { transaction });
    const exam = await Exam.create({
      name: 'First Term Examination', type_id: 1, weightage: 100, max_marks: 100,
      academic_year: year.code, term_id: term.id, is_active: true, publish_status: true, result_status: true,
      instructions: 'Answer all questions carefully.', school_id: school.id, branch_id: branch.id,
      created_by: users.admin.id
    }, { transaction });
    await ExamResult.create({
      marks_obtained: 86, percentage: 86, grade: 'A', grade_points: 9, rank: 1,
      remarks: 'Excellent progress', is_absent: false, exam_id: exam.id, student_id: student.id,
      school_id: school.id, branch_id: branch.id, created_by: users.teacher.id
    }, { transaction });
    await ExamResult.create({
      marks_obtained: 74, percentage: 74, grade: 'B', grade_points: 7, rank: 2,
      remarks: 'Good progress', is_absent: false, exam_id: exam.id, student_id: studentTwo.id,
      school_id: school.id, branch_id: branch.id, created_by: users.teacher.id
    }, { transaction });
    await ExamSchedule.create({ exam_id: exam.id, exam_date: '2026-07-01', branch_id: branch.id, school_id: school.id }, { transaction });
    await ExamPosition.create({ exam_id: exam.id, student_id: student.id, position: 1, total_marks: 86, percentage: 86, school_id: school.id, branch_id: branch.id }, { transaction });
    const markDistribution = await MarkDistribution.create({ name: 'First Term Marks', total_marks: 100, school_id: school.id, branch_id: branch.id }, { transaction });
    const gradingSystem = await GradingSystem.create({ name: 'Demo Letter Grades', code: 'DEMO-GRADE', school_id: school.id, created_by: users.admin.id, is_default: true }, { transaction });
    await GradeScale.create({ grading_system_id: gradingSystem.id, grade: 'A', min_percentage: 80, max_percentage: 100, grade_points: 4, is_passing: true, sort_order: 1, created_by: users.admin.id }, { transaction });
    await ExamHall.create({ name: 'Main Examination Hall', capacity: 60, school_id: school.id, branch_id: branch.id, created_by: users.admin.id }, { transaction });
    const examHall = await ExamHall.findOne({ where: { name: 'Main Examination Hall' }, transaction });
    await ExamSeating.create({ exam_id: exam.id, exam_hall_id: examHall.id, class_id: classOne.id, section_id: section.id, students_per_bench: 2, plan_json: [{ student_id: student.id, bench: 1 }, { student_id: studentTwo.id, bench: 1 }], status: 'active', school_id: school.id, branch_id: branch.id, created_by: users.admin.id }, { transaction });
    await AcademicCalendar.create({ date: '2026-08-15', day_type: 'holiday', description: 'Demo Independence Day holiday', academic_year: year.code, school_id: school.id, branch_id: branch.id, created_by: users.admin.id }, { transaction });
    await CardTemplate.create({ name: 'Demo Student ID Card', kind: 'id', user_type: 'student', fields_json: { name: true, admission_number: true, class: true }, html_template: '<div>{{student_name}}</div>', school_id: school.id, branch_id: branch.id, created_by: users.admin.id }, { transaction });
    await CertificateTemplate.create({ name: 'Student Bonafide Certificate', user_type: 'student', qr_code_text: 'DEMO-STUDENT-CERT', content: '<h1>Bonafide Certificate</h1><p>{{student_name}}</p>', branch_id: branch.id, created_by: users.admin.id }, { transaction });
    const reportTemplateId = randomUUID();
    await sequelize.query(
      `INSERT INTO report_templates (id, name, code, description, report_type, template_content, css_styles, header_template, footer_template, config, is_default, is_active, school_id, created_by, created_at, updated_at)
       VALUES (:id, :name, :code, :description, :reportType, :content, :css, :header, :footer, :config, true, true, :schoolId, :createdBy, NOW(), NOW())`,
      { replacements: {
        id: reportTemplateId, name: 'Demo Student Report Card', code: 'DEMO-STUDENT-REPORT',
        description: 'Default student report-card template', reportType: 'student_wise',
        content: '<h1>{{school_name}}</h1><h2>{{student_name}}</h2><p>Grade: {{grade}}</p>',
        css: 'body { font-family: sans-serif; }', header: 'Demo International School',
        footer: 'Generated by School ERP', config: JSON.stringify({ show_rank: true, show_remarks: true }),
        schoolId: school.id, createdBy: users.admin.id
      }, transaction }
    );
    await ExamReport.create({ exam_id: exam.id, report_type: 'student_wise', title: 'Demo Student Report Card', description: 'Generated demo report', template_id: reportTemplateId, filters: {}, config: {}, status: 'completed', school_id: school.id, branch_id: branch.id, created_by: users.admin.id }, { transaction });
    const feeType = await FeeType.create({
      name: 'Tuition Fee', code: 'TUITION', category: 'academic', is_active: true,
      school_id: school.id, branch_id: branch.id, created_by: users.accountant.id
    }, { transaction });
    const feeStructure = await FeeStructure.create({
      name: 'Class 1 Monthly Tuition', academic_year: year.code, class_name: classOne.name,
      class_id: classOne.id, fee_type_id: feeType.id, amount: 2500, payment_model: 'monthly',
      monthly_payment_amount: 2500, total_months: 12, is_active: true,
      school_id: school.id, branch_id: branch.id, created_by: users.accountant.id
    }, { transaction });
    await DynamicEntityRecord.create({ entity_type: 'fee_allocation', title: 'Class 1 tuition allocation', status: 'active', student_id: student.id, class_id: classOne.id, related_id: feeStructure.id, school_id: school.id, branch_id: branch.id, created_by: users.accountant.id, payload: { section_id: section.id } }, { transaction });
    const invoice = await FeeInvoice.create({
      invoice_id: 900001, invoice_number: 'INV-DEMO-001', student_id: student.id,
      fee_structure_id: feeStructure.id, academic_year: year.code, class_name: classOne.name,
      section: section.name, fee_type_name: feeType.name, invoice_date: '2026-06-01', due_date: '2026-06-10',
      amount: 2500, base_amount: 2500, discount_amount: 0, tax_amount: 0, total_amount: 2500,
      paid_amount: 2500, balance_amount: 0, status: 'paid', payment_status: 'paid',
      payment_model: 'monthly', month: 6, year: 2026, school_id: school.id,
      branch_id: branch.id, created_by: users.accountant.id
    }, { transaction });
    await FeePayment.create({
      payment_number: 'PAY-DEMO-001', receipt_number: 'REC-DEMO-001', invoice_id: invoice.id,
      student_id: student.id, payment_amount: 2500, payment_method: 'upi', payment_date: '2026-06-05',
      payment_status: 'completed', academic_year: year.code, school_id: school.id,
      branch_id: branch.id, created_by: users.accountant.id
    }, { transaction });
    await FeeInvoice.create({
      invoice_id: 900002, invoice_number: 'INV-DEMO-002', student_id: studentTwo.id,
      fee_structure_id: feeStructure.id, academic_year: year.code, class_name: classOne.name,
      section: section.name, fee_type_name: feeType.name, invoice_date: '2026-06-01', due_date: '2026-06-10',
      amount: 2500, base_amount: 2500, discount_amount: 0, tax_amount: 0, total_amount: 2500,
      paid_amount: 0, balance_amount: 2500, status: 'sent', payment_status: 'pending',
      payment_model: 'monthly', month: 6, year: 2026, school_id: school.id,
      branch_id: branch.id, created_by: users.accountant.id
    }, { transaction });
    await Homework.create({
      title: 'Fractions practice', description: 'Complete exercises 1–10 in the workbook.',
      due_date: '2026-07-15', class_id: classOne.id, section_id: section.id,
      subject_id: subjects.MATH.id, school_id: school.id, branch_id: branch.id, created_by: users.teacher.id
    }, { transaction });
    await LibraryBook.create({
      title: 'The World Around Us', author: 'Demo Publications', publisher: 'Demo Press',
      isbn: 'DEMO-9780001', category: 'Textbook', purchase_date: '2026-06-10',
      purchase_price: 350, quantity: 5, available: 5, school_id: school.id,
      branch_id: branch.id, created_by: users.librarian.id
    }, { transaction });
    const demoBook = await LibraryBook.findOne({ where: { isbn: 'DEMO-9780001' }, transaction });
    await LibraryIssue.create({ book_id: demoBook.id, student_id: student.id, borrower_type: 'student', borrower_name: 'Sarah Demo', issue_date: '2026-06-10', due_date: '2026-06-24', status: 'issued', school_id: school.id, branch_id: branch.id, created_by: users.librarian.id }, { transaction });
    await FeeFine.create({ name: 'Late Fee', fine_type: 'fixed', amount: 50, days_after_due: 7, school_id: school.id, branch_id: branch.id, created_by: users.accountant.id }, { transaction });
    const attendanceSession = await AttendanceSession.create({
      date: '2026-06-15', class_id: classOne.id, school_id: school.id, branch_id: branch.id,
      created_by: users.teacher.id
    }, { transaction });
    await AttendanceRecord.create({
      date: '2026-06-15', status: 'present', session_id: attendanceSession.id,
      student_id: student.id, class_id: classOne.id, school_id: school.id, branch_id: branch.id,
      marked_by: users.teacher.id
    }, { transaction });
    await AttendanceRecord.create({
      date: '2026-06-15', status: 'absent', session_id: attendanceSession.id,
      student_id: studentTwo.id, class_id: classOne.id, school_id: school.id, branch_id: branch.id,
      marked_by: users.teacher.id
    }, { transaction });
    const timetable = await Timetable.create({
      name: 'Class 1 Weekly Timetable', academic_year: year.code, class_id: classOne.id,
      school_id: school.id, created_by: users.admin.id
    }, { transaction });
    await TimetableSlot.create({ timetable_id: timetable.id, day_of_week: 1, period_number: 1, start_time: '09:00', end_time: '09:45' }, { transaction });
    const route = await TransportRoute.create({ school_id: school.id, branch_id: branch.id, route_name: 'Main Branch Route', route_code: 'MAIN-1', fee: 1200 }, { transaction });
    const vehicle = await Vehicle.create({ school_id: school.id, branch_id: branch.id, vehicle_number: 'DEMO-BUS-01', vehicle_type: 'bus', capacity: 40, is_active: true }, { transaction });
    await VehicleRoute.create({ vehicle_id: vehicle.id, route_id: route.id }, { transaction });
    await StudentTransport.create({ school_id: school.id, branch_id: branch.id, student_id: student.id, route_id: route.id, vehicle_id: vehicle.id, start_date: '2026-06-01', status: 'active' }, { transaction });
    await StudentTransport.create({ school_id: school.id, branch_id: branch.id, student_id: studentTwo.id, route_id: route.id, vehicle_id: vehicle.id, start_date: '2026-06-01', status: 'active' }, { transaction });
    const hostel = await Hostel.create({ school_id: school.id, branch_id: branch.id, hostel_name: 'Demo Hostel', capacity: 50, is_active: true }, { transaction });
    const roomType = await RoomType.create({ school_id: school.id, branch_id: branch.id, type_name: 'Standard', capacity: 4, is_active: true }, { transaction });
    const room = await HostelRoom.create({ school_id: school.id, branch_id: branch.id, hostel_id: hostel.id, room_type_id: roomType.id, room_number: 'A-101', capacity: 4, status: 'available' }, { transaction });
    await HostelAllocation.create({ school_id: school.id, branch_id: branch.id, student_id: student.id, hostel_id: hostel.id, room_id: room.id, allocation_date: '2026-06-01', status: 'active' }, { transaction });
    const itemCategory = await ItemCategory.create({ school_id: school.id, branch_id: branch.id, name: 'Stationery', code: 'STAT' }, { transaction });
    await InventoryItem.create({ school_id: school.id, branch_id: branch.id, category_id: itemCategory.id, name: 'Notebook', total_quantity: 100, available_quantity: 100 }, { transaction });
    const demoItem = await InventoryItem.findOne({ where: { name: 'Notebook', school_id: school.id }, transaction });
    await ItemIssue.create({ school_id: school.id, branch_id: branch.id, item_id: demoItem.id, issued_to_type: 'student', issued_to_id: student.id, issue_date: '2026-06-12', status: 'issued', quantity: 2, note: 'Demo stationery issue' }, { transaction });
    await Store.create({ school_id: school.id, branch_id: branch.id, name: 'Main Store', code: 'STORE-1' }, { transaction });
    const supplier = await Supplier.create({ school_id: school.id, branch_id: branch.id, name: 'Demo Supplies', code: 'SUP-1' }, { transaction });
    const incomeCategory = await AccountCategory.create({ school_id: school.id, branch_id: branch.id, name: 'Tuition Income', type: 'income' }, { transaction });
    await SchoolTransaction.create({ school_id: school.id, branch_id: branch.id, category_id: incomeCategory.id, name: 'Demo tuition receipt', type: 'income', amount: 2500, date: '2026-06-05', reference: supplier.id }, { transaction });
    const onlineExam = await OnlineExam.create({ title: 'Math Practice Quiz', description: 'Demo online assessment', school_id: school.id, created_by: users.teacher.id }, { transaction });
    await OnlineExamQuestion.create({ online_exam_id: onlineExam.id, question_text: 'What is 2 + 2?', question_type: 'multiple_choice', options: ['3', '4', '5'], correct_answer: '4', marks: 1, school_id: school.id, created_by: users.teacher.id }, { transaction });
    await OnlineExamAttempt.create({ online_exam_id: onlineExam.id, student_id: student.id, answers_json: { '1': '4' }, score: 1, status: 'submitted', school_id: school.id, submitted_at: '2026-06-20T10:00:00Z' }, { transaction });
    await StudentPromotion.create({ student_id: student.id, from_class_id: classOne.id, from_section_id: section.id, to_class_id: riversideClass.id, to_academic_year: '2027-2028', from_academic_year: year.code, action: 'promote', school_id: school.id, branch_id: branch.id, created_by: users.admin.id }, { transaction });
    await Alumni.create({ school_id: school.id, branch_id: branch.id, student_id: student.id, name: 'Jamie Demo', passing_year: '2025', current_profession: 'Engineer', email: 'jamie.demo@example.local', is_active: true }, { transaction });
    await AlumniEvent.create({ school_id: school.id, branch_id: branch.id, title: 'Demo Alumni Meet', description: 'Annual demo alumni gathering', event_date: '2026-12-20', venue: 'Main Auditorium', status: 'upcoming' }, { transaction });

    await transaction.commit();
    console.log(JSON.stringify({
      school: { name: school.name, code: school.code },
      branches: [branch.code, branchTwo.code],
      demo_data: { academic_year: year.code, class: classOne.name, student: student.admission_number, exam: exam.name },
      accounts: accounts.map(([email, , , role]) => ({ email, role, password: PASSWORD }))
    }, null, 2));
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

run().catch(error => {
  console.error(`Demo seed failed: ${error.message}`);
  process.exitCode = 1;
});
