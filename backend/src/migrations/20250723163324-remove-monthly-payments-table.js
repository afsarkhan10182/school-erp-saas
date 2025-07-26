'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, remove the foreign key constraint from fee_payments table
    await queryInterface.removeConstraint('fee_payments', 'fee_payments_monthly_payment_id_fkey');
    
    // Remove the monthly_payment_id column from fee_payments table
    await queryInterface.removeColumn('fee_payments', 'monthly_payment_id');
    
    // Drop the monthly_payments table
    await queryInterface.dropTable('monthly_payments');
  },

  async down(queryInterface, Sequelize) {
    // Recreate the monthly_payments table
    await queryInterface.createTable('monthly_payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fee_structure_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fee_structures',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      academic_year: {
        type: Sequelize.STRING,
        allowNull: false
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      paid_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      balance_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'partial', 'overdue'),
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true
      },
      transaction_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      payment_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      receipt_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('monthly_payments', ['student_id', 'fee_structure_id', 'month', 'year'], {
      unique: true,
      name: 'monthly_payments_student_fee_month_year_unique'
    });
    await queryInterface.addIndex('monthly_payments', ['school_id']);
    await queryInterface.addIndex('monthly_payments', ['branch_id']);
    await queryInterface.addIndex('monthly_payments', ['academic_year']);
    await queryInterface.addIndex('monthly_payments', ['status']);
    await queryInterface.addIndex('monthly_payments', ['due_date']);

    // Add monthly_payment_id column back to fee_payments table
    await queryInterface.addColumn('fee_payments', 'monthly_payment_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'monthly_payments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
};
