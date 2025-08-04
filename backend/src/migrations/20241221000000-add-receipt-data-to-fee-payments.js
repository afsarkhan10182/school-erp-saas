'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add receipt_data column to fee_payments table
    await queryInterface.addColumn('fee_payments', 'receipt_data', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Receipt data snapshot at the time of payment'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the column if migration is rolled back
    await queryInterface.removeColumn('fee_payments', 'receipt_data');
  }
}; 