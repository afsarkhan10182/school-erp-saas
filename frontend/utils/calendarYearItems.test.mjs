import assert from 'node:assert/strict';
import test from 'node:test';
import { getCalendarWeekAgendaItems, getCalendarWeekRange } from './calendarYearItems.js';

test('week agenda includes only Sunday-through-Saturday events, notices, and attendance', () => {
  const items = getCalendarWeekAgendaItems(
    '2026-10-27',
    [
      { id: 'event-1', date: '2026-10-26', day_type: 'holiday', description: 'Annual day' },
      { id: 'event-outside-week', date: '2026-10-24', description: 'Outside week' }
    ],
    [{ id: 'notice-1', date_value: '2026-10-26', title: 'School notice', notes: 'Reminder' }],
    [
      { id: 'attendance-2', date: '2026-10-26', status: 'late' },
      { id: 'attendance-outside-week', date: '2026-11-01', status: 'absent' }
    ]
  );

  assert.deepEqual(items.map(({ date, type }) => [date, type]), [
    ['2026-10-26', 'Attendance'],
    ['2026-10-26', 'Event'],
    ['2026-10-26', 'Notice']
  ]);
  assert.equal(items[0].title, 'Late');
  assert.equal(items[2].details, 'Reminder');
  assert.deepEqual(getCalendarWeekRange('2026-10-27'), {
    startDate: '2026-10-25',
    endDate: '2026-10-31'
  });
});

test('week range and agenda handle a week crossing calendar years', () => {
  assert.deepEqual(getCalendarWeekRange('2027-01-01'), {
    startDate: '2026-12-27',
    endDate: '2027-01-02'
  });
  assert.deepEqual(
    getCalendarWeekAgendaItems('2027-01-01', [
      { id: 'event-2026', date: '2026-12-31', description: 'Year-end event' },
      { id: 'event-2027', date: '2027-01-02', description: 'New-year event' }
    ]).map(item => item.date),
    ['2026-12-31', '2027-01-02']
  );
});
