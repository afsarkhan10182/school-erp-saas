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

// Test endpoint to debug user role
router.get('/debug-user', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email,
      school_id: req.user.school_id,
      branch_id: req.user.branch_id
    }
  });
});

// Test endpoint to debug authorization
router.get('/debug-auth', verifyToken, authorize(['school_admin']), (req, res) => {
  res.json({
    success: true,
    message: 'Authorization successful',
    user: {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    }
  });
});

// Test endpoint without authorization
router.get('/debug-no-auth', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'No authorization required',
    user: {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    }
  });
});

// Test endpoint with manual role check
router.get('/debug-manual-auth', verifyToken, (req, res) => {
  console.log('=== MANUAL AUTH DEBUG ===');
  console.log('User role:', req.user.role);
  console.log('Allowed roles:', ['super_admin', 'school_admin', 'branch_admin', 'admission_clerk']);
  console.log('Is authorized:', ['super_admin', 'school_admin', 'branch_admin', 'admission_clerk'].includes(req.user.role));
  
  if (['super_admin', 'school_admin', 'branch_admin', 'admission_clerk'].includes(req.user.role)) {
    res.json({
      success: true,
      message: 'Manual authorization successful',
      user: {
        id: req.user.id,
        role: req.user.role,
        email: req.user.email
      }
    });
  } else {
    res.status(403).json({
      success: false,
      message: `User role ${req.user.role} is not authorized`
    });
  }
});

// GET /api/admissions - Get all admissions with filtering and pagination
router.get('/', (req, res, next) => {
  console.log('=== ADMISSIONS ROUTE DEBUG ===');
  console.log('Route matched: GET /api/admissions');
  console.log('User:', req.user);
  console.log('User role:', req.user?.role);
  next();
}, authorize(['super_admin', 'school_admin', 'branch_admin', 'admission_clerk']), getAllAdmissions);

// POST /api/admissions - Create new admission
router.post('/', 
  authorize(['super_admin', 'school_admin', 'branch_admin', 'admission_clerk']),
  uploadFields([
    { name: 'student_profile_picture', maxCount: 1 },
    { name: 'guardian_picture', maxCount: 1 },
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
