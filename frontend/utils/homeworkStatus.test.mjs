import assert from 'node:assert/strict';
import test from 'node:test';
import { getHomeworkBuckets } from './homeworkStatus.js';

test('separates due and future work from completed and expired assignments', () => {
  const assignments = [
    { id: 'today', due_date: '2026-10-27' },
    { id: 'future', due_date: '2026-10-28', submissions: [{ submitted_at: '2026-10-26' }] },
    { id: 'expired', due_date: '2026-10-26' },
    { id: 'graded', due_date: '2026-10-30', submissions: [{ evaluated_at: '2026-10-26' }] }
  ];

  const result = getHomeworkBuckets(assignments, '2026-10-27');
  assert.deepEqual(
    result.pending.map(({ id }) => id),
    ['today', 'future']
  );
  assert.deepEqual(
    result.past.map(({ id }) => id),
    ['expired', 'graded']
  );
});
