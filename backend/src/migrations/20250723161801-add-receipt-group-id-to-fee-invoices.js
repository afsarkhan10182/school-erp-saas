'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('fee_invoices', 'receipt_group_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Groups multiple invoices under one receipt',
      after: 'last_payment_date'
    });

    // Add index for better query performance
    await queryInterface.addIndex('fee_invoices', ['receipt_group_id'], {
      name: 'idx_fee_invoices_receipt_group_id'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('fee_invoices', 'idx_fee_invoices_receipt_group_id');
    
    // Remove column
    await queryInterface.removeColumn('fee_invoices', 'receipt_group_id');
  }
};
