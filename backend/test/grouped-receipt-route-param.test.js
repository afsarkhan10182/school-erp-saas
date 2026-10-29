require('module-alias/register');

jest.mock('../src/models', () => ({
  FeeInvoice: { findAll: jest.fn() },
  FeeStructure: {},
  FeeType: {},
  Student: {},
  Parent: {},
  School: { findByPk: jest.fn() },
  FeePayment: {},
  Branch: {},
  Class: {}
}));
jest.mock('../src/services/financial/receipt.service', () => ({
  generateInstallmentReceipt: jest.fn()
}));
jest.mock('../src/controllers/financial/core.controller', () => ({
  generateUniqueInvoiceNumber: jest.fn(),
  getClassCode: jest.fn()
}));

const { FeeInvoice } = require('../src/models');
const { getCombinedReceiptByGroupId } = require('../src/controllers/financial/receipts');

describe('getCombinedReceiptByGroupId route parameter', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses the route group ID and scopes Branch Admin to its branch', async () => {
    const branch = { id: 'branch-2', name: 'Second Branch', code: 'SECOND' };
    const student = {
      first_name: 'Riya',
      last_name: 'Demo',
      current_class: 'Class 2',
      section: 'A',
      admission_number: 'DEMO-SECOND-001'
    };
    FeeInvoice.findAll.mockResolvedValue([{
      branch,
      student,
      payments: [{ receipt_data: { receipt_number: 'GROUP-SECOND-001' } }]
    }]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await getCombinedReceiptByGroupId(
      {
        params: { receiptGroupId: 'GROUP-SECOND-001' },
        schoolId: 'school-1',
        user: { role: 'branch_admin', branch_id: 'branch-2' }
      },
      res,
      next
    );

    expect(FeeInvoice.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        receipt_number: 'GROUP-SECOND-001',
        school_id: 'school-1',
        branch_id: 'branch-2'
      }
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        receipt_number: 'GROUP-SECOND-001',
        branch_name: 'Second Branch',
        student_name: 'Riya Demo'
      })
    }));
    expect(next).not.toHaveBeenCalled();
  });
});
