const express = require('express');
const { verifyToken, setSchoolContext, setBranchContext } = require('../middleware/auth');
const { uploadCSV } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { upsertSession, saveRecords, getSession, listSessions, getReport, bulkImport, notifyAbsentees, exportReport, bulkImportFile, exportPDFReport, getSummary, generateImportTemplate } = require('../controllers/attendance.controller');

const router = express.Router();

// All attendance routes require auth and school/branch context
router.use(verifyToken, setSchoolContext, setBranchContext);

router.post('/session', upsertSession);
router.post('/records', saveRecords);
router.get('/sessions/:id', getSession);
router.get('/sessions', listSessions);
router.get('/reports', getReport);
router.get('/reports/export', exportReport);
router.get('/reports/export/pdf', exportPDFReport);
router.get('/reports/export/excel', exportReport);
router.get('/reports/summary', getSummary);
router.get('/import-template', generateImportTemplate);
router.post('/bulk-import', bulkImport);
router.post('/notify-absentees', notifyAbsentees);
router.post('/bulk-import/file', uploadCSV('file'), bulkImportFile);

module.exports = router;


