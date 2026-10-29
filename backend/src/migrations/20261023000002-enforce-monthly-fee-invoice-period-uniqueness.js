'use strict';

const indexName = 'fee_invoices_monthly_period_unique';

module.exports = {
  async up(queryInterface) {
    const [duplicates] = await queryInterface.sequelize.query(`
      SELECT school_id, student_id, fee_structure_id, COALESCE(academic_year, ''), year, month
      FROM fee_invoices
      WHERE payment_model = 'monthly' AND month IS NOT NULL AND year IS NOT NULL
      GROUP BY school_id, student_id, fee_structure_id, COALESCE(academic_year, ''), year, month
      HAVING COUNT(*) > 1
      LIMIT 1
    `);

    if (duplicates.length) {
      throw new Error(
        'Cannot enforce monthly invoice period uniqueness: duplicate student/month invoices exist. Resolve duplicates before retrying this migration.'
      );
    }

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ${indexName}
      ON fee_invoices (school_id, student_id, fee_structure_id, COALESCE(academic_year, ''), year, month)
      WHERE payment_model = 'monthly' AND month IS NOT NULL AND year IS NOT NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS ${indexName}`);
  }
};
