require('module-alias/register');
const { FeeInvoice } = require('../src/models');
const getStudentInvoiceTotals = require('../src/utils/financial/studentInvoiceTotals');
const { Op } = require('sequelize');

describe('student invoice totals', () => {
  const findAll = FeeInvoice.findAll;

  afterEach(() => {
    FeeInvoice.findAll = findAll;
  });

  it('aggregates only posted invoices for the requested students and schools', async () => {
    FeeInvoice.findAll = jest
      .fn()
      .mockResolvedValue([
        {
          school_id: 'school-1',
          student_id: 'student-1',
          total_billed: '5000.00',
          total_due: '2500.00'
        }
      ]);

    const totals = await getStudentInvoiceTotals([
      { id: 'student-1', school_id: 'school-1' },
      { id: 'student-2', school_id: 'school-1' }
    ]);

    const query = FeeInvoice.findAll.mock.calls[0][0];
    expect(query.where.school_id[Op.in]).toEqual(['school-1']);
    expect(query.where.student_id[Op.in]).toEqual(['student-1', 'student-2']);
    expect(query.where.status[Op.in]).toEqual(['sent', 'paid', 'partial_paid', 'overdue']);
    expect(query.group).toEqual(['school_id', 'student_id']);
    expect(totals.get('school-1:student-1')).toEqual({ total_billed: 5000, total_due: 2500 });
    expect(totals.has('school-1:student-2')).toBe(false);
  });

  it('includes paid totals when requested without changing default consumers', async () => {
    FeeInvoice.findAll = jest
      .fn()
      .mockResolvedValue([
        {
          school_id: 'school-1',
          student_id: 'student-1',
          total_billed: '5000',
          total_paid: '2500',
          total_due: '2500'
        }
      ]);

    const totals = await getStudentInvoiceTotals([{ id: 'student-1', school_id: 'school-1' }], {
      includePaid: true
    });

    expect(FeeInvoice.findAll.mock.calls[0][0].attributes).toEqual(
      expect.arrayContaining([
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('paid_amount')), 'total_paid']
      ])
    );
    expect(totals.get('school-1:student-1')).toEqual({
      total_billed: 5000,
      total_paid: 2500,
      total_due: 2500
    });
  });

  it('avoids a database query when the visible roster is empty', async () => {
    FeeInvoice.findAll = jest.fn();
    expect(await getStudentInvoiceTotals([])).toEqual(new Map());
    expect(FeeInvoice.findAll).not.toHaveBeenCalled();
  });
});
