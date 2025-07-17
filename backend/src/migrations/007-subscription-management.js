'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Subscription Renewal Requests Table
    await queryInterface.createTable('subscription_renewal_requests', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      school_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      current_plan_id: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      requested_plan_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      current_billing_cycle: { 
        type: Sequelize.ENUM('monthly', 'yearly', 'lifetime'), 
        allowNull: false 
      },
      requested_billing_cycle: { 
        type: Sequelize.ENUM('monthly', 'yearly', 'lifetime'), 
        allowNull: false 
      },
      current_end_date: { 
        type: Sequelize.DATE, 
        allowNull: true 
      },
      requested_start_date: { 
        type: Sequelize.DATE, 
        allowNull: false 
      },
      requested_end_date: { 
        type: Sequelize.DATE, 
        allowNull: false 
      },
      reason: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      additional_requirements: { 
        type: Sequelize.JSONB, 
        allowNull: false, 
        defaultValue: {} 
      },
      status: { 
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'), 
        allowNull: false, 
        defaultValue: 'pending' 
      },
      admin_notes: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      reviewed_by: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      reviewed_at: { 
        type: Sequelize.DATE, 
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
    await queryInterface.addConstraint('subscription_renewal_requests', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'subscription_renewal_requests_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('subscription_renewal_requests', {
      fields: ['current_plan_id'],
      type: 'foreign key',
      name: 'subscription_renewal_requests_current_plan_id_fkey',
      references: { table: 'subscription_plans', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('subscription_renewal_requests', {
      fields: ['requested_plan_id'],
      type: 'foreign key',
      name: 'subscription_renewal_requests_requested_plan_id_fkey',
      references: { table: 'subscription_plans', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('subscription_renewal_requests', {
      fields: ['reviewed_by'],
      type: 'foreign key',
      name: 'subscription_renewal_requests_reviewed_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('subscription_renewal_requests', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'subscription_renewal_requests_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('subscription_renewal_requests', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'subscription_renewal_requests_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Add Indexes
    await queryInterface.addIndex('subscription_renewal_requests', ['school_id']);
    await queryInterface.addIndex('subscription_renewal_requests', ['current_plan_id']);
    await queryInterface.addIndex('subscription_renewal_requests', ['requested_plan_id']);
    await queryInterface.addIndex('subscription_renewal_requests', ['status']);
    await queryInterface.addIndex('subscription_renewal_requests', ['reviewed_by']);
    await queryInterface.addIndex('subscription_renewal_requests', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('subscription_renewal_requests');
  }
}; 