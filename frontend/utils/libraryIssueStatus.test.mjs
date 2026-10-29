import assert from 'node:assert/strict';
import test from 'node:test';
import { getLibraryIssueStatus } from './libraryIssueStatus.js';

const today = new Date(2026, 9, 27);

test('marks an unreturned issue overdue only after its due date', () => {
  assert.equal(
    getLibraryIssueStatus({ status: 'issued', due_date: '2026-06-24' }, today),
    'overdue'
  );
  assert.equal(
    getLibraryIssueStatus({ status: 'issued', due_date: '2026-10-27' }, today),
    'issued'
  );
  assert.equal(
    getLibraryIssueStatus({ status: 'issued', due_date: '2026-10-28' }, today),
    'issued'
  );
});

test('preserves returned status and does not infer overdue without a due date', () => {
  assert.equal(
    getLibraryIssueStatus({ status: 'returned', due_date: '2026-06-24' }, today),
    'returned'
  );
  assert.equal(getLibraryIssueStatus({ status: 'issued' }, today), 'issued');
});
