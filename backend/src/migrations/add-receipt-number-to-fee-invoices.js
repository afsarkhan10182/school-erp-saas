'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('fee_invoices', 'receipt_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Simple receipt number per class (RCP-{classcode}-{sequence})',
    });

    // Add index for better performance on receipt_number queries
    await queryInterface.addIndex('fee_invoices', ['receipt_number'], {
      name: 'idx_fee_invoices_receipt_number'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('fee_invoices', 'idx_fee_invoices_receipt_number');
    await queryInterface.removeColumn('fee_invoices', 'receipt_number');
  }
};
