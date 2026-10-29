'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('fee_invoice_adjustments', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      invoice_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'fee_invoices', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      school_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      branch_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      adjustment_type: { type: DataTypes.STRING(10), allowNull: false },
      adjustment_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      adjustment_reason: { type: DataTypes.TEXT, allowNull: false },
      previous_total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      new_total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      previous_balance_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      new_balance_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addIndex('fee_invoice_adjustments', ['school_id', 'invoice_id', 'created_at']);
    await queryInterface.addIndex('fee_invoice_adjustments', ['branch_id', 'created_at']);
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*)::int AS count FROM fee_invoice_adjustments'
    );
    if (rows[0].count > 0) {
      throw new Error('Cannot remove fee adjustment history while adjustment records exist');
    }
    await queryInterface.dropTable('fee_invoice_adjustments');
  }
};
