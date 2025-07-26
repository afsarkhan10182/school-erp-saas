'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add payment model fields to fee_structures table
    await queryInterface.addColumn('fee_structures', 'payment_model', {
      type: Sequelize.ENUM('installment', 'monthly'),
      allowNull: false,
      defaultValue: 'monthly',
    });

    await queryInterface.addColumn('fee_structures', 'installment_amounts', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
    });

    await queryInterface.addColumn('fee_structures', 'monthly_payment_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.addColumn('fee_structures', 'total_months', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 12,
    });

    // Create monthly_payments table
    await queryInterface.createTable('monthly_payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
      },
      fee_structure_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fee_structures',
          key: 'id',
        },
      },
      academic_year: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      due_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      paid_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      balance_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'partial', 'paid', 'overdue'),
        allowNull: false,
        defaultValue: 'pending',
      },
      payment_method: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      transaction_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      receipt_number: {
        type: Sequelize.STRING(50),
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
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id',
        },
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
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

    // Add indexes for monthly_payments table
    await queryInterface.addIndex('monthly_payments', ['student_id', 'fee_structure_id', 'month', 'year'], {
      unique: true,
      name: 'monthly_payments_student_fee_month_year_unique'
    });
    await queryInterface.addIndex('monthly_payments', ['school_id']);
    await queryInterface.addIndex('monthly_payments', ['branch_id']);
    await queryInterface.addIndex('monthly_payments', ['academic_year']);
    await queryInterface.addIndex('monthly_payments', ['status']);
    await queryInterface.addIndex('monthly_payments', ['due_date']);

    // Add indexes for fee_structures new fields
    await queryInterface.addIndex('fee_structures', ['payment_model']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('monthly_payments', 'monthly_payments_student_fee_month_year_unique');
    await queryInterface.removeIndex('monthly_payments', ['school_id']);
    await queryInterface.removeIndex('monthly_payments', ['branch_id']);
    await queryInterface.removeIndex('monthly_payments', ['academic_year']);
    await queryInterface.removeIndex('monthly_payments', ['status']);
    await queryInterface.removeIndex('monthly_payments', ['due_date']);
    await queryInterface.removeIndex('fee_structures', ['payment_model']);

    // Drop monthly_payments table
    await queryInterface.dropTable('monthly_payments');

    // Remove columns from fee_structures
    await queryInterface.removeColumn('fee_structures', 'payment_model');
    await queryInterface.removeColumn('fee_structures', 'installment_amounts');
    await queryInterface.removeColumn('fee_structures', 'monthly_payment_amount');
    await queryInterface.removeColumn('fee_structures', 'total_months');
  }
}; 