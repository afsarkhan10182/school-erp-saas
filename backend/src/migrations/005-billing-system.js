'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create ENUM types first
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_fee_invoices_status" AS ENUM ('draft', 'sent', 'paid', 'partial_paid', 'overdue', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_fee_invoices_payment_status" AS ENUM ('pending', 'partial', 'paid', 'overdue');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_transactions_payment_method" AS ENUM ('online', 'offline_cash', 'offline_cheque', 'offline_bank_transfer', 'card', 'upi');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_transactions_payment_status" AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_transactions_transaction_status" AS ENUM ('initiated', 'processing', 'success', 'failed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_transactions_billing_cycle" AS ENUM ('monthly', 'yearly', 'lifetime');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Fee Invoices Table
    await queryInterface.createTable('fee_invoices', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      invoice_number: { 
        type: Sequelize.STRING(50), 
        allowNull: false, 
        unique: true 
      },
      student_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      fee_structure_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      academic_year: { 
        type: Sequelize.STRING(10), 
        allowNull: false 
      },
      class_name: { 
        type: Sequelize.STRING(20), 
        allowNull: false 
      },
      section: { 
        type: Sequelize.STRING(10), 
        allowNull: true 
      },
      fee_type_name: { 
        type: Sequelize.STRING(100), 
        allowNull: false 
      },
      base_amount: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false 
      },
      discount_amount: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false, 
        defaultValue: 0.00 
      },
      tax_amount: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false, 
        defaultValue: 0.00 
      },
      total_amount: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false 
      },
      paid_amount: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false, 
        defaultValue: 0.00 
      },
      balance_amount: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false 
      },
      due_date: { 
        type: Sequelize.DATEONLY, 
        allowNull: false 
      },
      installment_number: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 1 
      },
      total_installments: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 1 
      },
      status: { 
        type: Sequelize.ENUM('draft', 'sent', 'paid', 'partial_paid', 'overdue', 'cancelled'), 
        allowNull: false, 
        defaultValue: 'draft' 
      },
      payment_status: { 
        type: Sequelize.ENUM('pending', 'partial', 'paid', 'overdue'), 
        allowNull: false, 
        defaultValue: 'pending' 
      },
      notes: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      school_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
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

    // 3. Transactions Table
    await queryInterface.createTable('transactions', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      transaction_id: { 
        type: Sequelize.STRING(50), 
        allowNull: false, 
        unique: true 
      },
      school_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      subscription_plan_id: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      amount: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false 
      },
      currency: { 
        type: Sequelize.STRING(3), 
        allowNull: false, 
        defaultValue: 'INR' 
      },
      payment_method: { 
        type: Sequelize.ENUM('online', 'offline_cash', 'offline_cheque', 'offline_bank_transfer', 'card', 'upi'), 
        allowNull: false, 
        defaultValue: 'online' 
      },
      payment_status: { 
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'), 
        allowNull: false, 
        defaultValue: 'pending' 
      },
      transaction_status: { 
        type: Sequelize.ENUM('initiated', 'processing', 'success', 'failed', 'cancelled'), 
        allowNull: false, 
        defaultValue: 'initiated' 
      },
      billing_cycle: { 
        type: Sequelize.ENUM('monthly', 'yearly', 'lifetime'), 
        allowNull: false, 
        defaultValue: 'monthly' 
      },
      subscription_start_date: { 
        type: Sequelize.DATE, 
        allowNull: true 
      },
      subscription_end_date: { 
        type: Sequelize.DATE, 
        allowNull: true 
      },
      description: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      gateway_response: { 
        type: Sequelize.JSONB, 
        allowNull: true 
      },
      gateway_transaction_id: { 
        type: Sequelize.STRING(100), 
        allowNull: true 
      },
      gateway_name: { 
        type: Sequelize.STRING(50), 
        allowNull: true 
      },
      receipt_url: { 
        type: Sequelize.STRING, 
        allowNull: true 
      },
      notes: { 
        type: Sequelize.TEXT, 
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

    // Add Foreign Key Constraints
    await queryInterface.addConstraint('fee_invoices', {
      fields: ['student_id'],
      type: 'foreign key',
      name: 'fee_invoices_student_id_fkey',
      references: { table: 'students', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_invoices', {
      fields: ['fee_structure_id'],
      type: 'foreign key',
      name: 'fee_invoices_fee_structure_id_fkey',
      references: { table: 'fee_structures', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_invoices', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'fee_invoices_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_invoices', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'fee_invoices_branch_id_fkey',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_invoices', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'fee_invoices_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_invoices', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'fee_invoices_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('transactions', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'transactions_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('transactions', {
      fields: ['subscription_plan_id'],
      type: 'foreign key',
      name: 'transactions_subscription_plan_id_fkey',
      references: { table: 'subscription_plans', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('transactions', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'transactions_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('transactions', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'transactions_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Add Indexes
    await queryInterface.addIndex('fee_invoices', ['invoice_number'], { unique: true });
    await queryInterface.addIndex('fee_invoices', ['student_id']);
    await queryInterface.addIndex('fee_invoices', ['fee_structure_id']);
    await queryInterface.addIndex('fee_invoices', ['school_id']);
    await queryInterface.addIndex('fee_invoices', ['branch_id']);
    await queryInterface.addIndex('fee_invoices', ['academic_year']);
    await queryInterface.addIndex('fee_invoices', ['class_name']);
    await queryInterface.addIndex('fee_invoices', ['status']);
    await queryInterface.addIndex('fee_invoices', ['payment_status']);
    await queryInterface.addIndex('fee_invoices', ['due_date']);

    await queryInterface.addIndex('transactions', ['transaction_id'], { unique: true });
    await queryInterface.addIndex('transactions', ['school_id']);
    await queryInterface.addIndex('transactions', ['subscription_plan_id']);
    await queryInterface.addIndex('transactions', ['payment_status']);
    await queryInterface.addIndex('transactions', ['transaction_status']);
    await queryInterface.addIndex('transactions', ['gateway_transaction_id']);
    await queryInterface.addIndex('transactions', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables first
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('fee_invoices');
    
    // Drop ENUM types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_transactions_billing_cycle";
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_transactions_transaction_status";
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_transactions_payment_status";
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_transactions_payment_method";
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_fee_invoices_payment_status";
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_fee_invoices_status";
    `);
  }
}; 