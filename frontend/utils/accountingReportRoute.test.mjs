import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAccountingReportTab } from './accountingReportRoute.js';

test('resolves supported voucher report tabs', () => {
  assert.deepEqual(resolveAccountingReportTab(undefined), { supported: true, type: 'summary' });
  assert.deepEqual(resolveAccountingReportTab('list'), { supported: true, type: 'list' });
});

test('labels legacy accounting tabs that do not have matching local reports', () => {
  for (const tab of ['statement', 'income', 'expense', 'transactions', 'balance', 'incomevsexpense']) {
    assert.deepEqual(resolveAccountingReportTab(tab), {
      supported: false,
      label: expectLabel[tab]
    });
  }
});

test('uses the first repeated query value and a safe fallback for unknown tabs', () => {
  assert.deepEqual(resolveAccountingReportTab(['list', 'balance']), { supported: true, type: 'list' });
  assert.deepEqual(resolveAccountingReportTab('unexpected'), { supported: false, label: 'Accounting report' });
});

const expectLabel = {
  statement: 'Account Statement', income: 'Income Report', expense: 'Expense Report',
  transactions: 'Transaction Report', balance: 'Balance Sheet', incomevsexpense: 'Income vs Expense Report'
};
