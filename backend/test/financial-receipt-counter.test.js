require('module-alias/register');
const { sequelize } = require('../src/config/database');
const { generateUniqueReceiptNumber } = require('../src/controllers/financial/core.controller');

describe('receipt counter schema compatibility', () => {
  const originalQuery = sequelize.query;

  afterEach(() => {
    sequelize.query = originalQuery;
  });

  it('uses the persisted school/branch/class unique key and caller transaction', async () => {
    const transaction = { id: 'payment-transaction' };
    sequelize.query = jest.fn().mockResolvedValue([{ receipt_count: 12 }]);

    await expect(generateUniqueReceiptNumber('C1', {
      school_id: 'school-1',
      branch_id: 'branch-1',
      academic_year: '2025-2026',
      transaction
    })).resolves.toEqual({ receipt_number: 'RCP-C1-12' });

    const [sql, options] = sequelize.query.mock.calls[0];
    expect(sql).toContain('ON CONFLICT (school_id, branch_id, class_code)');
    expect(options.replacements.academic_year).toBe('2025-2026');
    expect(options.transaction).toBe(transaction);
  });
});
