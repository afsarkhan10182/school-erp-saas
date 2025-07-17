'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add late_fee_percentage column to fee_invoices table
    await queryInterface.addColumn('fee_invoices', 'late_fee_percentage', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 2.00, // Default 2% late fee
    });

    // Add index for late_fee_percentage
    await queryInterface.addIndex('fee_invoices', ['late_fee_percentage']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the column and index
    await queryInterface.removeIndex('fee_invoices', ['late_fee_percentage']);
    await queryInterface.removeColumn('fee_invoices', 'late_fee_percentage');
  }
}; 