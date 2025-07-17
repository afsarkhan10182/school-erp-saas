'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Demo School
    const demoSchool = await queryInterface.bulkInsert('schools', [{
      id: '550e8400-e29b-41d4-a716-446655440006',
      name: 'Demo School',
      code: 'DEMO001',
      email: 'info@demoschool.com',
      phone: '+91-9876543211',
      address: '123 Education Street, Knowledge City',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postal_code: '400001',
      website: 'https://demoschool.com',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      currency: 'INR',
      date_format: 'DD/MM/YYYY',
      time_format: '12h',
      status: 'active',
      settings: JSON.stringify({
        currency_symbol: '₹',
        system_logo: null,
        text_logo: 'Demo School',
        printing_logo: null,
        report_card_design: null
      }),
      subscription_plan: 'TRIAL',
      subscription_start_date: new Date(),
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      max_students: 50,
      max_staff: 10,
      max_branches: 1,
      modules: ['academics', 'attendance', 'fees', 'exams', 'library'],
      is_active: true,
      created_by: '550e8400-e29b-41d4-a716-446655440001',
      created_at: new Date(),
      updated_at: new Date()
    }], { returning: true });

    // Create Demo Branch
    await queryInterface.bulkInsert('branches', [{
      id: '550e8400-e29b-41d4-a716-446655440007',
      name: 'Main Campus',
      code: 'MAIN',
      email: 'main@demoschool.com',
      phone: '+91-9876543212',
      address: '123 Education Street, Knowledge City',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postal_code: '400001',
      principal_name: 'Dr. John Smith',
      principal_email: 'principal@demoschool.com',
      principal_phone: '+91-9876543213',
      is_main_branch: true,
      status: 'active',
      settings: JSON.stringify({
        currency: 'INR',
        currency_symbol: '₹',
        system_logo: null,
        text_logo: 'Demo School - Main Campus',
        printing_logo: null,
        report_card_design: null
      }),
      school_id: '550e8400-e29b-41d4-a716-446655440006',
      created_by: '550e8400-e29b-41d4-a716-446655440001',
      created_at: new Date(),
      updated_at: new Date()
    }], { returning: true });

    // Create School Admin User
    const hashedPassword = await bcrypt.hash('school123', 12);
    
    await queryInterface.bulkInsert('users', [{
      id: '550e8400-e29b-41d4-a716-446655440008',
      email: 'admin@demoschool.com',
      password: hashedPassword,
      first_name: 'School',
      last_name: 'Admin',
      phone: '+91-9876543214',
      role: 'school_admin',
      permissions: ['school_management', 'user_management', 'student_management', 'fee_management'],
      email_verified: true,
      phone_verified: true,
      status: 'active',
      settings: JSON.stringify({}), 
      school_id: '550e8400-e29b-41d4-a716-446655440006',
      branch_id: '550e8400-e29b-41d4-a716-446655440007',
      created_by: '550e8400-e29b-41d4-a716-446655440001',
      created_at: new Date(),
      updated_at: new Date()
    }], { returning: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { school_id: '550e8400-e29b-41d4-a716-446655440006' }, {});
    await queryInterface.bulkDelete('branches', { school_id: '550e8400-e29b-41d4-a716-446655440006' }, {});
    await queryInterface.bulkDelete('schools', { id: '550e8400-e29b-41d4-a716-446655440006' }, {});
  }
}; 