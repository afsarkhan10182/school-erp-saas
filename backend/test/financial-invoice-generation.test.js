require('module-alias/register');
const { Branch, Class, FeeInvoice, FeeStructure, School, Student } = require('../src/models');
const { Op } = require('sequelize');
const { sequelize } = require('../src/config/database');
const { generateInvoices } = require('../src/controllers/financial/core.controller');

describe('invoice generation student selection', () => {
  const originalFindAll = FeeStructure.findAll;
  const originalBranchFindOne = Branch.findOne;
  const originalSchoolFindByPk = School.findByPk;
  const originalStudentFindAll = Student.findAll;
  const originalClassFindAll = Class.findAll;
  const originalInvoiceFindAll = FeeInvoice.findAll;
  const originalInvoiceCreate = FeeInvoice.create;
  const originalQuery = sequelize.query;

  afterEach(() => {
    FeeStructure.findAll = originalFindAll;
    Branch.findOne = originalBranchFindOne;
    School.findByPk = originalSchoolFindByPk;
    Student.findAll = originalStudentFindAll;
    Class.findAll = originalClassFindAll;
    FeeInvoice.findAll = originalInvoiceFindAll;
    FeeInvoice.create = originalInvoiceCreate;
    sequelize.query = originalQuery;
    jest.clearAllMocks();
  });

  it.each([[], undefined])(
    'rejects a missing/empty specific-student selection before reading fee structures',
    async studentIds => {
      FeeStructure.findAll = jest.fn();
      const next = jest.fn();

      await generateInvoices(
        {
          body: {
            payment_model: 'installment',
            fee_structure_ids: ['fee-structure-1'],
            student_selection: 'specific',
            student_ids: studentIds
          },
          schoolId: 'school-1',
          user: { role: 'admin' }
        },
        {},
        next
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Select at least one student for specific invoice generation'
        })
      );
      expect(FeeStructure.findAll).not.toHaveBeenCalled();
    }
  );

  it.each(['branch_admin', 'accountant'])(
    'keeps a %s from selecting another branch fee structure', async role => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1' });
    FeeStructure.findAll = jest.fn().mockResolvedValue([]);
    const next = jest.fn();

    await generateInvoices(
      {
        body: {
          payment_model: 'installment',
          fee_structure_ids: ['fee-structure-2'],
          branch_id: 'branch-2'
        },
        schoolId: 'school-1',
        user: { role, branch_id: 'branch-1' }
      },
      {},
      next
    );

    expect(FeeStructure.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          school_id: 'school-1',
          [Op.or]: [{ branch_id: 'branch-1' }, { branch_id: null }]
        })
      })
    );
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 })
    );
    }
  );

  it('limits students and generated branch context when using a school-wide structure', async () => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1' });
    FeeStructure.findAll = jest.fn().mockResolvedValue([
      { id: 'fee-structure-1', branch_id: null, academic_year: '2026-2027', applicable_classes: [] }
    ]);
    School.findByPk = jest.fn().mockResolvedValue({ starting_month: 6 });
    Student.findAll = jest.fn().mockResolvedValue([]);

    await generateInvoices(
      {
        body: { payment_model: 'installment', fee_structure_ids: ['fee-structure-1'], branch_id: 'branch-2' },
        schoolId: 'school-1',
        user: { role: 'accountant', branch_id: 'branch-1' }
      },
      { status: () => ({ json: jest.fn() }) },
      jest.fn()
    );

    expect(Student.findAll).toHaveBeenCalledWith({
      where: expect.objectContaining({ school_id: 'school-1', branch_id: 'branch-1' })
    });
  });

  it('generates a missing month when the student already has another monthly invoice', async () => {
    const feeStructure = {
      id: 'fee-structure-1', name: 'Tuition', branch_id: null,
      academic_year: '2026-2027', class_name: 'Class 1', applicable_classes: [],
      amount: '2500.00', monthly_payment_amount: '2500.00', fee_type_id: 'fee-type-1',
      feeType: { name: 'Tuition Fee' }, class: { code: 'C1' }
    };
    const student = {
      id: 'student-1', first_name: 'Alex', last_name: 'Demo', current_class: 'Class 1'
    };
    let response;

    FeeStructure.findAll = jest.fn().mockResolvedValue([feeStructure]);
    School.findByPk = jest.fn().mockResolvedValue({ starting_month: 6 });
    Class.findAll = jest.fn().mockResolvedValue([]);
    Student.findAll = jest.fn().mockResolvedValue([student]);
    FeeInvoice.findAll = jest.fn().mockResolvedValue([
      { student_id: 'student-1', invoice_number: 'INV-C1-10', payment_model: 'monthly', month: 10, year: 2026 }
    ]);
    sequelize.query = jest.fn().mockResolvedValue([{ invoice_count: 11 }]);
    FeeInvoice.create = jest.fn(async invoice => invoice);

    await generateInvoices(
      {
        body: {
          payment_model: 'monthly', fee_structure_ids: ['fee-structure-1'],
          student_selection: 'specific', student_ids: ['student-1'], months: [11], year: 2026
        },
        schoolId: 'school-1',
        user: { id: 'accountant-1', role: 'admin' }
      },
      { status: code => ({ json: payload => { response = { code, payload }; } }) },
      error => { if (error) throw error; }
    );

    expect(FeeInvoice.create).toHaveBeenCalledTimes(1);
    expect(FeeInvoice.create.mock.calls[0][0]).toMatchObject({
      student_id: 'student-1', payment_model: 'monthly', month: 11, year: 2026
    });
    expect(response).toMatchObject({
      code: 201,
      payload: { success: true, data: { total_generated: 1 } }
    });
  });

  it('skips a duplicate monthly period instead of creating a second invoice', async () => {
    const feeStructure = {
      id: 'fee-structure-1', name: 'Tuition', branch_id: null,
      academic_year: '2026-2027', class_name: 'Class 1', applicable_classes: [],
      amount: '2500.00', monthly_payment_amount: '2500.00', fee_type_id: 'fee-type-1',
      feeType: { name: 'Tuition Fee' }, class: { code: 'C1' }
    };

    FeeStructure.findAll = jest.fn().mockResolvedValue([feeStructure]);
    School.findByPk = jest.fn().mockResolvedValue({ starting_month: 6 });
    Class.findAll = jest.fn().mockResolvedValue([]);
    Student.findAll = jest.fn().mockResolvedValue([
      { id: 'student-1', first_name: 'Alex', last_name: 'Demo', current_class: 'Class 1' }
    ]);
    FeeInvoice.findAll = jest.fn().mockResolvedValue([
      { student_id: 'student-1', invoice_number: 'INV-C1-10', payment_model: 'monthly', month: 10, year: 2026 }
    ]);
    FeeInvoice.create = jest.fn();
    const next = jest.fn();

    await generateInvoices(
      {
        body: {
          payment_model: 'monthly', fee_structure_ids: ['fee-structure-1'],
          student_selection: 'specific', student_ids: ['student-1'], months: [10], year: 2026
        },
        schoolId: 'school-1',
        user: { id: 'accountant-1', role: 'admin' }
      },
      {},
      next
    );

    expect(FeeInvoice.create).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: expect.stringContaining('already has monthly invoices for: October 2026')
    }));
  });

  it('applies the school fixed-days policy to a one-time invoice with no structure date', async () => {
    const feeStructure = {
      id: 'fee-structure-one-time', name: 'Admission Fee', branch_id: 'branch-1',
      academic_year: '2026-2027', class_name: 'Class 1', applicable_classes: [],
      installment_type: 'one_time', due_date: null, amount: '1000.00', fee_type_id: 'fee-type-1',
      feeType: { name: 'Admission Fee' }, class: { code: 'C1' }
    };
    FeeStructure.findAll = jest.fn().mockResolvedValue([feeStructure]);
    School.findByPk = jest.fn().mockResolvedValue({
      starting_month: 6,
      fee_settings: { defaultPaymentDueDays: 20, invoiceSettings: { dueDateCalculation: 'fixed_days' } }
    });
    Class.findAll = jest.fn().mockResolvedValue([]);
    Student.findAll = jest.fn().mockResolvedValue([
      { id: 'student-1', first_name: 'Alex', last_name: 'Demo', current_class: 'Class 1' }
    ]);
    FeeInvoice.findAll = jest.fn().mockResolvedValue([]);
    sequelize.query = jest.fn().mockResolvedValue([{ invoice_count: 1 }]);
    FeeInvoice.create = jest.fn(async invoice => invoice);
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const now = new Date('2026-01-10T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    try {
      await generateInvoices(
        {
          body: { payment_model: 'installment', fee_structure_ids: [feeStructure.id], student_ids: ['student-1'] },
          schoolId: 'school-1',
          user: { id: 'admin-1', role: 'admin' }
        },
        response,
        error => { if (error) throw error; }
      );
    } finally {
      jest.useRealTimers();
    }

    expect(FeeInvoice.create).toHaveBeenCalledWith(expect.objectContaining({ due_date: '2026-01-30' }));
    expect(response.status).toHaveBeenCalledWith(201);
  });

  it('does not replace an absent one-time due date with a stale model default', async () => {
    const structure = {
      payment_model: 'installment', installment_type: 'one_time', due_date: null,
      installment_amounts: [], installment_due_dates: []
    };

    await FeeStructure.runHooks('beforeCreate', structure);

    expect(structure.due_date).toBeNull();
  });

  it('rejects an impossible requested due date before loading fee structures', async () => {
    FeeStructure.findAll = jest.fn();
    const next = jest.fn();

    await generateInvoices(
      {
        body: { fee_structure_ids: ['fee-structure-1'], due_date: '2026-02-30' },
        schoolId: 'school-1',
        user: { role: 'admin' }
      },
      {},
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: 'Due date must be a valid YYYY-MM-DD date'
    }));
    expect(FeeStructure.findAll).not.toHaveBeenCalled();
  });
});
