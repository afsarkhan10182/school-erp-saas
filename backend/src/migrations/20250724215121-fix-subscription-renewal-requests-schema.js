'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, drop the existing table since the structure is completely different
    await queryInterface.dropTable('subscription_renewal_requests');
    
    // Create the table with the correct structure matching the model
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
      current_plan_code: { 
        type: Sequelize.STRING(50), 
        allowNull: false 
      },
      requested_plan_code: { 
        type: Sequelize.STRING(50), 
        allowNull: false 
      },
      request_type: { 
        type: Sequelize.ENUM('renewal', 'upgrade', 'downgrade', 'change_plan'), 
        allowNull: false, 
        defaultValue: 'renewal' 
      },
      current_subscription_end_date: { 
        type: Sequelize.DATE, 
        allowNull: false 
      },
      requested_start_date: { 
        type: Sequelize.DATE, 
        allowNull: false 
      },
      requested_end_date: { 
        type: Sequelize.DATE, 
        allowNull: false 
      },
      billing_cycle: { 
        type: Sequelize.ENUM('monthly', 'yearly', 'lifetime'), 
        allowNull: false, 
        defaultValue: 'yearly' 
      },
      status: { 
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'), 
        allowNull: false, 
        defaultValue: 'pending' 
      },
      request_reason: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      admin_notes: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      admin_response: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      requested_by: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      reviewed_by: { 
        type: Sequelize.UUID, 
        allowNull: true 
      },
      reviewed_at: { 
        type: Sequelize.DATE, 
        allowNull: true 
      },
      is_active: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: true 
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
      fields: ['requested_by'],
      type: 'foreign key',
      name: 'subscription_renewal_requests_requested_by_fkey',
      references: { table: 'users', field: 'id' },
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

    // Add Indexes
    await queryInterface.addIndex('subscription_renewal_requests', ['school_id']);
    await queryInterface.addIndex('subscription_renewal_requests', ['status']);
    await queryInterface.addIndex('subscription_renewal_requests', ['requested_by']);
    await queryInterface.addIndex('subscription_renewal_requests', ['reviewed_by']);
    await queryInterface.addIndex('subscription_renewal_requests', ['created_at']);
  },

  async down (queryInterface, Sequelize) {
    // Drop the table
    await queryInterface.dropTable('subscription_renewal_requests');
  }
};
