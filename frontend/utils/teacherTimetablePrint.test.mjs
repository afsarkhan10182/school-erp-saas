import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTeacherTimetablePrintReport } from './teacherTimetablePrint.js';

test('builds a teacher-only print grid with class, section, time, and empty slots', () => {
  const report = buildTeacherTimetablePrintReport({
    timetable: {
      teacher: { first_name: 'Mohan', last_name: 'Das' },
      schedule: {
        monday: [{
          period_number: 1,
          subject: { name: 'Mathematics' },
          timetable: { class: { name: 'Class 1' }, section: { name: 'A' } },
          start_time: '08:00:00',
          end_time: '08:45:00'
        }]
      }
    },
    weekDays: [{ value: 'monday', label: 'Monday' }, { value: 'tuesday', label: 'Tuesday' }],
    periods: [{ number: 1, startTime: '08:00', endTime: '08:45' }],
    academicYear: '2026-2027'
  });

  assert.equal(report.title, 'Teaching Schedule - Mohan Das');
  assert.equal(report.data[0].period_1, 'Mathematics · Class 1 · A · 08:00–08:45');
  assert.equal(report.data[1].period_1, '—');
  assert.equal(report.filters.academic_year, '2026-2027');
});
