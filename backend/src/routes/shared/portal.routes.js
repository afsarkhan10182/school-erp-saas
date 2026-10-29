const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const {
  portalDashboard,
  portalFeeInvoices,
  portalLibraryCatalog,
  portalReportCard,
  portalReportCardSetups,
  parentSchoolVisits,
  createParentSchoolVisit
} = require('~/controllers/shared/dynamic-entities.controller');
const {
  listPortalLibraryBookRequests,
  createPortalLibraryBookRequest
} = require('~/controllers/academic/library-book-request.controller');

const router = express.Router();
router.use(
  verifyToken,
  setSchoolContext,
  authorize([
    'super_admin',
    'admin',
    'branch_admin',
    'teacher',
    'student',
    'parent',
    'receptionist',
    'accountant',
    'librarian'
  ])
);
router.get('/visits', authorize(['parent']), requireModuleAccess('reception'), parentSchoolVisits);
router.post(
  '/visits',
  authorize(['parent']),
  requireModuleAccess('reception'),
  createParentSchoolVisit
);
router.get('/dashboard', portalDashboard);
router.get('/fees', authorize(['parent', 'student']), portalFeeInvoices);
router.get('/library/books', authorize(['parent', 'student']), requireModuleAccess('library'), portalLibraryCatalog);
router.get('/library/requests', authorize(['parent', 'student']), requireModuleAccess('library'), listPortalLibraryBookRequests);
router.post('/library/requests', authorize(['parent', 'student']), requireModuleAccess('library'), createPortalLibraryBookRequest);
router.get(
  '/students/:studentId/report-card/setups',
  authorize(['parent', 'student']),
  portalReportCardSetups
);
router.get('/students/:studentId/report-card', authorize(['parent', 'student']), portalReportCard);
module.exports = router;
