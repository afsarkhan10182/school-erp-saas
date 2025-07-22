'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('fee_payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      payment_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      receipt_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      invoice_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fee_invoices',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      payment_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'cheque', 'bank_transfer', 'card', 'upi', 'online'),
        allowNull: false,
        defaultValue: 'cash',
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      transaction_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      cheque_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      bank_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      reference_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'completed',
      },
      receipt_html: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      receipt_data: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('fee_payments', ['payment_number'], { unique: true });
    await queryInterface.addIndex('fee_payments', ['receipt_number'], { unique: true });
    await queryInterface.addIndex('fee_payments', ['invoice_id']);
    await queryInterface.addIndex('fee_payments', ['student_id']);
    await queryInterface.addIndex('fee_payments', ['school_id']);
    await queryInterface.addIndex('fee_payments', ['branch_id']);
    await queryInterface.addIndex('fee_payments', ['payment_date']);
    await queryInterface.addIndex('fee_payments', ['payment_status']);
    await queryInterface.addIndex('fee_payments', ['payment_method']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('fee_payments');
  },
}; 