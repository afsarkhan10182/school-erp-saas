require('module-alias/register');

const express = require('express');
const request = require('supertest');

jest.mock('../src/middleware/core/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { role: req.get('x-test-role'), branch_id: 'branch-1' };
    next();
  },
  setSchoolContext: (req, res, next) => {
    req.schoolId = 'school-1';
    next();
  }
}));

jest.mock('../src/middleware/administration/moduleAccess', () => ({
  requireModuleAccess: () => (req, res, next) => next()
}));

jest.mock('../src/controllers/shared/export.controller', () => ({
  exportReport: (req, res) => res.status(204).end(),
  exportHomeworkReport: (req, res) => res.status(204).end(),
  exportClassworkReport: (req, res) => res.status(204).end(),
  exportGatePassReport: (req, res) => res.status(204).end(),
  exportVisitorReport: (req, res) => res.status(204).end(),
  exportAdmissionEnquiryReport: (req, res) => res.status(204).end(),
  getExportFormats: (req, res) => res.status(204).end(),
  getReportTypes: (req, res) => res.status(204).end(),
  getReportColumns: (req, res) => res.status(204).end()
}));

const exportRoutes = require('../src/routes/shared/export.routes');
const app = express();
app.use(express.json());
app.use('/export', exportRoutes);
app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({ message: error.message });
});

describe('report export route permissions', () => {
  it.each(['parent', 'student', 'teacher', 'receptionist'])(
    'denies data exports to %s',
    async role => {
      await request(app).get('/export').set('x-test-role', role).expect(403);
      await request(app).post('/export').set('x-test-role', role).send({}).expect(403);
    }
  );

  it.each(['super_admin', 'admin', 'branch_admin', 'accountant', 'librarian'])(
    'allows operational report exports for %s',
    async role => {
      await request(app).get('/export').set('x-test-role', role).expect(204);
      await request(app).post('/export').set('x-test-role', role).send({}).expect(204);
    }
  );

  it.each(['parent', 'student', 'receptionist', 'librarian', 'accountant'])(
    'denies homework exports to %s',
    async role => {
      await request(app).get('/export/homeworks').set('x-test-role', role).expect(403);
    }
  );

  it.each(['super_admin', 'admin', 'branch_admin', 'teacher'])(
    'allows homework exports for %s',
    async role => {
      await request(app).get('/export/homeworks').set('x-test-role', role).expect(204);
    }
  );

  it.each(['parent', 'student', 'receptionist', 'librarian', 'accountant'])(
    'denies classwork exports to %s', async role => {
      await request(app).get('/export/classwork').set('x-test-role', role).expect(403);
    }
  );
  it.each(['super_admin', 'admin', 'branch_admin', 'teacher'])(
    'allows classwork exports for %s', async role => {
      await request(app).get('/export/classwork').set('x-test-role', role).expect(204);
    }
  );

  it.each(['parent', 'student', 'teacher', 'accountant', 'librarian'])(
    'denies gate pass exports to %s',
    async role => {
      await request(app).get('/export/gate-passes').set('x-test-role', role).expect(403);
    }
  );

  it.each(['super_admin', 'admin', 'branch_admin', 'receptionist'])(
    'allows gate pass exports for %s',
    async role => {
      await request(app).get('/export/gate-passes').set('x-test-role', role).expect(204);
    }
  );

  it.each(['parent', 'student', 'teacher', 'accountant', 'librarian'])(
    'denies visitor exports to %s',
    async role => {
      await request(app).get('/export/visitors').set('x-test-role', role).expect(403);
    }
  );

  it.each(['super_admin', 'admin', 'branch_admin', 'receptionist'])(
    'allows visitor exports for %s',
    async role => {
      await request(app).get('/export/visitors').set('x-test-role', role).expect(204);
    }
  );

  it.each(['parent', 'student', 'teacher', 'accountant', 'librarian'])(
    'denies admission enquiry exports to %s',
    async role => {
      await request(app).get('/export/admission-enquiries').set('x-test-role', role).expect(403);
    }
  );

  it.each(['super_admin', 'admin', 'branch_admin', 'receptionist'])(
    'allows admission enquiry exports for %s',
    async role => {
      await request(app).get('/export/admission-enquiries').set('x-test-role', role).expect(204);
    }
  );
});
