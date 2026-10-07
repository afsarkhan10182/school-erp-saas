const express = require('express');
const router = express.Router();

router.use('/vehicles', require('./vehicle.routes'));
router.use('/routes', require('./route.routes'));
router.use('/allocations', require('./allocation.routes'));

module.exports = router;
