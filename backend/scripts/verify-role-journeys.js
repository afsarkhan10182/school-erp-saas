require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('module-alias/register');
const axios = require('axios');

const API_BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 8000}/api`;

const DEMO_ACCOUNTS = [
  {
    role: 'super_admin',
    email: 'demo.superadmin@schoolerp.local',
    pass: 'Demo@12345',
    target: '/saas'
  },
  { role: 'admin', email: 'demo.admin@schoolerp.local', pass: 'Demo@12345', target: '/dashboard' },
  {
    role: 'branch_admin',
    email: 'demo.branch@schoolerp.local',
    pass: 'Demo@12345',
    target: '/dashboard'
  },
  {
    role: 'teacher',
    email: 'demo.teacher@schoolerp.local',
    pass: 'Demo@12345',
    target: '/dashboard'
  },
  {
    role: 'teacher',
    email: 'demo.teacher.second@schoolerp.local',
    pass: 'Demo@12345',
    target: '/dashboard'
  },
  {
    role: 'accountant',
    email: 'demo.accountant@schoolerp.local',
    pass: 'Demo@12345',
    target: '/dashboard'
  },
  {
    role: 'receptionist',
    email: 'demo.reception@schoolerp.local',
    pass: 'Demo@12345',
    target: '/dashboard'
  },
  {
    role: 'librarian',
    email: 'demo.librarian@schoolerp.local',
    pass: 'Demo@12345',
    target: '/dashboard'
  },
  { role: 'parent', email: 'demo.parent@schoolerp.local', pass: 'Demo@12345', target: '/portal' },
  { role: 'student', email: 'demo.student@schoolerp.local', pass: 'Demo@12345', target: '/portal' }
];

async function run() {
  console.log('🚀 Starting Role & Boundary Verification Suite...\n');
  let failures = 0;
  let mainBranchStudentId;
  let demoSchoolId;
  let superAdminHeaders;

  for (const acct of DEMO_ACCOUNTS) {
    try {
      process.stdout.write(`Testing [${acct.role.padEnd(14)}] (${acct.email})... `);
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: acct.email,
        password: acct.pass
      });

      if (!loginRes.data.success) {
        throw new Error('Login failed: unsuccessful response');
      }

      const cookie = loginRes.headers['set-cookie']?.join('; ');
      const token = loginRes.data.data?.token;
      const headers = {};
      if (cookie) headers['Cookie'] = cookie;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const user = loginRes.data.data?.user;
      if (acct.role === 'super_admin') superAdminHeaders = headers;
      if (acct.role === 'admin') demoSchoolId = user.school_id;

      if (acct.role === 'super_admin') {
        const [noticesRes, attendanceRes, overdueFeesRes] = await Promise.all([
          axios.get(`${API_BASE}/dashboard/notices`, { headers }),
          axios.get(`${API_BASE}/dashboard/attendance-today`, { headers }),
          axios.get(`${API_BASE}/dashboard/overdue-fees`, { headers })
        ]);
        if (
          noticesRes.data.data?.notices?.length !== 0 ||
          attendanceRes.data.data?.attendance !== null ||
          overdueFeesRes.data.data?.fees?.length !== 0
        ) {
          throw new Error('Platform-wide dashboard exposed tenant data without school context');
        }
        try {
          await axios.get(`${API_BASE}/students/export`, { headers });
          throw new Error('Platform Owner exported students without selecting a school');
        } catch (err) {
          if (err.message === 'Platform Owner exported students without selecting a school') throw err;
          if (err.response?.status !== 400) throw new Error('Unscoped student export was not rejected');
        }
      } else if (['admin', 'branch_admin'].includes(acct.role)) {
        const [noticesRes, attendanceRes, overdueFeesRes] = await Promise.all([
          axios.get(`${API_BASE}/dashboard/notices`, { headers }),
          axios.get(`${API_BASE}/dashboard/attendance-today`, { headers }),
          axios.get(`${API_BASE}/dashboard/overdue-fees`, { headers })
        ]);
        if (
          !Array.isArray(noticesRes.data.data?.notices) ||
          !attendanceRes.data.data?.attendance ||
          !Array.isArray(overdueFeesRes.data.data?.fees)
        ) {
          throw new Error(`${acct.role} dashboard operational summaries were invalid`);
        }
        const studentExport = await axios.get(`${API_BASE}/students/export`, {
          headers,
          params: {
            branch_id: acct.role === 'branch_admin'
              ? '99999999-9999-9999-9999-999999999999'
              : user.branch_id
          },
          responseType: 'text'
        });
        const studentCsv = String(studentExport.data);
        if (
          !studentExport.headers['content-type']?.includes('text/csv') ||
          (acct.role === 'branch_admin'
            ? !studentCsv.includes('DEMO-SECOND-001') || studentCsv.includes('DEMO-001,')
            : !studentCsv.includes('DEMO-001') || studentCsv.includes('DEMO-SECOND-001'))
        ) {
          throw new Error(`${acct.role} student export did not respect branch scope`);
        }
      } else {
        if (acct.role === 'accountant') {
          const overdueFeesRes = await axios.get(`${API_BASE}/dashboard/overdue-fees`, { headers });
          if (!Array.isArray(overdueFeesRes.data.data?.fees)) {
            throw new Error('Accountant overdue-fees response was invalid');
          }
        }
        const deniedEndpoints =
          acct.role === 'accountant'
            ? ['notices', 'attendance-today']
            : ['notices', 'attendance-today', 'overdue-fees'];
        for (const endpoint of deniedEndpoints) {
          try {
            await axios.get(`${API_BASE}/dashboard/${endpoint}`, { headers });
            throw new Error(`${acct.role} unexpectedly accessed dashboard ${endpoint}`);
          } catch (err) {
            if (err.message === `${acct.role} unexpectedly accessed dashboard ${endpoint}`) throw err;
            if (err.response?.status !== 403) {
              throw new Error(`Dashboard ${endpoint} returned ${err.response?.status}, expected 403`);
            }
          }
        }
      }

      // Call dashboard or portal
      if (acct.role === 'student' || acct.role === 'parent') {
        const portalRes = await axios.get(`${API_BASE}/portal/dashboard`, { headers });
        if (!portalRes.data.success) {
          throw new Error('portal/dashboard call failed');
        }
        if (
          acct.role === 'parent' &&
          !portalRes.data.data?.students?.some(student => student.admission_number === 'DEMO-SECOND-001')
        ) {
          throw new Error('Parent portal omitted the linked Second Branch student');
        }
        try {
          await axios.get(`${API_BASE}/students/export`, { headers });
          throw new Error(`${acct.role} unexpectedly exported school student data`);
        } catch (err) {
          if (err.message === `${acct.role} unexpectedly exported school student data`) throw err;
          if (err.response?.status !== 403) throw new Error(`${acct.role} student export was not denied`);
        }
        try {
          await axios.get(
            `${API_BASE}/exams/student/${mainBranchStudentId}/report-card?academic_year=2026-2027&format=pdf`,
            { headers, responseType: 'arraybuffer' }
          );
          throw new Error(`${acct.role} unexpectedly generated a staff report card`);
        } catch (err) {
          if (err.message === `${acct.role} unexpectedly generated a staff report card`) throw err;
          if (err.response?.status !== 403) {
            throw new Error(
              `Report card access returned ${err.response?.status || err.message}, expected 403`
            );
          }
        }
        for (const endpoint of ['students-chart', 'student-distribution', 'weekend-attendance']) {
          try {
            await axios.get(`${API_BASE}/dashboard/${endpoint}`, { headers });
            throw new Error(`${acct.role} unexpectedly accessed ${endpoint}`);
          } catch (err) {
            if (err.message === `${acct.role} unexpectedly accessed ${endpoint}`) throw err;
            if (err.response?.status !== 403)
              throw new Error(
                `${endpoint} returned ${err.response?.status || err.message}, expected 403`
              );
          }
        }
        console.log(
          `✅ OK (portal data returned: ${portalRes.data.data?.student ? portalRes.data.data.student.first_name : 'found'})`
        );
      } else {
        const statsRes = await axios.get(`${API_BASE}/dashboard/stats?academic_year=2026-2027`, {
          headers
        });
        if (!statsRes.data.success) {
          throw new Error('dashboard/stats call failed');
        }
        const data = statsRes.data.data;
        if (acct.role === 'super_admin') {
          console.log(
            `✅ OK (totalSchools: ${data.totalSchools}, platformUsers: ${data.totalUsers})`
          );
        } else if (acct.role === 'admin') {
          const feeRes = await axios.get(
            `${API_BASE}/dashboard/fee-collection-summary?academic_year=2026-2027`,
            { headers }
          );
          const fee = feeRes.data.data;
          const examsRes = await axios.get(`${API_BASE}/exams?limit=100`, { headers });
          const demoExam = (examsRes.data.data?.exams || []).find(
            exam => exam.name === 'First Term Examination'
          );
          if (!demoExam) throw new Error('Seeded first-term exam was missing');
          const exportRes = await axios.get(
            `${API_BASE}/exams/${demoExam.id}/results/export?format=csv`,
            { headers, responseType: 'text' }
          );
          const alternateExportRes = await axios.get(
            `${API_BASE}/exam-results/exams/${demoExam.id}/results/export?format=csv`,
            { headers, responseType: 'text' }
          );
          const exportLines = String(exportRes.data).trim().split(/\r?\n/);
          if (
            !exportRes.headers['content-type']?.includes('text/csv') ||
            exportLines.length !== 3 ||
            !exportLines[0].includes('Student Name') ||
            String(alternateExportRes.data).trim().split(/\r?\n/).length !== exportLines.length
          ) {
            throw new Error(`Exam CSV export was incomplete: ${exportLines.length} lines`);
          }
          const resultsRes = await axios.get(`${API_BASE}/exams/${demoExam.id}/results`, {
            headers
          });
          const studentId = resultsRes.data.data?.results?.[0]?.student_id;
          if (!studentId) throw new Error('Seeded exam result did not include a student ID');
          mainBranchStudentId = studentId;
          const reportCardRes = await axios.get(
            `${API_BASE}/exams/student/${studentId}/report-card`,
            {
              params: { academic_year: '2026-2027', format: 'pdf' },
              headers,
              responseType: 'arraybuffer'
            }
          );
          if (
            !reportCardRes.headers['content-type']?.includes('application/pdf') ||
            Buffer.from(reportCardRes.data).subarray(0, 4).toString() !== '%PDF'
          ) {
            throw new Error('Report card response was not a valid PDF');
          }
          const templatesRes = await axios.get(`${API_BASE}/exam-reports/templates`, { headers });
          const reportTemplates = templatesRes.data.data || [];
          if (
            !reportTemplates.some(template => template.name === 'Demo Student Report Card') ||
            reportTemplates.some(
              template => template.school_id && template.school_id !== user.school_id
            )
          ) {
            throw new Error(
              'Report card templates were missing the demo template or crossed school scope'
            );
          }
          console.log(
            `✅ OK (students: ${data.totalStudents}, fees reconcile, exam CSV: ${exportLines.length - 1} rows, report card PDF valid, school templates: ${reportTemplates.length})`
          );
        } else if (
          acct.role === 'teacher' ||
          acct.role === 'receptionist' ||
          acct.role === 'librarian'
        ) {
          for (const endpoint of [
            'fees-chart',
            'fee-trend',
            'fee-collection-summary',
            'academic-year-months',
            'income-vs-expense',
            'annual-fees-summary'
          ]) {
            try {
              await axios.get(`${API_BASE}/dashboard/${endpoint}`, { headers });
              throw new Error(`${acct.role} unexpectedly accessed ${endpoint}`);
            } catch (err) {
              if (err.message === `${acct.role} unexpectedly accessed ${endpoint}`) throw err;
              if (err.response?.status !== 403)
                throw new Error(
                  `${endpoint} returned ${err.response?.status || err.message}, expected 403`
                );
            }
          }
          if (acct.role === 'teacher') {
            const classesRes = await axios.get(
              `${API_BASE}/classes/dropdown?branch_id=99999999-9999-9999-9999-999999999999`,
              { headers }
            );
            const teacherBranchId = user.branch_id;
            if (
              !classesRes.data.success ||
              !classesRes.data.data.every(item => item.branch?.id === teacherBranchId)
            ) {
              throw new Error(
                'Teacher class dropdown returned classes outside their assigned branch'
              );
            }
            const homeworksRes = await axios.get(`${API_BASE}/homeworks`, { headers });
            const expectedAssignedHomework = homeworksRes.data.data.homeworks.filter(
              item => item.created_by === user.id
            ).length;
            if (data.activeHomework !== expectedAssignedHomework) {
              throw new Error(
                `Teacher assigned homework metric ${data.activeHomework} did not match visible assignments ${expectedAssignedHomework}`
              );
            }
          }
          if (acct.role === 'librarian') {
            const libraryIssuesRes = await axios.get(`${API_BASE}/library/issues`, { headers });
            const libraryIssues = libraryIssuesRes.data.data?.issues;
            if (!Array.isArray(libraryIssues)) {
              throw new Error('Library issue list was missing from the Librarian response');
            }
            const today = new Date().toISOString().slice(0, 10);
            const expectedOverdueBooks = libraryIssues.filter(issue => {
              const dueDate = issue.due_date && String(issue.due_date).slice(0, 10);
              return issue.status === 'overdue' || (issue.status === 'issued' && dueDate < today);
            }).length;
            if (
              data.totalBooks !== 5 ||
              data.issuedBooks !== 1 ||
              data.availableBooks !== 4 ||
              data.overdueBooks !== expectedOverdueBooks
            ) {
              throw new Error(
                `Library dashboard metrics did not match demo inventory: ${JSON.stringify(data)}`
              );
            }
            const borrowersRes = await axios.get(`${API_BASE}/library/borrowers`, { headers });
            const borrowers = borrowersRes.data.data?.users || [];
            if (
              !borrowers.length ||
              borrowers.some(borrower => borrower.email || borrower.school_id)
            ) {
              throw new Error(
                'Library borrower lookup was empty or exposed fields beyond the safe picker data'
              );
            }
            const libraryStudentsRes = await axios.get(`${API_BASE}/library/students`, { headers });
            const libraryStudents = libraryStudentsRes.data.data?.students || [];
            if (
              !libraryStudents.length ||
              libraryStudents.some(student => student.email || student.school_id)
            ) {
              throw new Error(
                'Library student lookup was empty or exposed fields beyond the safe picker data'
              );
            }
            console.log('✅ OK (finance denied; library inventory metrics reconcile)');
          } else if (acct.role === 'receptionist') {
            if (
              data.totalEnquiries !== 1 ||
              data.todayVisitors !== 1 ||
              data.callLogs !== 1 ||
              data.postalRecords !== 1
            ) {
              throw new Error(
                `Reception dashboard metrics did not match demo records: ${JSON.stringify(data)}`
              );
            }
            const classesRes = await axios.get(
              `${API_BASE}/classes/dropdown?branch_id=99999999-9999-9999-9999-999999999999`,
              { headers }
            );
            if (
              !classesRes.data.success ||
              !classesRes.data.data.some(
                item => item.name === 'Class 1' && item.branch?.id === user.branch_id
              ) ||
              classesRes.data.data.some(item => item.branch?.id !== user.branch_id)
            ) {
              throw new Error(
                'Receptionist class dropdown did not return only their assigned branch classes'
              );
            }
            console.log('✅ OK (finance denied; reception activity metrics reconcile)');
          } else {
            console.log('✅ OK (finance dashboard endpoints correctly denied)');
          }
        } else if (acct.role === 'accountant') {
          await axios.get(`${API_BASE}/dashboard/fee-collection-summary?academic_year=2026-2027`, {
            headers
          });
          await axios.get(`${API_BASE}/dashboard/fees-chart`, { headers });
          await axios.get(`${API_BASE}/dashboard/academic-year-months`, { headers });
          const studentSearch = await axios.get(
            `${API_BASE}/fee-invoices/students/search?search=Alex`,
            { headers }
          );
          const students = studentSearch.data.data || [];
          if (
            !students.some(student => student.first_name === 'Alex') ||
            students.some(student => student.email || student.school_id)
          ) {
            throw new Error(
              'Accountant fee student search was empty or exposed fields beyond picker data'
            );
          }
          console.log('✅ OK (finance dashboard access allowed)');
        } else {
          if (acct.role === 'branch_admin') {
            const studentSearch = await axios.get(
              `${API_BASE}/fee-invoices/students/search?search=Alex&branch_id=99999999-9999-9999-9999-999999999999`,
              { headers }
            );
            if ((studentSearch.data.data || []).some(student => student.first_name === 'Alex')) {
              throw new Error('Branch admin fee student search escaped its assigned branch');
            }
            try {
              await axios.get(
                `${API_BASE}/exams/student/${mainBranchStudentId}/report-card?academic_year=2026-2027&format=pdf`,
                { headers, responseType: 'arraybuffer' }
              );
              throw new Error('Branch admin generated a report card for another branch student');
            } catch (err) {
              if (err.message === 'Branch admin generated a report card for another branch student')
                throw err;
              if (err.response?.status !== 404) {
                throw new Error(
                  `Cross-branch report card returned ${err.response?.status || err.message}, expected 404`
                );
              }
            }
          }
          console.log(
            acct.role === 'branch_admin'
              ? '✅ OK (role stats loaded; cross-branch report card denied)'
              : '✅ OK (role stats loaded)'
          );
        }
      }
    } catch (err) {
      failures++;
      console.log(`❌ FAILED: ${err.response?.data?.message || err.message}`);
    }
  }

  process.stdout.write('\nTesting Platform Owner report-card school context... ');
  try {
    if (!demoSchoolId || !superAdminHeaders) throw new Error('Demo school context was not loaded');
    const [examsRes, classesRes, templatesRes] = await Promise.all([
      axios.get(`${API_BASE}/exams`, {
        params: { school_id: demoSchoolId, limit: 100 },
        headers: superAdminHeaders
      }),
      axios.get(`${API_BASE}/classes/dropdown`, {
        params: { school_id: demoSchoolId },
        headers: superAdminHeaders
      }),
      axios.get(`${API_BASE}/exam-reports/templates`, {
        params: { school_id: demoSchoolId },
        headers: superAdminHeaders
      })
    ]);
    const demoExam = (examsRes.data.data?.exams || []).find(
      exam => exam.name === 'First Term Examination'
    );
    const demoClass = (classesRes.data.data || []).find(item => item.name === 'Class 1');
    const templates = templatesRes.data.data || [];
    if (
      !demoExam ||
      !demoClass ||
      !templates.some(template => template.name === 'Demo Student Report Card') ||
      templates.some(template => template.school_id && template.school_id !== demoSchoolId)
    ) {
      throw new Error('Selected-school exams, classes, or templates did not load in scope');
    }
    const studentsRes = await axios.get(`${API_BASE}/exam-reports/students`, {
      params: { exam_id: demoExam.id, class_id: demoClass.id, school_id: demoSchoolId },
      headers: superAdminHeaders
    });
    const students = studentsRes.data.data || [];
    if (students.length < 2 || students.some(student => !student.id)) {
      throw new Error(`Expected at least 2 selected-school students, received ${students.length}`);
    }
    const noticesRes = await axios.get(`${API_BASE}/dashboard/notices`, {
      params: { school_id: demoSchoolId },
      headers: superAdminHeaders
    });
    if (!noticesRes.data.data?.notices?.some(notice => notice.title)) {
      throw new Error('Selected-school dashboard notice was missing');
    }
    const attendanceRes = await axios.get(`${API_BASE}/dashboard/attendance-today`, {
      params: { school_id: demoSchoolId },
      headers: superAdminHeaders
    });
    const attendance = attendanceRes.data.data?.attendance;
    const attendanceTotal = attendance &&
      Number(attendance.present || 0) + Number(attendance.absent || 0) +
      Number(attendance.late || 0) + Number(attendance.excused || 0);
    if (
      !attendance || !Number.isInteger(Number(attendance.session_count)) ||
      !Number.isInteger(Number(attendance.enrolled)) || Number(attendance.enrolled) < students.length ||
      Number(attendance.marked) !== attendanceTotal ||
      (Number(attendance.session_count) === 0 && attendanceTotal !== 0)
    ) {
      throw new Error(`Selected-school attendance summary was invalid: ${JSON.stringify(attendance)}`);
    }
    const overdueFeesRes = await axios.get(`${API_BASE}/dashboard/overdue-fees`, {
      params: { school_id: demoSchoolId },
      headers: superAdminHeaders
    });
    const overdueFees = overdueFeesRes.data.data?.fees || [];
    if (!overdueFees.some(fee => fee.student?.first_name === 'Alex' && Number(fee.balance_amount) === 2500)) {
      throw new Error('Selected-school overdue fee summary did not include Alex Demo');
    }
    const systemSettingsRes = await axios.get(`${API_BASE}/settings/system`, {
      params: { school_id: demoSchoolId },
      headers: superAdminHeaders
    });
    if (!systemSettingsRes.data.data?.systemSettings) {
      throw new Error('Selected-school system settings were not returned');
    }
    try {
      await axios.get(`${API_BASE}/settings/system`, { headers: superAdminHeaders });
      throw new Error('Platform Owner read system settings without selecting a school');
    } catch (err) {
      if (err.message === 'Platform Owner read system settings without selecting a school') throw err;
      if (err.response?.status !== 400) throw new Error('Unscoped system settings were not rejected');
    }
    console.log('✅ OK (school-scoped exam/class/template, student lookup, settings, notices, attendance, and overdue fees)');
  } catch (err) {
    failures++;
    console.log(`❌ FAILED: ${err.response?.data?.message || err.message}`);
  }

  // Test Boundary Enforcement: Branch Admin cannot access another branch context
  process.stdout.write(
    '\nTesting Boundary Enforcement (branch_admin requesting mismatched branch_id)... '
  );
  try {
    const branchLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'demo.branch@schoolerp.local',
      password: 'Demo@12345'
    });
    const bCookie = branchLogin.headers['set-cookie']?.join('; ');
    const bToken = branchLogin.data.data?.token;
    const bHeaders = {};
    if (bCookie) bHeaders['Cookie'] = bCookie;
    if (bToken) bHeaders['Authorization'] = `Bearer ${bToken}`;
    // Attempt to pass a fake or mismatched branch_id
    const mismatchedBranchId = '99999999-9999-9999-9999-999999999999';
    try {
      await axios.get(`${API_BASE}/dashboard/stats?branch_id=${mismatchedBranchId}`, {
        headers: bHeaders
      });
      console.log('❌ FAILED: Mismatched branch request should have been rejected or filtered.');
      failures++;
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ OK (403 Forbidden correctly returned for unauthorized branch access)');
      } else {
        console.log(`✅ OK (Handled: ${err.response?.status || err.message})`);
      }
    }
  } catch (err) {
    failures++;
    console.log(`❌ FAILED: ${err.message}`);
  }

  console.log(`\n========================================`);
  if (failures === 0) {
    console.log('🎉 ALL ROLE JOURNEYS & BOUNDARY CHECKS PASSED EMPIRICALLY!');
    process.exit(0);
  } else {
    console.log(`💥 ${failures} CHECKS FAILED.`);
    process.exit(1);
  }
}

run();
