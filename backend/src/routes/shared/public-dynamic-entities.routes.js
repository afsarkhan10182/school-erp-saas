const express = require('express');
const controller = require('~/controllers/shared/dynamic-entities.controller');

const router = express.Router();
router.get('/admissions/:schoolCode/classes', controller.publicClasses);
router.post('/admissions/:schoolCode', controller.publicAdmission);
module.exports = router;
