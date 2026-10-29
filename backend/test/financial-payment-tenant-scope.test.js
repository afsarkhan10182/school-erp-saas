require('module-alias/register');

jest.mock('../src/models', () => ({
  FeeInvoice: { findOne: jest.fn() },
  FeeStructure: {},
  FeeType: {},
  Student: {},
  Parent: {},
  School: {},
  FeePayment: { create: jest.fn() },
  Branch: {},
  Class: {}
}));
jest.mock('../src/config/database', () => ({
  sequelize: { transaction: jest.fn() }
}));
jest.mock('../src/controllers/financial/core.controller', () => ({
  generateUniqueReceiptNumber: jest.fn(),
  getClassCode: jest.fn()
}));

const { FeeInvoice, FeePayment } = require('../src/models');
const { sequelize } = require('../src/config/database');
const { recordPayment } = require('../src/controllers/financial/payment.controller');

describe('recordPayment tenant scope', () => {
  it('does not find or create a payment for an invoice outside the active school', async () => {
    const transaction = {
      LOCK: { UPDATE: 'UPDATE' },
      finished: null,
      rollback: jest.fn(async () => { transaction.finished = 'rollback'; })
    };
    sequelize.transaction.mockResolvedValue(transaction);
    FeeInvoice.findOne.mockResolvedValue(null);

    const next = jest.fn();
    await recordPayment(
      {
        params: { id: 'other-school-invoice' },
        body: { amount: 100 },
        schoolId: 'active-school',
        user: { id: 'accountant-1', role: 'accountant' }
      },
      { status: jest.fn().mockReturnThis(), json: jest.fn() },
      next
    );

    expect(FeeInvoice.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'other-school-invoice', school_id: 'active-school' },
      transaction
    }));
    expect(FeePayment.create).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});
