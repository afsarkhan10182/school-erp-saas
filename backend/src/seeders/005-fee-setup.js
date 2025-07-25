'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Fee Types for Demo School
    await queryInterface.bulkInsert('fee_types', [
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        name: 'Tuition Fee',
        code: 'TUITION',
        category: 'academic',
        description: 'Monthly tuition fee for academic classes',
        is_active: true,
        due_date_days: 10,
        tax_applicable: false,
        tax_percentage: 0.00,
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007',
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440015',
        name: 'Transport Fee',
        code: 'TRANSPORT',
        category: 'transport',
        description: 'Monthly transport fee for bus service',
        is_active: true,
        due_date_days: 5,
        tax_applicable: true,
        tax_percentage: 18.00,
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007',
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Create Fee Structures for Demo School
    await queryInterface.bulkInsert('fee_structures', [
      {
        id: '550e8400-e29b-41d4-a716-446655440016',
        name: 'Class VI Tuition Fee 2024-2025',
        academic_year: '2024-2025',
        class_name: 'Class VI',
        section: 'A',
        fee_type_id: '550e8400-e29b-41d4-a716-446655440014',
        amount: 2500.00,
        installment_type: 'monthly',
        installment_count: 12,
        due_month: null,
        due_day: 10,
        discount_applicable: true,
        discount_amount: 100.00,
        discount_type: 'fixed',
        is_active: true,
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007',
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440017',
        name: 'Class VI Transport Fee 2024-2025',
        academic_year: '2024-2025',
        class_name: 'Class VI',
        section: 'A',
        fee_type_id: '550e8400-e29b-41d4-a716-446655440015',
        amount: 800.00,
        installment_type: 'monthly',
        installment_count: 12,
        due_month: null,
        due_day: 5,
        discount_applicable: false,
        discount_amount: 0.00,
        discount_type: 'fixed',
        is_active: true,
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007',
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('fee_structures', { school_id: '550e8400-e29b-41d4-a716-446655440006' }, {});
    await queryInterface.bulkDelete('fee_types', { school_id: '550e8400-e29b-41d4-a716-446655440006' }, {});
  }
}; 