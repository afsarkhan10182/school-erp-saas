require('module-alias/register');

const { DynamicEntityRecord } = require('../src/models');
const { catalog, suite } = require('../src/controllers/shared/reports.controller');

describe('Accountant Reports Suite access', () => {
  it('limits the Accountant catalog to Accounting Reports', async () => {
    const res = { json: jest.fn() };
    await catalog({ user: { role: 'accountant' } }, res);

    expect(res.json.mock.calls[0][0].data.modules.map(module => module.module)).toEqual(['accounting']);
  });

  it('exposes the existing exam-report workflows in the staff catalog', async () => {
    const res = { json: jest.fn() };
    await catalog({ user: { role: 'admin' } }, res);

    expect(res.json.mock.calls[0][0].data.modules).toContainEqual(
      expect.objectContaining({ key: 'exams', title: 'Exam Reports' })
    );
  });

  it('returns application routes, not API endpoints, for exam reports', async () => {
    const res = { json: jest.fn() };
    await suite({ user: { role: 'admin' }, params: { module: 'exams' }, query: {} }, res);

    expect(res.json.mock.calls[0][0].data.links).toEqual([
      { label: 'Tabulation, progress and marksheets', to: '/reports/exams' },
      { label: 'Generate report cards', to: '/exams/report-cards' }
    ]);
  });

  it('denies Accountants access to non-accounting report modules', async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await suite({ user: { role: 'accountant' }, params: { module: 'students' }, query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].success).toBe(false);
  });

  it('locks accounting voucher reports to the Accountant assigned branch', async () => {
    const originalFindAll = DynamicEntityRecord.findAll;
    DynamicEntityRecord.findAll = jest.fn(async options => {
      expect(options.where).toMatchObject({
        school_id: 'school-1', entity_type: 'voucher', branch_id: 'branch-1',
        date_value: {
          [require('sequelize').Op.gte]: '2026-10-01',
          [require('sequelize').Op.lte]: '2026-10-31'
        }
      });
      return [];
    });

    try {
      const res = { json: jest.fn() };
      await suite({
        user: { role: 'accountant', school_id: 'school-1', branch_id: 'branch-1' },
        schoolId: 'school-1', params: { module: 'accounting' },
        query: { type: 'list', branch_id: 'branch-other', from_date: '2026-10-01', to_date: '2026-10-31' }
      }, res);

      expect(DynamicEntityRecord.findAll).toHaveBeenCalledTimes(1);
      expect(res.json.mock.calls[0][0].success).toBe(true);
    } finally {
      DynamicEntityRecord.findAll = originalFindAll;
    }
  });
});
