const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const SchoolController = require('../controllers/school.controller');
const {
  createSchoolValidator,
  updateSchoolValidator,
} = require('../validations/school.validation');

// All routes require authentication
router.use(verifyToken);

// Super Admin only routes
router.post(
  '/',
  requireRole(['super_admin']),
  ...createSchoolValidator,
  SchoolController.createSchool
);

router.get(
  '/',
  requireRole(['super_admin']),
  SchoolController.getAllSchools
);

// School Admin routes (for their own school) - must come before /:id
router.get(
  '/my-school',
  requireRole(['school_admin']),
  SchoolController.getMySchool
);

router.put(
  '/my-school',
  requireRole(['school_admin']),
  ...updateSchoolValidator,
  SchoolController.updateMySchool
);

router.get(
  '/:id',
  requireRole(['super_admin', 'school_admin']),
  SchoolController.getSchoolById
);

router.put(
  '/:id',
  requireRole(['super_admin']),
  ...updateSchoolValidator,
  SchoolController.updateSchool
);

router.delete(
  '/:id',
  requireRole(['super_admin']),
  SchoolController.deleteSchool
);



module.exports = router; 