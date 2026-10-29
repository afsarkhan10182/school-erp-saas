const parseDateOnly = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
};

const calculateInvoiceDueDate = ({ invoiceDate = new Date(), calculation, dueDays = 15, customDate }) => {
  const baseDate = invoiceDate instanceof Date ? invoiceDate : new Date(invoiceDate);
  if (Number.isNaN(baseDate.getTime())) throw new Error('Invalid invoice date');

  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth();
  const day = baseDate.getUTCDate();

  switch (calculation) {
    case 'custom': {
      if (!parseDateOnly(customDate)) throw new Error('A valid due date is required for custom calculation');
      return customDate;
    }
    case 'month_end':
      return new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
    case 'next_month': {
      const nextMonth = new Date(Date.UTC(year, month + 1, 1));
      const lastDay = new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0)).getUTCDate();
      nextMonth.setUTCDate(Math.min(day, lastDay));
      return nextMonth.toISOString().slice(0, 10);
    }
    case 'fixed_days':
    default: {
      const days = Number.isInteger(Number(dueDays)) && Number(dueDays) > 0 ? Number(dueDays) : 15;
      return new Date(Date.UTC(year, month, day + days)).toISOString().slice(0, 10);
    }
  }
};

module.exports = { calculateInvoiceDueDate, parseDateOnly };
