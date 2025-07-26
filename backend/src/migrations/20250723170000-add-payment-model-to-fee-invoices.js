'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('fee_invoices', 'payment_model', {
      type: Sequelize.ENUM('installment', 'monthly'),
      allowNull: false,
      defaultValue: 'installment',
      after: 'installment_number'
    });

    await queryInterface.addColumn('fee_invoices', 'month', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'payment_model'
    });

    await queryInterface.addColumn('fee_invoices', 'year', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'month'
    });

    // Add indexes for better performance
    await queryInterface.addIndex('fee_invoices', ['payment_model']);
    await queryInterface.addIndex('fee_invoices', ['month', 'year']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('fee_invoices', ['payment_model']);
    await queryInterface.removeIndex('fee_invoices', ['month', 'year']);
    
    await queryInterface.removeColumn('fee_invoices', 'year');
    await queryInterface.removeColumn('fee_invoices', 'month');
    await queryInterface.removeColumn('fee_invoices', 'payment_model');
    
    // Remove the ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_fee_invoices_payment_model;');
  }
}; 