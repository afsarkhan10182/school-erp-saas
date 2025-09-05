'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the unique index on receipt_number from fee_payments table
    try {
      await queryInterface.removeIndex('fee_payments', ['receipt_number'], {
        unique: true
      });
      console.log('Successfully removed unique index on receipt_number');
    } catch (error) {
      console.log('Could not remove unique index on receipt_number:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the unique index if needed to rollback
    await queryInterface.addIndex('fee_payments', ['receipt_number'], {
      unique: true,
      name: 'fee_payments_receipt_number_unique_idx'
    });
  }
};
