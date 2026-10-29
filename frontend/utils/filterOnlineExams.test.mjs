import assert from 'node:assert/strict';
import test from 'node:test';
import { filterOnlineExams, paginateOnlineExams } from './filterOnlineExams.js';

const now = new Date('2026-10-27T12:00:00Z');
const exams = [
  {
    id: 'open',
    title: 'Science Quiz',
    class_id: 'class-a',
    class: { name: 'Class A' },
    status: 'published',
    start_at: '2026-10-27T11:00:00Z',
    duration_minutes: 60
  },
  {
    id: 'upcoming',
    title: 'Math Exam',
    class_id: 'class-a',
    class: { name: 'Class A' },
    status: 'draft',
    start_at: '2026-10-28T11:00:00Z'
  },
  {
    id: 'closed',
    title: 'Reading',
    class_id: 'class-b',
    class: { name: 'Class B' },
    status: 'published',
    start_at: '2026-10-26T11:00:00Z',
    duration_minutes: 60
  }
];

test('combines search, class, status, and time-window filters', () => {
  assert.deepEqual(
    filterOnlineExams(
      exams,
      { search: 'science', class_id: 'class-a', status: 'published', window: 'open' },
      now
    ).map(exam => exam.id),
    ['open']
  );
  assert.deepEqual(
    filterOnlineExams(exams, { window: 'upcoming', sort: 'start_desc' }, now).map(exam => exam.id),
    ['upcoming']
  );
  assert.deepEqual(
    filterOnlineExams(exams, { window: 'closed', sort: 'start_asc' }, now).map(exam => exam.id),
    ['closed']
  );
});

test('sorts by title and paginates a copied filtered list', () => {
  const sorted = filterOnlineExams(exams, { sort: 'title' }, now);
  assert.deepEqual(sorted.map(exam => exam.id), ['upcoming', 'closed', 'open']);
  assert.deepEqual(paginateOnlineExams(sorted, 2, 2).map(exam => exam.id), ['open']);
  assert.equal(exams.length, 3);
});

test('filters the parent/student availability payload without staff-only status fields', () => {
  const available = [
    {
      id: 'current',
      title: 'Math Practice',
      class: { name: 'Class 1' },
      start_at: '2026-10-27T11:00:00Z',
      end_at: '2026-10-27T13:00:00Z',
      attempt_status: 'in_progress'
    },
    {
      id: 'upcoming',
      title: 'Science Quiz',
      class: { name: 'Class 2' },
      start_at: '2026-10-28T11:00:00Z',
      attempt_status: null
    }
  ];
  const filtered = filterOnlineExams(
    available,
    { search: 'class 1', window: 'open', sort: 'start_asc' },
    now
  );

  assert.deepEqual(filtered.map(exam => exam.id), ['current']);
  assert.deepEqual(paginateOnlineExams(filtered, 1, 10).map(exam => exam.id), ['current']);
});
