'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, make invoice_id nullable
    await queryInterface.changeColumn('fee_payments', 'invoice_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'fee_invoices',
        key: 'id',
      },
    });

    // Add monthly_payment_id column
    await queryInterface.addColumn('fee_payments', 'monthly_payment_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'monthly_payments',
        key: 'id',
      },
    });

    // Add index for monthly_payment_id
    await queryInterface.addIndex('fee_payments', ['monthly_payment_id']);
  },

  async down (queryInterface, Sequelize) {
    // Remove the index
    await queryInterface.removeIndex('fee_payments', ['monthly_payment_id']);

    // Remove monthly_payment_id column
    await queryInterface.removeColumn('fee_payments', 'monthly_payment_id');

    // Make invoice_id non-nullable again
    await queryInterface.changeColumn('fee_payments', 'invoice_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'fee_invoices',
        key: 'id',
      },
    });
  }
};
