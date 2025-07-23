'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('monthly_payments', 'idx_monthly_payments_receipt_group_id');
    
    // Remove column
    await queryInterface.removeColumn('monthly_payments', 'receipt_group_id');
  },

  async down(queryInterface, Sequelize) {
    // Add column back
    await queryInterface.addColumn('monthly_payments', 'receipt_group_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Groups multiple monthly payments under one receipt',
      after: 'receipt_number'
    });

    // Add index back
    await queryInterface.addIndex('monthly_payments', ['receipt_group_id'], {
      name: 'idx_monthly_payments_receipt_group_id'
    });
  }
};
