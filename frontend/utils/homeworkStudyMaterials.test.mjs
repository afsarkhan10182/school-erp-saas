import assert from 'node:assert/strict';
import test from 'node:test';
import { getHomeworkStudyMaterials } from './homeworkStudyMaterials.js';

test('homework picker only returns safe HTTPS resources matching the selected subject', () => {
  const materials = [
    { id: 'match', subject_id: 'math', external_url: 'https://example.edu/math' },
    { id: 'other-subject', subject_id: 'science', external_url: 'https://example.edu/science' },
    { id: 'unsafe', subject_id: 'math', external_url: 'http://example.edu/math' },
    { id: 'file', subject_id: 'math', resource_type: 'file' }
  ];

  assert.deepEqual(getHomeworkStudyMaterials(materials, 'math').map(({ id }) => id), ['match']);
  assert.deepEqual(getHomeworkStudyMaterials(materials).map(({ id }) => id), ['match', 'other-subject']);
});
