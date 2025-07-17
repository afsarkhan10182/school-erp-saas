'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add payment_terms column
    await queryInterface.addColumn('fee_invoices', 'payment_terms', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add is_late_fee_applied column
    await queryInterface.addColumn('fee_invoices', 'is_late_fee_applied', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Add late_fee_applied_date column
    await queryInterface.addColumn('fee_invoices', 'late_fee_applied_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    // Add last_payment_date column
    await queryInterface.addColumn('fee_invoices', 'last_payment_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    // Add invoice_items column
    await queryInterface.addColumn('fee_invoices', 'invoice_items', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });

    // Add indexes for the new columns
    await queryInterface.addIndex('fee_invoices', ['is_late_fee_applied']);
    await queryInterface.addIndex('fee_invoices', ['late_fee_applied_date']);
    await queryInterface.addIndex('fee_invoices', ['last_payment_date']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('fee_invoices', ['is_late_fee_applied']);
    await queryInterface.removeIndex('fee_invoices', ['late_fee_applied_date']);
    await queryInterface.removeIndex('fee_invoices', ['last_payment_date']);

    // Remove columns
    await queryInterface.removeColumn('fee_invoices', 'payment_terms');
    await queryInterface.removeColumn('fee_invoices', 'is_late_fee_applied');
    await queryInterface.removeColumn('fee_invoices', 'late_fee_applied_date');
    await queryInterface.removeColumn('fee_invoices', 'last_payment_date');
    await queryInterface.removeColumn('fee_invoices', 'invoice_items');
  }
}; 