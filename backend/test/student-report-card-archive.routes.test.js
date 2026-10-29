require('module-alias/register');

jest.mock('~/middleware/core/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { role: req.get('x-test-role'), school_id: 'school-a' };
    req.schoolId = 'school-a';
    req.branchId = 'branch-a';
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
jest.mock('~/controllers/academic/exams/report-card-template.controller', () => ({ create: () => {}, update: () => {} }));

const express = require('express');
const routes = require('../src/routes/academic/exam-reports');

describe('student report-card archive route permissions', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    const app = express();
    app.use('/exam-reports', routes);
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/exam-reports`;
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  it('allows exam staff and denies portal/finance roles on archive reads and downloads', async () => {
    const archiveListUrl = `${baseUrl}/students/student-a/archives`;
    const downloadUrl = `${baseUrl}/archives/archive-a/download`;
    for (const role of ['parent', 'student', 'teacher', 'accountant', 'librarian', 'receptionist']) {
      expect((await fetch(archiveListUrl, { headers: { 'x-test-role': role } })).status).toBe(403);
      expect((await fetch(downloadUrl, { headers: { 'x-test-role': role } })).status).toBe(403);
    }
    expect((await fetch(archiveListUrl, { headers: { 'x-test-role': 'branch_admin' } })).status).toBe(204);
    expect((await fetch(downloadUrl, { headers: { 'x-test-role': 'admin' } })).status).toBe(204);
  });
});
