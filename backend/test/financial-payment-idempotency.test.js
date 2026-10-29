require('module-alias/register');

jest.mock('../src/models', () => ({
  FeeInvoice: { findOne: jest.fn(), findAll: jest.fn() },
  FeeStructure: {},
  FeeType: {},
  Student: { findOne: jest.fn() },
  Parent: {},
  School: {},
  FeePayment: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
  Branch: {},
  Class: {},
  sequelize: { transaction: jest.fn() }
}));
jest.mock('../src/models/administration/branch.model', () => ({
  findOne: jest.fn().mockResolvedValue({ id: 'branch-1', school_id: 'school-1', status: 'active' })
}));
jest.mock('../src/config/database', () => ({ sequelize: { transaction: jest.fn() } }));
jest.mock('../src/controllers/financial/core.controller', () => ({
  generateUniqueReceiptNumber: jest.fn(),
  getClassCode: jest.fn()
}));
jest.mock('../src/controllers/financial/receipts', () => ({ generateCombinedReceipt: jest.fn() }));

const { FeeInvoice, FeePayment, Student, sequelize } = require('../src/models');
const { sequelize: databaseSequelize } = require('../src/config/database');
const { getPaymentIdempotency } = require('../src/utils/financial/paymentIdempotency');
const { recordPayment } = require('../src/controllers/financial/payment.controller');
const { recordSmartPayment } = require('../src/controllers/financial/student.controller');
const { recordFlexibleInstallmentPayment } = require('../src/controllers/financial/advanced-payments');

const request = (body, params = {}) => ({
  body,
  params,
  schoolId: 'school-1',
  branchId: 'branch-1',
  user: { id: 'accountant-1', role: 'accountant' }
});

const setupTransaction = () => {
  const transaction = {
    LOCK: { UPDATE: 'UPDATE' },
    finished: null,
    commit: jest.fn(async () => { transaction.finished = 'commit'; }),
    rollback: jest.fn(async () => { transaction.finished = 'rollback'; })
  };
  sequelize.transaction.mockResolvedValue(transaction);
  databaseSequelize.transaction.mockResolvedValue(transaction);
  return transaction;
};

const response = () => {
  const result = {};
  result.status = jest.fn(code => { result.statusCode = code; return result; });
  result.json = jest.fn(payload => { result.payload = payload; return result; });
  return result;
};

const idempotentPayment = (body, extra = {}) => ({
  id: 'payment-1',
  idempotency_key: body.idempotency_key,
  idempotency_request_hash: getPaymentIdempotency({ body }).fingerprint,
  idempotency_response: { payment_id: 'payment-1', receipt_number: 'RCP-1' },
  ...extra
});

beforeEach(() => jest.clearAllMocks());

describe('payment idempotent retries', () => {
  it('replays the single-invoice response without creating a second payment', async () => {
    const body = { amount: 500, payment_method: 'cash', idempotency_key: 'retry-key-0001' };
    const transaction = setupTransaction();
    const invoice = { id: 'invoice-1', reload: jest.fn().mockResolvedValue(undefined) };
    FeeInvoice.findOne.mockResolvedValue(invoice);
    FeePayment.findOne.mockResolvedValue(idempotentPayment(body));
    const res = response();
    const next = jest.fn();

    await recordPayment(request(body, { id: 'invoice-1' }), res, next);

    expect(FeeInvoice.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'invoice-1', school_id: 'school-1' }, transaction
    }));
    expect(FeePayment.create).not.toHaveBeenCalled();
    expect(res.payload.data.payment_id).toBe('payment-1');
    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects reuse of a key with changed payment details', async () => {
    const body = { amount: 501, payment_method: 'cash', idempotency_key: 'retry-key-0001' };
    const transaction = setupTransaction();
    FeeInvoice.findOne.mockResolvedValue({ id: 'invoice-1', reload: jest.fn() });
    FeePayment.findOne.mockResolvedValue(idempotentPayment({ ...body, amount: 500 }));
    const next = jest.fn();

    await recordPayment(request(body, { id: 'invoice-1' }), response(), next);

    expect(FeePayment.create).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
  });

  it('replays a multi-invoice smart payment before recalculating pending invoices', async () => {
    const body = { student_id: 'student-1', payment_amount: 500, idempotency_key: 'retry-key-0002' };
    const transaction = setupTransaction();
    Student.findOne.mockResolvedValue({ id: 'student-1' });
    FeePayment.findAll.mockResolvedValue([idempotentPayment(body)]);
    const res = response();

    await recordSmartPayment(request(body), res, jest.fn());

    expect(Student.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'student-1', school_id: 'school-1', branch_id: 'branch-1' },
      lock: transaction.LOCK.UPDATE
    }));
    expect(FeeInvoice.findAll).not.toHaveBeenCalled();
    expect(res.payload.data.payment_id).toBe('payment-1');
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  it('rejects changed details when retrying a smart payment key', async () => {
    const body = { student_id: 'student-1', payment_amount: 500, idempotency_key: 'retry-key-0002' };
    const transaction = setupTransaction();
    Student.findOne.mockResolvedValue({ id: 'student-1' });
    FeePayment.findAll.mockResolvedValue([idempotentPayment({ ...body, payment_amount: 450 })]);
    const next = jest.fn();

    await recordSmartPayment(request(body), response(), next);

    expect(FeeInvoice.findAll).not.toHaveBeenCalled();
    expect(FeePayment.create).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
  });

  it('replays a flexible-installment payment before changing the invoice', async () => {
    const body = { invoice_id: 'invoice-1', payment_amount: 500, idempotency_key: 'retry-key-0003' };
    const transaction = setupTransaction();
    const invoice = { id: 'invoice-1', status: 'partial_paid', update: jest.fn() };
    FeeInvoice.findOne.mockResolvedValue(invoice);
    FeePayment.findOne.mockResolvedValue(idempotentPayment(body));
    const res = response();

    await recordFlexibleInstallmentPayment(request(body), res, jest.fn());

    expect(FeeInvoice.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'invoice-1', school_id: 'school-1' }, transaction
    }));
    expect(FeePayment.create).not.toHaveBeenCalled();
    expect(invoice.update).not.toHaveBeenCalled();
    expect(res.payload.data.payment_id).toBe('payment-1');
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  it('rejects changed details when retrying a flexible-installment key', async () => {
    const body = { invoice_id: 'invoice-1', payment_amount: 500, idempotency_key: 'retry-key-0003' };
    const transaction = setupTransaction();
    const invoice = { id: 'invoice-1', status: 'partial_paid', update: jest.fn() };
    FeeInvoice.findOne.mockResolvedValue(invoice);
    FeePayment.findOne.mockResolvedValue(idempotentPayment({ ...body, payment_amount: 450 }));
    const next = jest.fn();

    await recordFlexibleInstallmentPayment(request(body), response(), next);

    expect(FeePayment.create).not.toHaveBeenCalled();
    expect(invoice.update).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
  });
});
