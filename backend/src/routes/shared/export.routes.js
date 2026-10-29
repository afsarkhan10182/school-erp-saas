const express = require('express');
const router = express.Router();
const { verifyToken, setSchoolContext } = require('~/middleware/core/auth');
const { requireRole } = require('~/middleware/core/roleValidation');
const {
  exportReport,
  exportHomeworkReport,
  exportClassworkReport,
  exportGatePassReport,
  exportVisitorReport,
  exportAdmissionEnquiryReport,
  getExportFormats,
  getReportTypes,
  getReportColumns
} = require('~/controllers/shared/export.controller');

const canExport = requireRole('super_admin', 'admin', 'branch_admin', 'accountant', 'librarian');
const canExportHomework = requireRole('super_admin', 'admin', 'branch_admin', 'teacher');
const canExportGatePasses = requireRole('super_admin', 'admin', 'branch_admin', 'receptionist');
const canExportVisitors = requireRole('super_admin', 'admin', 'branch_admin', 'receptionist');
const canExportAdmissionEnquiries = requireRole('super_admin', 'admin', 'branch_admin', 'receptionist');

router.get('/homeworks', verifyToken, setSchoolContext, canExportHomework, exportHomeworkReport);
router.get('/classwork', verifyToken, setSchoolContext, require('~/middleware/administration/moduleAccess').requireModuleAccess('attachments'), canExportHomework, exportClassworkReport);
router.get(
  '/gate-passes',
  verifyToken,
  setSchoolContext,
  canExportGatePasses,
  exportGatePassReport
);
router.get('/visitors', verifyToken, setSchoolContext, canExportVisitors, exportVisitorReport);
router.get(
  '/admission-enquiries',
  verifyToken,
  setSchoolContext,
  canExportAdmissionEnquiries,
  exportAdmissionEnquiryReport
);

router.get('/', verifyToken, setSchoolContext, canExport, exportReport);

router.post('/', verifyToken, setSchoolContext, canExport, exportReport);

router.get('/formats', verifyToken, setSchoolContext, getExportFormats);

router.get('/report-types', verifyToken, setSchoolContext, getReportTypes);

router.get('/columns', verifyToken, setSchoolContext, getReportColumns);

module.exports = router;
