'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add invoice_date column to fee_invoices table
    await queryInterface.addColumn('fee_invoices', 'invoice_date', {
      type: Sequelize.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_DATE'),
    });

    // Add index for invoice_date
    await queryInterface.addIndex('fee_invoices', ['invoice_date']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the column and index
    await queryInterface.removeIndex('fee_invoices', ['invoice_date']);
    await queryInterface.removeColumn('fee_invoices', 'invoice_date');
  }
}; 