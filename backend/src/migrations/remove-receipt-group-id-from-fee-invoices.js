'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the old receipt_group_id column since we're using receipt_number now
    await queryInterface.removeColumn('fee_invoices', 'receipt_group_id');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back receipt_group_id column if needed to rollback
    await queryInterface.addColumn('fee_invoices', 'receipt_group_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Groups multiple invoices under one receipt',
    });
  }
};
