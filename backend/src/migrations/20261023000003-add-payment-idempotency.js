'use strict';

const columns = {
  idempotency_key: 'VARCHAR(128)',
  idempotency_request_hash: 'VARCHAR(64)',
  idempotency_response: 'JSONB'
};

module.exports = {
  async up(queryInterface) {
    for (const [name, type] of Object.entries(columns)) {
      await queryInterface.sequelize.query(`ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS ${name} ${type}`);
    }
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS fee_payments_idempotency_invoice_unique
      ON fee_payments (school_id, idempotency_key, invoice_id)
      WHERE idempotency_key IS NOT NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS fee_payments_idempotency_invoice_unique');
    for (const name of Object.keys(columns).reverse()) {
      await queryInterface.removeColumn('fee_payments', name);
    }
  }
};
