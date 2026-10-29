require('module-alias/register');
require('dotenv').config();
const { Op } = require('sequelize');

const models = require('../src/models');

const required = {
  branches: models.Branch,
  users: models.User,
  classes: models.Class,
  students: models.Student,
  terms: models.Term,
  exams: models.Exam,
  report_card_setups: models.ReportCardSetup,
  exam_schedules: models.ExamSchedule,
  exam_subject_marks: models.ExamSubjectMark,
  mark_distributions: models.MarkDistribution,
  exam_results: models.ExamResult,
  exam_reports: models.ExamReport,
  fee_types: models.FeeType,
  fee_structures: models.FeeStructure,
  fee_invoices: models.FeeInvoice,
  fee_payments: models.FeePayment,
  fee_fines: models.FeeFine,
  attendance_sessions: models.AttendanceSession,
  attendance_records: models.AttendanceRecord,
  timetables: models.Timetable,
  homework: models.Homework,
  live_classes: models.LiveClass,
  syllabus_units: models.SyllabusUnit,
  study_materials: null,
  library_books: models.LibraryBook,
  library_issues: models.LibraryIssue,
  library_book_requests: models.LibraryBookRequest,
  fee_allocations: null,
  academic_calendar: models.AcademicCalendar,
  student_categories: models.StudentCategory,
  streams: models.Stream,
  subject_teachers: models.SubjectTeacher,
  class_subject_assignments: models.ClassSubjectAssignment,
  class_teachers: models.ClassTeacher,
  exam_halls: models.ExamHall,
  grading_systems: models.GradingSystem,
  grade_scales: null,
  card_templates: models.CardTemplate,
  transport_routes: models.TransportRoute,
  vehicles: models.Vehicle,
  student_transport: models.StudentTransport,
  hostels: models.Hostel,
  hostel_rooms: models.HostelRoom,
  inventory_items: models.InventoryItem,
  stores: models.Store,
  account_categories: models.AccountCategory,
  school_transactions: models.SchoolTransaction,
  online_exams: models.OnlineExam,
  online_exam_questions: models.OnlineExamQuestion,
  online_exam_attempts: models.OnlineExamAttempt,
  exam_seatings: models.ExamSeating,
  student_promotions: models.StudentPromotion,
  inventory_issues: models.ItemIssue,
  vehicle_routes: null,
  alumni: models.Alumni,
  alumni_events: models.AlumniEvent,
  certificate_templates: models.CertificateTemplate,
  report_templates: null,
  parent_teacher_meetings: models.ParentTeacherMeeting,
  parent_teacher_meeting_students: null,
  settings_history: models.SettingsChangeLog,
  gate_passes: models.GatePass
};

async function run() {
  const school = await models.School.findOne({ where: { code: 'DEMOERP' } });
  if (!school) throw new Error('DEMOERP school is missing');

  const where = { school_id: school.id };
  const counts = {};
  for (const [name, model] of Object.entries(required)) {
    if (name === 'certificate_templates') {
      const [[row]] = await models.sequelize.query(
        'SELECT COUNT(*)::int AS count FROM certificate_templates WHERE branch_id IN (SELECT id FROM branches WHERE school_id = :schoolId)',
        { replacements: { schoolId: school.id } }
      );
      counts[name] = row.count;
    } else if (name === 'report_templates') {
      const [[row]] = await models.sequelize.query(
        'SELECT COUNT(*)::int AS count FROM report_templates WHERE school_id = :schoolId',
        { replacements: { schoolId: school.id } }
      );
      counts[name] = row.count;
    } else if (name === 'grade_scales') {
      const [[row]] = await models.sequelize.query(
        'SELECT COUNT(*)::int AS count FROM grade_scales WHERE grading_system_id IN (SELECT id FROM grading_systems WHERE school_id = :schoolId)',
        { replacements: { schoolId: school.id } }
      );
      counts[name] = row.count;
    } else if (name === 'fee_allocations') {
      counts[name] = await models.DynamicEntityRecord.count({
        where: { ...where, entity_type: 'fee_allocation' }
      });
    } else if (name === 'study_materials') {
      const student = await models.Student.findOne({
        where: { ...where, admission_number: 'DEMO-001' }
      });
      counts[name] = student
        ? await models.DynamicEntityRecord.count({
            where: {
              ...where,
              entity_type: 'attachment',
              branch_id: student.branch_id,
              class_id: student.class_id,
              status: 'active'
            }
          })
        : 0;
    } else if (name === 'vehicle_routes') {
      const [[row]] = await models.sequelize.query(
        'SELECT COUNT(*)::int AS count FROM vehicle_routes WHERE vehicle_id IN (SELECT id FROM vehicles WHERE school_id = :schoolId)',
        { replacements: { schoolId: school.id } }
      );
      counts[name] = row.count;
    } else if (name === 'parent_teacher_meeting_students') {
      counts[name] = await models.ParentTeacherMeetingStudent.count({
        include: [{ model: models.ParentTeacherMeeting, as: 'meeting', where, required: true }]
      });
    } else {
      counts[name] = await model.count({ where });
    }
  }

  const branchRows = await models.Branch.findAll({
    where,
    attributes: ['id', 'name', 'code'],
    raw: true
  });
  const branches = branchRows.map(({ name, code }) => ({ name, code }));
  const passRows = await models.GatePass.findAll({
    where,
    attributes: ['branch_id', 'status'],
    raw: true
  });
  const mainBranchId = branchRows.find(branch => branch.code === 'MAIN')?.id;
  const secondBranchId = branchRows.find(branch => branch.code === 'SECOND')?.id;
  const missing = Object.entries(counts)
    .filter(([, count]) => count < 1)
    .map(([name]) => name);
  counts.main_branch_textbook_category = await models.DynamicEntityRecord.count({
    where: {
      ...where,
      branch_id: mainBranchId,
      entity_type: 'library_category',
      title: 'Textbook',
      status: 'active'
    }
  });
  if (!counts.main_branch_textbook_category) missing.push('main_branch_textbook_category');
  counts.library_books_by_branch = {
    main: mainBranchId ? await models.LibraryBook.count({ where: { ...where, branch_id: mainBranchId } }) : 0,
    second: secondBranchId ? await models.LibraryBook.count({ where: { ...where, branch_id: secondBranchId } }) : 0
  };
  if (!counts.library_books_by_branch.main) missing.push('main_branch_library_book');
  if (!counts.library_books_by_branch.second) missing.push('second_branch_library_book');
  counts.second_branch_textbook_category = await models.DynamicEntityRecord.count({
    where: {
      ...where,
      branch_id: secondBranchId,
      entity_type: 'library_category',
      title: 'Textbook',
      status: 'active'
    }
  });
  if (!counts.second_branch_textbook_category) missing.push('second_branch_textbook_category');
  counts.main_pending_gate_passes = passRows.filter(
    pass => pass.branch_id === mainBranchId && pass.status === 'pending'
  ).length;
  counts.second_branch_active_gate_passes = passRows.filter(
    pass => pass.branch_id === secondBranchId && pass.status === 'out'
  ).length;
  const homeworkCounts = await models.Homework.count({
    where,
    attributes: ['branch_id'],
    group: ['branch_id'],
    raw: true
  });
  const homeworkBranchIds = new Set(homeworkCounts.map(row => row.branch_id));
  counts.homework_main_branch = homeworkBranchIds.has(mainBranchId)
    ? homeworkCounts.find(row => row.branch_id === mainBranchId).count
    : 0;
  counts.homework_second_branch = homeworkBranchIds.has(secondBranchId)
    ? homeworkCounts.find(row => row.branch_id === secondBranchId).count
    : 0;
  if (!counts.homework_main_branch) missing.push('homework_main_branch');
  if (!counts.homework_second_branch) missing.push('homework_second_branch');
  counts.live_class_attendance_rows = await models.LiveClassAttendance.count({
    include: [{ model: models.LiveClass, as: 'liveClass', where, required: true }]
  });
  if (counts.live_class_attendance_rows < 3) missing.push('live_class_attendance_roster');
  counts.live_classes_by_branch = {
    main: mainBranchId
      ? await models.LiveClass.count({ where: { ...where, branch_id: mainBranchId } })
      : 0,
    second: secondBranchId
      ? await models.LiveClass.count({ where: { ...where, branch_id: secondBranchId } })
      : 0
  };
  if (!counts.live_classes_by_branch.main) missing.push('main_branch_live_class');
  if (!counts.live_classes_by_branch.second) missing.push('second_branch_live_class');
  counts.syllabus_units_by_branch = {
    main: mainBranchId
      ? await models.SyllabusUnit.count({ where: { ...where, branch_id: mainBranchId } })
      : 0,
    second: secondBranchId
      ? await models.SyllabusUnit.count({ where: { ...where, branch_id: secondBranchId } })
      : 0
  };
  if (!counts.syllabus_units_by_branch.main) missing.push('main_branch_syllabus');
  if (!counts.syllabus_units_by_branch.second) missing.push('second_branch_syllabus');
  const [[markReady]] = await models.sequelize.query(
    `SELECT COUNT(DISTINCT branch_id)::int AS count
     FROM exam_schedules
     WHERE school_id = :schoolId
       AND class_id IS NOT NULL
       AND section_id IS NOT NULL
       AND subject_id IS NOT NULL
       AND COALESCE(total_marks, 0) > 0
       AND COALESCE(pass_marks, 0) BETWEEN 1 AND total_marks
       AND COALESCE(theory_marks, 0) + COALESCE(practical_marks, 0)
           + COALESCE(viva_marks, 0) + COALESCE(assignment_marks, 0) = total_marks`,
    { replacements: { schoolId: school.id } }
  );
  counts.branches_with_mark_entry_ready_exams = markReady.count;
  if (markReady.count < 2) missing.push('mark_entry_ready_exam_each_branch');
  const [[componentResults]] = await models.sequelize.query(
    `SELECT COUNT(*)::int AS count
     FROM exam_results
     WHERE school_id = :schoolId
       AND is_absent = false
       AND (theory_marks_obtained IS NOT NULL OR practical_marks_obtained IS NOT NULL
            OR viva_marks_obtained IS NOT NULL OR assignment_marks_obtained IS NOT NULL)
       AND COALESCE(theory_marks_obtained, 0) + COALESCE(practical_marks_obtained, 0)
           + COALESCE(viva_marks_obtained, 0) + COALESCE(assignment_marks_obtained, 0) = marks_obtained`,
    { replacements: { schoolId: school.id } }
  );
  counts.exam_results_with_component_marks = componentResults.count;
  if (!componentResults.count) missing.push('exam_result_component_marks');
  const [[subjectMarks]] = await models.sequelize.query(
    `SELECT COUNT(*)::int AS count
     FROM exam_subject_marks
     WHERE school_id = :schoolId
       AND is_absent = false
       AND (theory_marks_obtained IS NOT NULL OR practical_marks_obtained IS NOT NULL
            OR viva_marks_obtained IS NOT NULL OR assignment_marks_obtained IS NOT NULL)
       AND COALESCE(theory_marks_obtained, 0) + COALESCE(practical_marks_obtained, 0)
           + COALESCE(viva_marks_obtained, 0) + COALESCE(assignment_marks_obtained, 0) = marks_obtained`,
    { replacements: { schoolId: school.id } }
  );
  counts.exam_subject_marks_with_component_data = subjectMarks.count;
  if (!subjectMarks.count) missing.push('exam_subject_mark_component_data');
  const [[subjectMarkBranches]] = await models.sequelize.query(
    'SELECT COUNT(DISTINCT branch_id)::int AS count FROM exam_subject_marks WHERE school_id = :schoolId',
    { replacements: { schoolId: school.id } }
  );
  counts.branches_with_exam_subject_marks = subjectMarkBranches.count;
  if (subjectMarkBranches.count < 2) missing.push('exam_subject_marks_each_branch');
  const [[publishedReportSetups]] = await models.sequelize.query(
    `SELECT COUNT(DISTINCT setup.branch_id)::int AS count
     FROM report_card_setups setup
     JOIN report_card_setup_exams setup_exam ON setup_exam.setup_id = setup.id
     JOIN report_templates template ON template.id = setup.template_id
     JOIN exams exam ON exam.id = setup_exam.exam_id
     WHERE setup.school_id = :schoolId
       AND setup.is_published = true
       AND template.is_active = true
       AND template.report_type IN ('student_wise', 'detailed')
       AND exam.school_id = setup.school_id
       AND exam.branch_id = setup.branch_id
       AND exam.is_active = true
       AND exam.result_status = true`,
    { replacements: { schoolId: school.id } }
  );
  counts.branches_with_published_report_card_setups = publishedReportSetups.count;
  if (publishedReportSetups.count < 2) missing.push('published_report_card_setup_each_branch');
  const [[setupExamRows]] = await models.sequelize.query(
    `SELECT COUNT(*)::int AS count FROM report_card_setup_exams setup_exam
     JOIN report_card_setups setup ON setup.id = setup_exam.setup_id
     WHERE setup.school_id = :schoolId`,
    { replacements: { schoolId: school.id } }
  );
  counts.report_card_setup_exams = setupExamRows.count;
  if (!setupExamRows.count) missing.push('report_card_setup_exams');
  counts.installment_fee_structures = await models.FeeStructure.count({
    where: { ...where, payment_model: 'installment', installment_type: 'multiple' }
  });
  if (!counts.installment_fee_structures) missing.push('installment_fee_structures');
  counts.installment_fee_invoices = await models.FeeInvoice.count({
    where: { ...where, payment_model: 'installment' }
  });
  if (counts.installment_fee_invoices < 2) missing.push('installment_fee_invoices');
  counts.published_online_exams = await models.OnlineExam.count({
    where: { ...where, status: 'published' }
  });
  counts.published_online_exams_with_questions = await models.OnlineExam.count({
    where: { ...where, status: 'published' },
    include: [{ model: models.OnlineExamQuestion, as: 'questions', required: true }],
    distinct: true
  });
  if (counts.published_online_exams < 2) missing.push('published_online_exams');
  if (!counts.published_online_exams_with_questions)
    missing.push('published_online_exam_questions');
  counts.timetable_slots = await models.TimetableSlot.count({
    include: [
      { model: models.Timetable, as: 'timetable', where: { school_id: school.id }, required: true }
    ]
  });
  if (!counts.timetable_slots) missing.push('timetable_slots');
  const demoTeacher = await models.User.findOne({
    where: { school_id: school.id, email: 'demo.teacher@schoolerp.local' },
    attributes: ['id']
  });
  counts.teacher_timetable_slots = demoTeacher
    ? await models.TimetableSlot.count({
        where: { teacher_id: demoTeacher.id, is_active: true },
        include: [
          {
            model: models.Timetable,
            as: 'timetable',
            where: { school_id: school.id, academic_year: '2026-2027', is_active: true },
            required: true
          }
        ]
      })
    : 0;
  if (!counts.teacher_timetable_slots) missing.push('teacher_timetable_slots');
  const secondBranch = await models.Branch.findOne({
    where: { ...where, code: 'SECOND' },
    attributes: ['id']
  });
  const mainBranch = await models.Branch.findOne({
    where: { ...where, code: 'MAIN' },
    attributes: ['id']
  });
  counts.class_subject_assignments_by_branch = {
    main: mainBranch
      ? await models.ClassSubjectAssignment.count({ where: { ...where, branch_id: mainBranch.id } })
      : 0,
    second: secondBranch
      ? await models.ClassSubjectAssignment.count({
          where: { ...where, branch_id: secondBranch.id }
        })
      : 0
  };
  if (!counts.class_subject_assignments_by_branch.main)
    missing.push('main_branch_class_subject_assignment');
  if (!counts.class_subject_assignments_by_branch.second)
    missing.push('second_branch_class_subject_assignment');
  const secondBranchTeacher = secondBranch
    ? await models.User.findOne({
        where: {
          ...where,
          branch_id: secondBranch.id,
          role: 'teacher',
          email: 'demo.teacher.second@schoolerp.local'
        },
        attributes: ['id']
      })
    : null;
  counts.second_branch_class_teacher_assignments = secondBranchTeacher
    ? await models.ClassTeacher.count({
        where: { ...where, branch_id: secondBranch.id, teacher_id: secondBranchTeacher.id }
      })
    : 0;
  counts.second_branch_subject_teacher_assignments = secondBranchTeacher
    ? await models.SubjectTeacher.count({
        where: { ...where, branch_id: secondBranch.id, teacher_id: secondBranchTeacher.id }
      })
    : 0;
  if (!counts.second_branch_class_teacher_assignments)
    missing.push('second_branch_class_teacher_assignment');
  if (!counts.second_branch_subject_teacher_assignments)
    missing.push('second_branch_subject_teacher_assignment');
  counts.ptm_meetings_by_branch = {
    main: mainBranch
      ? await models.ParentTeacherMeeting.count({ where: { ...where, branch_id: mainBranch.id } })
      : 0,
    second: secondBranch
      ? await models.ParentTeacherMeeting.count({ where: { ...where, branch_id: secondBranch.id } })
      : 0
  };
  if (!counts.ptm_meetings_by_branch.main) missing.push('main_branch_ptm_meeting');
  if (!counts.ptm_meetings_by_branch.second) missing.push('second_branch_ptm_meeting');
  counts.ptm_attendees = await models.ParentTeacherMeetingStudent.count({
    include: [{ model: models.ParentTeacherMeeting, as: 'meeting', where, required: true }]
  });
  if (counts.ptm_attendees < 3) missing.push('ptm_attendees');
  counts.second_branch_exams = secondBranch
    ? await models.Exam.count({ where: { ...where, branch_id: secondBranch.id } })
    : 0;
  counts.second_branch_exam_results = secondBranch
    ? await models.ExamResult.count({ where: { ...where, branch_id: secondBranch.id } })
    : 0;
  counts.second_branch_students_with_guardians = secondBranch
    ? await models.StudentParent.count({
        include: [
          {
            model: models.Student,
            as: 'student',
            where: { school_id: school.id, branch_id: secondBranch.id },
            required: true
          }
        ]
      })
    : 0;
  if (!counts.second_branch_exams) missing.push('second_branch_exams');
  if (!counts.second_branch_exam_results) missing.push('second_branch_exam_results');
  if (!counts.second_branch_students_with_guardians) missing.push('second_branch_student_guardian');
  counts.second_branch_fee_structures = secondBranch
    ? await models.FeeStructure.count({ where: { ...where, branch_id: secondBranch.id } })
    : 0;
  counts.second_branch_fee_invoices = secondBranch
    ? await models.FeeInvoice.count({ where: { ...where, branch_id: secondBranch.id } })
    : 0;
  if (!counts.second_branch_fee_structures) missing.push('second_branch_fee_structures');
  if (!counts.second_branch_fee_invoices) missing.push('second_branch_fee_invoices');
  const streamClass = await models.Class.findOne({ where: { ...where, has_stream: true } });
  counts.stream_classes_with_stream = streamClass
    ? await models.Stream.count({ where: { ...where, class_id: streamClass.id } })
    : 0;
  counts.stream_sections = streamClass
    ? await models.Section.count({
        where: { ...where, class_id: streamClass.id, stream_id: { [Op.not]: null } }
      })
    : 0;
  counts.students_assigned_to_stream = await models.Student.count({
    where: { ...where, stream_id: { [Op.not]: null } }
  });
  if (!counts.stream_classes_with_stream) missing.push('stream_classes_with_stream');
  if (!counts.stream_sections) missing.push('stream_sections');
  if (!counts.students_assigned_to_stream) missing.push('students_assigned_to_stream');

  counts.overdue_fee_invoices = await models.FeeInvoice.count({
    where: { school_id: school.id, status: 'overdue' }
  });
  if (!counts.overdue_fee_invoices) missing.push('overdue_fee_invoices');
  counts.published_attendance_sessions_with_section = await models.AttendanceSession.count({
    where: { school_id: school.id, section_id: { [Op.not]: null }, status: 'published' }
  });
  counts.attendance_records_with_section = await models.AttendanceRecord.count({
    where: { school_id: school.id, section_id: { [Op.not]: null } }
  });
  const today = new Date().toISOString().slice(0, 10);
  counts.upcoming_homework = await models.Homework.count({
    where: { school_id: school.id, due_date: { [Op.gte]: today } }
  });
  counts.homework_with_academic_year = await models.Homework.count({
    where: { school_id: school.id, academic_year: { [Op.not]: null } }
  });
  if (!counts.published_attendance_sessions_with_section)
    missing.push('published_attendance_sessions_with_section');
  if (counts.attendance_records_with_section < 2) missing.push('attendance_records_with_section');
  if (!counts.upcoming_homework) missing.push('upcoming_homework');
  if (!counts.homework_with_academic_year) missing.push('homework_with_academic_year');
  const routeDetails = await models.TransportRoute.findAll({
    where,
    attributes: ['start_point', 'end_point', 'fare'],
    raw: true
  });
  counts.transport_routes_with_details = routeDetails.filter(
    route => route.start_point && route.end_point && Number(route.fare) > 0
  ).length;
  if (counts.transport_routes_with_details < 1) missing.push('transport_route_details');
  const demoInventory = await models.InventoryItem.findOne({
    where,
    attributes: ['unit_price'],
    raw: true
  });
  if (!demoInventory || Number(demoInventory.unit_price) <= 0) missing.push('inventory_item_price');
  for (const entityType of ['enquiry', 'visitor', 'call_log', 'postal', 'complaint']) {
    counts[`reception_${entityType}`] = await models.DynamicEntityRecord.count({
      where: { ...where, entity_type: entityType }
    });
    if (counts[`reception_${entityType}`] < 1) missing.push(`reception_${entityType}`);
  }
  const enquiryWithClass = await models.DynamicEntityRecord.findOne({
    where: { ...where, entity_type: 'enquiry' },
    include: [{ model: models.Class, as: 'class', attributes: ['id'], required: true }]
  });
  counts.reception_enquiries_with_class = enquiryWithClass ? 1 : 0;
  if (!enquiryWithClass) missing.push('reception_enquiry_class');
  const result = { school: school.code, branches, counts, missing, passed: missing.length === 0 };
  console.log(JSON.stringify(result, null, 2));
  await models.sequelize.close();
  if (missing.length) process.exitCode = 1;
}

run().catch(error => {
  console.error(`Demo audit failed: ${error.message}`);
  process.exitCode = 1;
});
