import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectStudent360ExportRows, mergeStudent360Filters, parseStudent360Number, student360Csv } from './student360Query.js';

test('Student 360 number query uses defaults only for missing or invalid values', () => {
  assert.equal(parseStudent360Number('', 75), 75);
  assert.equal(parseStudent360Number('  ', 30), 30);
  assert.equal(parseStudent360Number('0', 75), 0);
  assert.equal(parseStudent360Number('42', 30), 42);
  assert.equal(parseStudent360Number('not-a-number', 30), 30);
});

test('shareable Student 360 query preserves unrelated parameters and current filters', () => {
  assert.deepEqual(mergeStudent360Filters(
    { tab: 'students', class_id: 'stale', branch_id: 'global' },
    { search: 'Sarah', class_id: 'class-1', attendance_below: 75, library_out: true, library_overdue: false, has_transport: true, has_hostel: false }
  ), {
    tab: 'students', branch_id: 'global', search: 'Sarah', class_id: 'class-1',
    attendance_below: '75', library_out: 'true', has_transport: 'true'
  });
});

test('Student 360 CSV exports risk context and neutralizes formula-like values', () => {
  const csv = student360Csv([{
    admission_number: '=HYPERLINK("bad")',
    first_name: 'Sarah',
    last_name: 'Demo',
    class: { name: 'Class 1' },
    sectionInfo: { name: 'A' },
    risk: {
      attendance_rate: 100,
      attendance_marked_days: 1,
      overdue_balance: 6000,
      oldest_overdue_days: 43,
      signals: ['fees_overdue'],
      service_memberships: { transport: true, hostel: true, library_books_out: true, library_books_overdue: true },
      latest_result: { exam_name: 'First Term, Examination', exam_date: '2026-07-01', percentage: 86, grade: 'A' }
    }
  }]);

  assert.match(csv, /"Admission Number","Student Name"/);
  assert.match(csv, /"'=HYPERLINK\(""bad""\)","Sarah Demo","Class 1","A","100","1","6000","43","First Term, Examination","2026-07-01","86","A","Transport; Hostel; Library \(overdue\)","fees_overdue"/);
});

test('Student 360 export collects all pages and rejects a changing result set', async () => {
  const requested = [];
  const students = await collectStudent360ExportRows(async page => {
    requested.push(page);
    return {
      data: page === 1 ? [{ id: 'one' }, { id: 'two' }] : [{ id: 'three' }],
      pagination: { total: 3, totalPages: 2 }
    };
  });
  assert.deepEqual(requested, [1, 2]);
  assert.deepEqual(students.map(student => student.id), ['one', 'two', 'three']);

  await assert.rejects(collectStudent360ExportRows(async page => ({
    data: [{ id: `page-${page}` }],
    pagination: { total: page === 1 ? 2 : 3, totalPages: 2 }
  })), /list changed during export/);
});
