require('module-alias/register');

jest.mock('../src/models', () => ({
  FeeInvoice: {},
  FeeStructure: {},
  FeeType: {},
  Student: {},
  Parent: {},
  School: {},
  FeePayment: { findAll: jest.fn() },
  Branch: {},
  Class: {}
}));
jest.mock('../src/services/financial/receipt.service', () => ({
  generateInstallmentReceipt: jest.fn(),
  generateCombinedReceiptData: jest.fn(),
  generateReceiptData: jest.fn()
}));
jest.mock('../src/controllers/financial/core.controller', () => ({
  generateUniqueInvoiceNumber: jest.fn(),
  getClassCode: jest.fn()
}));

const { FeePayment } = require('../src/models');
const {
  getReceiptByNumber,
  getReceiptsReport,
  getCombinedReceiptData
} = require('../src/controllers/financial/receipts');

const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('getReceiptByNumber branch scope', () => {
  beforeEach(() => jest.clearAllMocks());

  it('restricts Branch Admin receipt lookups to their assigned invoice branch', async () => {
    FeePayment.findAll.mockResolvedValue([]);
    const res = response();
    const next = jest.fn();

    await getReceiptByNumber(
      {
        params: { receiptNumber: 'RCP-SECOND-001' },
        schoolId: 'school-1',
        user: { role: 'branch_admin', branch_id: 'branch-2' }
      },
      res,
      next
    );

    expect(FeePayment.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        receipt_number: 'RCP-SECOND-001',
        school_id: 'school-1'
      }
    }));
    expect(FeePayment.findAll.mock.calls[0][0].include[0].where).toEqual({ branch_id: 'branch-2' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('keeps school-scoped lookup behavior for non-Branch-Admin finance roles', async () => {
    FeePayment.findAll.mockResolvedValue([{ receipt_data: { receipt_number: 'RCP-MAIN-001' } }]);
    const res = response();

    await getReceiptByNumber(
      {
        params: { receiptNumber: 'RCP-MAIN-001' },
        schoolId: 'school-1',
        user: { role: 'accountant' }
      },
      res,
      jest.fn()
    );

    expect(FeePayment.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { receipt_number: 'RCP-MAIN-001', school_id: 'school-1' }
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { receipt_number: 'RCP-MAIN-001' }
    });
  });
});

describe('getCombinedReceiptData branch scope', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns not found when a Branch Admin cannot see any requested payment', async () => {
    FeePayment.findAll.mockResolvedValue([]);
    const next = jest.fn();

    await getCombinedReceiptData(
      {
        body: { paymentIds: ['main-branch-payment'] },
        schoolId: 'school-1',
        user: { role: 'branch_admin', branch_id: 'branch-second' }
      },
      response(),
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      message: 'No payments found'
    }));
  });
});

describe('getReceiptsReport branch scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    FeePayment.findAll.mockResolvedValue([]);
  });

  it('filters a School Admin receipt report by the invoice branch, not current student branch', async () => {
    const res = response();

    await getReceiptsReport(
      {
        query: { branch_id: 'branch-second' },
        schoolId: 'school-1',
        user: { role: 'admin', branch_id: 'branch-main' }
      },
      res,
      jest.fn()
    );

    const options = FeePayment.findAll.mock.calls[0][0];
    expect(options.where).toEqual({
      school_id: 'school-1',
      payment_status: 'completed'
    });
    expect(options.include[0].where).toMatchObject({ branch_id: 'branch-second' });
    expect(options.include[0].include).toContainEqual(expect.objectContaining({
      model: require('../src/models').Branch,
      as: 'branch',
      attributes: ['id', 'name', 'code']
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('keeps Branch Admin invoice and student data pinned despite a forged branch filter', async () => {
    const res = response();

    await getReceiptsReport(
      {
        query: { branch_id: 'branch-main' },
        schoolId: 'school-1',
        user: { role: 'branch_admin', branch_id: 'branch-second' }
      },
      res,
      jest.fn()
    );

    const options = FeePayment.findAll.mock.calls[0][0];
    expect(options.where).toEqual({
      school_id: 'school-1',
      payment_status: 'completed'
    });
    expect(options.include[0].where).toMatchObject({ branch_id: 'branch-second' });
    expect(options.include[0].include[0].where).not.toHaveProperty('branch_id');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('labels a historical receipt with its invoice branch after the student transfers', async () => {
    FeePayment.findAll.mockResolvedValue([
      {
        id: 'payment-1',
        receipt_number: 'RCP-1',
        payment_date: '2026-10-27',
        payment_amount: '1250.00',
        payment_method: 'cash',
        invoice: {
          id: 'invoice-1',
          invoice_number: 'INV-1',
          branch: { name: 'Second Branch' },
          student: {
            id: 'student-1',
            first_name: 'Riya',
            last_name: 'Demo',
            branch: { name: 'Main Branch' }
          },
          feeStructure: { feeType: { name: 'Tuition' } }
        }
      }
    ]);
    const res = response();

    await getReceiptsReport(
      {
        query: { branch_id: 'branch-second' },
        schoolId: 'school-1',
        user: { role: 'admin' }
      },
      res,
      jest.fn()
    );

    expect(res.json.mock.calls[0][0].data.payments[0].branch).toBe('Second Branch');
  });
});
