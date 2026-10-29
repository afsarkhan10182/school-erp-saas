import assert from 'node:assert/strict';
import test from 'node:test';
import { canManageClasswork } from './classworkAccess.js';

test('classwork management is limited to school staff and teachers', () => {
  for (const role of ['super_admin', 'admin', 'branch_admin', 'teacher']) assert.equal(canManageClasswork(role), true);
  for (const role of ['student', 'parent', 'accountant', 'receptionist', 'librarian', undefined]) assert.equal(canManageClasswork(role), false);
});
