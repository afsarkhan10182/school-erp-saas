'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add performance indexes for fee invoice queries
    await queryInterface.addIndex('fee_invoices', ['school_id', 'status'], {
      name: 'idx_fee_invoices_school_status',
      concurrently: true
    });

    await queryInterface.addIndex('fee_invoices', ['payment_model', 'month'], {
      name: 'idx_fee_invoices_payment_model_month',
      concurrently: true
    });

    await queryInterface.addIndex('fee_invoices', ['invoice_date', 'due_date'], {
      name: 'idx_fee_invoices_dates',
      concurrently: true
    });

    await queryInterface.addIndex('fee_invoices', ['branch_id'], {
      name: 'idx_fee_invoices_branch',
      concurrently: true
    });

    await queryInterface.addIndex('fee_invoices', ['academic_year'], {
      name: 'idx_fee_invoices_academic_year',
      concurrently: true
    });

    // Composite index for common query patterns
    await queryInterface.addIndex('fee_invoices', ['school_id', 'payment_model', 'status'], {
      name: 'idx_fee_invoices_school_payment_status',
      concurrently: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the indexes
    await queryInterface.removeIndex('fee_invoices', 'idx_fee_invoices_school_status');
    await queryInterface.removeIndex('fee_invoices', 'idx_fee_invoices_payment_model_month');
    await queryInterface.removeIndex('fee_invoices', 'idx_fee_invoices_dates');
    await queryInterface.removeIndex('fee_invoices', 'idx_fee_invoices_branch');
    await queryInterface.removeIndex('fee_invoices', 'idx_fee_invoices_academic_year');
    await queryInterface.removeIndex('fee_invoices', 'idx_fee_invoices_school_payment_status');
  }
};
