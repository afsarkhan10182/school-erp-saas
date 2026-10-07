require('dotenv').config();

const baseUrl = process.env.DEMO_API_URL || 'http://localhost:8000/api';

async function run() {
  const accounts = ['admin', 'branch', 'teacher', 'reception', 'accountant', 'librarian', 'parent', 'student'];
  const logins = await Promise.all(accounts.map(account => fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: `demo.${account}@schoolerp.local`, password: 'Demo@12345' })
  })));
  if (logins.some(response => !response.ok)) throw new Error(`role login failure: ${logins.map(response => response.status).join(',')}`);
  const login = logins[0];
  if (!login.ok) throw new Error(`login ${login.status}`);
  const sessionCookie = response => response.headers.get('set-cookie')?.split(';')[0];
  const cookie = sessionCookie(login);
  if (!cookie) throw new Error('login did not return an auth cookie');
  const studentCookie = sessionCookie(logins[7]);
  const portal = await fetch(`${baseUrl}/portal/dashboard`, { headers: { cookie: studentCookie } });
  const availableExams = await fetch(`${baseUrl}/online-exams/available`, { headers: { cookie: studentCookie } });
  if (!portal.ok || !availableExams.ok) throw new Error(`student workflow failure: portal ${portal.status}, online exams ${availableExams.status}`);
  const json = async path => {
    const response = await fetch(`${baseUrl}${path}`, { headers: { cookie } });
    if (!response.ok) throw new Error(`${path} ${response.status}`);
    return response.json();
  };
  const branchPayload = await json('/branches');
  const branches = branchPayload.data?.branches || branchPayload.data || [];
  const branchNames = branches.map(branch => branch.name).sort();
  if (branchNames.join('|') !== 'Main Branch|Second Branch') throw new Error(`branch fixture mismatch: ${branchNames.join('|')}`);
  const mainStudents = await json(`/students?branch_id=${encodeURIComponent(branches.find(branch => branch.code === 'MAIN').id)}`);
  const secondStudents = await json(`/students?branch_id=${encodeURIComponent(branches.find(branch => branch.code === 'SECOND').id)}`);
  const studentCount = payload => Array.isArray(payload.data) ? payload.data.length : (payload.data?.students?.length ?? payload.data?.data?.length ?? 0);
  if (studentCount(mainStudents) !== 2 || studentCount(secondStudents) !== 0) throw new Error('branch student isolation mismatch');

  const paths = [
    '/branches', '/students', '/parents', '/classes', '/sections', '/subjects', '/academic-years',
    '/academic-calendar', '/streams', '/student-categories', '/subject-teachers',
    '/class-subject-assignments', '/class-teachers',
    '/exam-terms', '/exams', '/exam-schedules', '/exams/stats', '/homeworks',
    '/library/books', '/library/issues', '/fee-types', '/fee-structures', '/fee-fines', '/fee-invoices/student-fee-summary',
    '/attendance/sessions', '/attendance/reports/summary', '/timetables',
    '/exam-halls', '/grading-systems', '/cards/templates',
    '/transport/routes', '/transport/vehicles', '/transport/allocations',
    '/hostel/hostels', '/hostel/rooms', '/inventory/categories', '/inventory/items',
    '/inventory/stores', '/accounting/categories', '/accounting/transactions',
    '/online-exams', '/certificate-templates', '/reports/catalog', '/alumni/directory', '/alumni/events'
    ,'/exam-seatings', '/inventory/issues'
    ,'/dashboard/stats', '/dashboard/recent-activities', '/dashboard/students-chart',
    '/dashboard/fees-chart', '/dashboard/student-distribution', '/dashboard/fee-trend',
    '/dashboard/fee-collection-summary', '/dashboard/income-vs-expense',
    '/reports/students', '/reports/fees', '/reports/exams', '/reports/attendance',
    '/export/formats?report_type=students', '/export/report-types'
    ,'/schools/my-school', '/settings/school', '/settings/academic', '/settings/fee', '/settings/branding', '/settings/system'
    ,'/students/stats', '/students/report', '/academic-years/current', '/exam-terms/current',
    '/grading-systems/default', '/attendance/analytics', '/attendance/analytics/summary',
    '/attendance/analytics/trends', '/attendance/reports', '/attendance/reports/summary',
    '/fee-invoices/student-fee-summary', '/certificates/test'
  ];
  const results = [];
  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`, { headers: { cookie } });
    results.push({ path, status: response.status, passed: response.status < 400 });
  }
  console.log(JSON.stringify({ passed: results.every(result => result.passed), role_accounts: accounts.length, student_workflows: true, branches: branchNames, main_students: studentCount(mainStudents), second_students: studentCount(secondStudents), results }, null, 2));
  if (results.some(result => !result.passed)) process.exitCode = 1;
}

run().catch(error => {
  console.error(`Demo route smoke test failed: ${error.message}`);
  process.exitCode = 1;
});
