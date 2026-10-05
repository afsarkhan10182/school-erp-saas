const express = require('express');
const router = express.Router();

const alumniRoutes = require('./alumni.routes');
const eventRoutes = require('./event.routes');

router.use('/directory', alumniRoutes);
router.use('/events', eventRoutes);

module.exports = router;
