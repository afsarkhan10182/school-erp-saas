require('module-alias/register');

jest.mock('~/middleware/core/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 'user-a', role: req.get('x-test-role'), school_id: 'school-a' };
    req.schoolId = 'school-a';
    next();
  },
  setSchoolContext: (req, res, next) => next(),
  setBranchContext: (req, res, next) => next(),
  requireRole: (...roles) => (req, res, next) =>
    roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Forbidden' })
}));
jest.mock('~/middleware/administration/moduleAccess', () => ({
  requireModuleAccess: () => (req, res, next) => next()
}));
jest.mock('~/controllers/academic/exam-reports/exam-reports.controller', () => ({
  getStudentsForReportCards: (req, res) => res.status(204).end(),
  getReportCardTemplates: (req, res) => res.status(204).end(),
  generateReportCards: (req, res) => res.status(204).end(),
  downloadReportCard: (req, res) => res.status(204).end(),
  getTabulationSheet: (req, res) => res.status(204).end(),
  getProgressReport: (req, res) => res.status(204).end(),
  getStudentReportCardArchives: (req, res) => res.status(204).end(),
  downloadStudentReportCardArchive: (req, res) => res.status(204).end()
}));
jest.mock('~/controllers/academic/exams/report-card-template.controller', () => ({
  create: (req, res) => res.status(201).json({ success: true }),
  update: (req, res) => res.status(200).json({ success: true })
}));

const express = require('express');
const routes = require('../src/routes/academic/exam-reports');

describe('report-card template management permissions', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/reports', routes);
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/reports/templates`;
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  it('allows school admins and Platform Owners, but not Branch Admins or teaching/portal roles', async () => {
    for (const role of ['branch_admin', 'teacher', 'accountant', 'librarian', 'receptionist', 'parent', 'student']) {
      expect((await fetch(baseUrl, {
        method: 'POST',
        headers: { 'x-test-role': role, 'content-type': 'application/json' },
        body: JSON.stringify({})
      })).status).toBe(403);
    }

    for (const role of ['admin', 'super_admin']) {
      expect((await fetch(baseUrl, {
        method: 'POST',
        headers: { 'x-test-role': role, 'content-type': 'application/json' },
        body: JSON.stringify({})
      })).status).toBe(201);
      expect((await fetch(`${baseUrl}/template-a`, {
        method: 'PUT',
        headers: { 'x-test-role': role, 'content-type': 'application/json' },
        body: JSON.stringify({})
      })).status).toBe(200);
    }
  });
});
