import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLiveClassMonthDays,
  getLiveClassMonthRange,
  getLocalCalendarDateKey
} from './liveClassCalendar.js';

test('live class month grid is a Sunday-first six-week calendar with correct month days', () => {
  const days = getLiveClassMonthDays(2026, 9);
  assert.equal(days.length, 42);
  assert.equal(days[0].key, '2026-09-27');
  assert.equal(days[3].key, '2026-09-30');
  assert.equal(days[4].key, '2026-10-01');
  assert.equal(days[34].key, '2026-10-31');
  assert.equal(days[35].key, '2026-11-01');
  assert.equal(days.filter(day => day.inMonth).length, 31);
});

test('live class month range uses exclusive next-month boundary across year rollover', () => {
  const range = getLiveClassMonthRange(2026, 11);
  assert.equal(new Date(range.date_from).getTime(), new Date(2026, 11, 1).getTime());
  assert.equal(new Date(range.date_to).getTime(), new Date(2027, 0, 1).getTime());
});

test('live class date keys follow local calendar dates rather than UTC dates', () => {
  const localDate = new Date(2026, 9, 28, 23, 45);
  assert.equal(getLocalCalendarDateKey(localDate.toISOString()), '2026-10-28');
});
