const express = require('express');
const router = express.Router();
const { School } = require('~/models');

router.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});



module.exports = router; 