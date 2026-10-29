require('module-alias/register');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { randomUUID } = require('crypto');
const { resolvePrivateReportCardsPath } = require('../src/utils/shared/pathHelper');

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
  HomeworkSubmission,
  LibraryBook,
  LibraryBookRequest,
  Term,
  ExamResult,
  FeeType,
  FeeStructure,
  FeeInvoice,
  FeeInvoiceAdjustment,
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
  ExamSubjectMark,
  ExamPosition,
  MarkDistribution,
  AcademicCalendar,
  CardTemplate,
  ClassTeacher,
  ExamHall,
  GradingSystem,
  GradeScale,
  LibraryIssue,
  StudentCategory,
  Stream,
  SubjectTeacher,
  ClassSubjectAssignment,
  FeeFine,
  Alumni,
  AlumniEvent,
  DynamicEntityRecord,
  ExamSeating,
  OnlineExamAttempt,
  StudentPromotion,
  ItemIssue,
  VehicleRoute,
  ExamReport,
  ReportCardSetup,
  ReportCardSetupExam,
  ParentTeacherMeeting,
  ParentTeacherMeetingStudent,
  SettingsChangeLog,
  GatePass,
  StudentReportCardArchive,
  LiveClass,
  LiveClassAttendance,
  SyllabusUnit
} = require('../src/models');

const DEMO_CODE = 'DEMOERP';
const PASSWORD = 'Demo@12345';
const accounts = [
  ['demo.superadmin@schoolerp.local', 'Demo', 'Super Admin', 'super_admin'],
  ['demo.admin@schoolerp.local', 'Demo', 'Admin', 'admin'],
  ['demo.branch@schoolerp.local', 'Demo', 'Branch Admin', 'branch_admin'],
  ['demo.teacher@schoolerp.local', 'Demo', 'Teacher', 'teacher'],
  [
    'demo.teacher.second@schoolerp.local',
    'Demo',
    'Second Branch Teacher',
    'teacher',
    'second_branch_teacher'
  ],
  ['demo.reception@schoolerp.local', 'Demo', 'Receptionist', 'receptionist'],
  ['demo.accountant@schoolerp.local', 'Demo', 'Accountant', 'accountant'],
  ['demo.librarian@schoolerp.local', 'Demo', 'Librarian', 'librarian'],
  ['demo.parent@schoolerp.local', 'Demo', 'Parent', 'parent'],
  ['demo.student@schoolerp.local', 'Demo', 'Student', 'student']
];

async function run() {
  const transaction = await sequelize.transaction();
  const archivedFilesToRemove = [];
  try {
    const existingAccounts = await User.findAll({
      where: { email: accounts.map(([email]) => email) },
      transaction
    });
    const existingDemo = await School.findOne({ where: { code: DEMO_CODE }, transaction });
    for (const account of existingAccounts) {
      if (
        account.role !== 'super_admin' &&
        account.school_id &&
        (!existingDemo || account.school_id !== existingDemo.id)
      ) {
        throw new Error(`Refusing to overwrite account outside demo school: ${account.email}`);
      }
    }

    if (existingDemo) {
      const schoolWhere = { school_id: existingDemo.id };
      const reportCardArchives = await StudentReportCardArchive.findAll({
        where: schoolWhere,
        attributes: ['file_name', 'storage_year'],
        transaction
      });
      reportCardArchives.forEach(archive => {
        if (/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.pdf$/i.test(archive.file_name)) {
          archivedFilesToRemove.push(
            path.join(
              resolvePrivateReportCardsPath(existingDemo.code, String(archive.storage_year)),
              archive.file_name
            )
          );
        }
      });
      await StudentReportCardArchive.destroy({ where: schoolWhere, force: true, transaction });
      await sequelize.query(
        'DELETE FROM live_class_attendance WHERE live_class_id IN (SELECT id FROM live_classes WHERE school_id = :schoolId)',
        { replacements: { schoolId: existingDemo.id }, transaction }
      );
      await LiveClass.destroy({ where: schoolWhere, force: true, transaction });
      await HomeworkSubmission.destroy({ where: schoolWhere, force: true, transaction });
      await Homework.destroy({ where: schoolWhere, force: true, transaction });
      await LibraryBookRequest.destroy({ where: schoolWhere, force: true, transaction });
      await LibraryIssue.destroy({ where: schoolWhere, force: true, transaction });
      await LibraryBook.destroy({ where: schoolWhere, force: true, transaction });
      await DynamicEntityRecord.destroy({ where: schoolWhere, force: true, transaction });
      await GatePass.destroy({ where: schoolWhere, force: true, transaction });
      await SyllabusUnit.destroy({ where: schoolWhere, force: true, transaction });
      await FeeInvoiceAdjustment.destroy({ where: schoolWhere, force: true, transaction });
      await FeePayment.destroy({ where: schoolWhere, force: true, transaction });
      await FeeInvoice.destroy({ where: schoolWhere, force: true, transaction });
      await FeeStructure.destroy({ where: schoolWhere, force: true, transaction });
      await FeeType.destroy({ where: schoolWhere, force: true, transaction });
      await FeeFine.destroy({ where: schoolWhere, force: true, transaction });
      await ExamResult.destroy({ where: schoolWhere, force: true, transaction });
      await ExamSubjectMark.destroy({ where: schoolWhere, force: true, transaction });
      await ExamSeating.destroy({ where: schoolWhere, force: true, transaction });
      await ExamPosition.destroy({ where: schoolWhere, force: true, transaction });
      await ExamReport.destroy({ where: schoolWhere, force: true, transaction });
      await ParentTeacherMeeting.destroy({ where: schoolWhere, force: true, transaction });
      await sequelize.query(
        'DELETE FROM report_card_setup_exams WHERE setup_id IN (SELECT id FROM report_card_setups WHERE school_id = :schoolId)',
        { replacements: { schoolId: existingDemo.id }, transaction }
      );
      await ReportCardSetup.destroy({ where: schoolWhere, force: true, transaction });
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
        replacements: { schoolId: existingDemo.id },
        transaction
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
      await sequelize.query('DELETE FROM invoice_counters WHERE school_id = :schoolId', {
        replacements: { schoolId: existingDemo.id },
        transaction
      });
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
    const school = await School.create(
      {
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
        modules: [
          'academic',
          'attendance',
          'fees',
          'exams',
          'homework',
          'liveclass',
          'library',
          'transport',
          'hostel',
          'inventory',
          'accounting',
          'reports'
        ],
        settings: { demo: true, demo_seed_code: DEMO_CODE, defaultTheme: 'light' },
        receipt_settings: {
          schoolName: 'Demo International School',
          defaultReceiptTitle: 'Fee Receipt'
        },
        fee_settings: { defaultCurrency: 'INR', defaultPaymentModel: 'monthly' }
      },
      { transaction }
    );
    const branch = await Branch.create(
      {
        name: 'Main Branch',
        code: 'MAIN',
        email: 'demo.main@schoolerp.local',
        phone: '+91 90000 00001',
        address: school.address,
        city: school.city,
        state: school.state,
        country: school.country,
        postal_code: school.postal_code,
        principal_name: 'Dr. Demo Principal',
        principal_email: 'principal@schoolerp.local',
        is_main_branch: true,
        school_id: school.id
      },
      { transaction }
    );
    const branchTwo = await Branch.create(
      {
        name: 'Second Branch',
        code: 'SECOND',
        email: 'demo.second@schoolerp.local',
        phone: '+91 90000 00002',
        address: '20 Riverside Road',
        city: school.city,
        state: school.state,
        country: school.country,
        postal_code: school.postal_code,
        principal_name: 'Prof. Demo Riverside',
        principal_email: 'riverside@schoolerp.local',
        is_main_branch: false,
        school_id: school.id
      },
      { transaction }
    );

    const users = {};
    for (const [email, first_name, last_name, role, userKey = role] of accounts) {
      const isSuper = role === 'super_admin';
      users[userKey] = await User.create(
        {
          email,
          password: PASSWORD,
          first_name,
          last_name,
          role,
          school_id: isSuper ? null : school.id,
          branch_id: isSuper
            ? null
            : userKey === 'second_branch_teacher'
              ? branchTwo.id
              : branch.id,
          status: 'active',
          settings: { demo: true }
        },
        { transaction }
      );
    }
    await users.branch_admin.update({ branch_id: branchTwo.id }, { transaction });
    await SettingsChangeLog.create(
      {
        school_id: school.id,
        actor_id: users.admin.id,
        category: 'system_preferences',
        changes: {
          defaultTheme: {
            before: { exists: true, value: 'dark' },
            after: { exists: true, value: 'light' }
          }
        },
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      { transaction }
    );

    const year = await AcademicYear.findOrCreate({
      where: { code: '2026-2027' },
      defaults: {
        name: '2026-2027',
        start_date: '2026-06-01',
        end_date: '2027-05-31',
        is_current: true,
        status: 'active'
      },
      transaction
    }).then(([record]) => record);
    await school.update({ current_academic_year_id: year.id }, { transaction });

    const classOne = await Class.create(
      {
        name: 'Class 1',
        code: 'C1',
        numeric_value: 1,
        capacity: 30,
        has_stream: true,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const section = await Section.create(
      {
        name: 'A',
        capacity: 30,
        class_id: classOne.id,
        school_id: school.id,
        branch_id: branch.id,
        class_teacher_id: users.teacher.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const subjects = {};
    for (const [name, code, category] of [
      ['English', 'ENG', 'language'],
      ['Mathematics', 'MATH', 'core'],
      ['Science', 'SCI', 'science']
    ]) {
      subjects[code] = await Subject.create(
        {
          name,
          code,
          category,
          class_id: classOne.id,
          school_id: school.id,
          branch_id: branch.id,
          created_by: users.admin.id
        },
        { transaction }
      );
    }
    const riversideClass = await Class.create(
      {
        name: 'Class 2',
        code: 'C2-SECOND',
        numeric_value: 2,
        capacity: 30,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const secondSection = await Section.create(
      {
        name: 'A',
        capacity: 30,
        class_id: riversideClass.id,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const secondBranchSubject = await Subject.create(
      {
        name: 'English',
        code: 'ENG-SECOND',
        category: 'language',
        class_id: riversideClass.id,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const studentCategory = await StudentCategory.create(
      {
        name: 'Demo General',
        description: 'Default demo student category',
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const scienceStream = await Stream.create(
      {
        name: 'Science',
        code: 'SCI',
        description: 'Demo science stream',
        school_id: school.id,
        branch_id: branch.id,
        class_id: classOne.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await section.update({ stream_id: scienceStream.id }, { transaction });
    await ClassSubjectAssignment.create(
      {
        class_id: classOne.id,
        subject_id: subjects.MATH.id,
        section_id: section.id,
        academic_year: year.code,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const mathChapter = await SyllabusUnit.create({
      school_id: school.id,
      branch_id: branch.id,
      class_id: classOne.id,
      subject_id: subjects.MATH.id,
      title: 'Number Sense',
      description: 'Understand numbers, place value, and operations.',
      created_by: users.admin.id
    }, { transaction });
    await SyllabusUnit.create({
      school_id: school.id,
      branch_id: branch.id,
      class_id: classOne.id,
      subject_id: subjects.MATH.id,
      parent_id: mathChapter.id,
      title: 'Addition and Subtraction',
      description: 'Solve age-appropriate addition and subtraction problems.',
      created_by: users.admin.id
    }, { transaction });
    await ClassSubjectAssignment.create(
      {
        class_id: riversideClass.id,
        subject_id: secondBranchSubject.id,
        section_id: secondSection.id,
        academic_year: year.code,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await SyllabusUnit.create({
      school_id: school.id,
      branch_id: branchTwo.id,
      class_id: riversideClass.id,
      subject_id: secondBranchSubject.id,
      title: 'Reading and Writing',
      description: 'Build reading comprehension and clear written expression.',
      created_by: users.admin.id
    }, { transaction });
    await SubjectTeacher.create(
      {
        subject_id: secondBranchSubject.id,
        teacher_id: users.second_branch_teacher.id,
        class_id: riversideClass.id,
        section_id: secondSection.id,
        is_primary: true,
        academic_year: year.code,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await secondSection.update(
      { class_teacher_id: users.second_branch_teacher.id },
      { transaction }
    );
    await ClassTeacher.create(
      {
        class_id: riversideClass.id,
        section_id: secondSection.id,
        teacher_id: users.second_branch_teacher.id,
        academic_year: year.code,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await SubjectTeacher.create(
      {
        subject_id: subjects.MATH.id,
        teacher_id: users.teacher.id,
        class_id: classOne.id,
        section_id: section.id,
        is_primary: true,
        academic_year: year.code,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await ClassTeacher.create(
      {
        class_id: classOne.id,
        section_id: section.id,
        teacher_id: users.teacher.id,
        academic_year: year.code,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );

    const student = await Student.create(
      {
        admission_number: 'DEMO-001',
        roll_number: '1',
        first_name: 'Sarah',
        last_name: 'Demo',
        date_of_birth: '2018-04-12',
        gender: 'female',
        nationality: 'Indian',
        address: school.address,
        city: school.city,
        state: school.state,
        postal_code: school.postal_code,
        admission_class: 'Class 1',
        current_class: 'Class 1',
        section: 'A',
        class_id: classOne.id,
        section_id: section.id,
        stream_id: scienceStream.id,
        academic_year: year.code,
        school_id: school.id,
        branch_id: branch.id,
        user_id: users.student.id,
        created_by: users.admin.id,
        category_id: studentCategory.id
      },
      { transaction }
    );
    const studentTwo = await Student.create(
      {
        admission_number: 'DEMO-002',
        roll_number: '2',
        first_name: 'Alex',
        last_name: 'Demo',
        date_of_birth: '2018-08-21',
        gender: 'male',
        nationality: 'Indian',
        address: school.address,
        city: school.city,
        state: school.state,
        postal_code: school.postal_code,
        admission_class: 'Class 1',
        current_class: 'Class 1',
        section: 'A',
        class_id: classOne.id,
        section_id: section.id,
        stream_id: scienceStream.id,
        academic_year: year.code,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id,
        category_id: studentCategory.id
      },
      { transaction }
    );
    const secondBranchStudent = await Student.create(
      {
        admission_number: 'DEMO-SECOND-001',
        roll_number: '1',
        first_name: 'Riya',
        last_name: 'Demo',
        date_of_birth: '2017-11-03',
        gender: 'female',
        nationality: 'Indian',
        address: school.address,
        city: school.city,
        state: school.state,
        postal_code: school.postal_code,
        admission_class: 'Class 2',
        current_class: 'Class 2',
        section: 'A',
        class_id: riversideClass.id,
        section_id: secondSection.id,
        academic_year: year.code,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const parent = await Parent.create(
      {
        guardian_name: 'Demo Parent',
        guardian_phone: '+91 90000 00002',
        guardian_email: users.parent.email,
        guardian_relation: 'Father',
        address: school.address,
        city: school.city,
        state: school.state,
        postal_code: school.postal_code,
        school_id: school.id,
        branch_id: branch.id,
        user_id: users.parent.id
      },
      { transaction }
    );
    await StudentParent.create(
      { student_id: student.id, parent_id: parent.id, relationship: 'father', is_primary: true },
      { transaction }
    );
    await StudentParent.create(
      { student_id: studentTwo.id, parent_id: parent.id, relationship: 'father', is_primary: true },
      { transaction }
    );
    await StudentParent.create(
      {
        student_id: secondBranchStudent.id,
        parent_id: parent.id,
        relationship: 'father',
        is_primary: true
      },
      { transaction }
    );

    await GatePass.create(
      {
        pass_no: 'GP-DEMO-MAIN-001',
        school_id: school.id,
        branch_id: branch.id,
        student_id: student.id,
        reason: 'parent_pickup',
        note: 'Demo early pickup request',
        leaving_at: new Date(Date.now() + 60 * 60 * 1000),
        collector_name: 'Demo Parent',
        collector_relation: 'Father',
        collector_phone: '+91 90000 00002',
        collector_id_type: 'school_id',
        collector_id_last4: '1001',
        gate_name: 'Main Gate',
        status: 'pending',
        created_by: users.receptionist.id
      },
      { transaction }
    );
    const secondGatePassNow = new Date();
    await GatePass.create(
      {
        pass_no: 'GP-DEMO-SECOND-001',
        school_id: school.id,
        branch_id: branchTwo.id,
        student_id: secondBranchStudent.id,
        reason: 'doctor',
        leaving_at: new Date(secondGatePassNow.getTime() - 30 * 60 * 1000),
        expected_return_at: new Date(secondGatePassNow.getTime() + 60 * 60 * 1000),
        collector_name: 'Demo Guardian',
        collector_relation: 'Parent',
        collector_phone: '+91 90000 00004',
        collector_id_type: 'school_id',
        collector_id_last4: '2002',
        gate_name: 'Riverside Gate',
        status: 'out',
        created_by: users.admin.id,
        approved_by: users.admin.id,
        approved_at: new Date(secondGatePassNow.getTime() - 35 * 60 * 1000),
        out_by: users.receptionist.id,
        actual_out_at: new Date(secondGatePassNow.getTime() - 30 * 60 * 1000)
      },
      { transaction }
    );

    const yesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const mainPtm = await ParentTeacherMeeting.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        class_id: classOne.id,
        section_id: section.id,
        title: 'Class 1 Learning Progress Meeting',
        agenda: 'Review term progress, homework habits, and the next learning goals.',
        meeting_date: yesterday,
        start_time: '10:00',
        end_time: '12:00',
        mode: 'in_person',
        venue: 'Main Branch - Class 1 Room',
        status: 'scheduled',
        created_by: users.admin.id
      },
      { transaction }
    );
    const secondBranchPtm = await ParentTeacherMeeting.create(
      {
        school_id: school.id,
        branch_id: branchTwo.id,
        class_id: riversideClass.id,
        section_id: secondSection.id,
        title: 'Class 2 Family Check-in',
        agenda: 'Discuss student wellbeing and the upcoming term plan.',
        meeting_date: nextWeek,
        start_time: '14:00',
        end_time: '15:00',
        mode: 'in_person',
        venue: 'Second Branch - Meeting Room',
        status: 'scheduled',
        created_by: users.admin.id
      },
      { transaction }
    );
    await ParentTeacherMeetingStudent.bulkCreate(
      [
        { meeting_id: mainPtm.id, student_id: student.id },
        { meeting_id: mainPtm.id, student_id: studentTwo.id },
        { meeting_id: secondBranchPtm.id, student_id: secondBranchStudent.id }
      ],
      { transaction }
    );

    const term = await Term.create(
      {
        name: 'First Term',
        code: 'TERM1',
        description: 'First academic term',
        start_date: '2026-06-01',
        end_date: '2026-09-30',
        academic_year: year.code,
        is_active: true,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const exam = await Exam.create(
      {
        name: 'First Term Examination',
        type_id: 1,
        weightage: 100,
        max_marks: 100,
        academic_year: year.code,
        term_id: term.id,
        is_active: true,
        publish_status: true,
        result_status: true,
        instructions: 'Answer all questions carefully.',
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await ExamResult.create(
      {
        marks_obtained: 86,
        percentage: 86,
        grade: 'A',
        grade_points: 9,
        rank: 1,
        theory_marks_obtained: 86,
        remarks: 'Excellent progress',
        is_absent: false,
        exam_id: exam.id,
        student_id: student.id,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.teacher.id
      },
      { transaction }
    );
    await ExamResult.create(
      {
        marks_obtained: 74,
        percentage: 74,
        grade: 'B',
        grade_points: 7,
        rank: 2,
        theory_marks_obtained: 74,
        remarks: 'Good progress',
        is_absent: false,
        exam_id: exam.id,
        student_id: studentTwo.id,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.teacher.id
      },
      { transaction }
    );
    const secondMainTerm = await Term.create(
      {
        name: 'Second Term',
        code: 'TERM2',
        description: 'Second academic term',
        start_date: '2026-10-01',
        end_date: '2027-01-31',
        academic_year: year.code,
        is_active: true,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const secondMainExam = await Exam.create(
      {
        name: 'Second Term Examination',
        type_id: 1,
        weightage: 100,
        max_marks: 100,
        academic_year: year.code,
        term_id: secondMainTerm.id,
        is_active: true,
        publish_status: true,
        result_status: true,
        instructions: 'Answer all questions carefully.',
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await ExamResult.bulkCreate(
      [
        {
          marks_obtained: 80,
          percentage: 80,
          grade: 'A',
          grade_points: 4,
          rank: 1,
          theory_marks_obtained: 80,
          remarks: 'Consistent progress',
          is_absent: false,
          exam_id: secondMainExam.id,
          student_id: student.id,
          school_id: school.id,
          branch_id: branch.id,
          created_by: users.teacher.id
        },
        {
          marks_obtained: 68,
          percentage: 68,
          grade: 'C',
          grade_points: 2,
          rank: 2,
          theory_marks_obtained: 68,
          remarks: 'Keep practicing',
          is_absent: false,
          exam_id: secondMainExam.id,
          student_id: studentTwo.id,
          school_id: school.id,
          branch_id: branch.id,
          created_by: users.teacher.id
        }
      ],
      { transaction }
    );
    const secondBranchTerm = await Term.create(
      {
        name: 'Second Branch Term',
        code: 'TERM2-SECOND',
        description: 'Second branch academic term',
        start_date: '2026-06-01',
        end_date: '2026-09-30',
        academic_year: year.code,
        is_active: true,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const secondBranchExam = await Exam.create(
      {
        name: 'Second Branch Examination',
        type_id: 1,
        weightage: 100,
        max_marks: 100,
        academic_year: year.code,
        term_id: secondBranchTerm.id,
        is_active: true,
        publish_status: true,
        result_status: true,
        instructions: 'Answer all questions carefully.',
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await ExamResult.create(
      {
        marks_obtained: 91,
        percentage: 91,
        grade: 'A',
        grade_points: 9,
        rank: 1,
        theory_marks_obtained: 91,
        remarks: 'Excellent progress',
        is_absent: false,
        exam_id: secondBranchExam.id,
        student_id: secondBranchStudent.id,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.teacher.id
      },
      { transaction }
    );
    const firstMainSchedule = await ExamSchedule.create(
      {
        exam_id: exam.id,
        class_id: classOne.id,
        section_id: section.id,
        subject_id: subjects.MATH.id,
        exam_date: '2026-07-01',
        theory_marks: 100,
        total_marks: 100,
        pass_marks: 40,
        branch_id: branch.id,
        school_id: school.id
      },
      { transaction }
    );
    const secondMainSchedule = await ExamSchedule.create(
      {
        exam_id: secondMainExam.id,
        class_id: classOne.id,
        section_id: section.id,
        subject_id: subjects.MATH.id,
        exam_date: '2026-11-02',
        theory_marks: 100,
        total_marks: 100,
        pass_marks: 40,
        branch_id: branch.id,
        school_id: school.id
      },
      { transaction }
    );
    const secondBranchSchedule = await ExamSchedule.create(
      {
        exam_id: secondBranchExam.id,
        class_id: riversideClass.id,
        section_id: secondSection.id,
        subject_id: secondBranchSubject.id,
        exam_date: '2026-07-02',
        theory_marks: 100,
        total_marks: 100,
        pass_marks: 40,
        branch_id: branchTwo.id,
        school_id: school.id
      },
      { transaction }
    );
    await ExamSubjectMark.bulkCreate(
      [
        {
          exam_schedule_id: firstMainSchedule.id,
          student_id: student.id,
          school_id: school.id,
          branch_id: branch.id,
          theory_marks_obtained: 86,
          marks_obtained: 86,
          created_by: users.teacher.id
        },
        {
          exam_schedule_id: firstMainSchedule.id,
          student_id: studentTwo.id,
          school_id: school.id,
          branch_id: branch.id,
          theory_marks_obtained: 74,
          marks_obtained: 74,
          created_by: users.teacher.id
        },
        {
          exam_schedule_id: secondMainSchedule.id,
          student_id: student.id,
          school_id: school.id,
          branch_id: branch.id,
          theory_marks_obtained: 80,
          marks_obtained: 80,
          created_by: users.teacher.id
        },
        {
          exam_schedule_id: secondMainSchedule.id,
          student_id: studentTwo.id,
          school_id: school.id,
          branch_id: branch.id,
          theory_marks_obtained: 68,
          marks_obtained: 68,
          created_by: users.teacher.id
        },
        {
          exam_schedule_id: secondBranchSchedule.id,
          student_id: secondBranchStudent.id,
          school_id: school.id,
          branch_id: branchTwo.id,
          theory_marks_obtained: 91,
          marks_obtained: 91,
          created_by: users.teacher.id
        }
      ],
      { transaction }
    );
    await ExamPosition.create(
      {
        exam_id: exam.id,
        student_id: student.id,
        position: 1,
        total_marks: 86,
        percentage: 86,
        school_id: school.id,
        branch_id: branch.id
      },
      { transaction }
    );
    const markDistribution = await MarkDistribution.create(
      {
        name: 'First Term Marks',
        type: 'theory_only',
        theory_marks: 100,
        total_marks: 100,
        pass_marks: 40,
        school_id: school.id,
        branch_id: branch.id
      },
      { transaction }
    );
    const gradingSystem = await GradingSystem.create(
      {
        name: 'Demo Letter Grades',
        code: 'DEMO-GRADE',
        school_id: school.id,
        created_by: users.admin.id,
        is_default: true,
        passing_percentage: 40
      },
      { transaction }
    );
    await GradeScale.bulkCreate(
      [
        {
          grading_system_id: gradingSystem.id,
          grade: 'A',
          min_percentage: 80,
          max_percentage: 100,
          grade_points: 4,
          is_passing: true,
          sort_order: 1,
          created_by: users.admin.id
        },
        {
          grading_system_id: gradingSystem.id,
          grade: 'B',
          min_percentage: 70,
          max_percentage: 79.99,
          grade_points: 3,
          is_passing: true,
          sort_order: 2,
          created_by: users.admin.id
        },
        {
          grading_system_id: gradingSystem.id,
          grade: 'C',
          min_percentage: 60,
          max_percentage: 69.99,
          grade_points: 2,
          is_passing: true,
          sort_order: 3,
          created_by: users.admin.id
        },
        {
          grading_system_id: gradingSystem.id,
          grade: 'D',
          min_percentage: 40,
          max_percentage: 59.99,
          grade_points: 1,
          is_passing: true,
          sort_order: 4,
          created_by: users.admin.id
        },
        {
          grading_system_id: gradingSystem.id,
          grade: 'F',
          min_percentage: 0,
          max_percentage: 39.99,
          grade_points: 0,
          is_passing: false,
          sort_order: 5,
          created_by: users.admin.id
        }
      ],
      { transaction }
    );
    await ExamHall.create(
      {
        name: 'Main Examination Hall',
        capacity: 60,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const examHall = await ExamHall.findOne({
      where: { name: 'Main Examination Hall' },
      transaction
    });
    await ExamSeating.create(
      {
        exam_id: exam.id,
        exam_hall_id: examHall.id,
        class_id: classOne.id,
        section_id: section.id,
        students_per_bench: 2,
        plan_json: [
          { student_id: student.id, bench: 1 },
          { student_id: studentTwo.id, bench: 1 }
        ],
        status: 'active',
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await AcademicCalendar.create(
      {
        date: '2026-08-15',
        day_type: 'holiday',
        description: 'Demo Independence Day holiday',
        academic_year: year.code,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await CardTemplate.create(
      {
        name: 'Demo Student ID Card',
        kind: 'id',
        user_type: 'student',
        fields_json: { name: true, admission_number: true, class: true },
        html_template: '<div>{{student_name}}</div>',
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await CertificateTemplate.create(
      {
        name: 'Student Bonafide Certificate',
        user_type: 'student',
        qr_code_text: 'DEMO-STUDENT-CERT',
        content: '<h1>Bonafide Certificate</h1><p>{{student_name}}</p>',
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const reportTemplateId = randomUUID();
    await sequelize.query(
      `INSERT INTO report_templates (id, name, code, description, report_type, template_content, css_styles, header_template, footer_template, config, is_default, is_active, school_id, created_by, created_at, updated_at)
       VALUES (:id, :name, :code, :description, :reportType, :content, :css, :header, :footer, :config, true, true, :schoolId, :createdBy, NOW(), NOW())`,
      {
        replacements: {
          id: reportTemplateId,
          name: 'Demo Student Report Card',
          code: 'DEMO-STUDENT-REPORT',
          description: 'Default student report-card template',
          reportType: 'student_wise',
          content: '<h1>{{school_name}}</h1><h2>{{student_name}}</h2><p>Grade: {{grade}}</p>',
          css: 'body { font-family: sans-serif; }',
          header: 'Demo International School',
          footer: 'Generated by School ERP',
          config: JSON.stringify({ show_rank: true, show_remarks: true }),
          schoolId: school.id,
          createdBy: users.admin.id
        },
        transaction
      }
    );
    const mainReportSetup = await ReportCardSetup.create(
      {
        name: 'Main Branch Weighted Term Report',
        template_id: reportTemplateId,
        orientation: 'portrait',
        is_published: true,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id,
        updated_by: users.admin.id
      },
      { transaction }
    );
    await ReportCardSetupExam.bulkCreate(
      [
        { setup_id: mainReportSetup.id, exam_id: exam.id, weightage: 50, sort_order: 0 },
        { setup_id: mainReportSetup.id, exam_id: secondMainExam.id, weightage: 50, sort_order: 1 }
      ],
      { transaction }
    );
    const secondBranchReportSetup = await ReportCardSetup.create(
      {
        name: 'Second Branch Term Report',
        template_id: reportTemplateId,
        orientation: 'landscape',
        is_published: true,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.admin.id,
        updated_by: users.admin.id
      },
      { transaction }
    );
    await ReportCardSetupExam.create(
      {
        setup_id: secondBranchReportSetup.id,
        exam_id: secondBranchExam.id,
        weightage: 100,
        sort_order: 0
      },
      { transaction }
    );
    await ExamReport.create(
      {
        exam_id: exam.id,
        report_type: 'student_wise',
        title: 'Demo Student Report Card',
        description: 'Generated demo report',
        template_id: reportTemplateId,
        filters: {},
        config: {},
        status: 'completed',
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const feeType = await FeeType.create(
      {
        name: 'Tuition Fee',
        code: 'TUITION',
        category: 'academic',
        is_active: true,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.accountant.id
      },
      { transaction }
    );
    const feeStructure = await FeeStructure.create(
      {
        name: 'Class 1 Monthly Tuition',
        academic_year: year.code,
        class_name: classOne.name,
        class_id: classOne.id,
        fee_type_id: feeType.id,
        amount: 2500,
        payment_model: 'monthly',
        monthly_payment_amount: 2500,
        total_months: 12,
        is_active: true,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.accountant.id
      },
      { transaction }
    );
    const installmentFeeType = await FeeType.create(
      {
        name: 'Annual Development Fee',
        code: 'ANNUAL-DEV',
        category: 'academic',
        is_active: true,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.accountant.id
      },
      { transaction }
    );
    const installmentFeeStructure = await FeeStructure.create(
      {
        name: 'Class 1 Annual Development Fee - Two Installments',
        academic_year: year.code,
        class_name: classOne.name,
        class_id: classOne.id,
        fee_type_id: installmentFeeType.id,
        amount: 12000,
        payment_model: 'installment',
        installment_type: 'multiple',
        installment_count: 2,
        installment_amounts: [6000, 6000],
        installment_due_dates: ['2026-09-15', '2027-02-15'],
        is_active: true,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.accountant.id
      },
      { transaction }
    );
    const secondBranchFeeType = await FeeType.create(
      {
        name: 'Tuition Fee',
        code: 'TUITION-SECOND',
        category: 'academic',
        is_active: true,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.accountant.id
      },
      { transaction }
    );
    const secondBranchFeeStructure = await FeeStructure.create(
      {
        name: 'Class 2 Monthly Tuition',
        academic_year: year.code,
        class_name: riversideClass.name,
        class_id: riversideClass.id,
        fee_type_id: secondBranchFeeType.id,
        amount: 2000,
        payment_model: 'monthly',
        monthly_payment_amount: 2000,
        total_months: 12,
        is_active: true,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.accountant.id
      },
      { transaction }
    );
    await DynamicEntityRecord.create(
      {
        entity_type: 'fee_allocation',
        title: 'Class 1 tuition allocation',
        status: 'active',
        student_id: student.id,
        class_id: classOne.id,
        related_id: feeStructure.id,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.accountant.id,
        payload: { section_id: section.id }
      },
      { transaction }
    );
    await DynamicEntityRecord.create(
      {
        entity_type: 'fee_allocation',
        title: 'Class 2 tuition allocation',
        status: 'active',
        student_id: secondBranchStudent.id,
        class_id: riversideClass.id,
        related_id: secondBranchFeeStructure.id,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.accountant.id,
        payload: { section_id: secondSection.id }
      },
      { transaction }
    );
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const homeworkDueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const currentMonthNum = today.getMonth() + 1;
    const currentYearNum = today.getFullYear();
    const invoiceFirstDate = new Date(currentYearNum, today.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const invoiceDueDate = new Date(currentYearNum, today.getMonth(), 15)
      .toISOString()
      .slice(0, 10);

    const invoice = await FeeInvoice.create(
      {
        invoice_id: 900001,
        invoice_number: 'INV-DEMO-001',
        student_id: student.id,
        fee_structure_id: feeStructure.id,
        academic_year: year.code,
        class_name: classOne.name,
        section: section.name,
        fee_type_name: feeType.name,
        invoice_date: invoiceFirstDate,
        due_date: invoiceDueDate,
        amount: 2500,
        base_amount: 2500,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 2500,
        paid_amount: 2500,
        balance_amount: 0,
        status: 'paid',
        payment_status: 'paid',
        payment_model: 'monthly',
        month: currentMonthNum,
        year: currentYearNum,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.accountant.id
      },
      { transaction }
    );
    await FeePayment.create(
      {
        payment_number: 'PAY-DEMO-001',
        receipt_number: 'REC-DEMO-001',
        invoice_id: invoice.id,
        student_id: student.id,
        payment_amount: 2500,
        payment_method: 'upi',
        payment_date: todayIso,
        payment_status: 'completed',
        academic_year: year.code,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.accountant.id
      },
      { transaction }
    );
    await FeeInvoice.create(
      {
        invoice_id: 900002,
        invoice_number: 'INV-DEMO-002',
        student_id: studentTwo.id,
        fee_structure_id: feeStructure.id,
        academic_year: year.code,
        class_name: classOne.name,
        section: section.name,
        fee_type_name: feeType.name,
        invoice_date: invoiceFirstDate,
        due_date: invoiceDueDate,
        amount: 2500,
        base_amount: 2500,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 2500,
        paid_amount: 0,
        balance_amount: 2500,
        status: 'overdue',
        payment_status: 'overdue',
        payment_model: 'monthly',
        month: currentMonthNum,
        year: currentYearNum,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.accountant.id
      },
      { transaction }
    );
    for (const [installmentNumber, dueDate] of [
      [1, '2026-09-15'],
      [2, '2027-02-15']
    ]) {
      const amount = 6000;
      const isOverdue = installmentNumber === 1;
      await FeeInvoice.create(
        {
          invoice_number: `INV-DEMO-INST-00${installmentNumber}`,
          student_id: student.id,
          fee_structure_id: installmentFeeStructure.id,
          academic_year: year.code,
          class_name: classOne.name,
          section: section.name,
          fee_type_name: installmentFeeType.name,
          invoice_date: todayIso,
          due_date: dueDate,
          amount,
          base_amount: amount,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: amount,
          paid_amount: 0,
          balance_amount: amount,
          status: isOverdue ? 'overdue' : 'sent',
          payment_status: isOverdue ? 'overdue' : 'pending',
          payment_model: 'installment',
          installment_number: installmentNumber,
          total_installments: 2,
          school_id: school.id,
          branch_id: branch.id,
          created_by: users.accountant.id
        },
        { transaction }
      );
    }
    await FeeInvoice.create(
      {
        invoice_number: 'INV-DEMO-SECOND-001',
        student_id: secondBranchStudent.id,
        fee_structure_id: secondBranchFeeStructure.id,
        academic_year: year.code,
        class_name: riversideClass.name,
        section: secondSection.name,
        fee_type_name: secondBranchFeeType.name,
        invoice_date: invoiceFirstDate,
        due_date: invoiceDueDate,
        amount: 2000,
        base_amount: 2000,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 2000,
        paid_amount: 0,
        balance_amount: 2000,
        status: 'overdue',
        payment_status: 'overdue',
        payment_model: 'monthly',
        month: currentMonthNum,
        year: currentYearNum,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.accountant.id
      },
      { transaction }
    );
    await Homework.create(
      {
        title: 'Fractions practice',
        description: 'Complete exercises 1–10 in the workbook.',
        due_date: homeworkDueDate,
        academic_year: year.code,
        class_id: classOne.id,
        section_id: section.id,
        subject_id: subjects.MATH.id,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.teacher.id
      },
      { transaction }
    );
    await Homework.create(
      {
        title: 'English reading practice',
        description: 'Read the assigned story and answer the vocabulary questions.',
        due_date: homeworkDueDate,
        academic_year: year.code,
        class_id: riversideClass.id,
        section_id: secondSection.id,
        subject_id: secondBranchSubject.id,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.second_branch_teacher.id
      },
      { transaction }
    );
    const pastLiveClass = await LiveClass.create(
      {
        title: 'Demo Mathematics Review',
        description: 'Fractions and problem-solving recap.',
        scheduled_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
        duration_minutes: 40,
        provider: 'external_link',
        meeting_url: 'https://meet.jit.si/demo-main-math-review',
        school_id: school.id,
        branch_id: branch.id,
        class_id: classOne.id,
        section_id: section.id,
        subject_id: subjects.MATH.id,
        teacher_id: users.teacher.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await LiveClassAttendance.bulkCreate(
      [
        {
          live_class_id: pastLiveClass.id,
          student_id: student.id,
          status: 'present',
          first_joined_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
          duration_minutes: 39
        },
        { live_class_id: pastLiveClass.id, student_id: studentTwo.id, status: 'absent' }
      ],
      { transaction }
    );
    const secondBranchLiveClass = await LiveClass.create(
      {
        title: 'Demo English Reading Room',
        description: 'Guided reading and vocabulary.',
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration_minutes: 35,
        provider: 'external_link',
        meeting_url: 'https://meet.jit.si/demo-second-english',
        school_id: school.id,
        branch_id: branchTwo.id,
        class_id: riversideClass.id,
        section_id: secondSection.id,
        subject_id: secondBranchSubject.id,
        teacher_id: users.second_branch_teacher.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await LiveClassAttendance.create(
      { live_class_id: secondBranchLiveClass.id, student_id: secondBranchStudent.id },
      { transaction }
    );
    await DynamicEntityRecord.create(
      {
        entity_type: 'library_category',
        title: 'Textbook',
        status: 'active',
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.librarian.id
      },
      { transaction }
    );
    await DynamicEntityRecord.create(
      {
        entity_type: 'library_category',
        title: 'Textbook',
        status: 'active',
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.librarian.id
      },
      { transaction }
    );
    await LibraryBook.create(
      {
        title: 'The World Around Us',
        author: 'Demo Publications',
        publisher: 'Demo Press',
        isbn: 'DEMO-9780001',
        category: 'Textbook',
        purchase_date: '2026-06-10',
        purchase_price: 350,
        quantity: 5,
        available: 4,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.librarian.id
      },
      { transaction }
    );
    await LibraryBook.create(
      {
        title: 'Riverside Science Reader',
        author: 'Demo Publications',
        publisher: 'Demo Press',
        isbn: 'DEMO-9780002',
        category: 'Textbook',
        purchase_date: todayIso,
        purchase_price: 280,
        quantity: 3,
        available: 3,
        school_id: school.id,
        branch_id: branchTwo.id,
        created_by: users.librarian.id
      },
      { transaction }
    );
    const demoBook = await LibraryBook.findOne({ where: { isbn: 'DEMO-9780001' }, transaction });
    await LibraryIssue.create(
      {
        book_id: demoBook.id,
        student_id: student.id,
        borrower_type: 'student',
        borrower_name: 'Sarah Demo',
        issue_date: todayIso,
        due_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'issued',
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.librarian.id
      },
      { transaction }
    );
    await LibraryBookRequest.create(
      {
        book_id: demoBook.id,
        student_id: student.id,
        requested_by_user_id: users.student.id,
        status: 'pending',
        school_id: school.id,
        branch_id: branch.id
      },
      { transaction }
    );
    await FeeFine.create(
      {
        name: 'Late Fee',
        fine_type: 'fixed',
        amount: 50,
        days_after_due: 7,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.accountant.id
      },
      { transaction }
    );
    const attendanceSession = await AttendanceSession.create(
      {
        date: todayIso,
        attendance_type: 'daily',
        status: 'published',
        class_id: classOne.id,
        section_id: section.id,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.teacher.id
      },
      { transaction }
    );
    await AttendanceRecord.create(
      {
        date: todayIso,
        status: 'present',
        session_id: attendanceSession.id,
        student_id: student.id,
        class_id: classOne.id,
        section_id: section.id,
        school_id: school.id,
        branch_id: branch.id,
        marked_by: users.teacher.id
      },
      { transaction }
    );
    await AttendanceRecord.create(
      {
        date: todayIso,
        status: 'absent',
        session_id: attendanceSession.id,
        student_id: studentTwo.id,
        class_id: classOne.id,
        section_id: section.id,
        school_id: school.id,
        branch_id: branch.id,
        marked_by: users.teacher.id
      },
      { transaction }
    );
    const timetable = await Timetable.create(
      {
        name: 'Class 1 Weekly Timetable',
        academic_year: year.code,
        class_id: classOne.id,
        section_id: section.id,
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await TimetableSlot.create(
      {
        timetable_id: timetable.id,
        day_of_week: 1,
        period_number: 1,
        start_time: '09:00',
        end_time: '09:45',
        subject_id: subjects.MATH.id,
        teacher_id: users.teacher.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    const route = await TransportRoute.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        route_name: 'Main Branch Route',
        route_code: 'MAIN-1',
        start_point: 'Main Campus',
        end_point: 'Central Bus Stand',
        fare: 1200
      },
      { transaction }
    );
    const vehicle = await Vehicle.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        vehicle_number: 'DEMO-BUS-01',
        vehicle_type: 'bus',
        capacity: 40,
        is_active: true
      },
      { transaction }
    );
    await VehicleRoute.create({ vehicle_id: vehicle.id, route_id: route.id }, { transaction });
    await StudentTransport.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        student_id: student.id,
        route_id: route.id,
        vehicle_id: vehicle.id,
        start_date: '2026-06-01',
        status: 'active'
      },
      { transaction }
    );
    await StudentTransport.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        student_id: studentTwo.id,
        route_id: route.id,
        vehicle_id: vehicle.id,
        start_date: '2026-06-01',
        status: 'active'
      },
      { transaction }
    );
    const hostel = await Hostel.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        hostel_name: 'Demo Hostel',
        capacity: 50,
        is_active: true
      },
      { transaction }
    );
    const roomType = await RoomType.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        type_name: 'Standard',
        capacity: 4,
        is_active: true
      },
      { transaction }
    );
    const room = await HostelRoom.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        hostel_id: hostel.id,
        room_type_id: roomType.id,
        room_number: 'A-101',
        capacity: 4,
        status: 'available'
      },
      { transaction }
    );
    await HostelAllocation.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        student_id: student.id,
        hostel_id: hostel.id,
        room_id: room.id,
        allocation_date: '2026-06-01',
        status: 'active'
      },
      { transaction }
    );
    const itemCategory = await ItemCategory.create(
      { school_id: school.id, branch_id: branch.id, name: 'Stationery', code: 'STAT' },
      { transaction }
    );
    await InventoryItem.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        category_id: itemCategory.id,
        name: 'Notebook',
        total_quantity: 100,
        available_quantity: 100,
        unit_price: 25
      },
      { transaction }
    );
    const demoItem = await InventoryItem.findOne({
      where: { name: 'Notebook', school_id: school.id },
      transaction
    });
    await ItemIssue.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        item_id: demoItem.id,
        issued_to_type: 'student',
        issued_to_id: student.id,
        issue_date: '2026-06-12',
        status: 'issued',
        quantity: 2,
        note: 'Demo stationery issue'
      },
      { transaction }
    );
    await Store.create(
      { school_id: school.id, branch_id: branch.id, name: 'Main Store', code: 'STORE-1' },
      { transaction }
    );
    const supplier = await Supplier.create(
      { school_id: school.id, branch_id: branch.id, name: 'Demo Supplies', code: 'SUP-1' },
      { transaction }
    );
    const incomeCategory = await AccountCategory.create(
      { school_id: school.id, branch_id: branch.id, name: 'Tuition Income', type: 'income' },
      { transaction }
    );
    await SchoolTransaction.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        category_id: incomeCategory.id,
        name: 'Demo tuition receipt',
        type: 'income',
        amount: 2500,
        date: '2026-06-05',
        reference: supplier.id
      },
      { transaction }
    );
    const completedQuiz = await OnlineExam.create(
      {
        title: 'Completed Math Practice Quiz',
        description: 'Previous demo assessment attempt',
        class_id: classOne.id,
        subject_id: subjects.MATH.id,
        branch_id: branch.id,
        status: 'draft',
        school_id: school.id,
        created_by: users.teacher.id
      },
      { transaction }
    );
    const completedQuestion = await OnlineExamQuestion.create(
      {
        online_exam_id: completedQuiz.id,
        question_text: 'What is 2 + 2?',
        options_json: ['3', '4', '5'],
        correct_option: 1,
        marks: 1,
        school_id: school.id
      },
      { transaction }
    );
    await OnlineExamAttempt.create(
      {
        online_exam_id: completedQuiz.id,
        student_id: student.id,
        answers_json: { [completedQuestion.id]: 1 },
        score: 1,
        status: 'submitted',
        school_id: school.id,
        submitted_at: '2026-06-20T10:00:00Z'
      },
      { transaction }
    );
    const availableQuiz = await OnlineExam.create(
      {
        title: 'Math Practice Quiz',
        description: 'Published demo assessment',
        class_id: classOne.id,
        subject_id: subjects.MATH.id,
        branch_id: branch.id,
        duration_minutes: 15,
        pass_marks: 1,
        total_marks: 1,
        status: 'published',
        school_id: school.id,
        created_by: users.teacher.id
      },
      { transaction }
    );
    await OnlineExamQuestion.create(
      {
        online_exam_id: availableQuiz.id,
        question_text: 'What is 3 + 2?',
        options_json: ['4', '5', '6'],
        correct_option: 1,
        marks: 1,
        school_id: school.id
      },
      { transaction }
    );
    const secondBranchQuiz = await OnlineExam.create(
      {
        title: 'Second Branch Science Quiz',
        description: 'Published assessment for Second Branch',
        class_id: riversideClass.id,
        branch_id: branchTwo.id,
        duration_minutes: 15,
        pass_marks: 1,
        total_marks: 1,
        status: 'published',
        school_id: school.id,
        created_by: users.teacher.id
      },
      { transaction }
    );
    await OnlineExamQuestion.create(
      {
        online_exam_id: secondBranchQuiz.id,
        question_text: 'Which planet do we live on?',
        options_json: ['Mars', 'Earth', 'Venus'],
        correct_option: 1,
        marks: 1,
        school_id: school.id
      },
      { transaction }
    );
    await StudentPromotion.create(
      {
        student_id: student.id,
        from_class_id: classOne.id,
        from_section_id: section.id,
        to_class_id: riversideClass.id,
        to_academic_year: '2027-2028',
        from_academic_year: year.code,
        action: 'promote',
        school_id: school.id,
        branch_id: branch.id,
        created_by: users.admin.id
      },
      { transaction }
    );
    await Alumni.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        student_id: student.id,
        name: 'Jamie Demo',
        passing_year: '2025',
        current_profession: 'Engineer',
        email: 'jamie.demo@example.local',
        is_active: true
      },
      { transaction }
    );
    await AlumniEvent.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        title: 'Demo Alumni Meet',
        description: 'Annual demo alumni gathering',
        event_date: '2026-12-20',
        venue: 'Main Auditorium',
        status: 'upcoming'
      },
      { transaction }
    );
    await DynamicEntityRecord.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        entity_type: 'school_notice',
        title: 'Annual Sports Day & Term Assessments',
        date_value: '2026-10-15',
        status: 'active',
        notes:
          'Dear Parents and Students, Annual Sports Day will be held on Nov 15. All term assessments will commence from Nov 20.',
        payload: {
          priority: 'high',
          category: 'academic'
        },
        created_by: users.admin.id
      },
      { transaction }
    );
    await DynamicEntityRecord.create(
      {
        school_id: school.id,
        branch_id: branch.id,
        class_id: classOne.id,
        entity_type: 'attachment',
        title: 'Fractions: equivalent fractions',
        status: 'active',
        notes: 'Review the examples and complete the practice questions.',
        payload: {
          resource_type: 'link',
          topic: 'Fractions',
          subject_id: subjects.MATH.id,
          subject_name: 'Mathematics',
          academic_year: year.code || year.name,
          external_url: 'https://www.khanacademy.org/math/arithmetic/fraction-arithmetic'
        },
        created_by: users.teacher.id
      },
      { transaction }
    );
    for (const record of [
      {
        entity_type: 'enquiry',
        title: 'Jordan Lee',
        reference_no: '90000 00011',
        class_id: classOne.id,
        notes: 'Interested in Class 1; follow up next week.'
      },
      {
        entity_type: 'visitor',
        title: 'Avery Morgan',
        reference_no: '90000 00012',
        notes: 'Campus tour; meeting the admissions team.'
      },
      {
        entity_type: 'call_log',
        title: 'Parent enquiry · 90000 00013',
        notes: 'Asked about the upcoming admission dates.'
      },
      {
        entity_type: 'postal',
        title: 'Board circular',
        status: 'inward',
        notes: 'Academic calendar circular received.'
      },
      {
        entity_type: 'complaint',
        title: 'Main Branch bus pickup delay',
        status: 'open',
        notes: 'Parent reported a delayed morning pickup; follow up with the transport coordinator.'
      }
    ]) {
      await DynamicEntityRecord.create(
        {
          ...record,
          status: record.status || 'active',
          date_value: todayIso,
          school_id: school.id,
          branch_id: branch.id,
          created_by: users.receptionist.id
        },
        { transaction }
      );
    }

    await transaction.commit();
    await Promise.all(
      archivedFilesToRemove.map(file =>
        fs.unlink(file).catch(error => {
          if (error.code !== 'ENOENT')
            console.warn(`Could not remove demo report-card archive: ${error.message}`);
        })
      )
    );
    console.log(
      JSON.stringify(
        {
          school: { name: school.name, code: school.code },
          branches: [branch.code, branchTwo.code],
          demo_data: {
            academic_year: year.code,
            class: classOne.name,
            student: student.admission_number,
            exam: exam.name
          },
          accounts: accounts.map(([email, , , role]) => ({ email, role, password: PASSWORD }))
        },
        null,
        2
      )
    );
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
