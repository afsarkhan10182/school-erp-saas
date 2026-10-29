import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveEffectiveBranchId } from './resolveEffectiveBranchId.js';

test('keeps an explicit branch and infers only a matching sole branch', () => {
  assert.equal(resolveEffectiveBranchId('branch-2', [{ id: 'branch-1' }], false, 'school-1'), 'branch-2');
  assert.equal(resolveEffectiveBranchId('', [{ id: 'branch-1', school_id: 'school-1' }], false, 'school-1'), 'branch-1');
  assert.equal(resolveEffectiveBranchId('', [{ id: 'branch-1', school_id: 'school-2' }], false, 'school-1'), '');
});

test('requires a selected school for Platform Owner and a selected branch for multi-branch schools', () => {
  assert.equal(resolveEffectiveBranchId('', [{ id: 'branch-1' }], true, ''), '');
  assert.equal(resolveEffectiveBranchId('', [{ id: 'branch-1', school_id: 'school-1' }], true, 'school-1'), 'branch-1');
  assert.equal(resolveEffectiveBranchId('', [{ id: 'branch-1' }, { id: 'branch-2' }], false, 'school-1'), '');
});
