'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const columns = await queryInterface.describeTable('fee_invoices');
    if (!columns.late_fee_amount) {
      await queryInterface.addColumn('fee_invoices', 'late_fee_amount', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('fee_invoices');
    if (columns.late_fee_amount) {
      await queryInterface.removeColumn('fee_invoices', 'late_fee_amount');
    }
  }
};
