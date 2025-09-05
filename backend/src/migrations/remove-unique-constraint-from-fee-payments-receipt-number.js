'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the unique constraint from receipt_number in fee_payments table
    await queryInterface.removeConstraint('fee_payments', 'fee_payments_receipt_number_key');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the unique constraint if needed to rollback
    await queryInterface.addConstraint('fee_payments', {
      fields: ['receipt_number'],
      type: 'unique',
      name: 'fee_payments_receipt_number_key'
    });
  }
};
