const express = require('express');
const router = express.Router();
const { verifyToken, setSchoolContext, requireRole } = require('~/middleware/core/auth');
const { validate } = require('~/middleware/shared/validate');
const { uploadMultiple } = require('~/middleware/shared/upload');
const {
  validateModuleAccess,
  checkSubscriptionStatus
} = require('~/middleware/administration/subscriptionValidation');
const CertificateTemplateController = require('~/controllers/administration/certificate-template.controller');
const {
  createCertificateTemplateValidator,
  updateCertificateTemplateValidator,
  getCertificateTemplateValidator,
  deleteCertificateTemplateValidator,
  getCertificateTemplatesValidator
} = require('~/validations/administration/certificate-template');

// All routes require authentication
router.use(verifyToken);

// All routes require school context
router.use(setSchoolContext);

// All routes require subscription validation
router.use(checkSubscriptionStatus);

// Certificate template management routes
router.post(
  '/',
  uploadMultiple([
    { name: 'signature_image', maxCount: 1 },
    { name: 'logo_image', maxCount: 1 },
    { name: 'background_image', maxCount: 1 }
  ]),
  validateModuleAccess('certificates'),
  validate(createCertificateTemplateValidator),
  CertificateTemplateController.createTemplate
);

router.get(
  '/',
  validateModuleAccess('certificates'),
  validate(getCertificateTemplatesValidator),
  CertificateTemplateController.getTemplates
);

router.get(
  '/qr-code-options',
  validateModuleAccess('certificates'),
  CertificateTemplateController.getQrCodeOptions
);

router.get(
  '/:id',
  validateModuleAccess('certificates'),
  validate(getCertificateTemplateValidator),
  CertificateTemplateController.getTemplate
);

router.put(
  '/:id',
  uploadMultiple([
    { name: 'signature_image', maxCount: 1 },
    { name: 'logo_image', maxCount: 1 },
    { name: 'background_image', maxCount: 1 }
  ]),
  validateModuleAccess('certificates'),
  validate(updateCertificateTemplateValidator),
  CertificateTemplateController.updateTemplate
);

router.delete(
  '/:id',
  validateModuleAccess('certificates'),
  validate(deleteCertificateTemplateValidator),
  CertificateTemplateController.deleteTemplate
);

module.exports = router;
