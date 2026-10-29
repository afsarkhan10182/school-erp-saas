const { calculateInvoiceDueDate, parseDateOnly } = require('../src/utils/financial/invoice-due-date');

describe('invoice due-date policies', () => {
  const invoiceDate = new Date('2026-01-31T18:30:00.000Z');

  it('adds configured fixed days across month boundaries', () => {
    expect(calculateInvoiceDueDate({ invoiceDate, calculation: 'fixed_days', dueDays: 15 }))
      .toBe('2026-02-15');
  });

  it('uses the end of the invoice month', () => {
    expect(calculateInvoiceDueDate({ invoiceDate, calculation: 'month_end' }))
      .toBe('2026-01-31');
  });

  it('clamps next-month dates when the next month is shorter', () => {
    expect(calculateInvoiceDueDate({ invoiceDate, calculation: 'next_month' }))
      .toBe('2026-02-28');
  });

  it('requires an explicit valid date for custom calculation', () => {
    expect(calculateInvoiceDueDate({ invoiceDate, calculation: 'custom', customDate: '2026-02-20' }))
      .toBe('2026-02-20');
    expect(() => calculateInvoiceDueDate({ invoiceDate, calculation: 'custom' }))
      .toThrow('A valid due date is required for custom calculation');
  });

  it.each(['2026-02-29', '2026-2-09', '2026-02-09T00:00:00Z'])('rejects invalid date-only value %s', value => {
    expect(parseDateOnly(value)).toBeNull();
  });
});
