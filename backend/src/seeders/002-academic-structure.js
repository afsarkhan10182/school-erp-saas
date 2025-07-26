'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Academic Years
    await queryInterface.bulkInsert('academic_years', [
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: '2024-2025',
        code: '2024-2025',
        start_date: '2024-04-01',
        end_date: '2025-03-31',
        is_current: true,
        status: 'active',
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: '2025-2026',
        code: '2025-2026',
        start_date: '2025-04-01',
        end_date: '2026-03-31',
        is_current: false,
        status: 'active',
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Create Classes (will be populated when school is created)
    // These are just placeholders - actual classes will be created per school
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('academic_years', null, {});
  }
}; 