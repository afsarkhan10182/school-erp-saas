require('module-alias/register');
require('dotenv').config();

const { LiveClass, School, Branch, Student, Subject, User } = require('../src/models');
const baseUrl = process.env.DEMO_API_URL || 'http://localhost:8000/api';
const password = 'Demo@12345';

async function login(email) {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) throw new Error(`${email} login failed (${response.status})`);
  return response.headers.get('set-cookie')?.split(';')[0];
}

async function call(path, cookie, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      cookie,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const contentType = response.headers.get('content-type') || '';
  return {
    response,
    data: contentType.includes('json') ? await response.json() : await response.text()
  };
}

async function run() {
  let createdId;
  try {
    const [
      adminCookie,
      branchCookie,
      teacherCookie,
      secondTeacherCookie,
      accountantCookie,
      receptionistCookie,
      librarianCookie,
      parentCookie,
      studentCookie
    ] = await Promise.all([
      login('demo.admin@schoolerp.local'),
      login('demo.branch@schoolerp.local'),
      login('demo.teacher@schoolerp.local'),
      login('demo.teacher.second@schoolerp.local'),
      login('demo.accountant@schoolerp.local'),
      login('demo.reception@schoolerp.local'),
      login('demo.librarian@schoolerp.local'),
      login('demo.parent@schoolerp.local'),
      login('demo.student@schoolerp.local')
    ]);
    const school = await School.findOne({ where: { code: 'DEMOERP' } });
    const main = await Branch.findOne({ where: { school_id: school.id, code: 'MAIN' } });
    const second = await Branch.findOne({ where: { school_id: school.id, code: 'SECOND' } });
    const mainStudent = await Student.findOne({
      where: { school_id: school.id, admission_number: 'DEMO-001' }
    });
    const subject = await Subject.findOne({
      where: { school_id: school.id, class_id: mainStudent.class_id, name: 'Mathematics' }
    });
    const teacher = await User.findOne({
      where: { school_id: school.id, email: 'demo.teacher@schoolerp.local' }
    });

    const roleChecks = await Promise.all([
      call('/live-classes', adminCookie),
      call('/live-classes', branchCookie),
      call('/live-classes', teacherCookie),
      call(`/live-classes?branch_id=${main.id}`, secondTeacherCookie),
      ...[accountantCookie, receptionistCookie, librarianCookie, parentCookie, studentCookie].map(
        cookie => call('/live-classes', cookie)
      )
    ]);
    const roleStatuses = roleChecks.map(item => item.response.status);
    if (roleStatuses.join(',') !== '200,200,200,200,403,403,403,403,403') {
      throw new Error(`role access mismatch: ${roleStatuses.join(',')}`);
    }
    const invalidBranch = await call(
      '/live-classes?branch_id=00000000-0000-0000-0000-000000000000',
      adminCookie
    );
    if (invalidBranch.response.status !== 400) {
      throw new Error(
        `invalid branch scope returned ${invalidBranch.response.status}, expected 400`
      );
    }
    const adminRows = roleChecks[0].data.data;
    const branchRows = roleChecks[1].data.data;
    const teacherRows = roleChecks[2].data.data;
    const secondTeacherRows = roleChecks[3].data.data;
    if (
      !adminRows.some(row => row.branch_id === main.id) ||
      !adminRows.some(row => row.branch_id === second.id) ||
      branchRows.some(row => row.branch_id !== second.id) ||
      teacherRows.some(row => row.branch_id !== main.id) ||
      secondTeacherRows.some(row => row.branch_id !== second.id)
    ) {
      throw new Error('school-wide, branch-admin, or assigned-teacher branch scope mismatch');
    }
    const mainSession = adminRows.find(row => row.branch_id === main.id);
    const pastSessions = await call('/live-classes?status=past', adminCookie);
    const scheduledSessions = await call('/live-classes?status=scheduled', adminCookie);
    if (
      pastSessions.response.status !== 200 ||
      !pastSessions.data.data.some(row => row.title === 'Demo Mathematics Review') ||
      scheduledSessions.response.status !== 200 ||
      !scheduledSessions.data.data.some(row => row.title === 'Demo English Reading Room')
    ) {
      throw new Error('Live Class Past/Scheduled filters did not match the seeded sessions');
    }
    const dateRange = `date_from=${encodeURIComponent(new Date(Date.now() - 2 * 86400000).toISOString())}&date_to=${encodeURIComponent(new Date(Date.now() + 2 * 86400000).toISOString())}`;
    const monthSessions = await call(
      `/live-classes?status=past&${dateRange}`,
      adminCookie
    );
    const invalidDateRange = await call('/live-classes?date_from=2026-10-01', adminCookie);
    if (
      monthSessions.response.status !== 200 ||
      !monthSessions.data.data.some(row => row.title === 'Demo Mathematics Review') ||
      monthSessions.data.data.some(row => row.title === 'Demo English Reading Room') ||
      invalidDateRange.response.status !== 400
    ) {
      throw new Error('Live Class date range filter failed or accepted an invalid boundary');
    }
    const crossBranchAttendance = await call(
      `/live-classes/${mainSession.id}/attendance`,
      secondTeacherCookie
    );
    if (crossBranchAttendance.response.status !== 404) {
      throw new Error(
        `second-branch teacher read a Main Branch session (${crossBranchAttendance.response.status})`
      );
    }

    const payload = {
      title: `Workflow verification ${Date.now()}`,
      class_id: mainStudent.class_id,
      section_id: mainStudent.section_id,
      subject_id: subject.id,
      teacher_id: teacher.id,
      scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 35,
      meeting_url: 'https://meet.jit.si/demo-workflow-check',
      school_id: school.id,
      branch_id: main.id
    };
    let result = await call('/live-classes', adminCookie, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (result.response.status !== 201 || result.data.roster_count !== 2)
      throw new Error(`schedule create failed: ${JSON.stringify(result.data)}`);
    createdId = result.data.data.id;

    result = await call(`/live-classes/${createdId}/attendance`, adminCookie);
    const row = result.data.data.attendance.find(item => item.student_id === mainStudent.id);
    if (result.response.status !== 200 || !row)
      throw new Error('created session roster was not returned');
    result = await call(`/live-classes/${createdId}/attendance/${mainStudent.id}`, adminCookie, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'present', duration_minutes: 34, remarks: '=1+1' })
    });
    if (result.response.status !== 200 || result.data.data.status !== 'present')
      throw new Error('attendance override did not persist');
    result = await call(`/live-classes/${createdId}/attendance/export.csv`, adminCookie);
    if (
      result.response.status !== 200 ||
      !String(result.data).includes('Admission No.') ||
      !String(result.data).includes('Sarah Demo') ||
      !String(result.data).includes("'=1+1")
    )
      throw new Error('attendance CSV export failed');
    result = await call(`/live-classes/${createdId}`, adminCookie, {
      method: 'PUT',
      body: JSON.stringify({ ...payload, title: `${payload.title} updated` })
    });
    if (result.response.status !== 200)
      throw new Error(`schedule edit failed: ${JSON.stringify(result.data)}`);
    result = await call(`/live-classes/${createdId}/cancel`, adminCookie, { method: 'PATCH' });
    if (result.response.status !== 200 || result.data.data.status !== 'cancelled')
      throw new Error('schedule cancellation failed');

    console.log(
      JSON.stringify(
        {
          passed: true,
          role_statuses: roleStatuses,
          invalid_branch_rejected: true,
          school_admin_branches: [...new Set(adminRows.map(row => row.branch_id))].length,
          branch_admin_rows: branchRows.length,
          teacher_rows: teacherRows.length,
          second_teacher_rows: secondTeacherRows.length,
          cross_branch_session_denied: true,
          create_roster: 2,
          attendance_override: true,
          csv_export: true,
          edit: true,
          cancel: true
        },
        null,
        2
      )
    );
  } finally {
    if (createdId) await LiveClass.destroy({ where: { id: createdId } });
  }
}

run()
  .catch(error => {
    console.error('Live-class workflow verification failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => require('../src/config/database').sequelize.close());
