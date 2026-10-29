import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeStudyMaterialUrl } from './safeStudyMaterialUrl.js';

test('study material links must be credential-free HTTPS URLs', () => {
  assert.equal(safeStudyMaterialUrl('https://example.edu/resource'), 'https://example.edu/resource');
  assert.equal(safeStudyMaterialUrl('javascript:alert(1)'), '');
  assert.equal(safeStudyMaterialUrl('http://example.edu/resource'), '');
  assert.equal(safeStudyMaterialUrl('https://user:secret@example.edu/resource'), '');
  assert.equal(safeStudyMaterialUrl('not a URL'), '');
});
