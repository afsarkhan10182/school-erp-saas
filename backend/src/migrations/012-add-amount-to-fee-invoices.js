'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add amount column to fee_invoices table
    await queryInterface.addColumn('fee_invoices', 'amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    });

    // Add index for amount
    await queryInterface.addIndex('fee_invoices', ['amount']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the column and index
    await queryInterface.removeIndex('fee_invoices', ['amount']);
    await queryInterface.removeColumn('fee_invoices', 'amount');
  }
}; 