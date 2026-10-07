const express = require('express');

const router = express.Router();

router.use('/categories', require('./category.routes'));
router.use('/suppliers', require('./supplier.routes'));
router.use('/stores', require('./store.routes'));
router.use('/items', require('./item.routes'));
router.use('/issues', require('./issue.routes'));

module.exports = router;
