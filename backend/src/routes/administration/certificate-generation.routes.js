const express = require('express');
const router = express.Router();
const { verifyToken, setSchoolContext, requireRole } = require('~/middleware/core/auth');
const { validate } = require('~/middleware/shared/validate');
const {
  validateModuleAccess,
  checkSubscriptionStatus
} = require('~/middleware/administration/subscriptionValidation');
const CertificateGenerationController = require('~/controllers/administration/certificate-generation.controller');
const {
  generateStudentCertificatesValidator,
  generateEmployeeCertificatesValidator
} = require('~/validations/administration/certificate-generation');

// All routes require authentication
router.use(verifyToken);

// All routes require school context
router.use(setSchoolContext);

// All routes require subscription validation
router.use(checkSubscriptionStatus);

// Test route to verify registration
router.get('/test', (req, res) => {
  res.json({ message: 'Certificate generation routes are working!' });
});

// Simple POST test route
router.post('/test-post', (req, res) => {
  res.json({ message: 'POST route is working!', body: req.body });
});

// Certificate generation routes
router.post(
  '/students',
  validateModuleAccess('certificates'),
  validate(generateStudentCertificatesValidator),
  CertificateGenerationController.generateStudentCertificates
);

router.post(
  '/employees',
  validateModuleAccess('certificates'),
  validate(generateEmployeeCertificatesValidator),
  CertificateGenerationController.generateEmployeeCertificates
);

module.exports = router;
