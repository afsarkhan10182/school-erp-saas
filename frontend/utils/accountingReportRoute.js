const reportLabels = {
  statement: 'Account Statement',
  income: 'Income Report',
  expense: 'Expense Report',
  transactions: 'Transaction Report',
  balance: 'Balance Sheet',
  incomevsexpense: 'Income vs Expense Report'
};

export const resolveAccountingReportTab = value => {
  const tab = Array.isArray(value) ? value[0] : value;
  if (!tab || tab === 'summary') return { supported: true, type: 'summary' };
  if (tab === 'list') return { supported: true, type: 'list' };
  return { supported: false, label: reportLabels[tab] || 'Accounting report' };
};
