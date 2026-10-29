require('module-alias/register');

jest.mock('~/middleware/core/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { role: req.get('x-test-role'), school_id: 'school-a', branch_id: 'branch-a' };
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
jest.mock('~/controllers/academic/exams/report-card-setup.controller', () =>
  Object.fromEntries(['list', 'create', 'update', 'setPublication', 'remove'].map(name => [
    name,
    (req, res) => res.status(204).end()
  ]))
);

const express = require('express');
const routes = require('../src/routes/academic/exams/report-card-setup.routes');

describe('report-card setup route permissions', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/setups', routes);
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/setups`;
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  it('allows only exam admins to view or mutate setup configurations', async () => {
    for (const role of ['parent', 'student', 'teacher', 'accountant', 'librarian', 'receptionist']) {
      expect((await fetch(baseUrl, { headers: { 'x-test-role': role } })).status).toBe(403);
      expect((await fetch(`${baseUrl}/setup-1/publication`, {
        method: 'PATCH',
        headers: { 'x-test-role': role, 'content-type': 'application/json' },
        body: JSON.stringify({ is_published: true })
      })).status).toBe(403);
    }
    expect((await fetch(baseUrl, { headers: { 'x-test-role': 'branch_admin' } })).status).toBe(204);
    expect((await fetch(`${baseUrl}/setup-1`, {
      method: 'PUT',
      headers: { 'x-test-role': 'admin', 'content-type': 'application/json' },
      body: JSON.stringify({})
    })).status).toBe(204);
  });
});
