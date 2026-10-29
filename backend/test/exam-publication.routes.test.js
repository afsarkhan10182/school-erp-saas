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
    }
  };
});
jest.mock('~/middleware/administration/moduleAccess', () => ({
  requireModuleAccess: () => (req, res, next) => next()
}));
jest.mock('~/controllers/academic/exam-publication/exam-publication.controller', () =>
  Object.fromEntries([
    'getPublicationStatus', 'publishExam', 'bulkPublish', 'sendNotifications',
    'getNotificationHistory', 'getStats'
  ].map(name => [name, (req, res) => res.status(204).end()]))
);

const express = require('express');
const publicationRoutes = require('../src/routes/academic/exam-publication');

describe('Exam publication route permissions', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/exam-publication', publicationRoutes);
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api/exam-publication`;
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  const request = (role, path, method = 'GET') => fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'x-test-role': role, 'content-type': 'application/json' },
    ...(method === 'POST' ? { body: JSON.stringify({}) } : {})
  });

  it('denies family roles access to publication status and publication writes', async () => {
    expect((await request('parent', '/status')).status).toBe(403);
    expect((await request('student', '/status')).status).toBe(403);
    expect((await request('teacher', '/publish', 'POST')).status).toBe(403);
    expect((await request('accountant', '/bulk-publish', 'POST')).status).toBe(403);
  });

  it('allows exam roles to read status and only exam admins to publish', async () => {
    expect((await request('teacher', '/status')).status).toBe(204);
    expect((await request('branch_admin', '/publish', 'POST')).status).toBe(204);
  });
});
