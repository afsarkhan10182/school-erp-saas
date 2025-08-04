'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove receipt_html and receipt_data columns from fee_payments table
    await queryInterface.removeColumn('fee_payments', 'receipt_html');
    await queryInterface.removeColumn('fee_payments', 'receipt_data');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the columns if migration is rolled back
    await queryInterface.addColumn('fee_payments', 'receipt_html', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Generated receipt HTML content'
    });
    
    await queryInterface.addColumn('fee_payments', 'receipt_data', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Receipt data for regeneration'
    });
  }
}; 