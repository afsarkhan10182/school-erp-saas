/**
 * verify-demo-experience.js
 * Comprehensive automated verification script for School ERP SaaS demo experience.
 * Tests:
 * 1. 9 persona authentications
 * 2. Landing route and home path expectations
 * 3. Scoped API data access & metric consistency
 * 4. Tenant & role authorization boundaries
 */

const path = require('path');
const Papa = require('papaparse');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = process.env.DEMO_API_URL || process.env.API_BASE || 'http://localhost:8000/api';

const DEMO_PERSONAS = [
  {
    role: 'super_admin',
    email: 'demo.superadmin@schoolerp.local',
    expectedHome: '/saas',
    allowedScope: 'Platform Owner (all schools)'
  },
  {
    role: 'admin',
    email: 'demo.admin@schoolerp.local',
    expectedHome: '/dashboard',
    allowedScope: 'School Admin (all branches of Demo International School)'
  },
  {
    role: 'branch_admin',
    email: 'demo.branch@schoolerp.local',
    expectedHome: '/dashboard',
    allowedScope: 'Branch Admin (Second Branch)'
  },
  {
    role: 'teacher',
    email: 'demo.teacher@schoolerp.local',
    expectedHome: '/dashboard',
    allowedScope: 'Teacher (Main Branch)'
  },
  {
    role: 'teacher',
    key: 'teacher_second',
    email: 'demo.teacher.second@schoolerp.local',
    expectedHome: '/dashboard',
    allowedScope: 'Teacher (Second Branch)'
  },
  {
    role: 'accountant',
    email: 'demo.accountant@schoolerp.local',
    expectedHome: '/dashboard',
    allowedScope: 'Accountant (Main Branch)'
  },
  {
    role: 'receptionist',
    email: 'demo.reception@schoolerp.local',
    expectedHome: '/dashboard',
    allowedScope: 'Receptionist (Main Branch)'
  },
  {
    role: 'librarian',
    email: 'demo.librarian@schoolerp.local',
    expectedHome: '/dashboard',
    allowedScope: 'Librarian (Main Branch)'
  },
  {
    role: 'parent',
    email: 'demo.parent@schoolerp.local',
    expectedHome: '/portal',
    allowedScope: 'Parent (Multi-child)'
  },
  {
    role: 'student',
    email: 'demo.student@schoolerp.local',
    expectedHome: '/portal',
    allowedScope: 'Student (DEMO-001)'
  }
];

function homePathForRole(role) {
  if (role === 'super_admin') return '/saas';
  if (role === 'student' || role === 'parent') return '/portal';
  return '/dashboard';
}

async function runVerification() {
  console.log('\n======================================================');
  console.log('   SCHOOL ERP SAAS — DEMO EXPERIENCE VERIFICATION    ');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // 1. Verify Authentication & Role Profile & Home Resolution
  console.log('--- 1. Persona Authentication & Home Path Mapping ---');
  const sessionCookies = {};
  const roleUsers = {};

  for (const persona of DEMO_PERSONAS) {
    try {
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: persona.email, password: 'Demo@12345' })
      });

      const data = await loginRes.json();
      assert(loginRes.ok && data.success, `${persona.role} (${persona.email}) logged in successfully`);

      const cookie = loginRes.headers.get('set-cookie')?.split(';', 1)[0];
      const personaKey = persona.key || persona.role;
      sessionCookies[personaKey] = cookie;

      const user = data.data?.user;
      roleUsers[personaKey] = user;
      assert(user && user.role === persona.role, `${persona.role} returned matching role '${user?.role}'`);

      const resolvedHome = homePathForRole(user.role);
      assert(
        resolvedHome === persona.expectedHome,
        `${persona.role} resolves to home '${resolvedHome}' (expected '${persona.expectedHome}')`
      );
    } catch (err) {
      assert(false, `${persona.role} login threw exception: ${err.message}`);
    }
  }

  // 2. Verify Scoped API Data & Dashboard Metrics Consistency
  console.log('\n--- 2. Scoped API Data & Metric Consistency ---');

  try {
    const [assignmentsRes, studentsRes, teacherStatsRes] = await Promise.all([
      fetch(`${API_BASE}/subject-teachers?branch_id=${encodeURIComponent(roleUsers.admin?.branch_id || '')}&limit=100`, {
        headers: { Cookie: sessionCookies.teacher_second }
      }),
      fetch(`${API_BASE}/students?limit=100`, { headers: { Cookie: sessionCookies.teacher_second } }),
      fetch(`${API_BASE}/dashboard/stats?academic_year=2025-2026`, {
        headers: { Cookie: sessionCookies.teacher_second }
      })
    ]);
    const assignments = await assignmentsRes.json();
    const students = await studentsRes.json();
    const teacherStats = await teacherStatsRes.json();
    const secondTeacherAssignments = assignments.data?.subjectTeachers || [];
    const secondTeacherAdmissions = (students.data || []).map(student => student.admission_number);
    assert(
      assignmentsRes.ok && secondTeacherAssignments.length === 1 &&
        secondTeacherAssignments[0]?.branch_id === roleUsers.teacher_second?.branch_id &&
        secondTeacherAssignments[0]?.class?.name === 'Class 2' &&
        secondTeacherAssignments[0]?.subject?.code === 'ENG-SECOND',
      'Second Branch teacher sees its Class 2 / English assignment and ignores a forged Main Branch filter'
    );
    assert(
      studentsRes.ok && secondTeacherAdmissions.includes('DEMO-SECOND-001') &&
        !secondTeacherAdmissions.includes('DEMO-001') && !secondTeacherAdmissions.includes('DEMO-002'),
      'Second Branch teacher student roster contains only the assigned branch student'
    );
    assert(
      teacherStatsRes.ok && teacherStats.success &&
        teacherStats.data?.totalStudents === secondTeacherAdmissions.length,
      `Second Branch teacher dashboard matches its assigned roster (${teacherStats.data?.totalStudents} vs ${secondTeacherAdmissions.length})`
    );
  } catch (err) {
    assert(false, `Second Branch teacher scope check threw error: ${err.message}`);
  }

  // Superadmin stats & SaaS endpoints
  try {
    const saasSchoolsRes = await fetch(`${API_BASE}/subscriptions/schools`, {
      headers: { Cookie: sessionCookies['super_admin'] }
    });
    const saasSchools = await saasSchoolsRes.json();
    const schoolsList = saasSchools.data?.schools || saasSchools.data || [];
    assert(
      saasSchoolsRes.ok && saasSchools.success && schoolsList.length > 0,
      `super_admin lists SaaS schools with subscriptions (found ${schoolsList.length})`
    );

    const saasPlansRes = await fetch(`${API_BASE}/subscriptions/plans`, {
      headers: { Cookie: sessionCookies['super_admin'] }
    });
    const saasPlans = await saasPlansRes.json();
    assert(
      saasPlansRes.ok && saasPlans.success,
      `super_admin can list SaaS subscription plans`
    );
  } catch (err) {
    assert(false, `super_admin endpoints threw error: ${err.message}`);
  }

  // Admin stats & Fee Consistency Check
  try {
    const adminStatsRes = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: { Cookie: sessionCookies['admin'] }
    });
    const adminStats = await adminStatsRes.json();
    assert(
      adminStatsRes.ok && adminStats.success,
      `admin dashboard/stats returns success`
    );

    const transportRegisterRes = await fetch(`${API_BASE}/students/risk-register?has_transport=true&limit=100`, {
      headers: { Cookie: sessionCookies.admin }
    });
    const transportRegister = await transportRegisterRes.json();
    assert(
      transportRegisterRes.ok && transportRegister.success && transportRegister.data?.length > 0 &&
        transportRegister.data.every(student => student.risk?.service_memberships?.transport),
      `Student 360 transport filter returns only assigned students (${transportRegister.data?.length || 0})`
    );

    const hostelRegisterRes = await fetch(`${API_BASE}/students/risk-register?has_hostel=true&limit=100`, {
      headers: { Cookie: sessionCookies.admin }
    });
    const hostelRegister = await hostelRegisterRes.json();
    assert(
      hostelRegisterRes.ok && hostelRegister.success && hostelRegister.data?.length > 0 &&
        hostelRegister.data.every(student => student.risk?.service_memberships?.hostel),
      `Student 360 hostel filter returns only allocated students (${hostelRegister.data?.length || 0})`
    );

    const forgedBranchRiskRes = await fetch(
      `${API_BASE}/students/risk-register?has_transport=true&branch_id=${encodeURIComponent(roleUsers.admin?.branch_id || '')}&limit=100`,
      { headers: { Cookie: sessionCookies.branch_admin } }
    );
    const forgedBranchRisk = await forgedBranchRiskRes.json();
    assert(
      forgedBranchRiskRes.ok && forgedBranchRisk.success &&
        forgedBranchRisk.data?.every(student => student.branch_id === roleUsers.branch_admin?.branch_id && student.risk?.service_memberships?.transport),
      'Student 360 transport filter remains pinned to Branch Admin’s assignment despite a forged Main Branch selector'
    );

    const feeSummaryRes = await fetch(`${API_BASE}/dashboard/fee-collection-summary`, {
      headers: { Cookie: sessionCookies['admin'] }
    });
    const feeSummary = await feeSummaryRes.json();
    assert(
      feeSummaryRes.ok && feeSummary.success,
      `admin dashboard/fee-collection-summary returns success`
    );
    const settingsHistoryRes = await fetch(`${API_BASE}/settings/history`, {
      headers: { Cookie: sessionCookies.admin }
    });
    const settingsHistory = await settingsHistoryRes.json();
    const demoSettingsChange = settingsHistory.data?.find(entry =>
      !entry.undo_of_id && entry.category === 'system_preferences' &&
      entry.changes?.defaultTheme?.before?.value === 'dark' &&
      entry.changes?.defaultTheme?.after?.value === 'light'
    );
    const settingsChangeDetailRes = demoSettingsChange
      ? await fetch(`${API_BASE}/settings/history/${encodeURIComponent(demoSettingsChange.id)}`, {
          headers: { Cookie: sessionCookies.admin }
        })
      : null;
    const settingsChangeDetail = settingsChangeDetailRes ? await settingsChangeDetailRes.json() : null;
    assert(
      settingsHistoryRes.ok && settingsHistory.success && demoSettingsChange &&
        settingsChangeDetailRes?.ok && settingsChangeDetail.data?.can_restore === true &&
        settingsChangeDetail.data.changes.find(change => change.field === 'defaultTheme')?.current?.value === 'light',
      'admin can review the seeded System Preferences change with current value and safe-restore eligibility'
    );

    const statsCollected = Number(
      adminStats.data?.academicYearFeeCollection ?? adminStats.data?.feeCollection ?? 0
    );
    const statsThisMonth = Number(adminStats.data?.thisMonthFeeCollection ?? 0);
    const summaryCollected = Number(feeSummary.data?.total_collected ?? 0);
    const statsPending = Number(adminStats.data?.pendingFees ?? 0);
    const summaryPending = Number(feeSummary.data?.total_pending ?? 0);

    assert(
      Number.isFinite(statsCollected) && Math.abs(statsCollected - summaryCollected) < 0.01 && Number.isFinite(statsThisMonth),
      `Academic-year fees match summary (₹${statsCollected} vs ₹${summaryCollected}); current-month amount is numeric (₹${statsThisMonth})`
    );
    assert(
      Math.abs(statsPending - summaryPending) < 0.01,
      `Pending fee metrics match: Headline pending (₹${statsPending}) equals summary (₹${summaryPending})`
    );
    assert(
      adminStats.data?.totalStudents > 0,
      `School admin sees non-zero students (${adminStats.data?.totalStudents})`
    );

    const rosterRes = await fetch(`${API_BASE}/students?limit=100`, {
      headers: { Cookie: sessionCookies.admin }
    });
    const roster = await rosterRes.json();
    const rosterDue = (roster.data || []).reduce((sum, student) => sum + Number(student.total_due), 0);
    assert(
      rosterRes.ok && roster.data?.every(student => Number.isFinite(Number(student.total_billed)) && Number.isFinite(Number(student.total_due))) &&
        Math.abs(rosterDue - statsPending) < 0.01,
      `School Admin roster billed/due values reconcile to the school pending-fee summary (₹${rosterDue})`
    );

    const rosterExportColumns = [
      { key: 'student_name', header: 'Student Name' },
      { key: 'total_billed', header: 'Billed (All Years)' },
      { key: 'total_due', header: 'Due (All Years)' }
    ];
    const rosterExportParams = new URLSearchParams({
      report_type: 'students',
      format: 'csv',
      columns: JSON.stringify(rosterExportColumns)
    });
    const rosterExportRes = await fetch(`${API_BASE}/export?${rosterExportParams}`, {
      headers: { Cookie: sessionCookies.admin }
    });
    const rosterExport = await rosterExportRes.text();
    const parsedRosterExport = Papa.parse(rosterExport).data;
    const rosterExportHeaderIndex = parsedRosterExport.findIndex(row =>
      row[0] === 'Student Name' && row[1] === 'Billed (All Years)' && row[2] === 'Due (All Years)'
    );
    const rosterExportRows = parsedRosterExport.slice(
      rosterExportHeaderIndex + 1,
      rosterExportHeaderIndex + 1 + roster.data.length
    );
    const rosterExportDue = rosterExportRows.reduce((sum, row) => sum + (Number(row[2]) || 0), 0);
    assert(
      rosterExportRes.ok && rosterExportHeaderIndex >= 0 &&
        rosterExportRows.length === roster.data.length && Math.abs(rosterExportDue - rosterDue) < 0.01,
      `Student CSV export includes billed/due columns and reconciles due totals (HTTP ${rosterExportRes.status}, ₹${rosterExportDue} vs ₹${rosterDue})`
    );

    const [siblingsRes, singleChildrenRes, siblingCsvRes, currentEnrollmentRes, fullRegisterRes, unassignedRes] = await Promise.all([
      fetch(`${API_BASE}/students?has_siblings=yes&limit=100`, {
        headers: { Cookie: sessionCookies.admin }
      }),
      fetch(`${API_BASE}/students?has_siblings=no&limit=100`, {
        headers: { Cookie: sessionCookies.admin }
      }),
      fetch(`${API_BASE}/students/export?has_siblings=yes`, {
        headers: { Cookie: sessionCookies.admin }
      }),
      fetch(`${API_BASE}/students?enrollment=currently_studying&limit=100`, {
        headers: { Cookie: sessionCookies.admin }
      }),
      fetch(`${API_BASE}/students?enrollment=full_register&limit=100`, {
        headers: { Cookie: sessionCookies.admin }
      }),
      fetch(`${API_BASE}/students?enrollment=unassigned&academic_year=2026-2027&limit=100`, {
        headers: { Cookie: sessionCookies.admin }
      })
    ]);
    const siblings = await siblingsRes.json();
    const singleChildren = await singleChildrenRes.json();
    const siblingCsv = await siblingCsvRes.text();
    const currentEnrollment = await currentEnrollmentRes.json();
    const fullRegister = await fullRegisterRes.json();
    const unassigned = await unassignedRes.json();
    const siblingAdmissions = siblings.data?.map(student => student.admission_number) || [];
    const sarahSiblings = siblings.data?.find(student => student.admission_number === 'DEMO-001')?.siblings || [];
    const sarahSiblingNames = sarahSiblings
      .map(student => [student.first_name, student.last_name].filter(Boolean).join(' '))
      .sort();
    const expectedSiblingAdmissions = ['DEMO-001', 'DEMO-002', 'DEMO-SECOND-001'];
    assert(
      siblingsRes.ok && singleChildrenRes.ok && siblings.success && singleChildren.success &&
        expectedSiblingAdmissions.every(admission => siblingAdmissions.includes(admission)) &&
        siblingAdmissions.length + (singleChildren.pagination?.total_count || 0) === adminStats.data.totalStudents,
      'Sibling and no-sibling roster filters partition the school register without losing seeded family records'
    );
    assert(
      sarahSiblingNames.join('|') === 'Alex Demo|Riya Demo',
      `School Admin roster includes Sarah's linked siblings (${sarahSiblingNames.join(', ') || 'none'})`
    );
    assert(
      siblingCsvRes.ok && siblingCsvRes.headers.get('content-type')?.includes('text/csv') &&
        expectedSiblingAdmissions.every(admission => siblingCsv.includes(admission)),
      'Sibling-filtered CSV includes the same seeded family records as the roster'
    );
    assert(
      currentEnrollmentRes.ok && fullRegisterRes.ok && unassignedRes.ok &&
        currentEnrollment.pagination?.total_count === adminStats.data.totalStudents &&
        fullRegister.pagination?.total_count === adminStats.data.totalStudents &&
        unassigned.pagination?.total_count === 0,
      'Enrollment filters return current and full demo registers while excluding unassigned students for the seeded year'
    );
  } catch (err) {
    assert(false, `admin stats consistency check threw error: ${err.message}`);
  }

  // Teacher timetable read-only workflow
  try {
    const teacherTimetableRes = await fetch(
      `${API_BASE}/timetables/my-timetable?academic_year=2026-2027`,
      { headers: { Cookie: sessionCookies.teacher } }
    );
    const teacherTimetable = await teacherTimetableRes.json();
    const mondaySlots = teacherTimetable.data?.timetable?.schedule?.monday || [];
    assert(
      teacherTimetableRes.ok && teacherTimetable.success && mondaySlots.some(slot =>
        slot.subject?.name === 'Mathematics' && slot.class?.name === 'Class 1' && slot.section?.name === 'A'
      ),
      'teacher can read the seeded Class 1 Monday Mathematics slot through the personal timetable API'
    );
  } catch (err) {
    assert(false, `teacher timetable check threw error: ${err.message}`);
  }

  // Branch Admin Scoping
  try {
    const feeCandidatesUrl = `${API_BASE}/fee-invoices/students/search?class_name=Class%201&academic_year=2026-2027`;
    const [accountantFeeCandidatesRes, accountantCrossBranchCandidatesRes, branchFeeCandidatesRes] = await Promise.all([
      fetch(feeCandidatesUrl, { headers: { Cookie: sessionCookies.accountant } }),
      fetch(`${feeCandidatesUrl}&branch_id=${roleUsers.branch_admin?.branch_id}`, {
        headers: { Cookie: sessionCookies.accountant }
      }),
      fetch(feeCandidatesUrl, { headers: { Cookie: sessionCookies.branch_admin } })
    ]);
    const [accountantFeeCandidates, accountantCrossBranchCandidates, branchFeeCandidates] = await Promise.all([
      accountantFeeCandidatesRes.json(), accountantCrossBranchCandidatesRes.json(), branchFeeCandidatesRes.json()
    ]);
    const mainBranchFeeStudents = accountantFeeCandidates.data || [];
    assert(
      accountantFeeCandidatesRes.ok && accountantFeeCandidates.success && mainBranchFeeStudents.length > 0 &&
        mainBranchFeeStudents.some(student => student.admission_number === 'DEMO-001') &&
        accountantCrossBranchCandidatesRes.ok &&
        JSON.stringify(accountantCrossBranchCandidates.data) === JSON.stringify(mainBranchFeeStudents) &&
        branchFeeCandidatesRes.ok && branchFeeCandidates.success && branchFeeCandidates.data.length === 0,
      'fee-invoice student search returns class candidates to Accountants while ignoring cross-branch overrides and honoring assigned branch scope'
    );

    const branchStatsRes = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: { Cookie: sessionCookies['branch_admin'] }
    });
    const branchStats = await branchStatsRes.json();
    assert(
      branchStatsRes.ok && branchStats.success && branchStats.data?.totalStudents === 1 && branchStats.data?.totalParents === 1,
      `branch_admin gets Second Branch statistics (${branchStats.data?.totalStudents} student, ${branchStats.data?.totalParents} linked parent)`
    );
  } catch (err) {
    assert(false, `branch_admin stats threw error: ${err.message}`);
  }

  try {
    const branchActivitiesRes = await fetch(`${API_BASE}/dashboard/recent-activities`, {
      headers: { Cookie: sessionCookies['branch_admin'] }
    });
    const branchActivities = await branchActivitiesRes.json();
    const descriptions = (branchActivities.data || []).map(activity => activity.description || '');
    assert(
      branchActivitiesRes.ok && branchActivities.success && descriptions.some(text => text.includes('Riya Demo')) && descriptions.every(text => !text.includes('DEMO-001')),
      'branch_admin recent activity feed is scoped to Second Branch'
    );
  } catch (err) {
    assert(false, `branch_admin activity scope threw error: ${err.message}`);
  }

  try {
    const mainBranchId = roleUsers.admin?.branch_id;
    const secondBranchId = roleUsers.branch_admin?.branch_id;
    if (!mainBranchId || !secondBranchId) throw new Error('Demo users are missing their branch assignments');
    const [mainPassesRes, secondPassesRes, allPassesRes, branchOverrideRes, receptionistPassesRes, receptionStudentsRes, terminalRes] = await Promise.all([
      fetch(`${API_BASE}/gate-passes?branch_id=${encodeURIComponent(mainBranchId)}`, { headers: { Cookie: sessionCookies.admin } }),
      fetch(`${API_BASE}/gate-passes?branch_id=${encodeURIComponent(secondBranchId)}`, { headers: { Cookie: sessionCookies.admin } }),
      fetch(`${API_BASE}/gate-passes`, { headers: { Cookie: sessionCookies.admin } }),
      fetch(`${API_BASE}/gate-passes?branch_id=${encodeURIComponent(mainBranchId)}`, { headers: { Cookie: sessionCookies.branch_admin } }),
      fetch(`${API_BASE}/gate-passes`, { headers: { Cookie: sessionCookies.receptionist } }),
      fetch(`${API_BASE}/gate-passes/students?branch_id=${encodeURIComponent(secondBranchId)}`, { headers: { Cookie: sessionCookies.receptionist } }),
      fetch(`${API_BASE}/gate-passes/terminal/GP-DEMO-SECOND-001?branch_id=${encodeURIComponent(secondBranchId)}`, { headers: { Cookie: sessionCookies.admin } })
    ]);
    const [mainPasses, secondPasses, allPasses, branchPasses, receptionPasses, receptionStudents, terminal] = await Promise.all([
      mainPassesRes.json(), secondPassesRes.json(), allPassesRes.json(), branchOverrideRes.json(), receptionistPassesRes.json(), receptionStudentsRes.json(), terminalRes.json()
    ]);
    assert(
      mainPassesRes.ok && mainPasses.data?.some(pass => pass.pass_no === 'GP-DEMO-MAIN-001' && pass.status === 'pending') &&
        secondPassesRes.ok && secondPasses.data?.some(pass => pass.pass_no === 'GP-DEMO-SECOND-001' && pass.status === 'out'),
      'School Admin can review distinct Main and Second Branch gate-pass states'
    );
    assert(
      allPassesRes.ok && allPasses.data?.length === 2 && allPasses.data.some(pass => pass.branch_id === mainBranchId) && allPasses.data.some(pass => pass.branch_id === secondBranchId),
      'School Admin All Branches gate-pass view aggregates Main and Second Branch'
    );
    assert(
      branchOverrideRes.ok && branchPasses.data?.length === 1 && branchPasses.data[0].pass_no === 'GP-DEMO-SECOND-001' &&
        receptionistPassesRes.ok && receptionPasses.data?.length === 1 && receptionPasses.data[0].pass_no === 'GP-DEMO-MAIN-001',
      'Branch Admin gate-pass listing ignores cross-branch overrides while Receptionist stays on the assigned branch'
    );
    assert(
      receptionStudentsRes.ok && receptionStudents.data?.some(student => student.admission_number === 'DEMO-001') &&
        !receptionStudents.data?.some(student => student.admission_number === 'DEMO-SECOND-001') &&
        !Object.hasOwn(receptionStudents.data?.[0] || {}, 'phone'),
      'Receptionist receives a minimal active-student picker scoped to the assigned branch'
    );
    assert(
      terminalRes.ok && terminal.data?.status === 'out' && terminal.data?.student?.admission_number === 'DEMO-SECOND-001' &&
        !Object.hasOwn(terminal.data || {}, 'collector_phone') && !Object.hasOwn(terminal.data || {}, 'collector_id_last4'),
      'Gate terminal can resolve an active pass without exposing collector contact or ID details'
    );
  } catch (err) {
    assert(false, `gate-pass branch and terminal checks threw error: ${err.message}`);
  }

  try {
    const spoofBranchId = roleUsers.admin?.branch_id;
    const branchStudentsRes = await fetch(
      `${API_BASE}/students?branch_id=${encodeURIComponent(spoofBranchId || '')}&limit=100`,
      { headers: { Cookie: sessionCookies.branch_admin } }
    );
    const branchStudents = await branchStudentsRes.json();
    const admissions = (branchStudents.data || []).map(student => student.admission_number);
    assert(
      branchStudentsRes.ok && admissions.length === 1 && admissions.includes('DEMO-SECOND-001') &&
        !admissions.includes('DEMO-001') && !admissions.includes('DEMO-002') &&
        branchStudents.data[0]?.siblings?.length === 0 &&
        Number.isFinite(Number(branchStudents.data[0]?.total_due)),
      'branch_admin roster ignores Main Branch override and exposes only Second Branch sibling/fee totals'
    );
  } catch (err) {
    assert(false, `branch_admin roster scope threw error: ${err.message}`);
  }

  try {
    const mainBranchId = roleUsers.teacher?.branch_id;
    if (!mainBranchId) throw new Error('Main Branch teacher has no assigned branch');
    const sessionsRes = await fetch(
      `${API_BASE}/attendance/sessions?branch_id=${encodeURIComponent(mainBranchId)}&status=published`,
      { headers: { Cookie: sessionCookies.admin } }
    );
    const sessions = await sessionsRes.json();
    const mainSession = sessions.data?.find(session => session.branch_id === mainBranchId);
    if (!sessionsRes.ok || !mainSession) throw new Error('Published Main Branch attendance session was not found');

    const notifyAttempt = await fetch(`${API_BASE}/attendance/notify-absentees`, {
      method: 'POST',
      headers: { Cookie: sessionCookies.branch_admin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: mainSession.id })
    });
    assert(
      notifyAttempt.status === 404,
      'branch_admin cannot request absence notifications for a Main Branch attendance session'
    );
  } catch (err) {
    assert(false, `branch_admin attendance notification scope check threw error: ${err.message}`);
  }

  try {
    const paidInvoicesRes = await fetch(`${API_BASE}/fee-invoices/grouped?status=paid`, {
      headers: { Cookie: sessionCookies.admin }
    });
    const paidInvoices = await paidInvoicesRes.json();
    const mainBranchInvoice = paidInvoices.data?.invoices?.find(
      invoice => invoice.invoice_number === 'INV-DEMO-001'
    );
    if (!mainBranchInvoice) throw new Error('Seeded paid Main Branch invoice was not found');

    const paymentAttempt = await fetch(`${API_BASE}/fee-invoices/${mainBranchInvoice.id}/payment`, {
      method: 'POST',
      headers: { Cookie: sessionCookies.branch_admin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1, payment_method: 'cash' })
    });
    const invoiceAfterAttemptRes = await fetch(`${API_BASE}/fee-invoices/${mainBranchInvoice.id}`, {
      headers: { Cookie: sessionCookies.admin }
    });
    const invoiceAfterAttempt = await invoiceAfterAttemptRes.json();
    assert(
      paymentAttempt.status === 404 && invoiceAfterAttemptRes.ok &&
        invoiceAfterAttempt.data?.status === 'paid' && Number(invoiceAfterAttempt.data?.paid_amount) === 2500,
      'branch_admin cannot post a payment to a Main Branch invoice and the invoice remains unchanged'
    );
  } catch (err) {
    assert(false, `branch_admin payment scope check threw error: ${err.message}`);
  }

  try {
    const adminRosterRes = await fetch(`${API_BASE}/students?limit=100`, {
      headers: { Cookie: sessionCookies.admin }
    });
    const adminRoster = await adminRosterRes.json();
    const mainStudent = adminRoster.data?.find(student => student.admission_number === 'DEMO-001');
    const secondBranchStudent = adminRoster.data?.find(
      student => student.admission_number === 'DEMO-SECOND-001'
    );
    if (!mainStudent || !secondBranchStudent) throw new Error('Seeded students were not found');

    const [
      teacherRosterRes,
      teacherStatsRes,
      teacherSecondProfileRes,
      branchMainProfileRes,
      parentRosterRes,
      studentRosterRes,
      accountantMainLedgerRes,
      accountantSecondLedgerRes,
      accountantMainFeeLedgerRes,
      accountantSecondFeeLedgerRes,
      branchAdminSecondFeeLedgerRes,
      branchAdminMainFeeLedgerRes
    ] = await Promise.all([
      fetch(`${API_BASE}/students?limit=100`, { headers: { Cookie: sessionCookies.teacher } }),
      fetch(`${API_BASE}/dashboard/stats?academic_year=2026-2027`, {
        headers: { Cookie: sessionCookies.teacher }
      }),
      fetch(`${API_BASE}/students/${secondBranchStudent.id}`, { headers: { Cookie: sessionCookies.teacher } }),
      fetch(`${API_BASE}/students/${mainStudent.id}`, { headers: { Cookie: sessionCookies.branch_admin } }),
      fetch(`${API_BASE}/students?limit=100`, { headers: { Cookie: sessionCookies.parent } }),
      fetch(`${API_BASE}/students?limit=100`, { headers: { Cookie: sessionCookies.student } }),
      fetch(`${API_BASE}/students/${mainStudent.id}/invoice-breakdown`, {
        headers: { Cookie: sessionCookies.accountant }
      }),
      fetch(`${API_BASE}/students/${secondBranchStudent.id}/invoice-breakdown`, {
        headers: { Cookie: sessionCookies.accountant }
      }),
      fetch(
        `${API_BASE}/fee-invoices/student-ledger?student_id=${mainStudent.id}`,
        {
          headers: { Cookie: sessionCookies.accountant }
        }
      ),
      fetch(
        `${API_BASE}/fee-invoices/student-ledger?student_id=${secondBranchStudent.id}`,
        {
          headers: { Cookie: sessionCookies.accountant }
        }
      ),
      fetch(
        `${API_BASE}/fee-invoices/student-ledger?student_id=${secondBranchStudent.id}`,
        {
          headers: { Cookie: sessionCookies.branch_admin }
        }
      ),
      fetch(
        `${API_BASE}/fee-invoices/student-ledger?student_id=${mainStudent.id}`,
        {
          headers: { Cookie: sessionCookies.branch_admin }
        }
      )
    ]);
    const teacherRoster = await teacherRosterRes.json();
    const teacherStats = await teacherStatsRes.json();
    const teacherAdmissions = teacherRoster.data?.map(student => student.admission_number) || [];
    const teacherSarahSiblings = teacherRoster.data?.find(
      student => student.admission_number === 'DEMO-001'
    )?.siblings || [];
    const accountantMainFeeLedger = await accountantMainFeeLedgerRes.json();
    const accountantSecondFeeLedger = await accountantSecondFeeLedgerRes.json();
    assert(
      teacherRosterRes.ok && teacherAdmissions.includes('DEMO-001') &&
        teacherAdmissions.includes('DEMO-002') && !teacherAdmissions.includes('DEMO-SECOND-001') &&
        teacherSarahSiblings.length === 1 && teacherSarahSiblings[0].first_name === 'Alex' &&
        teacherRoster.data.every(student => !Object.hasOwn(student, 'total_billed') && !Object.hasOwn(student, 'total_due')) &&
        teacherSecondProfileRes.status === 404 && branchMainProfileRes.status === 404 &&
        parentRosterRes.status === 403 && studentRosterRes.status === 403 &&
        accountantMainLedgerRes.ok && accountantSecondLedgerRes.status === 404 &&
        accountantMainFeeLedgerRes.ok &&
        accountantMainFeeLedger.data?.student?.academic_year === '2026-2027' &&
        !('parents' in (accountantMainFeeLedger.data?.student || {})) &&
        accountantSecondFeeLedgerRes.status === 404 && branchAdminSecondFeeLedgerRes.ok &&
        branchAdminMainFeeLedgerRes.status === 404,
      'student and fee-ledger data is scoped to assigned teacher classes and staff branches; Accountant ledger omits parent data and family portals remain separate'
    );
    assert(
      teacherStatsRes.ok && teacherStats.success &&
        teacherStats.data?.totalStudents === teacherAdmissions.length && teacherAdmissions.length >= 2,
      `Teacher dashboard student total matches assigned roster (${teacherStats.data?.totalStudents} vs ${teacherAdmissions.length})`
    );
  } catch (err) {
    assert(false, `student API role scope check threw error: ${err.message}`);
  }

  // 3. Family Portal Verification (Parent & Student)
  console.log('\n--- 3. Family & Student Portal Verification ---');
  try {
    const parentPortalRes = await fetch(`${API_BASE}/portal/dashboard`, {
      headers: { Cookie: sessionCookies['parent'] }
    });
    const parentPortal = await parentPortalRes.json();
    assert(
      parentPortalRes.ok && parentPortal.success,
      `parent portal-dashboard returns HTTP 200`
    );
    assert(
      parentPortal.data?.kind === 'parent' && Array.isArray(parentPortal.data?.students) && parentPortal.data?.students?.length >= 2,
      `parent portal provides multi-child data (children count: ${parentPortal.data?.students?.length || 0})`
    );
    const mainPtmChild = parentPortal.data?.students?.find(student => student.admission_number === 'DEMO-001');
    const mainPtmSibling = parentPortal.data?.students?.find(student => student.admission_number === 'DEMO-002');
    const secondPtmChild = parentPortal.data?.students?.find(student => student.admission_number === 'DEMO-SECOND-001');
    const mainBranchId = roleUsers.admin?.branch_id;
    const [mainPtmRes, siblingPtmRes, secondPtmRes, adminPtmRes, adminMainPtmRes, branchPtmRes, teacherPtmRes] = await Promise.all([
      fetch(`${API_BASE}/ptm/parent?student_id=${encodeURIComponent(mainPtmChild?.id || '')}`, { headers: { Cookie: sessionCookies.parent } }),
      fetch(`${API_BASE}/ptm/parent?student_id=${encodeURIComponent(mainPtmSibling?.id || '')}`, { headers: { Cookie: sessionCookies.parent } }),
      fetch(`${API_BASE}/ptm/parent?student_id=${encodeURIComponent(secondPtmChild?.id || '')}`, { headers: { Cookie: sessionCookies.parent } }),
      fetch(`${API_BASE}/ptm`, { headers: { Cookie: sessionCookies.admin } }),
      fetch(`${API_BASE}/ptm?branch_id=${encodeURIComponent(mainBranchId || '')}`, { headers: { Cookie: sessionCookies.admin } }),
      fetch(`${API_BASE}/ptm`, { headers: { Cookie: sessionCookies.branch_admin } }),
      fetch(`${API_BASE}/ptm`, { headers: { Cookie: sessionCookies.teacher } })
    ]);
    const [mainPtm, siblingPtm, secondPtm, adminPtm, adminMainPtm, branchPtm, teacherPtm] = await Promise.all([
      mainPtmRes.json(), siblingPtmRes.json(), secondPtmRes.json(), adminPtmRes.json(), adminMainPtmRes.json(), branchPtmRes.json(), teacherPtmRes.json()
    ]);
    assert(
      mainPtmRes.ok && mainPtm.data?.length === 1 && mainPtm.data[0].student?.id === mainPtmChild?.id &&
        mainPtm.data[0].meeting?.title === 'Class 1 Learning Progress Meeting' &&
        siblingPtmRes.ok && siblingPtm.data?.length === 1 && siblingPtm.data[0].student?.id === mainPtmSibling?.id,
      'parent can see PTM invites for both linked Main Branch children'
    );
    assert(
      secondPtmRes.ok && secondPtm.data?.length === 1 && secondPtm.data[0].student?.id === secondPtmChild?.id &&
        secondPtm.data[0].meeting?.title === 'Class 2 Family Check-in',
      'parent can see only the linked Second Branch child meeting'
    );
    const adminSecondPtmRes = await fetch(
      `${API_BASE}/ptm?branch_id=${encodeURIComponent(secondPtm.data?.[0]?.meeting?.branch_id || '')}`,
      { headers: { Cookie: sessionCookies.admin } }
    );
    const adminSecondPtm = await adminSecondPtmRes.json();
    assert(
      adminPtmRes.ok && adminPtm.data?.length === 2 && adminPtm.data.some(meeting => meeting.branch_id === mainBranchId) &&
        adminPtm.data.some(meeting => meeting.branch_id === secondPtm.data?.[0]?.meeting?.branch_id) &&
        adminMainPtmRes.ok && adminMainPtm.data?.length === 1 && adminMainPtm.data[0].title === 'Class 1 Learning Progress Meeting' &&
        adminSecondPtmRes.ok && adminSecondPtm.data?.length === 1 && adminSecondPtm.data[0].title === 'Class 2 Family Check-in',
      'school admin All Branches includes both PTMs and explicit branch filters select the correct meeting'
    );
    assert(
      branchPtmRes.ok && branchPtm.data?.length === 1 && branchPtm.data[0].title === 'Class 2 Family Check-in',
      'branch admin PTM list is restricted to Second Branch'
    );
    assert(
      teacherPtmRes.ok && teacherPtm.data?.length === 1 && teacherPtm.data[0].title === 'Class 1 Learning Progress Meeting' &&
        teacherPtm.data[0].attendees.every(row => !('parent_rating' in row) && !('parent_feedback' in row)),
      'teacher sees assigned Main Branch PTM roster without private parent feedback'
    );
    assert(
      !['father_income', 'mother_income', 'guardian_income', 'father_occupation', 'mother_occupation', 'guardian_occupation'].some(key => key in (parentPortal.data?.parent || {})),
      'parent portal excludes unrelated household income and employment fields'
    );
    const parentAttendance = parentPortal.data?.attendance?.records || [];
    assert(
      parentAttendance.length > 0 &&
        parentAttendance.every((record, index) =>
          record.date && ['present', 'absent', 'late', 'excused'].includes(record.status) &&
          record.session && ['daily', 'period'].includes(record.session.attendance_type) &&
          !['school_id', 'branch_id', 'created_by', 'updated_by'].some(key => key in record) &&
          !('status' in record.session) &&
          (index === 0 || parentAttendance[index - 1].date >= record.date)
        ),
      `parent calendar attendance rows are date-sorted, display-safe, and include session type (${parentAttendance.length} records)`
    );
    const parentVisitsRes = await fetch(
      `${API_BASE}/portal/visits?student_id=${encodeURIComponent(parentPortal.data?.student?.id || '')}`,
      { headers: { Cookie: sessionCookies.parent } }
    );
    const parentVisits = await parentVisitsRes.json();
    assert(
      parentVisitsRes.ok && parentVisits.success && Array.isArray(parentVisits.data?.records),
      'parent can read visit requests for a linked child'
    );
    const unlinkedVisitsRes = await fetch(`${API_BASE}/portal/visits?student_id=00000000-0000-4000-8000-000000000000`, {
      headers: { Cookie: sessionCookies.parent }
    });
    assert(unlinkedVisitsRes.status === 404, 'parent cannot read visit requests for an unlinked student');
    const paidDemoInvoice = parentPortal.data?.invoices?.find(invoice => invoice.invoice_number === 'INV-DEMO-001');
    const demoPayment = paidDemoInvoice?.payments?.[0];
    assert(
      demoPayment?.receipt_number === 'REC-DEMO-001' && demoPayment.payment_amount === '2500.00' &&
      !('transaction_id' in demoPayment) && !('created_by' in demoPayment),
      'parent receives only the linked child invoice payment fields needed to view and print a receipt'
    );
    const parentFeeSummary = parentPortal.data?.feeSummary || {};
    const assignedFees = Number(parentFeeSummary.total_assigned);
    const paidFees = Number(parentFeeSummary.total_paid);
    const dueFees = Number(parentFeeSummary.due_balance);
    assert(
      [assignedFees, paidFees, dueFees].every(Number.isFinite) &&
        Math.abs(assignedFees - paidFees - dueFees) < 0.01,
      `parent lifetime fee totals reconcile (₹${assignedFees} = ₹${paidFees} + ₹${dueFees})`
    );
    assert(
      Number.isInteger(parentPortal.data?.dueInvoiceCount) && parentPortal.data.dueInvoiceCount >= 0,
      `parent receives a complete due-invoice count (${parentPortal.data?.dueInvoiceCount})`
    );
    assert(
      Array.isArray(parentPortal.data?.notices) && parentPortal.data?.notices?.length > 0,
      `parent portal includes school notices & announcements (count: ${parentPortal.data?.notices?.length || 0})`
    );
    assert(
      parentPortal.data?.calendarEvents?.some(event => event.description === 'Demo Independence Day holiday'),
      'parent portal includes the active child branch calendar event'
    );
    assert(
      parentPortal.data?.libraryIssues?.some(issue => issue.book?.title === 'The World Around Us'),
      'parent portal shows the title of the child’s seeded library book'
    );
    assert(
      parentPortal.data?.libraryCatalog?.some(book => book.title === 'The World Around Us'),
      'parent portal catalog includes the school’s seeded library book'
    );
    assert(
      parentPortal.data?.hostel?.hostel?.hostel_name === 'Demo Hostel' &&
      parentPortal.data?.hostel?.room?.room_number === 'A-101',
      'parent portal shows the child’s assigned hostel and room'
    );
    const parentReportCard = parentPortal.data?.examResults?.[0];
    assert(
      Number(parentReportCard?.total_marks ?? parentReportCard?.exam?.max_marks) > 0,
      `parent report card exposes maximum marks (${parentReportCard?.total_marks ?? parentReportCard?.exam?.max_marks ?? 'missing'})`
    );
    const mainReportSetupsRes = await fetch(
      `${API_BASE}/portal/students/${encodeURIComponent(parentPortal.data?.student?.id || '')}/report-card/setups`,
      { headers: { Cookie: sessionCookies.parent } }
    );
    const mainReportSetups = await mainReportSetupsRes.json();
    assert(
      mainReportSetupsRes.ok && mainReportSetups.data?.length === 1 &&
        mainReportSetups.data[0].name === 'Main Branch Weighted Term Report' &&
        mainReportSetups.data[0].examEntries?.length === 2,
      'parent can see the published two-exam weighted report setup for the Main Branch child'
    );
    const mainReportPdfRes = await fetch(
      `${API_BASE}/portal/students/${encodeURIComponent(parentPortal.data?.student?.id || '')}/report-card?setup_id=${encodeURIComponent(mainReportSetups.data?.[0]?.id || '')}`,
      { headers: { Cookie: sessionCookies.parent } }
    );
    const mainReportPdf = Buffer.from(await mainReportPdfRes.arrayBuffer());
    assert(
      mainReportPdfRes.ok && mainReportPdfRes.headers.get('content-type')?.includes('application/pdf') &&
        mainReportPdf.subarray(0, 5).toString() === '%PDF-' && mainReportPdf.length > 1000,
      `parent can generate the Main Branch weighted report-card PDF (${mainReportPdf.length} bytes)`
    );
    const secondBranchChildForSetup = parentPortal.data?.students?.find(
      student => student.admission_number === 'DEMO-SECOND-001'
    );
    const secondReportSetupsRes = await fetch(
      `${API_BASE}/portal/students/${encodeURIComponent(secondBranchChildForSetup?.id || '')}/report-card/setups`,
      { headers: { Cookie: sessionCookies.parent } }
    );
    const secondReportSetups = await secondReportSetupsRes.json();
    assert(
      secondReportSetupsRes.ok && secondReportSetups.data?.length === 1 &&
        secondReportSetups.data[0].name === 'Second Branch Term Report',
      'parent sees only the published report setup belonging to the Second Branch child'
    );
    const secondReportPdfRes = await fetch(
      `${API_BASE}/portal/students/${encodeURIComponent(secondBranchChildForSetup?.id || '')}/report-card?setup_id=${encodeURIComponent(secondReportSetups.data?.[0]?.id || '')}`,
      { headers: { Cookie: sessionCookies.parent } }
    );
    const secondReportPdf = Buffer.from(await secondReportPdfRes.arrayBuffer());
    assert(
      secondReportPdfRes.ok && secondReportPdfRes.headers.get('content-type')?.includes('application/pdf') &&
        secondReportPdf.subarray(0, 5).toString() === '%PDF-' && secondReportPdf.length > 1000,
      `parent can generate the Second Branch report-card PDF (${secondReportPdf.length} bytes)`
    );
    const parentExamsRes = await fetch(`${API_BASE}/online-exams/available`, {
      headers: { Cookie: sessionCookies['parent'] }
    });
    const parentExams = await parentExamsRes.json();
    const parentQuiz = parentExams.data?.exams?.find(exam => exam.title === 'Math Practice Quiz');
    const secondBranchChildForExams = parentPortal.data?.students?.find(
      student => student.admission_number === 'DEMO-SECOND-001'
    );
    const secondBranchQuiz = parentExams.data?.exams?.find(
      exam => exam.title === 'Second Branch Science Quiz' && exam.class_id === secondBranchChildForExams?.class_id
    );
    assert(
      parentExamsRes.ok && parentExams.success && parentQuiz && secondBranchQuiz && parentExams.data.exams.length === 2,
      'parent sees only the two published online quizzes matching linked children across both branches'
    );
    if (parentQuiz) {
      const parentTakeRes = await fetch(`${API_BASE}/online-exams/${parentQuiz.id}/take`, {
        headers: { Cookie: sessionCookies['parent'] }
      });
      assert(parentTakeRes.status === 403, 'parent cannot start a student online exam');
    }
    const secondBranchChild = parentPortal.data?.students?.find(
      student => student.admission_number === 'DEMO-SECOND-001'
    );
    const secondBranchPortalRes = await fetch(
      `${API_BASE}/portal/dashboard?student_id=${encodeURIComponent(secondBranchChild?.id || '')}`,
      { headers: { Cookie: sessionCookies['parent'] } }
    );
    const secondBranchPortal = await secondBranchPortalRes.json();
    assert(
      secondBranchPortalRes.ok && secondBranchPortal.data?.attendance?.total === 0 && secondBranchPortal.data?.attendance?.rate === null,
      `parent portal does not invent an attendance rate for a child with no tracked sessions`
    );
    assert(
      !secondBranchPortal.data?.notices?.some(notice => notice.title === 'Annual Sports Day & Term Assessments') &&
        parentPortal.data?.notices?.some(notice => notice.title === 'Annual Sports Day & Term Assessments'),
      'parent notices are scoped to the selected child branch while allowing school-wide notices'
    );
    assert(
      !secondBranchPortal.data?.calendarEvents?.some(event => event.description === 'Demo Independence Day holiday'),
      'parent calendar does not leak Main Branch events to a Second Branch child'
    );

    const studentPortalRes = await fetch(`${API_BASE}/portal/dashboard`, {
      headers: { Cookie: sessionCookies['student'] }
    });
    const studentPortal = await studentPortalRes.json();
    assert(
      studentPortalRes.ok && studentPortal.success,
      `student portal-dashboard returns HTTP 200`
    );
    assert(
      studentPortal.data?.student?.admission_number === 'DEMO-001',
      `student portal loaded correct student record (DEMO-001)`
    );
    const availableExamsRes = await fetch(`${API_BASE}/online-exams/available`, {
      headers: { Cookie: sessionCookies['student'] }
    });
    const availableExams = await availableExamsRes.json();
    const quiz = availableExams.data?.exams?.find(exam => exam.title === 'Math Practice Quiz');
    assert(
      availableExamsRes.ok && availableExams.success && quiz?.class_id === studentPortal.data?.student?.class_id && availableExams.data.exams.length === 1,
      'student sees only the published quiz assigned to their class and branch'
    );
    // Opening /take creates a persisted timed attempt; keep this broad experience verifier read-only.
    assert(
      quiz && !('questions' in quiz) && !('correct_option' in quiz),
      'student exam list exposes schedule metadata only, without answer-key data'
    );
    assert(
      studentPortal.data?.invoices?.length > 0,
      `student portal has fees and invoice items`
    );
  } catch (err) {
    assert(false, `portal verification threw error: ${err.message}`);
  }

  // 4. Role & Tenant Boundary Security Checks
  console.log('\n--- 4. Role & Tenant Security Boundaries ---');
  try {
    // Parent should NOT be able to access SaaS plans
    const parentSaaSRes = await fetch(`${API_BASE}/subscriptions/plans`, {
      headers: { Cookie: sessionCookies['parent'] }
    });
    assert(
      parentSaaSRes.status === 403,
      `parent forbidden from /api/subscriptions/plans (HTTP ${parentSaaSRes.status})`
    );

    // Student should NOT be able to access staff dashboard stats
    const studentDashboardRes = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: { Cookie: sessionCookies['student'] }
    });
    assert(
      studentDashboardRes.status === 403,
      `student forbidden from staff /api/dashboard/stats (HTTP ${studentDashboardRes.status})`
    );
    const studentVisitsRes = await fetch(`${API_BASE}/portal/visits?student_id=${encodeURIComponent(roleUsers.student?.student_id || '')}`, {
      headers: { Cookie: sessionCookies.student }
    });
    assert(studentVisitsRes.status === 403, `student is forbidden from the parent school-visits route (HTTP ${studentVisitsRes.status})`);

    // Parent should NOT be able to access staff dashboard stats
    const parentDashboardRes = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: { Cookie: sessionCookies['parent'] }
    });
    assert(
      parentDashboardRes.status === 403,
      `parent forbidden from staff /api/dashboard/stats (HTTP ${parentDashboardRes.status})`
    );
    const branchSettingsHistoryRes = await fetch(`${API_BASE}/settings/history`, {
      headers: { Cookie: sessionCookies.branch_admin }
    });
    const parentSettingsHistoryRes = await fetch(`${API_BASE}/settings/history`, {
      headers: { Cookie: sessionCookies.parent }
    });
    assert(
      branchSettingsHistoryRes.status === 403 && parentSettingsHistoryRes.status === 403,
      `Branch Admin and Parent cannot access School Admin settings history (${branchSettingsHistoryRes.status}/${parentSettingsHistoryRes.status})`
    );
    const gatePassDenied = await Promise.all(['teacher', 'accountant', 'librarian', 'parent', 'student'].map(role =>
      fetch(`${API_BASE}/gate-passes`, { headers: { Cookie: sessionCookies[role] } })
    ));
    assert(
      gatePassDenied.every(response => response.status === 403),
      `Gate Pass data is limited to Receptionist and school managers (${gatePassDenied.map(response => response.status).join('/')})`
    );

    // Teacher should NOT be able to access SaaS plans
    const teacherSaaSRes = await fetch(`${API_BASE}/subscriptions/plans`, {
      headers: { Cookie: sessionCookies['teacher'] }
    });
    assert(
      teacherSaaSRes.status === 403,
      `teacher forbidden from /api/subscriptions/plans (HTTP ${teacherSaaSRes.status})`
    );

    const parentPublicationRes = await fetch(`${API_BASE}/exam-publication/status`, {
      headers: { Cookie: sessionCookies['parent'] }
    });
    const studentPublicationRes = await fetch(`${API_BASE}/exam-publication/status`, {
      headers: { Cookie: sessionCookies['student'] }
    });
    const teacherPublishRes = await fetch(`${API_BASE}/exam-publication/publish`, {
      method: 'POST',
      headers: { Cookie: sessionCookies['teacher'], 'Content-Type': 'application/json' },
      body: JSON.stringify({ exam_id: 'not-mutated', publish_status: true, result_status: true })
    });
    assert(
      parentPublicationRes.status === 403 && studentPublicationRes.status === 403 && teacherPublishRes.status === 403,
      `family roles cannot read publication status and teachers cannot publish results (${parentPublicationRes.status}/${studentPublicationRes.status}/${teacherPublishRes.status})`
    );

    const accountantPublishRes = await fetch(`${API_BASE}/exam-publication/bulk-publish`, {
      method: 'POST',
      headers: { Cookie: sessionCookies['accountant'], 'Content-Type': 'application/json' },
      body: JSON.stringify({ exam_ids: ['not-mutated'], publish_status: true, result_status: true })
    });
    assert(
      accountantPublishRes.status === 403,
      `accountants cannot publish exam results (HTTP ${accountantPublishRes.status})`
    );
  } catch (err) {
    assert(false, `security boundary tests threw error: ${err.message}`);
  }

  console.log('\n======================================================');
  console.log(`   RESULTS: ${passedTests} / ${totalTests} CHECKS PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
