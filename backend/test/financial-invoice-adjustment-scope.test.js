require('module-alias/register');

const { FeeInvoice, FeeInvoiceAdjustment, sequelize } = require('../src/models');
const {
  adjustInvoice,
  getInvoiceAdjustments
} = require('../src/controllers/financial/core.controller');
const { getFeeInvoiceReport } = require('../src/controllers/financial/report.controller');

const createTransaction = () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' }, finished: null };
  transaction.commit = jest.fn().mockImplementation(async () => {
    transaction.finished = 'commit';
  });
  transaction.rollback = jest.fn().mockImplementation(async () => {
    transaction.finished = 'rollback';
  });
  return transaction;
};

describe('fee invoice adjustment scope and audit history', () => {
  const originalFindOne = FeeInvoice.findOne;
  const originalFindAndCountAll = FeeInvoice.findAndCountAll;
  const originalFindAll = FeeInvoice.findAll;
  const originalCreateAdjustment = FeeInvoiceAdjustment.create;
  const originalFindAdjustments = FeeInvoiceAdjustment.findAll;
  const originalTransaction = sequelize.transaction;

  beforeEach(() => {
    FeeInvoice.findOne = jest.fn();
    FeeInvoiceAdjustment.create = jest.fn();
    FeeInvoiceAdjustment.findAll = jest.fn();
    sequelize.transaction = jest.fn();
  });

  afterEach(() => {
    FeeInvoice.findOne = originalFindOne;
    FeeInvoice.findAndCountAll = originalFindAndCountAll;
    FeeInvoice.findAll = originalFindAll;
    FeeInvoiceAdjustment.create = originalCreateAdjustment;
    FeeInvoiceAdjustment.findAll = originalFindAdjustments;
    sequelize.transaction = originalTransaction;
    jest.clearAllMocks();
  });

  it('locks and atomically records a same-branch waiver and discount totals', async () => {
    const transaction = createTransaction();
    const invoice = {
      id: 'invoice-1',
      branch_id: 'branch-1',
      status: 'sent',
      total_amount: '100.00',
      balance_amount: '100.00',
      discount_amount: '5.00',
      update: jest.fn().mockResolvedValue(undefined)
    };
    sequelize.transaction = jest.fn().mockResolvedValue(transaction);
    FeeInvoice.findOne = jest.fn().mockResolvedValue(invoice);
    FeeInvoiceAdjustment.create = jest.fn().mockResolvedValue({ id: 'adjustment-1' });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await adjustInvoice(
      {
        params: { id: 'invoice-1' },
        body: { adjustment_type: 'waive', adjustment_amount: '25.00', adjustment_reason: 'Aid' },
        schoolId: 'school-1',
        user: { id: 'branch-admin-1', role: 'branch_admin', branch_id: 'branch-1' }
      },
      res,
      jest.fn()
    );

    expect(FeeInvoice.findOne).toHaveBeenCalledWith({
      where: { id: 'invoice-1', school_id: 'school-1', branch_id: 'branch-1' },
      transaction,
      lock: 'UPDATE'
    });
    expect(FeeInvoiceAdjustment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice_id: 'invoice-1',
        school_id: 'school-1',
        branch_id: 'branch-1',
        adjustment_type: 'waive',
        adjustment_amount: 25,
        adjustment_reason: 'Aid',
        previous_total_amount: 100,
        new_total_amount: 75,
        previous_balance_amount: 100,
        new_balance_amount: 75,
        created_by: 'branch-admin-1'
      }),
      { transaction }
    );
    expect(invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({ total_amount: 75, balance_amount: 75, discount_amount: 30 }),
      { transaction }
    );
    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(transaction.rollback).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('includes a waived amount in the fee invoice report discount summary', async () => {
    const transaction = createTransaction();
    const invoice = {
      id: 'invoice-waiver-report',
      branch_id: 'branch-1',
      status: 'sent',
      total_amount: '100.00',
      balance_amount: '100.00',
      discount_amount: '5.00',
      update: jest.fn().mockResolvedValue(undefined)
    };
    sequelize.transaction = jest.fn().mockResolvedValue(transaction);
    FeeInvoice.findOne = jest.fn().mockResolvedValue(invoice);
    FeeInvoiceAdjustment.create = jest.fn().mockResolvedValue({ id: 'adjustment-waiver-report' });

    await adjustInvoice(
      {
        params: { id: invoice.id },
        body: { adjustment_type: 'waive', adjustment_amount: '25.00', adjustment_reason: 'Aid' },
        schoolId: 'school-1',
        user: { id: 'admin-1', role: 'admin' }
      },
      { status: jest.fn().mockReturnThis(), json: jest.fn() },
      jest.fn()
    );

    const updatedValues = invoice.update.mock.calls[0][0];
    expect(updatedValues.discount_amount).toBe(30);
    const updatedInvoice = { ...invoice, ...updatedValues };
    FeeInvoice.findAndCountAll = jest.fn().mockResolvedValue({ count: 1, rows: [updatedInvoice] });
    FeeInvoice.findAll = jest.fn().mockResolvedValue([
      {
        total_amount: updatedValues.total_amount,
        paid_amount: 0,
        discount_amount: updatedValues.discount_amount,
        balance_amount: updatedValues.balance_amount
      }
    ]);
    let payload;

    await getFeeInvoiceReport(
      { user: { role: 'admin' }, schoolId: 'school-1', query: {} },
      {
        status: () => ({
          json: body => {
            payload = body;
          }
        })
      },
      error => {
        throw error;
      }
    );

    expect(payload.data.invoices[0].discount_amount).toBe(30);
    expect(payload.data.summary.discount_amount).toBe(30);
  });

  it('does not adjust an invoice outside the branch admin assigned branch', async () => {
    const transaction = createTransaction();
    sequelize.transaction = jest.fn().mockResolvedValue(transaction);
    FeeInvoice.findOne = jest.fn().mockResolvedValue(null);
    const next = jest.fn();

    await adjustInvoice(
      {
        params: { id: 'invoice-2' },
        body: { adjustment_type: 'waive', adjustment_amount: 25, adjustment_reason: 'Aid' },
        schoolId: 'school-1',
        user: { id: 'branch-admin-1', role: 'branch_admin', branch_id: 'branch-1' }
      },
      {},
      next
    );

    expect(FeeInvoice.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'invoice-2', school_id: 'school-1', branch_id: 'branch-1' }
      })
    );
    expect(FeeInvoiceAdjustment.create).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });

  it('reopens a paid invoice consistently when fees are added', async () => {
    const transaction = createTransaction();
    const invoice = {
      id: 'invoice-paid',
      branch_id: 'branch-1',
      status: 'paid',
      total_amount: '100.00',
      paid_amount: '100.00',
      balance_amount: '0.00',
      discount_amount: '0.00',
      update: jest.fn().mockResolvedValue(undefined)
    };
    sequelize.transaction = jest.fn().mockResolvedValue(transaction);
    FeeInvoice.findOne = jest.fn().mockResolvedValue(invoice);
    FeeInvoiceAdjustment.create = jest.fn().mockResolvedValue({ id: 'adjustment-2' });

    await adjustInvoice(
      {
        params: { id: invoice.id },
        body: {
          adjustment_type: 'add',
          adjustment_amount: '25.00',
          adjustment_reason: 'Lab materials'
        },
        schoolId: 'school-1',
        user: { id: 'admin-1', role: 'admin' }
      },
      { status: jest.fn().mockReturnThis(), json: jest.fn() },
      jest.fn()
    );

    expect(invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        total_amount: 125,
        balance_amount: 25,
        status: 'partial_paid',
        payment_status: 'partial'
      }),
      { transaction }
    );
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  it('fails closed when a branch admin has no assigned branch', async () => {
    FeeInvoice.findOne = jest.fn();
    const next = jest.fn();

    await adjustInvoice(
      {
        params: { id: 'invoice-2' },
        body: { adjustment_type: 'waive', adjustment_amount: 25, adjustment_reason: 'Aid' },
        schoolId: 'school-1',
        user: { id: 'branch-admin-1', role: 'branch_admin' }
      },
      {},
      next
    );

    expect(FeeInvoice.findOne).not.toHaveBeenCalled();
    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Branch access is not configured for this account'
      })
    );
  });

  it.each([
    ['not-a-number', 'Aid'],
    ['1.001', 'Aid'],
    ['10.00', '   '],
    ['10.00', 'r'.repeat(501)]
  ])('rejects invalid adjustment amount/reason (%s)', async (amount, reason) => {
    FeeInvoice.findOne = jest.fn();
    const next = jest.fn();

    await adjustInvoice(
      {
        params: { id: 'invoice-1' },
        body: { adjustment_type: 'waive', adjustment_amount: amount, adjustment_reason: reason },
        schoolId: 'school-1',
        user: { id: 'admin-1', role: 'admin' }
      },
      {},
      next
    );

    expect(FeeInvoice.findOne).not.toHaveBeenCalled();
    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('rolls invoice changes and adjustment creation back together on failure', async () => {
    const transaction = createTransaction();
    const invoice = {
      id: 'invoice-1',
      branch_id: 'branch-1',
      status: 'sent',
      total_amount: '100.00',
      balance_amount: '100.00',
      discount_amount: '0.00',
      update: jest.fn().mockRejectedValue(new Error('write failed'))
    };
    sequelize.transaction = jest.fn().mockResolvedValue(transaction);
    FeeInvoice.findOne = jest.fn().mockResolvedValue(invoice);
    FeeInvoiceAdjustment.create = jest.fn().mockResolvedValue({ id: 'adjustment-1' });
    const next = jest.fn();

    await adjustInvoice(
      {
        params: { id: 'invoice-1' },
        body: { adjustment_type: 'waive', adjustment_amount: 25, adjustment_reason: 'Aid' },
        schoolId: 'school-1',
        user: { id: 'admin-1', role: 'admin' }
      },
      {},
      next
    );

    expect(FeeInvoiceAdjustment.create).toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'write failed' }));
  });

  it('returns only adjustment history for the branch admin assigned branch', async () => {
    FeeInvoice.findOne = jest.fn().mockResolvedValue({ id: 'invoice-1' });
    FeeInvoiceAdjustment.findAll = jest.fn().mockResolvedValue([]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getInvoiceAdjustments(
      {
        params: { id: 'invoice-1' },
        schoolId: 'school-1',
        user: { role: 'branch_admin', branch_id: 'branch-1' }
      },
      res,
      jest.fn()
    );

    expect(FeeInvoice.findOne).toHaveBeenCalledWith({
      where: { id: 'invoice-1', school_id: 'school-1', branch_id: 'branch-1' },
      attributes: ['id']
    });
    expect(FeeInvoiceAdjustment.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { invoice_id: 'invoice-1', school_id: 'school-1', branch_id: 'branch-1' }
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
