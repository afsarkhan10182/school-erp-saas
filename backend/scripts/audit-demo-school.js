require('module-alias/register');
require('dotenv').config();

const models = require('../src/models');

const required = {
  branches: models.Branch,
  users: models.User,
  classes: models.Class,
  students: models.Student,
  terms: models.Term,
  exams: models.Exam,
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
  library_books: models.LibraryBook,
  library_issues: models.LibraryIssue,
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
  report_templates: null
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
      counts[name] = await models.DynamicEntityRecord.count({ where: { ...where, entity_type: 'fee_allocation' } });
    } else if (name === 'vehicle_routes') {
      const [[row]] = await models.sequelize.query(
        'SELECT COUNT(*)::int AS count FROM vehicle_routes WHERE vehicle_id IN (SELECT id FROM vehicles WHERE school_id = :schoolId)',
        { replacements: { schoolId: school.id } }
      );
      counts[name] = row.count;
    } else {
      counts[name] = await model.count({ where });
    }
  }

  const branches = await models.Branch.findAll({ where, attributes: ['name', 'code'], raw: true });
  const missing = Object.entries(counts).filter(([, count]) => count < 1).map(([name]) => name);
  const result = { school: school.code, branches, counts, missing, passed: missing.length === 0 };
  console.log(JSON.stringify(result, null, 2));
  await models.sequelize.close();
  if (missing.length) process.exitCode = 1;
}

run().catch(error => {
  console.error(`Demo audit failed: ${error.message}`);
  process.exitCode = 1;
});
