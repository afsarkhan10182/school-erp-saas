const express = require('express');
const {
  getAllAdmissions,
  createAdmission,
  getAdmissionById,
  updateAdmissionStatus,
  deleteAdmission,
  getAdmissionStats,
  getAdmissionReport,
  exportAdmissionsToExcel,
  exportAdmissionsToCSV
} = require('../controllers/admission.controller');
const { verifyToken, authorize } = require('../middleware/auth');
const { uploadFields } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/admissions - Get all admissions with filtering and pagination
router.get('/', authorize(['super_admin', 'school_admin', 'branch_admin', 'admission_clerk']), getAllAdmissions);

// POST /api/admissions - Create new admission
router.post('/', 
  authorize(['super_admin', 'school_admin', 'branch_admin', 'admission_clerk']),
  uploadFields([
    { name: 'student_photo', maxCount: 1 },
    { name: 'birth_certificate', maxCount: 1 },
    { name: 'transfer_certificate', maxCount: 1 },
    { name: 'previous_records', maxCount: 1 },
    { name: 'address_proof', maxCount: 1 },
  ]),
  createAdmission
);

// GET /api/admissions/stats - Get admission statistics
router.get('/stats', authorize(['super_admin', 'school_admin', 'branch_admin', 'admission_clerk']), getAdmissionStats);

// GET /api/admissions/:id - Get admission by ID
router.get('/:id', authorize(['super_admin', 'school_admin', 'branch_admin', 'admission_clerk']), getAdmissionById);

// PUT /api/admissions/:id/status - Update admission status
router.put('/:id/status', authorize(['super_admin', 'school_admin', 'branch_admin', 'admission_clerk']), updateAdmissionStatus);

// DELETE /api/admissions/:id - Delete admission
router.delete('/:id', authorize(['super_admin', 'school_admin', 'branch_admin']), deleteAdmission);

// GET /api/admissions/report - Generate admission report
router.get('/report', authorize(['super_admin', 'school_admin', 'branch_admin']), getAdmissionReport);

// GET /api/admissions/export/excel - Export admissions to Excel
router.get('/export/excel', authorize(['super_admin', 'school_admin', 'branch_admin']), exportAdmissionsToExcel);

// GET /api/admissions/export/csv - Export admissions to CSV
router.get('/export/csv', authorize(['super_admin', 'school_admin', 'branch_admin']), exportAdmissionsToCSV);

module.exports = router;
