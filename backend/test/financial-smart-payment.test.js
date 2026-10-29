require('module-alias/register');

jest.mock('../src/models', () => ({
  FeeInvoice: { findAll: jest.fn(), count: jest.fn(), sum: jest.fn() },
  FeeStructure: {},
  FeeType: {},
  Student: { findOne: jest.fn(), findAll: jest.fn() },
  Parent: {},
  School: { findByPk: jest.fn() },
  FeePayment: { create: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() },
  Branch: { findByPk: jest.fn() },
  Class: { findOne: jest.fn() },
  Stream: {},
  sequelize: { transaction: jest.fn() }
}));
jest.mock('../src/models/administration/branch.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/controllers/financial/receipts', () => ({
  generateCombinedReceipt: jest
    .fn()
    .mockResolvedValue({ receipt_number: 'RCP-TEST', receipt_data: {} })
}));
jest.mock('../src/controllers/financial/core.controller', () => ({
  getClassCode: jest.fn().mockResolvedValue('C1'),
  generateUniqueReceiptNumber: jest.fn().mockResolvedValue({ receipt_number: 'RCP-TEST' })
}));
jest.mock('../src/utils/academic/academicYearUtils', () => ({
  getAvailablePaymentMonths: jest.fn(),
  getEarliestPendingMonth: jest.fn(),
  getMonthName: jest.fn(),
  getCurrentAcademicYearForSchool: jest.fn().mockResolvedValue({ name: '2026-2027' })
}));

const { FeeInvoice, Student, School, FeePayment, Branch, Class, sequelize } = require('../src/models');
const BranchModel = require('../src/models/administration/branch.model');
const {
  recordSmartPayment,
  getStudentDues,
  searchStudentsForFees
} = require('../src/controllers/financial/student.controller');
const {
  calculatePaidMonths,
  calculateMonthlyOutstandingBalance
} = require('../src/services/financial/receipt.service');

const makeInvoice = (month, invoiceNumber = `INV-${month}`) => {
  const invoice = {
    id: `invoice-${month}`,
    invoice_number: invoiceNumber,
    student_id: 'student-1',
    fee_structure_id: 'structure-1',
    academic_year: '2026-2027',
    payment_model: 'monthly',
    month,
    year: 2026,
    total_amount: '2500.00',
    paid_amount: '0.00',
    balance_amount: '2500.00',
    status: 'overdue',
    branch_id: 'branch-1',
    receipt_number: null,
    feeStructure: {
      payment_model: 'monthly',
      monthly_payment_amount: '2500.00',
      total_months: 12,
      feeType: { name: 'Tuition' }
    },
    update: jest.fn(async values => Object.assign(invoice, values))
  };
  return invoice;
};

const invokePayment = async (
  amount,
  invoices,
  createPayment,
  idempotencyKey,
  paymentOptions = {},
  user = { id: 'accountant-1', role: 'accountant' }
) => {
  const transaction = {
    LOCK: { UPDATE: 'UPDATE' },
    finished: null,
    commit: jest.fn(async () => {
      transaction.finished = 'commit';
    }),
    rollback: jest.fn(async () => {
      transaction.finished = 'rollback';
    })
  };
  sequelize.transaction.mockResolvedValue(transaction);
  FeeInvoice.findAll.mockResolvedValue(invoices);
  FeeInvoice.count.mockResolvedValue(invoices.length);
  FeeInvoice.sum.mockImplementation(async (_field, options) =>
    invoices.reduce((sum, invoice) => sum + Number(invoice.balance_amount), 0)
  );
  FeePayment.findAll.mockResolvedValue([]);
  Student.findOne.mockResolvedValue({
    id: 'student-1',
    first_name: 'Alex',
    last_name: 'Demo',
    current_class: 'Class 1',
    admission_number: 'DEMO-001',
    branch_id: 'branch-1'
  });
  School.findByPk.mockResolvedValue({ id: 'school-1', name: 'Demo School', receipt_settings: {} });
  Branch.findByPk.mockResolvedValue({ id: 'branch-1', name: 'Main Branch', code: 'MAIN' });
  FeePayment.create.mockImplementation(
    createPayment ||
      (async values => ({
        id: `payment-${FeePayment.create.mock.calls.length}`,
        ...values
      }))
  );
  FeePayment.findByPk.mockImplementation(async id => ({
    update: jest.fn().mockResolvedValue({ id })
  }));

  let response;
  const next = jest.fn();
  await recordSmartPayment(
    {
      body: {
        student_id: 'student-1',
        payment_amount: amount,
        ...paymentOptions,
        ...(idempotencyKey && { idempotency_key: idempotencyKey })
      },
      schoolId: 'school-1',
      branchId: 'branch-1',
      user
    },
    {
      status: code => ({
        json: payload => {
          response = { code, payload };
        }
      })
    },
    next
  );
  return { response, next, transaction };
};

beforeEach(() => {
  jest.clearAllMocks();
  BranchModel.findOne.mockImplementation(async ({ where }) => ({ ...where }));
});

describe('smart monthly fee payment allocation', () => {
  it('accepts a partial payment smaller than one monthly invoice', async () => {
    const invoice = makeInvoice(10);
    const { response, next, transaction } = await invokePayment(1000, [invoice]);

    expect(next).not.toHaveBeenCalled();
    expect(FeePayment.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_amount: 1000 }),
      expect.objectContaining({ transaction: expect.any(Object) })
    );
    expect(invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        paid_amount: 1000,
        balance_amount: 1500,
        status: 'partial_paid'
      }),
      expect.objectContaining({ transaction: expect.any(Object) })
    );
    expect(response.payload.data.total_applied_amount).toBe(1000);
    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(FeeInvoice.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        lock: expect.objectContaining({ level: 'UPDATE', of: FeeInvoice }),
        transaction
      })
    );
  });

  it('allocates a payment remainder to the next monthly invoice', async () => {
    const first = makeInvoice(10);
    const second = makeInvoice(11);
    const { response, next, transaction } = await invokePayment(3000, [first, second]);

    expect(next).not.toHaveBeenCalled();
    expect(FeePayment.create.mock.calls.map(([payment]) => payment.payment_amount)).toEqual([
      2500, 500
    ]);
    expect(response.payload.data.total_applied_amount).toBe(3000);
    expect(response.payload.data.remaining_amount).toBe(0);
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  it('rejects a payment greater than selected outstanding invoices before writing', async () => {
    const invoice = makeInvoice(10);
    const { next, transaction } = await invokePayment(2501, [invoice]);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(FeePayment.create).not.toHaveBeenCalled();
    expect(invoice.update).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
  });

  it('allocates manual payments only to the explicitly selected invoices', async () => {
    const unselected = makeInvoice(10);
    const selected = makeInvoice(11);
    const { next, transaction } = await invokePayment(
      1000,
      [unselected, selected],
      undefined,
      undefined,
      { payment_mode: 'manual', selected_invoice_ids: [selected.id] }
    );

    expect(next).not.toHaveBeenCalled();
    expect(unselected.update).not.toHaveBeenCalled();
    expect(selected.update).toHaveBeenCalledWith(
      expect.objectContaining({
        paid_amount: 1000,
        balance_amount: 1500
      }),
      expect.objectContaining({ transaction })
    );
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  it('rejects manual mode with no selected invoice instead of falling back to automatic allocation', async () => {
    const invoice = makeInvoice(10);
    const { next, transaction } = await invokePayment(1000, [invoice], undefined, undefined, {
      payment_mode: 'manual',
      selected_invoice_ids: []
    });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(FeePayment.create).not.toHaveBeenCalled();
    expect(invoice.update).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
  });

  it('rolls back all invoice writes if a later allocation fails', async () => {
    const first = makeInvoice(10);
    const second = makeInvoice(11);
    const createPayment = jest
      .fn()
      .mockResolvedValueOnce({ id: 'payment-first' })
      .mockRejectedValueOnce(new Error('payment insert failed'));
    const { next, transaction } = await invokePayment(3000, [first, second], createPayment);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
  });

  it('persists a retry key and the original response with smart-payment records', async () => {
    const invoice = makeInvoice(10);
    const key = 'smart-payment-retry-001';
    const { response, next } = await invokePayment(1000, [invoice], undefined, key);

    expect(next).not.toHaveBeenCalled();
    expect(FeePayment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotency_key: key,
        idempotency_request_hash: expect.stringMatching(/^[a-f0-9]{64}$/)
      }),
      expect.objectContaining({ transaction: expect.any(Object) })
    );
    const firstPayment = await FeePayment.findByPk.mock.results[0].value;
    expect(firstPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotency_response: expect.objectContaining({
          total_applied_amount: 1000,
          receipt_number: 'RCP-TEST'
        })
      }),
      expect.objectContaining({ transaction: expect.any(Object) })
    );
    expect(response.payload.data.total_applied_amount).toBe(1000);
  });

  it('does not count a partially paid monthly invoice as a fully paid month', async () => {
    FeeInvoice.findAll.mockResolvedValue([]);

    const paidMonths = await calculatePaidMonths('student-1', 'structure-1', '2026-2027', {
      payment_model: 'monthly',
      month: 10,
      year: 2026,
      status: 'partial_paid',
      balance_amount: 1500
    });

    expect(FeeInvoice.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'paid' })
      })
    );
    expect(paidMonths).toBe(0);
  });

  it('reports annual monthly-fee balance after subtracting partial payments', async () => {
    FeeInvoice.sum.mockResolvedValue('1000.00');

    const balance = await calculateMonthlyOutstandingBalance(
      'student-1',
      'structure-1',
      '2026-2027',
      12,
      2500,
      'school-1'
    );

    expect(FeeInvoice.sum).toHaveBeenCalledWith(
      'paid_amount',
      expect.objectContaining({
        where: expect.objectContaining({ school_id: 'school-1', payment_model: 'monthly' })
      })
    );
    expect(balance).toBe(29000);
  });

  it('keeps partially paid monthly invoices in pending dues, not paid-month totals', async () => {
    Student.findOne.mockResolvedValue({
      id: 'student-1',
      first_name: 'Alex',
      last_name: 'Demo',
      admission_number: 'DEMO-001',
      current_class: 'Class 1',
      section: 'A'
    });
    FeeInvoice.findAll.mockResolvedValue([
      {
        id: 'invoice-10',
        invoice_number: 'INV-10',
        student_id: 'student-1',
        total_amount: '2500',
        paid_amount: '1000',
        balance_amount: '1500',
        status: 'partial_paid',
        receipt_number: 'RCP-10',
        month: 10,
        year: 2026,
        academic_year: '2026-2027',
        due_date: '2026-10-14',
        last_payment_date: '2026-10-23',
        feeStructure: { payment_model: 'monthly', name: 'Tuition', feeType: { name: 'Tuition' } }
      }
    ]);

    let response;
    const next = jest.fn();
    await getStudentDues(
      { query: { student_id: 'student-1' }, schoolId: 'school-1', user: { role: 'accountant' } },
      {
        status: code => ({
          json: payload => {
            response = { code, payload };
          }
        })
      },
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(response.payload.data.summary).toMatchObject({
      total_dues: 1500,
      paid_months_count: 0,
      pending_months_count: 1
    });
    expect(response.payload.data.monthly_payments).toHaveLength(2);
    expect(response.payload.data.selectable_invoices).toEqual([
      expect.objectContaining({ id: 'invoice-10', balance_amount: 1500, payment_model: 'monthly' })
    ]);
  });

  it('pins an assigned Accountant dues lookup to their branch despite a forged branch query', async () => {
    Student.findOne.mockResolvedValue({ id: 'student-1', branch_id: 'branch-1' });
    FeeInvoice.findAll.mockResolvedValue([]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getStudentDues({
      query: { student_id: 'student-1', branch_id: 'branch-2' },
      schoolId: 'school-1',
      user: { role: 'accountant', branch_id: 'branch-1' }
    }, res, jest.fn());

    expect(Student.findOne.mock.calls[0][0].where).toEqual({
      id: 'student-1', school_id: 'school-1', branch_id: 'branch-1'
    });
    expect(FeeInvoice.findAll.mock.calls[0][0].where).toMatchObject({
      student_id: 'student-1', school_id: 'school-1', branch_id: 'branch-1'
    });
  });

  it('honors a School Admin selected branch on quick-collection student search', async () => {
    Student.findAll.mockResolvedValue([]);
    const res = { json: jest.fn() };

    await searchStudentsForFees({
      query: { search: 'Sarah', branch_id: 'branch-2' },
      schoolId: 'school-1',
      user: { role: 'admin', school_id: 'school-1' }
    }, res, jest.fn());

    expect(Student.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-2'
    });
  });

  it('pins smart-payment student and invoice queries to an assigned Accountant branch', async () => {
    const invoice = makeInvoice(10);
    const { response, next } = await invokePayment(
      1000,
      [invoice],
      null,
      null,
      { branch_id: 'branch-2' },
      { id: 'accountant-1', role: 'accountant', branch_id: 'branch-1' }
    );

    expect(next).not.toHaveBeenCalled();
    expect(Student.findOne.mock.calls[0][0].where).toEqual({
      id: 'student-1', school_id: 'school-1', branch_id: 'branch-1'
    });
    expect(FeeInvoice.findAll.mock.calls[0][0].where).toMatchObject({
      student_id: 'student-1', school_id: 'school-1', branch_id: 'branch-1'
    });
    expect(response.payload.success).toBe(true);
  });
});
