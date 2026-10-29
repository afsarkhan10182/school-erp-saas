import assert from 'node:assert/strict';
import test from 'node:test';
import { getFeeDueDateRange } from './feeDueDateRange.js';

test('builds calendar month and quarter due-date ranges', () => {
  const today = new Date(2026, 9, 27);
  assert.deepEqual(getFeeDueDateRange('month', today), {
    due_from: '2026-10-01', due_to: '2026-10-31'
  });
  assert.deepEqual(getFeeDueDateRange('quarter', today), {
    due_from: '2026-10-01', due_to: '2026-12-31'
  });
});

test('uses a clamped six-month end date and clears the full/custom range', () => {
  assert.deepEqual(getFeeDueDateRange('next-six-months', new Date(2026, 7, 31)), {
    due_from: '2026-08-31', due_to: '2027-02-28'
  });
  assert.deepEqual(getFeeDueDateRange('all'), { due_from: '', due_to: '' });
});
