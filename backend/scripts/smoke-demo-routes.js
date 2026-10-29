const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const baseUrl = process.env.DEMO_API_URL || 'http://localhost:8000/api';

async function run() {
  const accounts = [
    'superadmin',
    'admin',
    'branch',
    'teacher',
    'reception',
    'accountant',
    'librarian',
    'parent',
    'student'
  ];
  const logins = await Promise.all(
    accounts.map(account =>
      fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: `demo.${account}@schoolerp.local`, password: 'Demo@12345' })
      })
    )
  );
  if (logins.some(response => !response.ok))
    throw new Error(
      `role login failure: ${logins.map((response, i) => `${accounts[i]}:${response.status}`).join(',')}`
    );

  const sessionCookie = response => response.headers.get('set-cookie')?.split(';')[0];
  const superadminCookie = sessionCookie(logins[0]);
  const adminCookie = sessionCookie(logins[1]);
  const branchCookie = sessionCookie(logins[2]);
  const teacherCookie = sessionCookie(logins[3]);
  const accountantCookie = sessionCookie(logins[5]);
  const librarianCookie = sessionCookie(logins[6]);
  const parentCookie = sessionCookie(logins[7]);
  const studentCookie = sessionCookie(logins[8]);

  const classworkRoleChecks = await Promise.all([
    fetch(`${baseUrl}/classwork`, { headers: { cookie: adminCookie } }),
    fetch(`${baseUrl}/classwork`, { headers: { cookie: branchCookie } }),
    fetch(`${baseUrl}/classwork`, { headers: { cookie: teacherCookie } }),
    fetch(`${baseUrl}/classwork`, { headers: { cookie: accountantCookie } }),
    fetch(`${baseUrl}/classwork`, { headers: { cookie: parentCookie } }),
    fetch(`${baseUrl}/classwork`, { headers: { cookie: studentCookie } })
  ]);
  if (classworkRoleChecks.some((response, index) => response.status !== (index < 3 ? 200 : 403))) {
    throw new Error(
      `classwork role access mismatch: ${classworkRoleChecks.map(response => response.status).join(',')}`
    );
  }
  const classworkFilters = await fetch(
    `${baseUrl}/classwork?entry_type=Classwork&from_date=2026-01-01&to_date=2026-12-31&academic_year=2026-2027&sort_by=type&sort_order=ASC&page=1&limit=2`,
    {
      headers: { cookie: teacherCookie }
    }
  );
  if (!classworkFilters.ok)
    throw new Error(`classwork filter route failed: ${classworkFilters.status}`);

  if (!superadminCookie || !adminCookie || !branchCookie) {
    throw new Error('login did not return required auth cookies');
  }

  // Verify superadmin stats
  const saStatsRes = await fetch(`${baseUrl}/dashboard/stats`, {
    headers: { cookie: superadminCookie }
  });
  const saStats = await saStatsRes.json();
  if (!saStats.data || saStats.data.totalSchools < 1 || saStats.data.totalRevenue < 2500) {
    throw new Error(`superadmin stats data mismatch: ${JSON.stringify(saStats.data)}`);
  }

  // Verify superadmin platform owner endpoints
  const saOverviewRes = await fetch(`${baseUrl}/dashboard/overview-report`, {
    headers: { cookie: superadminCookie }
  });
  if (!saOverviewRes.ok)
    throw new Error(`superadmin overview report failed: ${saOverviewRes.status}`);
  const saOverview = await saOverviewRes.json();
  if (!saOverview.data || typeof saOverview.data.totalSchools === 'undefined') {
    throw new Error(`superadmin overview report data mismatch: ${JSON.stringify(saOverview.data)}`);
  }

  const saSchoolsRes = await fetch(`${baseUrl}/subscriptions/schools`, {
    headers: { cookie: superadminCookie }
  });
  const saPlansRes = await fetch(`${baseUrl}/subscriptions/plans`, {
    headers: { cookie: superadminCookie }
  });
  if (!saSchoolsRes.ok || !saPlansRes.ok) {
    throw new Error(
      `superadmin subscription routes failed: schools ${saSchoolsRes.status}, plans ${saPlansRes.status}`
    );
  }

  // Verify tenant/role boundary: School admin CANNOT access SaaS platform endpoints (403 Forbidden)
  const adminSaasAccess = await fetch(`${baseUrl}/dashboard/overview-report`, {
    headers: { cookie: adminCookie }
  });
  if (adminSaasAccess.status !== 403) {
    throw new Error(
      `security breach: school admin accessed SaaS overview-report with status ${adminSaasAccess.status}`
    );
  }
  const adminSubscriptionAccess = await fetch(`${baseUrl}/subscriptions/schools`, {
    headers: { cookie: adminCookie }
  });
  if (adminSubscriptionAccess.status !== 403) {
    throw new Error(
      `security breach: school admin accessed SaaS schools with status ${adminSubscriptionAccess.status}`
    );
  }

  // Verify teacher stats
  const teacherStatsRes = await fetch(`${baseUrl}/dashboard/stats`, {
    headers: { cookie: teacherCookie }
  });
  const teacherStats = await teacherStatsRes.json();
  if (!teacherStats.data || teacherStats.data.role !== 'teacher') {
    throw new Error(`teacher stats mismatch: ${JSON.stringify(teacherStats.data)}`);
  }

  // Verify accountant stats
  const accStatsRes = await fetch(`${baseUrl}/dashboard/stats`, {
    headers: { cookie: accountantCookie }
  });
  const accStats = await accStatsRes.json();
  if (!accStats.data || accStats.data.role !== 'accountant' || accStats.data.totalInvoices < 1) {
    throw new Error(`accountant stats mismatch: ${JSON.stringify(accStats.data)}`);
  }

  // Verify student portal
  const studentPortal = await fetch(`${baseUrl}/portal/dashboard`, {
    headers: { cookie: studentCookie }
  });
  const studentMaterials = await fetch(`${baseUrl}/study-materials`, {
    headers: { cookie: studentCookie }
  });
  const adminAuditTrail = await fetch(`${baseUrl}/audit-trail?limit=1`, {
    headers: { cookie: adminCookie }
  });
  const auditExportColumns = [
    { key: 'action', header: 'Activity' },
    { key: 'entity_name', header: 'Entity' }
  ];
  const auditExportQuery = new URLSearchParams({
    format: 'csv',
    columns: JSON.stringify(auditExportColumns)
  });
  const adminAuditExport = await fetch(`${baseUrl}/audit-trail/export?${auditExportQuery}`, {
    headers: { cookie: adminCookie }
  });
  const teacherAuditTrail = await fetch(`${baseUrl}/audit-trail?limit=1`, {
    headers: { cookie: teacherCookie }
  });
  const teacherAuditExport = await fetch(`${baseUrl}/audit-trail/export?${auditExportQuery}`, {
    headers: { cookie: teacherCookie }
  });
  const availableExams = await fetch(`${baseUrl}/online-exams/available`, {
    headers: { cookie: studentCookie }
  });
  const teacherMaterials = await fetch(`${baseUrl}/study-materials`, {
    headers: { cookie: teacherCookie }
  });
  const searchedTeacherMaterials = await fetch(
    `${baseUrl}/study-materials?search=demo&page=1&limit=1`,
    {
      headers: { cookie: teacherCookie }
    }
  );
  const parentMaterials = await fetch(`${baseUrl}/study-materials`, {
    headers: { cookie: parentCookie }
  });
  if (
    !studentPortal.ok ||
    !studentMaterials.ok ||
    !availableExams.ok ||
    !teacherMaterials.ok ||
    !searchedTeacherMaterials.ok ||
    !adminAuditTrail.ok ||
    !adminAuditExport.ok ||
    teacherAuditTrail.status !== 403 ||
    teacherAuditExport.status !== 403 ||
    parentMaterials.status !== 403
  )
    throw new Error(
      `role workflow failure: portal ${studentPortal.status}, student materials ${studentMaterials.status}, teacher materials ${teacherMaterials.status}, searched materials ${searchedTeacherMaterials.status}, admin audit ${adminAuditTrail.status}, admin audit export ${adminAuditExport.status}, teacher audit ${teacherAuditTrail.status}/${teacherAuditExport.status}, parent materials ${parentMaterials.status}, online exams ${availableExams.status}`
    );
  const studentPortalData = await studentPortal.json();
  const studentMaterialsData = await studentMaterials.json();
  const teacherMaterialsData = await teacherMaterials.json();
  const searchedTeacherMaterialsData = await searchedTeacherMaterials.json();
  const adminAuditTrailData = await adminAuditTrail.json();
  const auditExportCsv = await adminAuditExport.text();
  if (
    !studentPortalData.data ||
    !studentPortalData.data.attendance ||
    !Array.isArray(studentPortalData.data.homeworks) ||
    !Array.isArray(studentMaterialsData.data) ||
    !studentMaterialsData.data.some(
      material => material.title === 'Fractions: equivalent fractions'
    ) ||
    !Array.isArray(teacherMaterialsData.data) ||
    !teacherMaterialsData.data.some(
      material => material.title === 'Fractions: equivalent fractions'
    ) ||
    !Array.isArray(searchedTeacherMaterialsData.data) ||
    searchedTeacherMaterialsData.pagination?.page !== 1 ||
    searchedTeacherMaterialsData.pagination?.limit !== 1 ||
    !Array.isArray(adminAuditTrailData.data) ||
    adminAuditTrailData.pagination?.limit !== 1 ||
    !auditExportCsv.includes('Activity')
  ) {
    throw new Error('portal or Study Materials payload missing expected sections');
  }

  // Verify parent portal and child switching
  const parentPortal = await fetch(`${baseUrl}/portal/dashboard`, {
    headers: { cookie: parentCookie }
  });
  if (!parentPortal.ok) throw new Error(`parent portal failure: ${parentPortal.status}`);
  const parentPortalData = await parentPortal.json();
  if (
    !parentPortalData.data ||
    !parentPortalData.data.students ||
    parentPortalData.data.students.length < 2
  ) {
    throw new Error('parent portal should contain at least 2 linked students');
  }
  const secondChildId = parentPortalData.data.students[1].id;
  const switchedPortal = await fetch(`${baseUrl}/portal/dashboard?student_id=${secondChildId}`, {
    headers: { cookie: parentCookie }
  });
  const switchedData = await switchedPortal.json();
  if (switchedData.data.activeStudentId !== secondChildId) {
    throw new Error(`parent child switching failed to activate second child ${secondChildId}`);
  }
  const linkedStudentId = parentPortalData.data.students[0].id;
  const libraryRequestRouteChecks = await Promise.all([
    fetch(`${baseUrl}/library/requests`, { headers: { cookie: librarianCookie } }),
    fetch(`${baseUrl}/library/requests`, { headers: { cookie: teacherCookie } }),
    fetch(`${baseUrl}/portal/library/requests?student_id=${encodeURIComponent(linkedStudentId)}`, {
      headers: { cookie: parentCookie }
    }),
    fetch(`${baseUrl}/portal/library/requests?student_id=${encodeURIComponent(secondChildId)}`, {
      headers: { cookie: sessionCookie(logins[8]) }
    })
  ]);
  const linkedLibraryRequests = await libraryRequestRouteChecks[2].json();

  const cookie = adminCookie;
  const json = async path => {
    const response = await fetch(`${baseUrl}${path}`, { headers: { cookie } });
    if (!response.ok) throw new Error(`${path} ${response.status}`);
    return response.json();
  };
  const branchPayload = await json('/branches');
  const branches = branchPayload.data?.branches || branchPayload.data || [];
  const branchNames = branches.map(branch => branch.name).sort();
  if (branchNames.join('|') !== 'Main Branch|Second Branch')
    throw new Error(`branch fixture mismatch: ${branchNames.join('|')}`);
  const mainStudents = await json(
    `/students?branch_id=${encodeURIComponent(branches.find(branch => branch.code === 'MAIN').id)}`
  );
  const secondStudents = await json(
    `/students?branch_id=${encodeURIComponent(branches.find(branch => branch.code === 'SECOND').id)}`
  );
  const studentCount = payload =>
    Array.isArray(payload.data)
      ? payload.data.length
      : (payload.data?.students?.length ?? payload.data?.data?.length ?? 0);
  if (studentCount(mainStudents) !== 2 || studentCount(secondStudents) !== 1)
    throw new Error('branch student isolation mismatch');
  const studentList = payload =>
    Array.isArray(payload.data) ? payload.data : payload.data?.students || payload.data?.data || [];
  const mainBranch = branches.find(branch => branch.code === 'MAIN');
  const secondBranch = branches.find(branch => branch.code === 'SECOND');
  const mainExamSchedules = await json(
    `/exam-schedules?branch_id=${encodeURIComponent(mainBranch.id)}&page=1&limit=100`
  );
  const examSchedules = mainExamSchedules.data?.schedules || mainExamSchedules.data || [];
  const marksSchedule = examSchedules.find(schedule => schedule.class_id && schedule.subject_id);
  if (!marksSchedule) throw new Error('demo Main Branch subject schedule is missing');
  const marksTemplateParams = new URLSearchParams({
    exam_id: marksSchedule.exam_id,
    class_id: marksSchedule.class_id,
    section_id: marksSchedule.section_id || '',
    subject_id: marksSchedule.subject_id,
    branch_id: mainBranch.id
  });
  const marksTemplateResponse = await fetch(
    `${baseUrl}/marks-entry/import-template?${marksTemplateParams}`,
    { headers: { cookie: adminCookie } }
  );
  const marksTemplateType = marksTemplateResponse.headers.get('content-type') || '';
  const accountantImportAccess = await fetch(
    `${baseUrl}/marks-entry/import-template?${marksTemplateParams}`,
    { headers: { cookie: accountantCookie } }
  );
  const syllabusParams = new URLSearchParams({
    class_id: marksSchedule.class_id,
    subject_id: marksSchedule.subject_id,
    branch_id: mainBranch.id
  });
  const syllabusSubjectParams = new URLSearchParams({
    class_id: marksSchedule.class_id,
    branch_id: mainBranch.id
  });
  const [syllabusRead, syllabusSubjectsResponse, teacherSyllabus, teacherSyllabusSubjects, teacherSyllabusClasses, accountantSyllabus] = await Promise.all([
    fetch(`${baseUrl}/syllabus?${syllabusParams}`, { headers: { cookie: adminCookie } }),
    fetch(`${baseUrl}/syllabus/subjects?${syllabusSubjectParams}`, { headers: { cookie: adminCookie } }),
    fetch(`${baseUrl}/syllabus?${syllabusParams}`, { headers: { cookie: teacherCookie } }),
    fetch(`${baseUrl}/syllabus/subjects?${syllabusSubjectParams}`, { headers: { cookie: teacherCookie } }),
    fetch(`${baseUrl}/syllabus/classes`, { headers: { cookie: teacherCookie } }),
    fetch(`${baseUrl}/syllabus?${syllabusParams}`, { headers: { cookie: accountantCookie } })
  ]);
  const syllabusData = await syllabusRead.json();
  const syllabusSubjectsData = await syllabusSubjectsResponse.json();
  const teacherSyllabusData = await teacherSyllabus.json();
  const teacherSyllabusSubjectsData = await teacherSyllabusSubjects.json();
  const teacherSyllabusClassesData = await teacherSyllabusClasses.json();
  if (!syllabusRead.ok || !Array.isArray(syllabusData.data) || !syllabusSubjectsResponse.ok || !syllabusSubjectsData.data.some(subject => subject.id === marksSchedule.subject_id) || !teacherSyllabus.ok || !teacherSyllabusSubjects.ok || !teacherSyllabusSubjectsData.data.some(subject => subject.id === marksSchedule.subject_id) || !teacherSyllabusClasses.ok || !teacherSyllabusClassesData.data.some(item => item.id === marksSchedule.class_id) || teacherSyllabusClassesData.data.some(item => item.branch_id !== mainBranch.id) || accountantSyllabus.status !== 403) {
    throw new Error(`syllabus route/access mismatch: admin ${syllabusRead.status}, subjects ${syllabusSubjectsResponse.status}, teacher ${teacherSyllabus.status}, accountant ${accountantSyllabus.status}`);
  }
  const branchSyllabusOverride = await fetch(`${baseUrl}/syllabus?${syllabusParams}`, {
    headers: { cookie: branchCookie }
  });
  const secondExamSchedules = await json(
    `/exam-schedules?branch_id=${encodeURIComponent(secondBranch.id)}&page=1&limit=100`
  );
  const secondSyllabusSchedule = (secondExamSchedules.data?.schedules || secondExamSchedules.data || [])
    .find(schedule => schedule.class_id && schedule.subject_id);
  if (!secondSyllabusSchedule) throw new Error('demo Second Branch subject schedule is missing');
  const teacherSyllabusBranchOverride = await fetch(
    `${baseUrl}/syllabus?${new URLSearchParams({
      class_id: secondSyllabusSchedule.class_id,
      subject_id: secondSyllabusSchedule.subject_id,
      branch_id: secondBranch.id
    })}`,
    { headers: { cookie: teacherCookie } }
  );
  if (teacherSyllabusBranchOverride.status !== 400) {
    throw new Error(`Teacher syllabus branch override returned ${teacherSyllabusBranchOverride.status}`);
  }
  const secondSyllabusParams = new URLSearchParams({
    class_id: secondSyllabusSchedule.class_id,
    subject_id: secondSyllabusSchedule.subject_id,
    branch_id: secondBranch.id
  });
  const secondBranchSyllabus = await fetch(`${baseUrl}/syllabus?${secondSyllabusParams}`, {
    headers: { cookie: branchCookie }
  });
  const secondBranchSyllabusData = await secondBranchSyllabus.json();
  if (branchSyllabusOverride.status !== 400 || !secondBranchSyllabus.ok || !secondBranchSyllabusData.data.length) {
    throw new Error(`syllabus branch isolation mismatch: forged main ${branchSyllabusOverride.status}, assigned branch ${secondBranchSyllabus.status}/${secondBranchSyllabusData.data?.length}`);
  }
  const feeStructuresForBranch = async branchId => {
    const payload = await json(
      `/fee-structures?branch_id=${encodeURIComponent(branchId)}&limit=100`
    );
    return payload.data?.feeStructures || payload.data || [];
  };
  const mainRoster = studentList(mainStudents);
  const secondRoster = studentList(secondStudents);
  const mainFeeStructures = await feeStructuresForBranch(mainBranch.id);
  const secondFeeStructures = await feeStructuresForBranch(secondBranch.id);
  const mainFeeStructure = mainFeeStructures.find(
    structure => structure.class_id === mainRoster[0]?.class_id
  );
  const secondFeeStructure = secondFeeStructures.find(
    structure => structure.class_id === secondRoster[0]?.class_id
  );
  if (!mainFeeStructure || !secondFeeStructure)
    throw new Error('demo branch fee-allocation fixtures are missing');
  const mainAllocationPath = `/fee-allocation/students?class_id=${encodeURIComponent(mainRoster[0].class_id)}&fee_group_id=${encodeURIComponent(mainFeeStructure.id)}&branch_id=${encodeURIComponent(mainBranch.id)}`;
  const secondAllocationPath = `/fee-allocation/students?class_id=${encodeURIComponent(secondRoster[0].class_id)}&fee_group_id=${encodeURIComponent(secondFeeStructure.id)}&branch_id=${encodeURIComponent(secondBranch.id)}`;

  const paths = [
    '/branches',
    '/students',
    '/parents',
    '/gate-passes',
    `/gate-passes/students?branch_id=${encodeURIComponent(mainBranch.id)}`,
    '/classes',
    '/sections',
    '/subjects',
    '/academic-years',
    '/academic-calendar',
    '/streams',
    '/student-categories',
    '/subject-teachers',
    '/class-subject-assignments',
    '/class-teachers',
    '/exam-terms',
    '/exams',
    '/exam-schedules',
    '/exams/stats',
    '/homeworks',
    '/live-classes',
    '/classwork',
    '/library/books',
    '/library/borrowers',
    '/library/students',
    '/library/issues',
    '/fee-types',
    '/fee-structures',
    '/fee-fines',
    '/fee-invoices/students/search?search=Alex',
    '/fee-invoices/student-fee-summary',
    '/fee-invoices/grouped?status=overdue',
    '/fee-invoices/grouped?status=sent',
    '/fee-invoices/grouped?status=partial_paid',
    mainAllocationPath,
    '/attendance/sessions',
    '/attendance/reports/summary',
    '/timetables',
    '/exam-halls',
    '/grading-systems',
    '/cards/templates',
    '/transport/routes',
    '/transport/vehicles',
    '/transport/allocations',
    '/hostel/hostels',
    '/hostel/rooms',
    '/inventory/categories',
    '/inventory/items',
    '/inventory/stores',
    '/accounting/categories',
    '/accounting/transactions',
    '/online-exams',
    '/certificate-templates',
    '/reports/catalog',
    '/alumni/directory',
    '/alumni/events',
    '/exam-seatings',
    '/inventory/issues',
    '/dashboard/stats',
    '/dashboard/recent-activities',
    '/dashboard/students-chart',
    '/dashboard/fees-chart',
    '/dashboard/student-distribution',
    '/dashboard/fee-trend',
    '/dashboard/fee-collection-summary',
    '/dashboard/income-vs-expense',
    '/reports/students',
    '/reports/fees',
    '/reports/exams',
    '/reports/attendance',
    '/export/formats?report_type=students',
    '/export/report-types',
    '/schools/my-school',
    '/settings/school',
    '/settings/academic',
    '/settings/fee',
    '/settings/branding',
    '/settings/system',
    '/students/stats',
    '/students/report',
    '/academic-years/dropdown',
    '/academic-years/current',
    '/exam-terms/current',
    '/grading-systems/default',
    '/attendance/analytics',
    '/attendance/analytics/summary',
    '/attendance/analytics/trends',
    '/attendance/reports',
    '/attendance/reports/summary',
    '/fee-invoices/student-fee-summary',
    '/certificates/test'
  ];
  const results = [];
  results.push({
    path: 'library requests (librarian allowed; teacher denied)',
    status: `${libraryRequestRouteChecks[0].status}/${libraryRequestRouteChecks[1].status}`,
    passed: libraryRequestRouteChecks[0].ok && libraryRequestRouteChecks[1].status === 403
  });
  results.push({
    path: 'portal library requests (linked child allowed; other student denied)',
    status: `${libraryRequestRouteChecks[2].status}/${libraryRequestRouteChecks[3].status}`,
    passed: libraryRequestRouteChecks[2].ok && libraryRequestRouteChecks[3].status === 404 &&
      Array.isArray(linkedLibraryRequests.data)
  });
  results.push({
    path: '/audit-trail?limit=1 (admin)',
    status: adminAuditTrail.status,
    passed: true
  });
  results.push({
    path: '/audit-trail (teacher denied)',
    status: teacherAuditTrail.status,
    passed: teacherAuditTrail.status === 403
  });
  results.push({
    path: '/audit-trail/export (admin CSV)',
    status: adminAuditExport.status,
    passed: adminAuditExport.ok && auditExportCsv.includes('Activity')
  });
  results.push({
    path: '/audit-trail/export (teacher denied)',
    status: teacherAuditExport.status,
    passed: teacherAuditExport.status === 403
  });
  results.push({
    path: '/marks-entry/import-template (admin XLSX)',
    status: marksTemplateResponse.status,
    passed: marksTemplateResponse.ok && marksTemplateType.includes('spreadsheetml')
  });
  results.push({
    path: '/marks-entry/import-template (accountant denied)',
    status: accountantImportAccess.status,
    passed: accountantImportAccess.status === 403
  });
  results.push({
    path: '/syllabus (admin and assigned teacher read; accountant denied)',
    status: syllabusRead.status,
    passed: syllabusRead.ok && teacherSyllabus.ok && accountantSyllabus.status === 403 && teacherSyllabusBranchOverride.status === 400,
    details: { admin_units: syllabusData.data.length, teacher_units: teacherSyllabusData.data.length }
  });
  results.push({
    path: '/syllabus/subjects (selected class subject list)',
    status: syllabusSubjectsResponse.status,
    passed: syllabusSubjectsResponse.ok && syllabusSubjectsData.data.some(subject => subject.id === marksSchedule.subject_id) && teacherSyllabusSubjects.ok && teacherSyllabusSubjectsData.data.some(subject => subject.id === marksSchedule.subject_id)
  });
  results.push({
    path: '/syllabus/classes (teacher current-year assigned classes)',
    status: teacherSyllabusClasses.status,
    passed: teacherSyllabusClasses.ok && teacherSyllabusClassesData.data.some(item => item.id === marksSchedule.class_id) && teacherSyllabusClassesData.data.every(item => item.branch_id === mainBranch.id),
    details: { assigned_classes: teacherSyllabusClassesData.data.length, branch: 'MAIN' }
  });
  results.push({
    path: '/syllabus (branch admin pinned to SECOND)',
    status: secondBranchSyllabus.status,
    passed: secondBranchSyllabus.ok && secondBranchSyllabusData.data.length > 0 && branchSyllabusOverride.status === 400,
    details: { units: secondBranchSyllabusData.data.length, assigned_branch: 'SECOND' }
  });
  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`, { headers: { cookie } });
    let passed = response.status < 400;
    let details;
    if (path === mainAllocationPath && response.ok) {
      const payload = await response.json();
      const actualIds = (payload.data?.students || []).map(student => student.id).sort();
      const expectedIds = mainRoster.map(student => student.id).sort();
      passed = actualIds.join('|') === expectedIds.join('|');
      details = { students: actualIds.length, branch: mainBranch.code };
    }
    if (path === '/academic-years/dropdown' && response.ok) {
      const payload = await response.json();
      const years = payload.data;
      passed =
        Array.isArray(years) &&
        years.length > 0 &&
        years.every(year => typeof year.name === 'string');
      details = { academic_years: Array.isArray(years) ? years.length : 0 };
    }
    results.push({ path, status: response.status, passed, ...(details ? { details } : {}) });
  }
  const branchOverrideResponse = await fetch(
    `${baseUrl}${secondAllocationPath.replace(`branch_id=${encodeURIComponent(secondBranch.id)}`, `branch_id=${encodeURIComponent(mainBranch.id)}`)}`,
    { headers: { cookie: branchCookie } }
  );
  let branchOverridePassed = false;
  let branchOverrideDetails;
  if (branchOverrideResponse.ok) {
    const payload = await branchOverrideResponse.json();
    const actualIds = (payload.data?.students || []).map(student => student.id).sort();
    const expectedIds = secondRoster.map(student => student.id).sort();
    branchOverridePassed = actualIds.join('|') === expectedIds.join('|');
    branchOverrideDetails = {
      students: actualIds.length,
      assigned_branch: secondBranch.code,
      requested_branch: mainBranch.code
    };
  }
  results.push({
    path: 'branch-admin-fee-allocation-ignores-branch-override',
    status: branchOverrideResponse.status,
    passed: branchOverridePassed,
    ...(branchOverrideDetails ? { details: branchOverrideDetails } : {})
  });
  console.log(
    JSON.stringify(
      {
        passed: results.every(result => result.passed),
        role_accounts: accounts.length,
        student_workflows: true,
        branches: branchNames,
        main_students: studentCount(mainStudents),
        second_students: studentCount(secondStudents),
        results
      },
      null,
      2
    )
  );
  if (results.some(result => !result.passed)) process.exitCode = 1;
}

run().catch(error => {
  console.error(`Demo route smoke test failed (API: ${baseUrl}):`, error.cause?.code || error);
  process.exitCode = 1;
});
