import assert from 'node:assert/strict';
import test from 'node:test';
import { MODULE_ENTITY_DEFINITIONS } from './entity-definitions.ts';

test('Accounts entity exposes cash/bank metadata without implying a live balance', () => {
  const account = MODULE_ENTITY_DEFINITIONS.account;
  const fields = Object.fromEntries(account.fields.map(field => [field.key, field]));

  assert.equal(account.module, 'accounting');
  assert.deepEqual(fields.account_type.options.map(option => option.value), ['cash', 'bank']);
  assert.deepEqual(fields.bank_name.visibleWhen, { key: 'account_type', value: 'bank' });
  assert.deepEqual(fields.bank_name.requiredWhen, { key: 'account_type', value: 'bank' });
  assert.deepEqual(fields.reference_no.visibleWhen, { key: 'account_type', value: 'bank' });
  assert.deepEqual(fields.reference_no.requiredWhen, { key: 'account_type', value: 'bank' });
  assert.deepEqual(fields.bank_branch.visibleWhen, { key: 'account_type', value: 'bank' });
  assert.deepEqual(
    account.columns.map(column => column.key),
    ['title', 'account_type', 'bank_name', 'bank_branch', 'reference_no', 'opening_balance']
  );
  assert.equal(account.columns.some(column => column.key === 'current_balance'), false);
});
