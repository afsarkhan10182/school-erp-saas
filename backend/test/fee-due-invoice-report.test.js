require('module-alias/register');

const { Op } = require('sequelize');
const { FeeInvoice } = require('../src/models');
const { getFeeInvoiceReport } = require('../src/controllers/financial/report.controller');

describe('due invoice report filters', () => {
  const originalFindAndCountAll = FeeInvoice.findAndCountAll;
  const originalFindAll = FeeInvoice.findAll;

  afterEach(() => {
    FeeInvoice.findAndCountAll = originalFindAndCountAll;
    FeeInvoice.findAll = originalFindAll;
  });

  it('paginates multi-status results within the assigned branch and due-date filters', async () => {
    FeeInvoice.findAndCountAll = jest.fn().mockResolvedValue({ count: 51, rows: [] });
    FeeInvoice.findAll = jest.fn().mockResolvedValue([{
      total_amount: '1000.00', paid_amount: '250.00', discount_amount: '50.00', balance_amount: '700.00'
    }]);
    let payload;

    await getFeeInvoiceReport(
      {
        user: { role: 'branch_admin', branch_id: 'branch-1' },
        schoolId: 'school-1',
        query: {
          status: 'overdue,sent,partial_paid',
          academic_year: '2026-2027',
          due_from: '2026-10-01',
          due_to: '2026-10-31',
          class_name: 'Class 1',
          section: 'A',
          search: 'Sarah',
          page: '2',
          limit: '25'
        }
      },
      { status: () => ({ json: body => (payload = body) }) },
      error => { throw error; }
    );

    const query = FeeInvoice.findAndCountAll.mock.calls[0][0];
    expect(query.where).toEqual({
      school_id: 'school-1',
      branch_id: 'branch-1',
      status: { [Op.in]: ['overdue', 'sent', 'partial_paid'] },
      academic_year: '2026-2027',
      due_date: { [Op.gte]: '2026-10-01', [Op.lte]: '2026-10-31' }
    });
    expect(query.include[0].where).toEqual({
      [Op.or]: [
        { first_name: { [Op.iLike]: '%Sarah%' } },
        { last_name: { [Op.iLike]: '%Sarah%' } },
        { admission_number: { [Op.and]: [{ [Op.not]: null }, { [Op.iLike]: '%Sarah%' }] } }
      ],
      current_class: 'Class 1',
      section: 'A',
      branch_id: 'branch-1'
    });
    expect(query.include.find(({ as }) => as === 'branch')).toMatchObject({
      as: 'branch',
      attributes: ['id', 'name', 'code'],
      required: false
    });
    expect(query.offset).toBe(25);
    expect(payload.data.pagination).toMatchObject({ current_page: 2, total_pages: 3, total_records: 51 });
    expect(payload.data.summary).toEqual({ total_amount: 1000, paid_amount: 250, discount_amount: 50, balance_amount: 700 });
    expect(FeeInvoice.findAll.mock.calls[0][0]).toMatchObject({
      where: query.where,
      include: [{
        model: expect.anything(),
        as: 'student',
        attributes: [],
        required: true,
        where: query.include[0].where
      }],
      raw: true
    });
  });

  it('fails closed for an unassigned branch admin and rejects malformed due dates', async () => {
    FeeInvoice.findAndCountAll = jest.fn();
    FeeInvoice.findAll = jest.fn();
    const next = jest.fn();

    await getFeeInvoiceReport(
      { user: { role: 'branch_admin' }, schoolId: 'school-1', query: {} },
      {},
      next
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(FeeInvoice.findAndCountAll).not.toHaveBeenCalled();

    await getFeeInvoiceReport(
      {
        user: { role: 'admin' },
        schoolId: 'school-1',
        query: { due_from: '2026-02-31' }
      },
      {},
      next
    );
    expect(next).toHaveBeenLastCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(FeeInvoice.findAndCountAll).not.toHaveBeenCalled();
    expect(FeeInvoice.findAll).not.toHaveBeenCalled();
  });

  it('keeps student-only search filters on the unpaginated aggregate query', async () => {
    FeeInvoice.findAndCountAll = jest.fn().mockResolvedValue({ count: 1, rows: [] });
    FeeInvoice.findAll = jest.fn().mockResolvedValue([{}]);

    await getFeeInvoiceReport(
      {
        user: { role: 'accountant' },
        schoolId: 'school-1',
        query: { search: 'Sarah', status: 'sent' }
      },
      { status: () => ({ json: () => {} }) },
      error => { throw error; }
    );

    const aggregateInclude = FeeInvoice.findAll.mock.calls[0][0].include[0];
    expect(aggregateInclude.required).toBe(true);
    expect(aggregateInclude.where[Op.or]).toHaveLength(3);
    expect(FeeInvoice.findAll.mock.calls[0][0].where).toEqual({
      school_id: 'school-1',
      status: 'sent'
    });
  });
});
