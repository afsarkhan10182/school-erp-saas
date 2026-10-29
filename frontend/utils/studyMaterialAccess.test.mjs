import assert from 'node:assert/strict';
import test from 'node:test';
import { canManageStudyMaterials } from './studyMaterialAccess.js';

test('matches the Study Center management API role allowlist', () => {
  for (const role of ['super_admin', 'admin', 'branch_admin', 'teacher']) {
    assert.equal(canManageStudyMaterials(role), true, role);
  }
  for (const role of ['student', 'parent', 'accountant', 'receptionist', 'librarian', undefined]) {
    assert.equal(canManageStudyMaterials(role), false, String(role));
  }
});
