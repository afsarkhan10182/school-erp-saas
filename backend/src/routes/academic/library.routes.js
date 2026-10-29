const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { requireModuleAccess } = require('~/middleware/administration/moduleAccess');
const { uploadCSV } = require('~/middleware/shared/upload');
const {
  listBooks,
  listBorrowers,
  listStudents,
  createBook,
  updateBook,
  importBooks,
  getLibraryImportHistory,
  undoLibraryImportBatch,
  listIssues,
  issueBook,
  returnBook
} = require('~/controllers/academic/library.controller');
const {
  listLibraryBookRequests,
  decideLibraryBookRequest,
  fulfillLibraryBookRequest
} = require('~/controllers/academic/library-book-request.controller');

const router = express.Router();
router.use(
  verifyToken,
  setSchoolContext,
  authorize(['super_admin', 'admin', 'branch_admin', 'librarian']),
  requireModuleAccess('library')
);

router.get('/books', listBooks);
router.get('/borrowers', listBorrowers);
router.get('/students', listStudents);
router.post('/books', createBook);
router.post('/books/import', uploadCSV('csv_file'), importBooks);
router.get('/import-history', getLibraryImportHistory);
router.post('/import-history/:id/undo', undoLibraryImportBatch);
router.put('/books/:id', updateBook);
router.get('/issues', listIssues);
router.get('/requests', listLibraryBookRequests);
router.post('/requests/:id/decision', decideLibraryBookRequest);
router.post('/requests/:id/fulfill', fulfillLibraryBookRequest);
router.post('/issues', issueBook);
router.post('/issues/:id/return', returnBook);

module.exports = router;
