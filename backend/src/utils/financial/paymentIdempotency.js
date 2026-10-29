'use strict';

const { createHash } = require('crypto');
const ApiError = require('~/utils/shared/ApiError');

const stableJson = value => {
  if (Array.isArray(value)) return `[${value.map(item => stableJson(item === undefined ? null : item)).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).filter(key => value[key] !== undefined).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
};

const getPaymentIdempotency = req => {
  const key = req.body?.idempotency_key;
  if (key == null || key === '') return null;
  if (typeof key !== 'string' || !/^[A-Za-z0-9._:-]{8,128}$/.test(key)) {
    throw new ApiError(400, 'A valid payment idempotency key is required');
  }

  const { idempotency_key: _key, ...payload } = req.body;
  const fingerprint = createHash('sha256').update(stableJson(payload)).digest('hex');
  return { key, fingerprint };
};

const replayPayment = async (existingPayment, idempotency, transaction, res) => {
  if (!existingPayment) return null;
  if (existingPayment.idempotency_request_hash !== idempotency.fingerprint) {
    throw new ApiError(409, 'This payment retry key was already used with different payment details');
  }
  if (!existingPayment.idempotency_response) {
    throw new ApiError(409, 'This payment request was recorded but its response is unavailable');
  }

  await transaction.commit();
  return res.status(200).json({
    success: true,
    message: 'Payment request was already processed',
    data: existingPayment.idempotency_response
  });
};

module.exports = { getPaymentIdempotency, replayPayment };
