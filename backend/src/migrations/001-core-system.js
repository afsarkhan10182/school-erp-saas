'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Enable UUID extension
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // 1. Users Table
    await queryInterface.createTable('users', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      email: { 
        type: Sequelize.STRING, 
        allowNull: false, 
        unique: true 
      },
      password: { 
        type: Sequelize.STRING, 
        allowNull: false 
      },
      first_name: { 
        type: Sequelize.STRING(50), 
        allowNull: false 
      },
      last_name: { 
        type: Sequelize.STRING(50), 
        allowNull: false 
      },
      phone: { 
        type: Sequelize.STRING(20) 
      },
      profile_image: { 
        type: Sequelize.STRING 
      },
      role: { 
        type: Sequelize.ENUM(
          'super_admin', 'school_admin', 'branch_admin', 'teacher', 
          'accountant', 'librarian', 'receptionist', 'student', 
          'parent', 'transport_manager', 'hr', 'alumni'
        ), 
        allowNull: false, 
        defaultValue: 'student' 
      },
      permissions: { 
        type: Sequelize.ARRAY(Sequelize.STRING), 
        defaultValue: Sequelize.literal("ARRAY[]::VARCHAR[]") 
      },
      last_login: { 
        type: Sequelize.DATE 
      },
      last_ip: { 
        type: Sequelize.STRING(45) 
      },
      email_verified: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
      },
      phone_verified: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
      },
      two_factor_enabled: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
      },
      two_factor_secret: { 
        type: Sequelize.STRING 
      },
      reset_password_token: { 
        type: Sequelize.STRING 
      },
      reset_password_expires: { 
        type: Sequelize.DATE 
      },
      status: { 
        type: Sequelize.ENUM('active', 'inactive', 'suspended', 'pending'), 
        allowNull: false, 
        defaultValue: 'pending' 
      },
      settings: { 
        type: Sequelize.JSONB, 
        defaultValue: {} 
      },
      deleted_at: { 
        type: Sequelize.DATE, 
        allowNull: true 
      },
      school_id: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      branch_id: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      created_by: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      updated_by: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      created_at: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('NOW()') 
      },
      updated_at: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('NOW()') 
      },
    });

    // 2. Schools Table
    await queryInterface.createTable('schools', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      name: { 
        type: Sequelize.STRING(100), 
        allowNull: false 
      },
      code: { 
        type: Sequelize.STRING(20), 
        allowNull: false, 
        unique: true 
      },
      email: { 
        type: Sequelize.STRING, 
        allowNull: false, 
        unique: true 
      },
      phone: { 
        type: Sequelize.STRING(20) 
      },
      address: { 
        type: Sequelize.TEXT 
      },
      city: { 
        type: Sequelize.STRING(50) 
      },
      state: { 
        type: Sequelize.STRING(50) 
      },
      country: { 
        type: Sequelize.STRING(50), 
        defaultValue: 'India' 
      },
      postal_code: { 
        type: Sequelize.STRING(20) 
      },
      website: { 
        type: Sequelize.STRING 
      },
      logo: { 
        type: Sequelize.STRING 
      },
      timezone: { 
        type: Sequelize.STRING(50), 
        defaultValue: 'Asia/Kolkata' 
      },
      locale: { 
        type: Sequelize.STRING(10), 
        defaultValue: 'en-IN' 
      },
      currency: { 
        type: Sequelize.STRING(3), 
        defaultValue: 'INR' 
      },
      date_format: { 
        type: Sequelize.STRING(20), 
        defaultValue: 'DD/MM/YYYY' 
      },
      time_format: { 
        type: Sequelize.ENUM('12h', '24h'), 
        allowNull: false, 
        defaultValue: '12h' 
      },
      status: { 
        type: Sequelize.ENUM('active', 'inactive', 'suspended', 'trial'), 
        defaultValue: 'trial' 
      },
      settings: { 
        type: Sequelize.JSONB, 
        defaultValue: {} 
      },
      subscription_plan: { 
        type: Sequelize.STRING(50), 
        defaultValue: 'trial' 
      },
      subscription_start_date: { 
        type: Sequelize.DATE 
      },
      subscription_end_date: { 
        type: Sequelize.DATE 
      },
      max_students: { 
        type: Sequelize.INTEGER, 
        defaultValue: 100 
      },
      max_staff: { 
        type: Sequelize.INTEGER, 
        defaultValue: 20 
      },
      max_branches: { 
        type: Sequelize.INTEGER, 
        defaultValue: 1 
      },
      modules: { 
        type: Sequelize.ARRAY(Sequelize.STRING), 
        defaultValue: Sequelize.literal("ARRAY['academics', 'attendance', 'fees', 'exams', 'library']") 
      },
      is_active: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: true 
      },
      created_by: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      updated_by: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      created_at: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('NOW()') 
      },
      updated_at: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('NOW()') 
      },
    });

    // 3. Branches Table
    await queryInterface.createTable('branches', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      name: { 
        type: Sequelize.STRING(100), 
        allowNull: false 
      },
      code: { 
        type: Sequelize.STRING(20), 
        allowNull: false 
      },
      email: { 
        type: Sequelize.STRING 
      },
      phone: { 
        type: Sequelize.STRING(20) 
      },
      address: { 
        type: Sequelize.TEXT 
      },
      city: { 
        type: Sequelize.STRING(50) 
      },
      state: { 
        type: Sequelize.STRING(50) 
      },
      country: { 
        type: Sequelize.STRING(50), 
        defaultValue: 'India' 
      },
      postal_code: { 
        type: Sequelize.STRING(20) 
      },
      principal_name: { 
        type: Sequelize.STRING(100) 
      },
      principal_email: { 
        type: Sequelize.STRING 
      },
      principal_phone: { 
        type: Sequelize.STRING(20) 
      },
      is_main_branch: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
      },
      status: { 
        type: Sequelize.ENUM('active', 'inactive', 'maintenance'), 
        allowNull: false, 
        defaultValue: 'active' 
      },
      settings: { 
        type: Sequelize.JSONB, 
        defaultValue: {} 
      },
      school_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      created_by: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      updated_by: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      created_at: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('NOW()') 
      },
      updated_at: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('NOW()') 
      },
    });

    // 4. Subscription Plans Table
    await queryInterface.createTable('subscription_plans', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      name: { 
        type: Sequelize.STRING(100), 
        allowNull: false, 
        unique: true 
      },
      code: { 
        type: Sequelize.STRING(20), 
        allowNull: false, 
        unique: true 
      },
      description: { 
        type: Sequelize.TEXT 
      },
      price: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false, 
        defaultValue: 0.00 
      },
      currency: { 
        type: Sequelize.STRING(3), 
        allowNull: false, 
        defaultValue: 'INR' 
      },
      billing_cycle: { 
        type: Sequelize.ENUM('monthly', 'yearly', 'lifetime'), 
        allowNull: false, 
        defaultValue: 'monthly' 
      },
      max_students: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 100 
      },
      max_staff: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 20 
      },
      max_branches: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 1 
      },
      modules: { 
        type: Sequelize.ARRAY(Sequelize.STRING), 
        allowNull: false, 
        defaultValue: Sequelize.literal("ARRAY['academics', 'attendance', 'fees']") 
      },
      features: { 
        type: Sequelize.JSONB, 
        allowNull: false, 
        defaultValue: {} 
      },
      is_active: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: true 
      },
      is_popular: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
      },
      sort_order: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 0 
      },
      created_by: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      updated_by: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      created_at: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('NOW()') 
      },
      updated_at: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('NOW()') 
      },
    });

    // Add Foreign Key Constraints
    await queryInterface.addConstraint('users', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'users_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('users', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'users_branch_id_fkey',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

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

    await queryInterface.addConstraint('branches', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'branches_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('schools', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'schools_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('schools', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'schools_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('branches', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'branches_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('branches', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'branches_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('subscription_plans', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'subscription_plans_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('subscription_plans', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'subscription_plans_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Add Indexes
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['status']);
    await queryInterface.addIndex('users', ['school_id']);
    await queryInterface.addIndex('users', ['branch_id']);

    await queryInterface.addIndex('schools', ['code'], { unique: true });
    await queryInterface.addIndex('schools', ['email'], { unique: true });
    await queryInterface.addIndex('schools', ['status']);
    await queryInterface.addIndex('schools', ['subscription_plan']);
    await queryInterface.addIndex('schools', ['is_active']);

    await queryInterface.addIndex('branches', ['school_id']);
    await queryInterface.addIndex('branches', ['school_id', 'code'], { 
      unique: true, 
      name: 'unique_branch_code_per_school' 
    });
    await queryInterface.addIndex('branches', ['status']);

    await queryInterface.addIndex('subscription_plans', ['code'], { unique: true });
    await queryInterface.addIndex('subscription_plans', ['name'], { unique: true });
    await queryInterface.addIndex('subscription_plans', ['is_active']);
    await queryInterface.addIndex('subscription_plans', ['billing_cycle']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('subscription_plans');
    await queryInterface.dropTable('branches');
    await queryInterface.dropTable('schools');
    await queryInterface.dropTable('users');
  }
}; 