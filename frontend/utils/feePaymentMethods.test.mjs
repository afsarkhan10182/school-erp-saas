import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getConfiguredFeePaymentMethods,
  getEnabledFeePaymentMethods,
  getFeeSettingsCacheKey
} from './feePaymentMethods.js';

test('reads payment switches from both API and cached settings shapes', () => {
  const methods = { cash: false, online: true };
  assert.equal(
    getConfiguredFeePaymentMethods({ feeSettings: { paymentMethods: methods } }),
    methods
  );
  assert.equal(getConfiguredFeePaymentMethods({ paymentMethods: methods }), methods);
});

test('keeps cached fee settings isolated per selected school', () => {
  assert.notEqual(getFeeSettingsCacheKey('school-a'), getFeeSettingsCacheKey('school-b'));
  assert.equal(getFeeSettingsCacheKey(null), 'fees:unselected');
});

test('keeps existing collection methods enabled by default and hides Online until enabled', () => {
  assert.deepEqual(
    getEnabledFeePaymentMethods().map(({ value }) => value),
    ['cash', 'card', 'upi', 'bank_transfer', 'cheque']
  );
});

test('applies configured method switches and only exposes Online when explicitly enabled', () => {
  assert.deepEqual(
    getEnabledFeePaymentMethods({ cash: false, bank_transfer: false, online: true }).map(
      ({ value }) => value
    ),
    ['card', 'upi', 'cheque', 'online']
  );
});
