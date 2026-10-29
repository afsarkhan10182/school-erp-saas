import test from 'node:test';
import assert from 'node:assert/strict';
import { getLocalDateInputValue } from './localDate.js';

test('date input values use the browser-local calendar date, not the UTC date', () => {
  process.env.TZ = 'Asia/Kolkata';
  assert.equal(getLocalDateInputValue(new Date('2026-10-28T18:45:00.000Z')), '2026-10-29');
});
