'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Super Admin User
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const superAdmin = await queryInterface.bulkInsert('users', [{
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'admin@schoolexample.com',
      password: hashedPassword,
      first_name: 'Super',
      last_name: 'Admin',
      phone: '+91-9876543210',
      role: 'super_admin',
      permissions: ['*'],
      email_verified: true,
      phone_verified: true,
      status: 'active',
      settings: JSON.stringify({}),
      created_at: new Date(),
      updated_at: new Date()
    }], { returning: true });

    // Create Basic Subscription Plans
    await queryInterface.bulkInsert('subscription_plans', [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Trial Plan',
        code: 'TRIAL',
        description: 'Free trial plan for new schools',
        price: 0.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        max_students: 50,
        max_staff: 10,
        max_branches: 1,
        modules: ['students', 'academics', 'attendance', 'fees'],
        features: JSON.stringify({
          basic_reporting: true,
          email_support: true,
          mobile_app: false,
          advanced_analytics: false
        }),
        is_active: true,
        is_popular: false,
        sort_order: 1,
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Basic Plan',
        code: 'BASIC',
        description: 'Basic plan for small schools',
        price: 999.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        max_students: 200,
        max_staff: 25,
        max_branches: 2,
        modules: ['students', 'academics', 'attendance', 'fees', 'exams', 'library'],
        features: JSON.stringify({
          basic_reporting: true,
          email_support: true,
          mobile_app: true,
          advanced_analytics: false,
          sms_notifications: true
        }),
        is_active: true,
        is_popular: true,
        sort_order: 2,
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Lifetime Plan',
        code: 'LIFETIME',
        description: 'Lifetime plan with unlimited access',
        price: 4999.00,
        currency: 'INR',
        billing_cycle: 'lifetime',
        max_students: 5000,
        max_staff: 100,
        max_branches: 10,
        modules: ['students', 'academics', 'attendance', 'fees', 'exams', 'library', 'transport', 'hr', 'reports', 'settings'],
        features: JSON.stringify({
          basic_reporting: true,
          email_support: true,
          mobile_app: true,
          advanced_analytics: true,
          sms_notifications: true,
          priority_support: true,
          custom_integrations: true
        }),
        is_active: true,
        is_popular: false,
        sort_order: 3,
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('subscription_plans', null, {});
    await queryInterface.bulkDelete('users', { role: 'super_admin' }, {});
  }
}; 