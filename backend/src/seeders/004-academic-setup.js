'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Classes for Demo School
    await queryInterface.bulkInsert('classes', [
      {
        id: '550e8400-e29b-41d4-a716-446655440009',
        name: 'Class VI',
        code: 'VI',
        description: 'Class 6th Standard',
        capacity: 40,
        sort_order: 6,
        is_active: true,
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007', // Main Campus branch
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: 'Class VII',
        code: 'VII',
        description: 'Class 7th Standard',
        capacity: 40,
        sort_order: 7,
        is_active: true,
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007', // Main Campus branch
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Create Sections for Demo School
    await queryInterface.bulkInsert('sections', [
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'Section A',
        capacity: 40,
        current_strength: 0,
        is_active: true,
        class_id: '550e8400-e29b-41d4-a716-446655440009',
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007', // Main Campus branch
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: 'Section B',
        capacity: 40,
        current_strength: 0,
        is_active: true,
        class_id: '550e8400-e29b-41d4-a716-446655440009',
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007', // Main Campus branch
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        name: 'Section A',
        capacity: 40,
        current_strength: 0,
        is_active: true,
        class_id: '550e8400-e29b-41d4-a716-446655440010',
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007', // Main Campus branch
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('sections', { school_id: '550e8400-e29b-41d4-a716-446655440006' }, {});
    await queryInterface.bulkDelete('classes', { school_id: '550e8400-e29b-41d4-a716-446655440006' }, {});
  }
}; 