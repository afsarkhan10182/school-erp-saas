require('module-alias/register');
const assert = require('assert');
const { Op } = require('sequelize');
const { FeeInvoice, FeePayment } = require('../src/models');
const ReportsController = require('../src/controllers/financial/report.controller');
const getPaymentMethodInvoiceIds = require('../src/utils/financial/paymentMethodInvoiceIds');
const parseMonthlyPeriods = require('../src/utils/financial/parseMonthlyPeriods');

describe('Fee report collection-method filter', () => {
  it('uses completed payments scoped to the selected school and branch', async () => {
    const originalFindAll = FeePayment.findAll;
    try {
      FeePayment.findAll = async options => {
        assert.deepStrictEqual(options.where, {
          payment_method: 'cash',
          payment_status: 'completed',
          invoice_id: { [Op.ne]: null },
          school_id: 'school-a',
          branch_id: 'branch-a',
          academic_year: '2026-2027'
        });
        assert.deepStrictEqual(options.group, ['invoice_id']);
        return [{ invoice_id: 'invoice-a' }];
      };

      const invoiceIds = await getPaymentMethodInvoiceIds({
        paymentMethod: 'cash',
        schoolId: 'school-a',
        branchId: 'branch-a',
        academicYear: '2026-2027'
      });
      assert.deepStrictEqual(invoiceIds, ['invoice-a']);
    } finally {
      FeePayment.findAll = originalFindAll;
    }
  });

  it('limits the invoice report query to invoices that match the selected method', async () => {
    const originalPaymentFindAll = FeePayment.findAll;
    const originalInvoiceFindAll = FeeInvoice.findAll;
    const originalInvoiceFindAndCountAll = FeeInvoice.findAndCountAll;
    let payload;
    try {
      FeePayment.findAll = async () => [{ invoice_id: 'invoice-cash' }];
      FeeInvoice.findAll = async options => {
        assert.deepStrictEqual(options.where.id, { [Op.in]: ['invoice-cash'] });
        assert.strictEqual(options.where.school_id, 'school-a');
        return [{ student_id: 'student-a' }];
      };
      FeeInvoice.findAndCountAll = async options => {
        assert.deepStrictEqual(options.where.id, { [Op.in]: ['invoice-cash'] });
        assert.strictEqual(options.where.school_id, 'school-a');
        return { count: 1, rows: [] };
      };

      const res = {
        status(code) {
          assert.strictEqual(code, 200);
          return this;
        },
        json(body) {
          payload = body;
          return body;
        }
      };
      await ReportsController.getFeeInvoiceReportGrouped(
        {
          user: { role: 'admin', school_id: 'school-a' },
          schoolId: 'school-a',
          query: { payment_method: 'cash' }
        },
        res,
        error => {
          if (error) throw error;
        }
      );

      assert.strictEqual(payload.data.pagination.total_students, 1);
      assert.strictEqual(payload.data.pagination.total_invoices, 1);
    } finally {
      FeePayment.findAll = originalPaymentFindAll;
      FeeInvoice.findAll = originalInvoiceFindAll;
      FeeInvoice.findAndCountAll = originalInvoiceFindAndCountAll;
    }
  });

  it('applies the same scoped method filter to monthly status', async () => {
    const originalPaymentFindAll = FeePayment.findAll;
    const originalInvoiceCount = FeeInvoice.count;
    let payload;
    try {
      FeePayment.findAll = async options => {
        assert.strictEqual(options.where.school_id, 'school-a');
        assert.strictEqual(options.where.branch_id, 'branch-a');
        return [{ invoice_id: 'monthly-invoice' }];
      };
      FeeInvoice.count = async options => {
        assert.deepStrictEqual(options.where.id, { [Op.in]: ['monthly-invoice'] });
        assert.strictEqual(options.where.school_id, 'school-a');
        assert.deepStrictEqual(options.where[Op.or], [
          { month: 12, year: 2026 },
          { month: 1, year: 2027 }
        ]);
        assert.strictEqual(options.where.year, undefined);
        return 0;
      };

      await ReportsController.getMonthlyPaymentStatus(
        {
          user: { role: 'branch_admin', branch_id: 'branch-a' },
          schoolId: 'school-a',
          query: {
            periods: JSON.stringify([
              { month: 12, year: 2026 },
              { month: 1, year: 2027 }
            ]),
            payment_method: 'upi'
          }
        },
        { json: body => (payload = body) },
        error => {
          if (error) throw error;
        }
      );
      assert.strictEqual(payload.success, true);
      assert.strictEqual(payload.pagination.totalStudents, 0);
      assert.deepStrictEqual(parseMonthlyPeriods('[{"month":12,"year":2026}]'), [
        { month: 12, year: 2026 }
      ]);
      expect(() => parseMonthlyPeriods('[{"month":13,"year":2026}]')).toThrow(
        /valid month and year/
      );
    } finally {
      FeePayment.findAll = originalPaymentFindAll;
      FeeInvoice.count = originalInvoiceCount;
    }
  });

  it('keeps monthly summary totals scoped to each selected calendar year', async () => {
    const originalInvoiceFindAll = FeeInvoice.findAll;
    let payload;
    try {
      FeeInvoice.findAll = async options => {
        assert.deepStrictEqual(options.where[Op.or], [
          { month: 12, year: 2026 },
          { month: 1, year: 2027 }
        ]);
        assert.strictEqual(options.where.school_id, 'school-a');
        return [{ total_invoices: 0 }];
      };
      const res = {
        status(code) {
          assert.strictEqual(code, 200);
          return this;
        },
        json(body) {
          payload = body;
          return body;
        }
      };
      await ReportsController.getFeeCollectionSummary(
        {
          user: { role: 'admin', school_id: 'school-a' },
          schoolId: 'school-a',
          query: {
            payment_model: 'monthly',
            months: '12,1',
            periods: JSON.stringify([
              { month: 12, year: 2026 },
              { month: 1, year: 2027 }
            ])
          }
        },
        res,
        error => {
          if (error) throw error;
        }
      );
      assert.strictEqual(payload.success, true);
      assert.strictEqual(payload.data.totalInvoices, 0);
    } finally {
      FeeInvoice.findAll = originalInvoiceFindAll;
    }
  });
});
