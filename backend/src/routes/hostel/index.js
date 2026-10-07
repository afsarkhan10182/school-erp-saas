const express = require('express');
const router = express.Router();

router.use('/hostels', require('./hostel.routes'));
router.use('/rooms', require('./room.routes'));
router.use('/allocations', require('./allocation.routes'));

module.exports = router;
