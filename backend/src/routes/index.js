const express = require('express');
const router = express.Router();
const { version } = require('../../package.json');

// Import route files
const authRoutes = require('./auth.routes');
const schoolRoutes = require('./school.routes');
const branchRoutes = require('./branch.routes');
const userRoutes = require('./user.routes');

// API version
router.get('/version', (req, res) => {
  res.json({ version });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/schools', schoolRoutes);
router.use('/branches', branchRoutes);
router.use('/users', userRoutes);

// 404 handler for API routes
router.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

module.exports = router;
