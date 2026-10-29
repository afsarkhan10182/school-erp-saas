require('module-alias/register');

jest.mock('~/middleware/core/auth', () => {
  const auth = jest.requireActual('~/middleware/core/auth');
  return {
    ...auth,
    verifyToken: (req, res, next) => {
      req.user = {
        id: 'test-user',
        role: req.get('x-test-role'),
        school_id: 'school-a',
        branch_id: 'branch-a'
      };
      next();
    },
    setSchoolContext: (req, res, next) => {
      req.schoolId = req.user.school_id;
      next();
    },
    setBranchContext: (req, res, next) => {
      req.branchId = req.user.branch_id;
      next();
    }
  };
});

jest.mock('~/controllers/academic/attendance/attendance.controller', () =>
  Object.fromEntries(
    [
      'upsertSession',
      'saveRecords',
      'getSession',
      'listSessions',
      'getReport',
      'notifyAbsentees',
      'exportReport',
      'exportPDFReport',
      'exportExcelReport',
      'getSummary',
      'debugAttendanceData'
    ].map(name => [name, (req, res) => res.status(204).end()])
  )
);

jest.mock('~/controllers/academic/attendance/attendance-analytics.controller', () =>
  Object.fromEntries(
    [
      'getAttendanceAnalytics',
      'getAttendanceSummary',
      'getAttendanceTrends',
      'getClassPerformance',
      'getStudentPerformance',
      'getAttendanceAlerts',
      'exportAttendanceAnalytics',
      'getDetailedReport',
      'getStudentAttendanceHistory'
    ].map(name => [name, (req, res) => res.status(204).end()])
  )
);

const express = require('express');
const attendanceRoutes = require('../src/routes/academic/attendance/attendance.routes');

describe('Attendance route permissions', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    const app = express();
    app.use('/api/attendance', attendanceRoutes);
    app.use((error, req, res, next) =>
      res.status(error.statusCode || 500).json({ message: error.message })
    );
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api/attendance`;
  });

  afterAll(async () => {
    await new Promise((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    );
  });

  const request = (role, path, method = 'GET') =>
    fetch(`${baseUrl}${path}`, { method, headers: { 'x-test-role': role } });

  it('denies non-attendance roles and keeps analytics/reporting admin-only', async () => {
    for (const role of ['parent', 'student', 'accountant', 'receptionist', 'librarian']) {
      expect((await request(role, '/sessions')).status).toBe(403);
    }
    expect((await request('teacher', '/reports')).status).toBe(403);
    expect((await request('teacher', '/analytics')).status).toBe(403);
    expect((await request('teacher', '/notify-absentees', 'POST')).status).toBe(403);
  });

  it('allows assigned staff attendance pages and administrator reports', async () => {
    expect((await request('teacher', '/sessions')).status).toBe(204);
    expect((await request('branch_admin', '/reports')).status).toBe(204);
    expect((await request('admin', '/analytics')).status).toBe(204);
  });
});
