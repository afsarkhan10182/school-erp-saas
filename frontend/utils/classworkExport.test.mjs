import assert from 'node:assert/strict';
import test from 'node:test';
import { classworkCsv, classworkTsv, collectClassworkExportRows } from './classworkExport.js';

test('collects every paginated row and refuses inconsistent totals', async () => {
  const pages = { 1: { data: [{ title: 'One' }], pagination: { total: 2, totalPages: 2 } }, 2: { data: [{ title: 'Two' }], pagination: { total: 2, totalPages: 2 } } };
  assert.deepEqual(await collectClassworkExportRows(page => pages[page]), [{ title: 'One' }, { title: 'Two' }]);
  await assert.rejects(() => collectClassworkExportRows(page => ({ data: [pages[page].data[0]], pagination: { total: page === 1 ? 2 : 3, totalPages: 2 } })), /changed during export/);
});

test('quotes CSV cells and neutralizes spreadsheet formulas', () => {
  const csv = classworkCsv([{ date_value: '2026-10-28', title: '=HYPERLINK("https://unsafe")', notes: 'line 1, line 2' }]);
  assert.match(csv, /'=?HYPERLINK/);
  assert.match(csv, /"line 1, line 2"/);
});

test('exports only selected columns to CSV and clipboard text', () => {
  const rows = [{ title: 'Math', notes: 'first\nsecond' }];
  assert.equal(classworkCsv(rows, ['title']), '"Topic"\r\n"Math"');
  assert.equal(classworkTsv(rows, ['title', 'notes']), 'Topic\tContent / notes\r\nMath\tfirst second');
});
