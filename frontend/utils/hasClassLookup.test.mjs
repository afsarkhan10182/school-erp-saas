import assert from 'node:assert/strict';
import test from 'node:test';
import { MODULE_ENTITY_DEFINITIONS } from '../config/entity-definitions.ts';
import { hasClassLookup } from './hasClassLookup.js';

test('class filters are limited to entities that support class assignment', () => {
  assert.equal(hasClassLookup(MODULE_ENTITY_DEFINITIONS.online_exam), true);
  assert.equal(hasClassLookup(MODULE_ENTITY_DEFINITIONS.enquiry), true);
  assert.equal(hasClassLookup(MODULE_ENTITY_DEFINITIONS.translation), false);
  assert.equal(hasClassLookup(MODULE_ENTITY_DEFINITIONS.custom_field), false);
  assert.equal(hasClassLookup(undefined), false);
});
