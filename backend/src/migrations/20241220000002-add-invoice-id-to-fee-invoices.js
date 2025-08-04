'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('fee_invoices', 'invoice_id', {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      unique: true,
      allowNull: false
    });

    // Add index for better performance
    await queryInterface.addIndex('fee_invoices', ['invoice_id'], {
      unique: true,
      name: 'fee_invoices_invoice_id_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('fee_invoices', 'fee_invoices_invoice_id_unique');
    await queryInterface.removeColumn('fee_invoices', 'invoice_id');
  }
}; 