// FRESH MIGRATION: Creates schema for users, schools, branches, subscription_plans, transactions
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop tables if they exist (in correct order for FK constraints)
    await queryInterface.dropTable('transactions', { force: true }).catch(() => {});
    await queryInterface.dropTable('subscription_plans', { force: true }).catch(() => {});
    await queryInterface.dropTable('branches', { force: true }).catch(() => {});
    await queryInterface.dropTable('schools', { force: true }).catch(() => {});
    await queryInterface.dropTable('users', { force: true }).catch(() => {});

    // 1. Create users table (must be first)
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      first_name: { type: Sequelize.STRING(50), allowNull: false },
      last_name: { type: Sequelize.STRING(50), allowNull: false },
      phone: { type: Sequelize.STRING(20) },
      profile_image: { type: Sequelize.STRING },
      role: { type: Sequelize.ENUM('super_admin','school_admin','branch_admin','teacher','accountant','librarian','receptionist','student','parent','transport_manager','hr','alumni'), allowNull: false, defaultValue: 'student' },
      permissions: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      last_login: { type: Sequelize.DATE },
      last_ip: { type: Sequelize.STRING(45) },
      email_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      phone_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      two_factor_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      two_factor_secret: { type: Sequelize.STRING },
      reset_password_token: { type: Sequelize.STRING },
      reset_password_expires: { type: Sequelize.DATE },
      status: { type: Sequelize.ENUM('active', 'inactive', 'suspended', 'pending'), allowNull: false, defaultValue: 'pending' },
      settings: { type: Sequelize.JSONB, defaultValue: {} },
      school_id: { type: Sequelize.UUID, allowNull: true }, // FK added after schools table
      branch_id: { type: Sequelize.UUID, allowNull: true }, // FK added after branches table
      created_by: { type: Sequelize.UUID, allowNull: true }, // FK added after users table
      updated_by: { type: Sequelize.UUID, allowNull: true }, // FK added after users table
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['status']);

    // 2. Create schools table
    await queryInterface.createTable('schools', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      phone: { type: Sequelize.STRING(20) },
      address: { type: Sequelize.TEXT },
      city: { type: Sequelize.STRING(50) },
      state: { type: Sequelize.STRING(50) },
      country: { type: Sequelize.STRING(50), defaultValue: 'India' },
      postal_code: { type: Sequelize.STRING(20) },
      website: { type: Sequelize.STRING },
      logo: { type: Sequelize.STRING },
      timezone: { type: Sequelize.STRING(50), defaultValue: 'Asia/Kolkata' },
      locale: { type: Sequelize.STRING(10), defaultValue: 'en-IN' },
      currency: { type: Sequelize.STRING(3), defaultValue: 'INR' },
      date_format: { type: Sequelize.STRING(20), defaultValue: 'DD/MM/YYYY' },
      time_format: { type: Sequelize.ENUM('12h', '24h'), allowNull: false, defaultValue: '12h' },
      academic_year_start: { type: Sequelize.DATEONLY, allowNull: false },
      academic_year_end: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM('active', 'inactive', 'suspended', 'trial'), defaultValue: 'trial' },
      settings: { type: Sequelize.JSONB, defaultValue: {} },
      subscription_plan: { type: Sequelize.STRING(50), defaultValue: 'trial' },
      subscription_start_date: { type: Sequelize.DATE },
      subscription_end_date: { type: Sequelize.DATE },
      max_students: { type: Sequelize.INTEGER, defaultValue: 100 },
      max_staff: { type: Sequelize.INTEGER, defaultValue: 20 },
      max_branches: { type: Sequelize.INTEGER, defaultValue: 1 },
      modules: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: ['academics', 'attendance', 'fees', 'exams', 'library'] },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, allowNull: true, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, allowNull: true, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('schools', ['code'], { unique: true });
    await queryInterface.addIndex('schools', ['email'], { unique: true });
    await queryInterface.addIndex('schools', ['status']);
    await queryInterface.addIndex('schools', ['subscription_plan']);
    await queryInterface.addIndex('schools', ['is_active']);

    // 3. Add school_id FK to users
    await queryInterface.addConstraint('users', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'users_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // 4. Create branches table
    await queryInterface.createTable('branches', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: false },
      email: { type: Sequelize.STRING },
      phone: { type: Sequelize.STRING(20) },
      address: { type: Sequelize.TEXT },
      city: { type: Sequelize.STRING(50) },
      state: { type: Sequelize.STRING(50) },
      country: { type: Sequelize.STRING(50), defaultValue: 'India' },
      postal_code: { type: Sequelize.STRING(20) },
      principal_name: { type: Sequelize.STRING(100) },
      principal_email: { type: Sequelize.STRING },
      principal_phone: { type: Sequelize.STRING(20) },
      is_main_branch: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      status: { type: Sequelize.ENUM('active', 'inactive', 'maintenance'), allowNull: false, defaultValue: 'active' },
      settings: { type: Sequelize.JSONB, defaultValue: {} },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onDelete: 'CASCADE' },
      created_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, allowNull: true, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, allowNull: true, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('branches', ['school_id']);
    await queryInterface.addIndex('branches', ['school_id', 'code'], { unique: true, name: 'unique_branch_code_per_school' });
    await queryInterface.addIndex('branches', ['status']);

    // 5. Add branch_id FK to users
    await queryInterface.addConstraint('users', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'users_branch_id_fkey',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // 6. Add created_by/updated_by FKs to users (self-reference)
    await queryInterface.addConstraint('users', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'users_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('users', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'users_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // 7. Create subscription_plans table
    await queryInterface.createTable('subscription_plans', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      billing_cycle: { type: Sequelize.ENUM('monthly', 'yearly', 'lifetime'), allowNull: false, defaultValue: 'monthly' },
      max_students: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 100 },
      max_staff: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 20 },
      max_branches: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      modules: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: ['academics', 'attendance', 'fees'] },
      features: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_popular: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('subscription_plans', ['code'], { unique: true });
    await queryInterface.addIndex('subscription_plans', ['name'], { unique: true });
    await queryInterface.addIndex('subscription_plans', ['is_active']);
    await queryInterface.addIndex('subscription_plans', ['billing_cycle']);

    // 8. Create transactions table
    await queryInterface.createTable('transactions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      transaction_id: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onDelete: 'CASCADE' },
      subscription_plan_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'subscription_plans', key: 'id' }, onDelete: 'SET NULL' },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      payment_method: { type: Sequelize.ENUM('online', 'offline_cash', 'offline_cheque', 'offline_bank_transfer', 'card', 'upi'), allowNull: false, defaultValue: 'online' },
      payment_status: { type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'), allowNull: false, defaultValue: 'pending' },
      transaction_status: { type: Sequelize.ENUM('initiated', 'processing', 'success', 'failed', 'cancelled'), allowNull: false, defaultValue: 'initiated' },
      billing_cycle: { type: Sequelize.ENUM('monthly', 'yearly', 'lifetime'), allowNull: false, defaultValue: 'monthly' },
      subscription_start_date: { type: Sequelize.DATE },
      subscription_end_date: { type: Sequelize.DATE },
      description: { type: Sequelize.TEXT },
      gateway_response: { type: Sequelize.JSONB },
      gateway_transaction_id: { type: Sequelize.STRING(100) },
      gateway_name: { type: Sequelize.STRING(50) },
      receipt_url: { type: Sequelize.STRING },
      notes: { type: Sequelize.TEXT },
      is_manual: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('transactions', ['transaction_id'], { unique: true });
    await queryInterface.addIndex('transactions', ['school_id']);
    await queryInterface.addIndex('transactions', ['subscription_plan_id']);
    await queryInterface.addIndex('transactions', ['payment_status']);
    await queryInterface.addIndex('transactions', ['transaction_status']);
    await queryInterface.addIndex('transactions', ['payment_method']);
    await queryInterface.addIndex('transactions', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('subscription_plans');
    await queryInterface.dropTable('branches');
    await queryInterface.dropTable('schools');
    await queryInterface.dropTable('users');
  },
}; 