const express = require('express');
const router = express.Router();
const StreamController = require('~/controllers/academic/stream.controller');
const { verifyToken, requireRole, authorize } = require('~/middleware/core/auth');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Apply role-based authorization with debugging
router.use((req, res, next) => {
  console.log('🔍 Streams route middleware - User:', {
    id: req.user?.id,
    role: req.user?.role,
    email: req.user?.email,
    school_id: req.user?.school_id,
    branch_id: req.user?.branch_id
  });
  console.log('🔍 Streams route middleware - Allowed roles:', [
    'super_admin',
    'admin',
    'branch_admin'
  ]);
  next();
});

router.use(authorize(['super_admin', 'admin', 'branch_admin']));

// GET /api/streams - Get all streams with pagination and filters
router.get('/', StreamController.getAllStreams);

// GET /api/streams/dropdown - Get streams for dropdown/select
router.get('/dropdown', StreamController.getStreamsForDropdown);

// GET /api/streams/:id - Get stream by ID
router.get('/:id', StreamController.getStreamById);

// POST /api/streams - Create new stream
router.post('/', StreamController.createStream);

// PUT /api/streams/:id - Update stream
router.put('/:id', StreamController.updateStream);

// DELETE /api/streams/:id - Delete stream
router.delete('/:id', StreamController.deleteStream);

module.exports = router;
