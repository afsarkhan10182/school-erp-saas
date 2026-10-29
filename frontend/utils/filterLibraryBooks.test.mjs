import assert from 'node:assert/strict';
import test from 'node:test';
import {
  escapeLibraryPrintValue,
  filterLibraryBooks,
  libraryBookColumnValue,
  paginateLibraryBooks,
  sortLibraryBooks
} from './filterLibraryBooks.js';

const books = [
  {
    title: 'The World Around Us',
    author: 'Demo Publications',
    isbn: 'DEMO-9780001',
    category: 'Textbook'
  },
  { title: 'Charlotte’s Web', author: 'E. B. White', isbn: 'DEMO-9780002', category: 'Fiction' }
];

test('searches book metadata case-insensitively and combines with category', () => {
  assert.deepEqual(filterLibraryBooks(books, { query: 'demo-9780001' }), [books[0]]);
  assert.deepEqual(filterLibraryBooks(books, { query: 'white', category: 'Fiction' }), [books[1]]);
  assert.deepEqual(filterLibraryBooks(books, { query: 'white', category: 'Textbook' }), []);
});

test('returns all books for an empty query and category', () => {
  assert.deepEqual(filterLibraryBooks(books), books);
  assert.deepEqual(filterLibraryBooks(books, { query: '  ' }), books);
});

test('paginates filtered books and safely handles invalid page values', () => {
  assert.deepEqual(paginateLibraryBooks(books, 2, 1), [books[1]]);
  assert.deepEqual(paginateLibraryBooks(books, 0, 0), [books[0], books[1]]);
  assert.deepEqual(paginateLibraryBooks(books, 3, 1), []);
});

test('sorts text case-insensitively and availability numerically without mutating the catalog', () => {
  const inventory = [
    { title: 'zebra', author: 'Zed', available: 2 },
    { title: 'Apple', author: 'amy', available: 10 }
  ];
  assert.deepEqual(
    sortLibraryBooks(inventory, 'title').map(book => book.title),
    ['Apple', 'zebra']
  );
  assert.deepEqual(
    sortLibraryBooks(inventory, 'author', 'desc').map(book => book.author),
    ['Zed', 'amy']
  );
  assert.deepEqual(
    sortLibraryBooks(inventory, 'available', 'desc').map(book => book.available),
    [10, 2]
  );
  assert.equal(inventory[0].title, 'zebra');
});

test('formats every catalog column with safe empty values while preserving numeric zeros', () => {
  const book = { title: 'Demo', quantity: 0, available: 0, purchase_price: 0, sale_price: 12 };
  assert.deepEqual(
    ['title', 'author', 'isbn', 'category', 'publisher', 'edition', 'quantity', 'available', 'purchase_date', 'purchase_price', 'sale_price', 'unknown']
      .map(key => libraryBookColumnValue(book, key)),
    ['Demo', '—', '—', 'Uncategorised', '—', '—', 0, 0, '—', 0, 12, '—']
  );
});

test('escapes catalog content before placing it in the shared HTML print report', () => {
  assert.equal(
    escapeLibraryPrintValue(`<img src=x onerror='alert("x")'>&`),
    '&lt;img src=x onerror=&#39;alert(&quot;x&quot;)&#39;&gt;&amp;'
  );
});
