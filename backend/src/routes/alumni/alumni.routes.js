const express = require('express');
const { verifyToken, setSchoolContext, authorize } = require('~/middleware/core/auth');
const { list, create, update, destroy } = require('~/controllers/alumni/alumni.controller');

const router = express.Router();
router.use(verifyToken, setSchoolContext, authorize(['super_admin', 'admin', 'branch_admin']));

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', destroy);

module.exports = router;
