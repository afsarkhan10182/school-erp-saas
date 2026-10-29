export const feePaymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'online', label: 'Online (manual record)' }
];

export const getConfiguredFeePaymentMethods = (settings = {}) =>
  settings.feeSettings?.paymentMethods || settings.paymentMethods || {};

export const getFeeSettingsCacheKey = schoolId => `fees:${schoolId || 'unselected'}`;

export const getEnabledFeePaymentMethods = (enabledMethods = {}) =>
  feePaymentMethodOptions.filter(({ value }) =>
    value === 'online' ? enabledMethods.online === true : enabledMethods[value] !== false
  );
