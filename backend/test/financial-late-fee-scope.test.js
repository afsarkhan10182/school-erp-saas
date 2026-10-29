require('module-alias/register');

const { FeeInvoice, sequelize } = require('../src/models');
const { applyLateFees } = require('../src/controllers/financial/payment.controller');

const createTransaction = () => ({
  LOCK: { UPDATE: 'UPDATE' },
  finished: null,
  commit: jest.fn().mockImplementation(async function () { this.finished = 'commit'; }),
  rollback: jest.fn().mockImplementation(async function () { this.finished = 'rollback'; })
});

describe('late fee application', () => {
  const originalFindOne = FeeInvoice.findOne;
  const originalTransaction = sequelize.transaction;

  beforeEach(() => {
    FeeInvoice.findOne = jest.fn();
    sequelize.transaction = jest.fn();
  });

  afterEach(() => {
    FeeInvoice.findOne = originalFindOne;
    sequelize.transaction = originalTransaction;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('locks the assigned-branch invoice and persists the calculated fee atomically', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-26T12:00:00Z'));
    const transaction = createTransaction();
    const invoice = {
      id: 'invoice-1',
      invoice_number: 'INV-1',
      due_date: '2026-09-20',
      total_amount: '100.00',
      paid_amount: '50.00',
      balance_amount: '50.00',
      late_fee_percentage: '2.00',
      is_late_fee_applied: false,
      update: jest.fn().mockResolvedValue(undefined)
    };
    sequelize.transaction.mockResolvedValue(transaction);
    FeeInvoice.findOne.mockResolvedValue(invoice);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await applyLateFees(
      {
        params: { id: invoice.id },
        schoolId: 'school-1',
        user: { id: 'branch-admin-1', role: 'branch_admin', branch_id: 'branch-1' }
      },
      res,
      jest.fn()
    );

    expect(FeeInvoice.findOne).toHaveBeenCalledWith({
      where: {
        id: invoice.id,
        school_id: 'school-1',
        status: { [require('sequelize').Op.in]: ['sent', 'partial_paid', 'overdue'] },
        branch_id: 'branch-1'
      },
      transaction,
      lock: { level: 'UPDATE', of: FeeInvoice }
    });
    expect(invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        late_fee_amount: 4,
        total_amount: 104,
        balance_amount: 54,
        is_late_fee_applied: true,
        updated_by: 'branch-admin-1'
      }),
      { transaction }
    );
    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(transaction.rollback).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns not-found for an invoice from another branch', async () => {
    const transaction = createTransaction();
    sequelize.transaction.mockResolvedValue(transaction);
    FeeInvoice.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await applyLateFees(
      {
        params: { id: 'foreign-invoice' },
        schoolId: 'school-1',
        user: { role: 'branch_admin', branch_id: 'branch-1' }
      },
      {},
      next
    );

    expect(FeeInvoice.findOne.mock.calls[0][0].where.branch_id).toBe('branch-1');
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });

  it('fails closed when a branch admin has no assigned branch', async () => {
    const next = jest.fn();

    await applyLateFees(
      { params: { id: 'invoice-1' }, schoolId: 'school-1', user: { role: 'branch_admin' } },
      {},
      next
    );

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(FeeInvoice.findOne).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
