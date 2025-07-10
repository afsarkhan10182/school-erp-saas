'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create subscription_plans table
    await queryInterface.createTable('subscription_plans', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'INR',
      },
      billing_cycle: {
        type: Sequelize.ENUM('monthly', 'yearly', 'lifetime'),
        allowNull: false,
        defaultValue: 'monthly',
      },
      max_students: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
      },
      max_staff: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20,
      },
      max_branches: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      modules: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: Sequelize.literal("ARRAY['academics','attendance','fees']::VARCHAR[]"),
      },
      features: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: '{}',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_popular: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
    await queryInterface.addIndex('subscription_plans', ['code'], { unique: true });
    await queryInterface.addIndex('subscription_plans', ['name'], { unique: true });
    await queryInterface.addIndex('subscription_plans', ['is_active']);
    await queryInterface.addIndex('subscription_plans', ['billing_cycle']);

    // Create transactions table
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      transaction_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      subscription_plan_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'INR',
      },
      payment_method: {
        type: Sequelize.ENUM('online', 'offline_cash', 'offline_cheque', 'offline_bank_transfer', 'card', 'upi'),
        allowNull: false,
        defaultValue: 'online',
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      transaction_status: {
        type: Sequelize.ENUM('initiated', 'processing', 'success', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'initiated',
      },
      billing_cycle: {
        type: Sequelize.ENUM('monthly', 'yearly', 'lifetime'),
        allowNull: false,
        defaultValue: 'monthly',
      },
      subscription_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      subscription_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gateway_response: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      gateway_transaction_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      gateway_name: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      receipt_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_manual: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
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
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_subscription_plans_billing_cycle\";");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_transactions_payment_method\";");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_transactions_payment_status\";");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_transactions_transaction_status\";");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_transactions_billing_cycle\";");
  }
}; 