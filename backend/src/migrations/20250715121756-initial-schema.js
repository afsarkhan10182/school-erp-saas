'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop tables in reverse dependency order (for dev reset)
    const tables = [
      'admissions', 'fee_invoices', 'student_parents', 'parents', 'students', 
      'fee_structures', 'fee_types', 'sections', 'classes', 'academic_years',
      'subscription_renewal_requests', 'transactions', 'subscription_plans',
      'branches', 'schools', 'users'
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table, { force: true }).catch(() => {});
    }

    // 1. Users
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      first_name: { type: Sequelize.STRING(50), allowNull: false },
      last_name: { type: Sequelize.STRING(50), allowNull: false },
      phone: { type: Sequelize.STRING(20) },
      profile_image: { type: Sequelize.STRING },
      role: { type: Sequelize.STRING, allowNull: false, defaultValue: 'student' },
      permissions: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      last_login: { type: Sequelize.DATE },
      last_ip: { type: Sequelize.STRING(45) },
      email_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      phone_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      two_factor_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      two_factor_secret: { type: Sequelize.STRING },
      reset_password_token: { type: Sequelize.STRING },
      reset_password_expires: { type: Sequelize.DATE },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      settings: { type: Sequelize.JSONB, defaultValue: {} },
      school_id: { type: Sequelize.UUID, allowNull: true },
      branch_id: { type: Sequelize.UUID, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['status']);

    // 2. Schools
    await queryInterface.createTable('schools', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
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
      time_format: { type: Sequelize.STRING, allowNull: false, defaultValue: '12h' },
      status: { type: Sequelize.STRING, defaultValue: 'trial' },
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

    // 4. Branches
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
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'active' },
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

    // 7. Subscription Plans
    await queryInterface.createTable('subscription_plans', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      billing_cycle: { type: Sequelize.STRING, allowNull: false, defaultValue: 'monthly' },
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

    // 8. Transactions
    await queryInterface.createTable('transactions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      transaction_id: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onDelete: 'CASCADE' },
      subscription_plan_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'subscription_plans', key: 'id' }, onDelete: 'SET NULL' },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      payment_method: { type: Sequelize.STRING, allowNull: false, defaultValue: 'online' },
      payment_status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      transaction_status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'initiated' },
      billing_cycle: { type: Sequelize.STRING, allowNull: false, defaultValue: 'monthly' },
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

    // 9. Subscription Renewal Requests
    await queryInterface.createTable('subscription_renewal_requests', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onDelete: 'CASCADE' },
      current_plan_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'subscription_plans', key: 'id' }, onDelete: 'SET NULL' },
      requested_plan_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'subscription_plans', key: 'id' }, onDelete: 'RESTRICT' },
      current_end_date: { type: Sequelize.DATE, allowNull: false },
      requested_start_date: { type: Sequelize.DATE, allowNull: false },
      requested_end_date: { type: Sequelize.DATE, allowNull: false },
      billing_cycle: { type: Sequelize.STRING, allowNull: false },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      request_reason: { type: Sequelize.TEXT },
      admin_notes: { type: Sequelize.TEXT },
      approved_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_at: { type: Sequelize.DATE },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('subscription_renewal_requests', ['school_id']);
    await queryInterface.addIndex('subscription_renewal_requests', ['status']);
    await queryInterface.addIndex('subscription_renewal_requests', ['created_at']);

    // 10. Academic Years (Global)
    await queryInterface.createTable('academic_years', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      name: { type: Sequelize.STRING(50), allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: false },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: false },
      is_current: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'active' },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('academic_years', ['code'], { unique: true });
    await queryInterface.addIndex('academic_years', ['is_current']);
    await queryInterface.addIndex('academic_years', ['status']);

    // 11. Classes
    await queryInterface.createTable('classes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      name: { type: Sequelize.STRING(50), allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: false },
      numeric_value: { type: Sequelize.INTEGER, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      capacity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('classes', ['school_id']);
    await queryInterface.addIndex('classes', ['school_id', 'code'], { unique: true, name: 'unique_class_code_per_school' });
    await queryInterface.addIndex('classes', ['is_active']);

    // 12. Sections
    await queryInterface.createTable('sections', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      name: { type: Sequelize.STRING(10), allowNull: false },
      capacity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },
      current_strength: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      class_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'classes', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      class_teacher_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('sections', ['class_id']);
    await queryInterface.addIndex('sections', ['school_id']);
    await queryInterface.addIndex('sections', ['class_id', 'name'], { unique: true, name: 'unique_section_name_per_class' });
    await queryInterface.addIndex('sections', ['is_active']);

    // 13. Fee Types
    await queryInterface.createTable('fee_types', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.STRING, allowNull: false, defaultValue: 'tuition' },
      frequency: { type: Sequelize.STRING, allowNull: false, defaultValue: 'monthly' },
      is_refundable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_optional: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onDelete: 'CASCADE' },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('fee_types', ['school_id']);
    await queryInterface.addIndex('fee_types', ['school_id', 'code'], { unique: true, name: 'unique_fee_type_code_per_school' });
    await queryInterface.addIndex('fee_types', ['category']);
    await queryInterface.addIndex('fee_types', ['is_active']);

    // 14. Fee Structures
    await queryInterface.createTable('fee_structures', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      academic_year: { type: Sequelize.STRING(10), allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      structure_data: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'branches', key: 'id' }, onDelete: 'SET NULL' },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('fee_structures', ['school_id']);
    await queryInterface.addIndex('fee_structures', ['academic_year']);
    await queryInterface.addIndex('fee_structures', ['is_active']);

    // 15. Students
    await queryInterface.createTable('students', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      admission_number: { type: Sequelize.STRING(50), allowNull: false },
      roll_number: { type: Sequelize.STRING(50), allowNull: true },
      first_name: { type: Sequelize.STRING(50), allowNull: false },
      last_name: { type: Sequelize.STRING(50), allowNull: false },
      middle_name: { type: Sequelize.STRING(50), allowNull: true },
      date_of_birth: { type: Sequelize.DATEONLY, allowNull: false },
      gender: { type: Sequelize.STRING, allowNull: false },
      blood_group: { type: Sequelize.STRING(5), allowNull: true },
      religion: { type: Sequelize.STRING(50), allowNull: true },
      caste: { type: Sequelize.STRING(50), allowNull: true },
      category: { type: Sequelize.STRING, allowNull: true },
      nationality: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'Indian' },
      mother_tongue: { type: Sequelize.STRING(50), allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      emergency_contact: { type: Sequelize.STRING(20), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      city: { type: Sequelize.STRING(50), allowNull: true },
      state: { type: Sequelize.STRING(50), allowNull: true },
      postal_code: { type: Sequelize.STRING(20), allowNull: true },
      country: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'India' },
      admission_date: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.literal('CURRENT_DATE') },
      admission_class: { type: Sequelize.STRING(20), allowNull: false },
      current_class: { type: Sequelize.STRING(20), allowNull: false },
      section: { type: Sequelize.STRING(10), allowNull: true },
      academic_year: { type: Sequelize.STRING(10), allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'active' },
      photo: { type: Sequelize.STRING, allowNull: true },
      documents: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      medical_info: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      notes: { type: Sequelize.TEXT, allowNull: true },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'branches', key: 'id' }, onDelete: 'SET NULL' },
      user_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('students', ['admission_number'], { unique: true });
    await queryInterface.addIndex('students', ['school_id']);
    await queryInterface.addIndex('students', ['branch_id']);
    await queryInterface.addIndex('students', ['current_class']);
    await queryInterface.addIndex('students', ['status']);

    // 16. Parents
    await queryInterface.createTable('parents', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      father_name: { type: Sequelize.STRING(100), allowNull: true },
      father_phone: { type: Sequelize.STRING(20), allowNull: true },
      father_email: { type: Sequelize.STRING, allowNull: true },
      father_occupation: { type: Sequelize.STRING(100), allowNull: true },
      father_qualification: { type: Sequelize.STRING(100), allowNull: true },
      father_income: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      mother_name: { type: Sequelize.STRING(100), allowNull: true },
      mother_phone: { type: Sequelize.STRING(20), allowNull: true },
      mother_email: { type: Sequelize.STRING, allowNull: true },
      mother_occupation: { type: Sequelize.STRING(100), allowNull: true },
      mother_qualification: { type: Sequelize.STRING(100), allowNull: true },
      mother_income: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      guardian_name: { type: Sequelize.STRING(100), allowNull: true },
      guardian_phone: { type: Sequelize.STRING(20), allowNull: true },
      guardian_email: { type: Sequelize.STRING, allowNull: true },
      guardian_relation: { type: Sequelize.STRING(50), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      city: { type: Sequelize.STRING(50), allowNull: true },
      state: { type: Sequelize.STRING(50), allowNull: true },
      postal_code: { type: Sequelize.STRING(20), allowNull: true },
      country: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'India' },
      emergency_contact: { type: Sequelize.STRING(20), allowNull: true },
      emergency_relation: { type: Sequelize.STRING(50), allowNull: true },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'branches', key: 'id' }, onDelete: 'SET NULL' },
      user_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('parents', ['school_id']);
    await queryInterface.addIndex('parents', ['branch_id']);

    // 17. Student-Parent Relationship
    await queryInterface.createTable('student_parents', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      student_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'students', key: 'id' }, onDelete: 'CASCADE' },
      parent_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'parents', key: 'id' }, onDelete: 'CASCADE' },
      relationship: { type: Sequelize.STRING, allowNull: false, defaultValue: 'father' },
      is_primary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_emergency_contact: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('student_parents', ['student_id']);
    await queryInterface.addIndex('student_parents', ['parent_id']);
    await queryInterface.addIndex('student_parents', ['student_id', 'parent_id'], { unique: true, name: 'unique_student_parent' });

    // 18. Fee Invoices
    await queryInterface.createTable('fee_invoices', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      invoice_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      student_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'students', key: 'id' }, onDelete: 'CASCADE' },
      fee_structure_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'fee_structures', key: 'id' }, onDelete: 'RESTRICT' },
      academic_year: { type: Sequelize.STRING(10), allowNull: false },
      invoice_date: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.literal('CURRENT_DATE') },
      due_date: { type: Sequelize.DATEONLY, allowNull: false },
      total_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      paid_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
      balance_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
      discount_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
      fine_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'draft' },
      payment_terms: { type: Sequelize.TEXT, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'branches', key: 'id' }, onDelete: 'SET NULL' },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('fee_invoices', ['invoice_number'], { unique: true });
    await queryInterface.addIndex('fee_invoices', ['student_id']);
    await queryInterface.addIndex('fee_invoices', ['fee_structure_id']);
    await queryInterface.addIndex('fee_invoices', ['status']);
    await queryInterface.addIndex('fee_invoices', ['due_date']);
    await queryInterface.addIndex('fee_invoices', ['school_id']);

    // 19. Admissions
    await queryInterface.createTable('admissions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      application_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      student_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'students', key: 'id' }, onDelete: 'SET NULL' },
      first_name: { type: Sequelize.STRING(50), allowNull: false },
      last_name: { type: Sequelize.STRING(50), allowNull: false },
      middle_name: { type: Sequelize.STRING(50), allowNull: true },
      date_of_birth: { type: Sequelize.DATEONLY, allowNull: false },
      gender: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      city: { type: Sequelize.STRING(50), allowNull: true },
      state: { type: Sequelize.STRING(50), allowNull: true },
      postal_code: { type: Sequelize.STRING(20), allowNull: true },
      country: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'India' },
      applied_class: { type: Sequelize.STRING(20), allowNull: false },
      academic_year: { type: Sequelize.STRING(10), allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      application_date: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.literal('CURRENT_DATE') },
      documents: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      notes: { type: Sequelize.TEXT, allowNull: true },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'branches', key: 'id' }, onDelete: 'SET NULL' },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('admissions', ['application_number'], { unique: true });
    await queryInterface.addIndex('admissions', ['student_id']);
    await queryInterface.addIndex('admissions', ['school_id']);
    await queryInterface.addIndex('admissions', ['status']);
    await queryInterface.addIndex('admissions', ['application_date']);
    await queryInterface.addIndex('admissions', ['applied_class']);

    // Add UUID extension (if not already added)
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse dependency order
    const tables = [
      'admissions', 'fee_invoices', 'student_parents', 'parents', 'students', 
      'fee_structures', 'fee_types', 'sections', 'classes', 'academic_years',
      'subscription_renewal_requests', 'transactions', 'subscription_plans',
      'branches', 'schools', 'users'
    ];
    
    for (const table of tables) {
      await queryInterface.dropTable(table, { force: true }).catch(() => {});
    }
  }
};