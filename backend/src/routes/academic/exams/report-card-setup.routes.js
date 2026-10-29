const express = require('express');
const { verifyToken, setSchoolContext, setBranchContext, requireRole } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { EXAM_ADMIN_ROLES } = require('~/constants/roles');
const ReportCardSetupController = require('~/controllers/academic/exams/report-card-setup.controller');

const router = express.Router();

router.use(verifyToken, setSchoolContext, setBranchContext, requireModuleAccess('exams'));
router.use(requireRole(...EXAM_ADMIN_ROLES));
router.get('/', ReportCardSetupController.list);
router.post('/', ReportCardSetupController.create);
router.put('/:setupId', ReportCardSetupController.update);
router.patch('/:setupId/publication', ReportCardSetupController.setPublication);
router.delete('/:setupId', ReportCardSetupController.remove);

module.exports = router;
