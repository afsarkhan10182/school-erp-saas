import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCurrentSchool } from './resolveCurrentSchool.js';

test('regular school users cannot retain another selected school context', () => {
  assert.deepEqual(
    resolveCurrentSchool(
      { role: 'admin', school_id: 'school-a', school: { name: 'School A' } },
      { id: 'school-b', name: 'Stale School' }
    ),
    { id: 'school-a', name: 'School A' }
  );
});

test('keeps same-school metadata and the Platform Owner selected school', () => {
  const selectedSchool = { id: 'school-a', name: 'Renamed School', logo: '/logo.png' };
  assert.deepEqual(
    resolveCurrentSchool({ role: 'admin', school_id: 'school-a' }, selectedSchool),
    selectedSchool
  );
  assert.deepEqual(resolveCurrentSchool({ role: 'super_admin' }, selectedSchool), selectedSchool);
  assert.equal(resolveCurrentSchool({ role: 'teacher' }, selectedSchool), null);
});
