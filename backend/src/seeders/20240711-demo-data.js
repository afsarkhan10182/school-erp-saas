// Seeder for demo data: super_admin, schools, branches, users, subscription plans, transactions
'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Clean up (idempotent)
    await queryInterface.bulkDelete('transactions', null, {});
    await queryInterface.bulkDelete('subscription_plans', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('branches', null, {});
    await queryInterface.bulkDelete('schools', null, {});

    // 1. Super Admin User
    const superAdminId = uuidv4();
    const superAdmin = {
      id: superAdminId,
      email: 'superadmin@example.com',
      password: await bcrypt.hash('Admin@123', 12),
      first_name: 'Super',
      last_name: 'Admin',
      role: 'super_admin',
      status: 'active',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await queryInterface.bulkInsert('users', [superAdmin]);

    // 2. Schools
    const school1Id = uuidv4();
    const school2Id = uuidv4();
    const schools = [
      {
        id: school1Id,
        name: 'Oxford Public School',
        code: 'OXF',
        email: 'oxford@school.com',
        phone: '+911234567890',
        address: '123 Oxford St',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        postal_code: '110001',
        website: 'https://oxford.edu',
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
        currency: 'INR',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
        academic_year_start: new Date('2025-04-01'),
        academic_year_end: new Date('2026-03-31'),
        status: 'active',
        settings: Sequelize.literal(`'{}'::jsonb`),
        subscription_plan: 'premium',
        subscription_start_date: new Date(),
        subscription_end_date: new Date(Date.now() + 365*24*60*60*1000),
        max_students: 1000,
        max_staff: 100,
        max_branches: 3,
        modules: ['academics', 'attendance', 'fees', 'exams', 'library'],
        is_active: true,
        created_by: superAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: school2Id,
        name: 'Huda School',
        code: 'HUDA',
        email: 'huda@school.com',
        phone: '+919876543210',
        address: '456 Huda Lane',
        city: 'Gurgaon',
        state: 'Haryana',
        country: 'India',
        postal_code: '122001',
        website: 'https://huda.edu',
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
        currency: 'INR',
        date_format: 'DD/MM/YYYY',
        time_format: '12h',
        status: 'active',
        academic_year_start: new Date('2025-04-01'),
        academic_year_end: new Date('2026-03-31'),
        settings: Sequelize.literal(`'{}'::jsonb`),
        subscription_plan: 'basic',
        subscription_start_date: new Date(),
        subscription_end_date: new Date(Date.now() + 180*24*60*60*1000),
        max_students: 500,
        max_staff: 50,
        max_branches: 2,
        modules: ['academics', 'attendance', 'fees'],
        is_active: true,
        created_by: superAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    await queryInterface.bulkInsert('schools', schools);

    // 3. Branches
    const branch1Id = uuidv4();
    const branch2Id = uuidv4();
    const branch3Id = uuidv4();
    const branches = [
      {
        id: branch1Id,
        name: 'Main Campus',
        code: 'OXF-MAIN',
        email: 'main@oxford.edu',
        phone: '+911234567891',
        address: '123 Oxford St',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        postal_code: '110001',
        principal_name: 'Dr. Smith',
        principal_email: 'smith@oxford.edu',
        principal_phone: '+911234567892',
        is_main_branch: true,
        status: 'active',
        settings: Sequelize.literal(`'{}'::jsonb`),
        school_id: school1Id,
        created_by: superAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: branch2Id,
        name: 'Huda Main',
        code: 'HUDA-MAIN',
        email: 'main@huda.edu',
        phone: '+919876543211',
        address: '456 Huda Lane',
        city: 'Gurgaon',
        state: 'Haryana',
        country: 'India',
        postal_code: '122001',
        principal_name: 'Dr. Khan',
        principal_email: 'khan@huda.edu',
        principal_phone: '+919876543212',
        is_main_branch: true,
        status: 'active',
        settings: Sequelize.literal(`'{}'::jsonb`),
        school_id: school2Id,
        created_by: superAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: branch3Id,
        name: 'Oxford North',
        code: 'OXF-NORTH',
        email: 'north@oxford.edu',
        phone: '+911234567893',
        address: '789 North St',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        postal_code: '110002',
        principal_name: 'Dr. Jane',
        principal_email: 'jane@oxford.edu',
        principal_phone: '+911234567894',
        is_main_branch: false,
        status: 'active',
        settings: Sequelize.literal(`'{}'::jsonb`),
        school_id: school1Id,
        created_by: superAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    await queryInterface.bulkInsert('branches', branches);

    // 4. Users (school_admin, branch_admin, teacher, student)
    const schoolAdmin1Id = uuidv4();
    const schoolAdmin2Id = uuidv4();
    const branchAdmin1Id = uuidv4();
    const teacher1Id = uuidv4();
    const student1Id = uuidv4();
    const users = [
      {
        id: schoolAdmin1Id,
        email: 'admin@oxford.edu',
        password: await bcrypt.hash('School@123', 12),
        first_name: 'Oxford',
        last_name: 'Admin',
        role: 'school_admin',
        status: 'active',
        email_verified: true,
        school_id: school1Id,
        branch_id: branch1Id,
        created_by: superAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: schoolAdmin2Id,
        email: 'admin@huda.edu',
        password: await bcrypt.hash('School@123', 12),
        first_name: 'Huda',
        last_name: 'Admin',
        role: 'school_admin',
        status: 'active',
        email_verified: true,
        school_id: school2Id,
        branch_id: branch2Id,
        created_by: superAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: branchAdmin1Id,
        email: 'branchadmin@oxford.edu',
        password: await bcrypt.hash('Branch@123', 12),
        first_name: 'Branch',
        last_name: 'Admin',
        role: 'branch_admin',
        status: 'active',
        email_verified: true,
        school_id: school1Id,
        branch_id: branch3Id,
        created_by: schoolAdmin1Id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: teacher1Id,
        email: 'teacher@oxford.edu',
        password: await bcrypt.hash('Teacher@123', 12),
        first_name: 'John',
        last_name: 'Doe',
        role: 'teacher',
        status: 'active',
        email_verified: true,
        school_id: school1Id,
        branch_id: branch1Id,
        created_by: schoolAdmin1Id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: student1Id,
        email: 'student@oxford.edu',
        password: await bcrypt.hash('Student@123', 12),
        first_name: 'Alice',
        last_name: 'Smith',
        role: 'student',
        status: 'active',
        email_verified: true,
        school_id: school1Id,
        branch_id: branch1Id,
        created_by: teacher1Id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    await queryInterface.bulkInsert('users', users);

    // 5. Subscription Plans
    const plan1Id = uuidv4();
    const plan2Id = uuidv4();
    const plan3Id = uuidv4();
    const plans = [
      {
        id: plan1Id,
        name: 'Basic',
        code: 'basic',
        description: 'Basic plan',
        price: 1000,
        currency: 'INR',
        billing_cycle: 'yearly',
        max_students: 500,
        max_staff: 50,
        max_branches: 2,
        modules: ['academics', 'attendance', 'fees'],
        features: Sequelize.literal(`'{}'::jsonb`),
        is_active: true,
        is_popular: false,
        sort_order: 1,
        created_by: superAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: plan2Id,
        name: 'Premium',
        code: 'premium',
        description: 'Premium plan',
        price: 3000,
        currency: 'INR',
        billing_cycle: 'yearly',
        max_students: 1000,
        max_staff: 100,
        max_branches: 5,
        modules: ['academics', 'attendance', 'fees', 'exams', 'library'],
        features: Sequelize.literal(`'{}'::jsonb`),
        is_active: true,
        is_popular: true,
        sort_order: 2,
        created_by: superAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: plan3Id,
        name: 'Trial',
        code: 'trial',
        description: 'Trial plan',
        price: 0,
        currency: 'INR',
        billing_cycle: 'monthly',
        max_students: 100,
        max_staff: 10,
        max_branches: 1,
        modules: ['academics', 'attendance'],
        features: Sequelize.literal(`'{}'::jsonb`),
        is_active: true,
        is_popular: false,
        sort_order: 0,
        created_by: superAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    await queryInterface.bulkInsert('subscription_plans', plans);

    // 6. Transactions
    const txn1Id = uuidv4();
    const txn2Id = uuidv4();
    const transactions = [
      {
        id: txn1Id,
        transaction_id: 'TXN001',
        school_id: school1Id,
        subscription_plan_id: plan2Id,
        amount: 3000,
        currency: 'INR',
        payment_method: 'online',
        payment_status: 'completed',
        transaction_status: 'success',
        billing_cycle: 'yearly',
        subscription_start_date: new Date(),
        subscription_end_date: new Date(Date.now() + 365*24*60*60*1000),
        description: 'Oxford annual subscription',
        is_manual: false,
        created_by: superAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: txn2Id,
        transaction_id: 'TXN002',
        school_id: school2Id,
        subscription_plan_id: plan1Id,
        amount: 1000,
        currency: 'INR',
        payment_method: 'offline_cash',
        payment_status: 'completed',
        transaction_status: 'success',
        billing_cycle: 'yearly',
        subscription_start_date: new Date(),
        subscription_end_date: new Date(Date.now() + 180*24*60*60*1000),
        description: 'Huda annual subscription',
        is_manual: true,
        created_by: superAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    await queryInterface.bulkInsert('transactions', transactions);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('transactions', null, {});
    await queryInterface.bulkDelete('subscription_plans', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('branches', null, {});
    await queryInterface.bulkDelete('schools', null, {});
  },
}; 