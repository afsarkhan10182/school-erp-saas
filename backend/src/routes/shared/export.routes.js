const express = require('express');
const router = express.Router();
const { verifyToken, setSchoolContext } = require('~/middleware/core/auth');
const { requireRole } = require('~/middleware/core/roleValidation');
const {
  exportReport,
  getExportFormats,
  getReportTypes,
  getReportColumns
} = require('~/controllers/shared/export.controller');

router.get('/', verifyToken, setSchoolContext, exportReport);

router.post('/', verifyToken, setSchoolContext, exportReport);

router.get('/formats', verifyToken, setSchoolContext, getExportFormats);

router.get('/report-types', verifyToken, setSchoolContext, getReportTypes);

router.get('/columns', verifyToken, setSchoolContext, getReportColumns);

module.exports = router;
