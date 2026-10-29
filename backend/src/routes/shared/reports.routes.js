const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const controller = require('~/controllers/shared/reports.controller');

const router = express.Router();
const staff = [
  verifyToken,
  setSchoolContext,
  authorize(['super_admin', 'admin', 'branch_admin', 'teacher', 'accountant'])
];

const MODULE_GATE = {
  students: 'students',
  fees: 'fees',
  attendance: 'attendance',
  library: 'library',
  hostel: 'hostel',
  transport: 'transport',
  hr: 'hr',
  inventory: 'inventory',
  accounting: 'accounting',
  exams: 'exams'
};

const gateByModule = (req, res, next) => {
  const code = MODULE_GATE[req.params.module] || 'reports';
  return requireModuleAccess(code)(req, res, next);
};

router.get('/catalog', ...staff, controller.catalog);
router.get('/:module', ...staff, gateByModule, controller.suite);

module.exports = router;
