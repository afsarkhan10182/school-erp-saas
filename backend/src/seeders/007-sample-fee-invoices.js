'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create sample fee invoices for existing students and fee structures
    
    // Get the current date for due dates
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Sample installment invoices
    await queryInterface.bulkInsert('fee_invoices', [
      {
        id: '550e8400-e29b-41d4-a716-446655440024',
        invoice_number: 'INV-2024-001',
        student_id: '550e8400-e29b-41d4-a716-446655440020', // Arjun Gupta
        fee_structure_id: '550e8400-e29b-41d4-a716-446655440016', // Class VI Tuition Fee
        academic_year: '2024-2025',
        class_name: 'Class VI',
        section: 'A',
        fee_type_name: 'Tuition Fee',
        invoice_date: new Date(),
        due_date: new Date(currentYear, currentMonth, 10),
        amount: 2500.00,
        base_amount: 2500.00,
        discount_amount: 100.00,
        tax_amount: 0.00,
        total_amount: 2400.00,
        paid_amount: 0.00,
        balance_amount: 2400.00,
        status: 'sent',
        payment_status: 'pending',
        late_fee_percentage: 5.00,
        payment_terms: 'Due by 10th of each month',
        notes: 'First installment of tuition fee',
        installment_number: 1,
        total_installments: 12,
        payment_model: 'installment',
        is_late_fee_applied: false,
        invoice_items: JSON.stringify([
          {
            item_name: 'Tuition Fee',
            amount: 2500.00,
            discount: 100.00,
            tax: 0.00,
            total: 2400.00
          }
        ]),
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007',
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440025',
        invoice_number: 'INV-2024-002',
        student_id: '550e8400-e29b-41d4-a716-446655440021', // Rahul Pandey
        fee_structure_id: '550e8400-e29b-41d4-a716-446655440016', // Class VI Tuition Fee
        academic_year: '2024-2025',
        class_name: 'Class VI',
        section: 'B',
        fee_type_name: 'Tuition Fee',
        invoice_date: new Date(),
        due_date: new Date(currentYear, currentMonth, 10),
        amount: 2500.00,
        base_amount: 2500.00,
        discount_amount: 100.00,
        tax_amount: 0.00,
        total_amount: 2400.00,
        paid_amount: 1200.00,
        balance_amount: 1200.00,
        status: 'partial_paid',
        payment_status: 'partial',
        late_fee_percentage: 5.00,
        payment_terms: 'Due by 10th of each month',
        notes: 'First installment of tuition fee - partial payment received',
        installment_number: 1,
        total_installments: 12,
        payment_model: 'installment',
        is_late_fee_applied: false,
        last_payment_date: new Date(),
        invoice_items: JSON.stringify([
          {
            item_name: 'Tuition Fee',
            amount: 2500.00,
            discount: 100.00,
            tax: 0.00,
            total: 2400.00
          }
        ]),
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007',
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Create sample monthly invoices for June 2025
    await queryInterface.bulkInsert('fee_invoices', [
      {
        id: '550e8400-e29b-41d4-a716-446655440026',
        invoice_number: 'MONTHLY-2025-06-001',
        student_id: '550e8400-e29b-41d4-a716-446655440020', // Arjun Gupta
        fee_structure_id: '550e8400-e29b-41d4-a716-446655440016', // Class VI Tuition Fee
        academic_year: '2024-2025',
        class_name: 'Class VI',
        section: 'A',
        fee_type_name: 'Tuition Fee',
        invoice_date: new Date(),
        due_date: new Date(2025, 5, 10), // June 10, 2025
        amount: 2500.00,
        base_amount: 2500.00,
        discount_amount: 100.00,
        tax_amount: 0.00,
        total_amount: 2400.00,
        paid_amount: 0.00,
        balance_amount: 2400.00,
        status: 'sent',
        payment_status: 'pending',
        late_fee_percentage: 5.00,
        payment_terms: 'Due by 10th of each month',
        notes: 'Monthly payment for June 2025',
        installment_number: 1,
        total_installments: 1,
        payment_model: 'monthly',
        month: 6,
        year: 2025,
        is_late_fee_applied: false,
        invoice_items: JSON.stringify([
          {
            item_name: 'Tuition Fee - June 2025',
            amount: 2500.00,
            discount: 100.00,
            tax: 0.00,
            total: 2400.00
          }
        ]),
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007',
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440027',
        invoice_number: 'MONTHLY-2025-06-002',
        student_id: '550e8400-e29b-41d4-a716-446655440021', // Rahul Pandey
        fee_structure_id: '550e8400-e29b-41d4-a716-446655440016', // Class VI Tuition Fee
        academic_year: '2024-2025',
        class_name: 'Class VI',
        section: 'B',
        fee_type_name: 'Tuition Fee',
        invoice_date: new Date(),
        due_date: new Date(2025, 5, 10), // June 10, 2025
        amount: 2500.00,
        base_amount: 2500.00,
        discount_amount: 100.00,
        tax_amount: 0.00,
        total_amount: 2400.00,
        paid_amount: 2400.00,
        balance_amount: 0.00,
        status: 'paid',
        payment_status: 'paid',
        late_fee_percentage: 5.00,
        payment_terms: 'Due by 10th of each month',
        notes: 'Monthly payment for June 2025 - paid',
        installment_number: 1,
        total_installments: 1,
        payment_model: 'monthly',
        month: 6,
        year: 2025,
        is_late_fee_applied: false,
        last_payment_date: new Date(),
        invoice_items: JSON.stringify([
          {
            item_name: 'Tuition Fee - June 2025',
            amount: 2500.00,
            discount: 100.00,
            tax: 0.00,
            total: 2400.00
          }
        ]),
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007',
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('fee_invoices', { 
      id: [
        '550e8400-e29b-41d4-a716-446655440024',
        '550e8400-e29b-41d4-a716-446655440025',
        '550e8400-e29b-41d4-a716-446655440026',
        '550e8400-e29b-41d4-a716-446655440027'
      ]
    }, {});
  }
}; 