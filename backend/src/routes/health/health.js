const express = require('express');
const router = express.Router();
const { School } = require('../../models');

router.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Test endpoint to directly query schools
router.get('/test-schools', async (req, res) => {
  try {
    console.log('=== TESTING SCHOOLS QUERY ===');
    
    // Test 1: Simple findAll
    console.log('1. Testing School.findAll()...');
    const schools = await School.findAll({
      limit: 5,
      order: [['created_at', 'DESC']]
    });
    
    console.log('Result:', {
      count: schools.length,
      schools: schools.map(s => ({ id: s.id, name: s.name, code: s.code }))
    });
    
    // Test 2: findAndCountAll (like the actual service)
    console.log('2. Testing School.findAndCountAll()...');
    const { count, rows } = await School.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      offset: 0
    });
    
    console.log('findAndCountAll result:', { count, rowsCount: rows.length });
    
    res.json({
      success: true,
      data: {
        items: schools,
        total: count,
        page: 1,
        limit: 5,
        totalPages: Math.ceil(count / 5)
      }
    });
  } catch (error) {
    console.error('Error in test-schools:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router; 