'use strict';

const { DataTypes } = require('sequelize');
const enumName = 'enum_fee_payments_payment_status';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS 'reversed'`);
    await queryInterface.addColumn('fee_payments', 'reversed_at', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('fee_payments', 'reversal_reason', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('fee_payments', 'reversed_by', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT COUNT(*)::int AS count FROM fee_payments WHERE payment_status = 'reversed'"
    );
    if (rows[0].count > 0) {
      throw new Error('Cannot remove reversal support while reversed fee payments exist');
    }

    await queryInterface.removeColumn('fee_payments', 'reversed_by');
    await queryInterface.removeColumn('fee_payments', 'reversal_reason');
    await queryInterface.removeColumn('fee_payments', 'reversed_at');
    await queryInterface.sequelize.query(`
      ALTER TABLE fee_payments ALTER COLUMN payment_status DROP DEFAULT;
      ALTER TABLE fee_payments ALTER COLUMN payment_status TYPE VARCHAR(20) USING payment_status::text;
      DROP TYPE "${enumName}";
      CREATE TYPE "${enumName}" AS ENUM ('pending', 'completed', 'failed', 'cancelled');
      ALTER TABLE fee_payments ALTER COLUMN payment_status TYPE "${enumName}"
        USING payment_status::"${enumName}";
      ALTER TABLE fee_payments ALTER COLUMN payment_status SET DEFAULT 'completed';
    `);
  }
};
