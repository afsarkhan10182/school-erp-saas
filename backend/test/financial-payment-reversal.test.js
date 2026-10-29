require('module-alias/register');

jest.mock('../src/models', () => ({
  FeeInvoice: { findOne: jest.fn() },
  FeePayment: { findOne: jest.fn() }
}));
jest.mock('../src/config/database', () => ({
  sequelize: { transaction: jest.fn() }
}));

const { FeeInvoice, FeePayment } = require('../src/models');
const { sequelize } = require('../src/config/database');
const { reversePayment } = require('../src/controllers/financial/payment.controller');

const makeTransaction = () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' }, finished: null };
  transaction.commit = jest.fn(async () => { transaction.finished = 'commit'; });
  transaction.rollback = jest.fn(async () => { transaction.finished = 'rollback'; });
  return transaction;
};

describe('reversePayment', () => {
  let transaction;

  beforeEach(() => {
    jest.clearAllMocks();
    transaction = makeTransaction();
    sequelize.transaction.mockResolvedValue(transaction);
  });

  it('reverses a completed payment atomically and restores invoice balance', async () => {
    const payment = {
      id: 'payment-1',
      invoice_id: 'invoice-1',
      receipt_number: 'RCP-1',
      payment_amount: '2500.00',
      payment_status: 'completed',
      update: jest.fn(async function (values) { Object.assign(this, values); })
    };
    const invoice = {
      id: 'invoice-1',
      paid_amount: '2500.00',
      total_amount: '8500.00',
      due_date: '2026-11-01',
      status: 'paid',
      receipt_number: 'RCP-1',
      update: jest.fn()
    };
    FeePayment.findOne.mockResolvedValueOnce(payment).mockResolvedValueOnce(null);
    FeeInvoice.findOne.mockResolvedValue(invoice);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await reversePayment({
      params: { paymentId: 'payment-1' },
      body: { reason: 'Duplicate counter entry' },
      schoolId: 'school-1',
      user: { id: 'admin-1', role: 'admin' }
    }, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(payment.update).toHaveBeenCalledWith(expect.objectContaining({
      payment_status: 'reversed',
      reversal_reason: 'Duplicate counter entry',
      reversed_by: 'admin-1'
    }), { transaction });
    expect(invoice.update).toHaveBeenCalledWith(expect.objectContaining({
      paid_amount: 0,
      balance_amount: 8500,
      status: 'sent',
      payment_status: 'pending',
      receipt_number: null
    }), { transaction });
    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects staff roles before opening a transaction', async () => {
    const next = jest.fn();
    await reversePayment({
      params: { paymentId: 'payment-1' },
      body: { reason: 'mistake' },
      schoolId: 'school-1',
      user: { id: 'accountant-1', role: 'accountant' }
    }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('requires a reason and prevents a second reversal', async () => {
    const nextWithoutReason = jest.fn();
    await reversePayment({
      params: { paymentId: 'payment-1' }, body: { reason: '  ' }, schoolId: 'school-1',
      user: { id: 'admin-1', role: 'admin' }
    }, {}, nextWithoutReason);
    expect(nextWithoutReason).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(sequelize.transaction).not.toHaveBeenCalled();

    sequelize.transaction.mockResolvedValueOnce(transaction);
    FeePayment.findOne.mockResolvedValueOnce({ payment_status: 'reversed' });
    const nextRepeated = jest.fn();
    await reversePayment({
      params: { paymentId: 'payment-1' }, body: { reason: 'again' }, schoolId: 'school-1',
      user: { id: 'admin-1', role: 'admin' }
    }, {}, nextRepeated);
    expect(nextRepeated).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
  });
});
