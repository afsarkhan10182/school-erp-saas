require('module-alias/register');

jest.mock('../src/models', () => ({
  LibraryBook: { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), destroy: jest.fn(), bulkCreate: jest.fn() },
  LibraryIssue: { create: jest.fn(), findOne: jest.fn() },
  LibraryImportBatch: { create: jest.fn(), findOne: jest.fn(), findAll: jest.fn() },
  LibraryImportBatchRow: { bulkCreate: jest.fn(), findAll: jest.fn() },
  Branch: {},
  Student: { findOne: jest.fn() },
  User: { findOne: jest.fn() }
}));
jest.mock('../src/config/database', () => ({
  sequelize: {
    getQueryInterface: () => ({ describeTable: jest.fn().mockResolvedValue({ publisher: {}, purchase_date: {}, purchase_price: {}, sale_price: {} }) }),
    transaction: jest.fn()
  }
}));
jest.mock('../src/utils/shared/requestScope', () => ({
  schoolWhere: jest.fn(() => ({ school_id: 'school-a', branch_id: 'branch-a' })),
  resolveSchoolBranchScope: jest
    .fn()
    .mockResolvedValue({ school_id: 'school-a', branch_id: 'branch-a' })
}));

const { LibraryBook, LibraryIssue, LibraryImportBatch, LibraryImportBatchRow, User } = require('../src/models');
const { sequelize } = require('../src/config/database');
const { resolveSchoolBranchScope } = require('../src/utils/shared/requestScope');
const {
  listBooks, updateBook, issueBook, returnBook, importBooks, getLibraryImportHistory, undoLibraryImportBatch
} = require('../src/controllers/academic/library.controller');

const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const dateOffset = days => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

describe('library controller branch scope and input integrity', () => {
  beforeEach(() => jest.clearAllMocks());

  it('preserves client error status for an invalid tenant/branch scope', async () => {
    resolveSchoolBranchScope.mockRejectedValueOnce(Object.assign(new Error('Invalid branch for this school'), { statusCode: 400 }));
    const res = response();

    await listBooks({ user: { role: 'super_admin' }, query: { school_id: 'school-a', branch_id: 'foreign-branch' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(LibraryBook.findAll).not.toHaveBeenCalled();
  });

  it('only updates editable book fields and preserves issued-stock availability', async () => {
    const book = { quantity: 5, available: 3, update: jest.fn() };
    LibraryBook.findOne.mockResolvedValue(book);
    const res = response();

    await updateBook(
      {
        params: { id: 'book-a' },
        body: {
          title: 'Updated title',
          quantity: 6,
          available: 99,
          school_id: 'school-b',
          branch_id: 'branch-b',
          created_by: 'attacker'
        },
        user: { id: 'librarian-a' }
      },
      res
    );

    expect(LibraryBook.findOne).toHaveBeenCalledWith({
      where: { id: 'book-a', school_id: 'school-a', branch_id: 'branch-a' }
    });
    expect(book.update).toHaveBeenCalledWith({
      title: 'Updated title',
      quantity: 6,
      available: 4,
      updated_by: 'librarian-a'
    });
  });

  it('rejects non-positive or fractional stock quantities', async () => {
    const book = { quantity: 5, available: 5, update: jest.fn() };
    LibraryBook.findOne.mockResolvedValue(book);
    const res = response();

    await updateBook(
      { params: { id: 'book-a' }, body: { quantity: 1.5 }, user: { id: 'librarian-a' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(book.update).not.toHaveBeenCalled();
  });

  it('previews valid and invalid CSV rows without writing books', async () => {
    const res = response();
    await importBooks({
      file: { buffer: Buffer.from('\uFEFFtitle,quantity,purchase_price,purchase_date\nA Book,2,12.50,2026-10-28\n,1,,\nBad Stock,0,nope,2026-02-30\nExtra,1,1,2026-10-28,unexpected') },
      query: { preview: 'true' },
      body: { branch_id: 'forged-branch' },
      user: { id: 'librarian-a' }
    }, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ total_rows: 4, valid_rows: 1, invalid_rows: 3 })
    }));
    expect(res.json.mock.calls[0][0].data.preview_rows[3].errors).toContain('CSV row could not be parsed');
    expect(res.json.mock.calls[0][0].data.preview_rows[2].errors).toEqual(expect.arrayContaining([
      'Quantity must be a positive whole number',
      'purchase price must be a non-negative number',
      'purchase date must use a valid YYYY-MM-DD date'
    ]));
    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(LibraryBook.bulkCreate).not.toHaveBeenCalled();
  });

  it('refuses to commit invalid rows and imports valid CSV atomically within resolved branch scope', async () => {
    const invalidRes = response();
    await importBooks({
      file: { buffer: Buffer.from('title,quantity\nA Book,2\nBad Stock,0') },
      query: {},
      body: {},
      user: { id: 'librarian-a' }
    }, invalidRes);
    expect(invalidRes.status).toHaveBeenCalledWith(400);
    expect(sequelize.transaction).not.toHaveBeenCalled();

    const transaction = { id: 'transaction-a' };
    sequelize.transaction.mockImplementation(async callback => callback(transaction));
    const batch = { id: 'batch-test', update: jest.fn() };
    LibraryImportBatch.create.mockResolvedValue(batch);
    LibraryBook.bulkCreate.mockResolvedValue([{ id: 'book-test' }]);
    const res = response();
    await importBooks({
      file: { buffer: Buffer.from('title,quantity\nA Book,2') },
      query: {},
      body: { branch_id: 'forged-branch' },
      user: { id: 'librarian-a' }
    }, res);

    expect(LibraryBook.bulkCreate).toHaveBeenCalledWith([
      expect.objectContaining({ title: 'A Book', quantity: 2, available: 2, school_id: 'school-a', branch_id: 'branch-a', created_by: 'librarian-a' })
    ], { transaction, returning: true });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it('records imported books and their undo ownership in the same transaction', async () => {
    const transaction = {};
    const batch = { id: 'batch-a', update: jest.fn() };
    sequelize.transaction.mockImplementation(async callback => callback(transaction));
    LibraryImportBatch.create.mockResolvedValue(batch);
    LibraryBook.bulkCreate.mockResolvedValue([{ id: 'book-a' }]);
    const res = response();

    await importBooks({
      file: { originalname: 'books.csv', buffer: Buffer.from('title,quantity\nA Book,1') },
      query: {}, body: {}, user: { id: 'librarian-a' }
    }, res);

    expect(LibraryImportBatch.create).toHaveBeenCalledWith(expect.objectContaining({
      school_id: 'school-a', branch_id: 'branch-a', imported_by: 'librarian-a', file_name: 'books.csv'
    }), { transaction });
    expect(LibraryBook.bulkCreate).toHaveBeenCalledWith(expect.any(Array), { transaction, returning: true });
    expect(LibraryImportBatchRow.bulkCreate).toHaveBeenCalledWith(
      [{ batch_id: 'batch-a', book_id: 'book-a' }], { transaction }
    );
    expect(batch.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'completed', successful_rows: 1, undo_ready: true
    }), { transaction });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { imported: 1, batch_id: 'batch-a' } }));
  });

  it('lists recent imports in the resolved school and branch scope', async () => {
    LibraryImportBatch.findAll.mockResolvedValue([{ id: 'batch-a' }]);
    const res = response();
    await getLibraryImportHistory({ query: { branch_id: 'forged-branch' }, user: { role: 'branch_admin' } }, res, jest.fn());

    expect(LibraryImportBatch.findAll.mock.calls[0][0].where).toEqual({ school_id: 'school-a', branch_id: 'branch-a' });
    expect(LibraryImportBatch.findAll.mock.calls[0][0].limit).toBe(20);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'batch-a' }] });
  });

  it('undoes only unchanged imported books with no issue history', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    const batch = {
      id: 'batch-a', school_id: 'school-a', branch_id: 'branch-a', status: 'completed',
      undo_ready: true, successful_rows: 1, update: jest.fn()
    };
    const timestamp = new Date('2026-01-01T00:00:00Z');
    sequelize.transaction.mockImplementation(async (options, callback) => callback(transaction));
    LibraryImportBatch.findOne.mockResolvedValue(batch);
    LibraryImportBatchRow.findAll.mockResolvedValue([{ book_id: 'book-a' }]);
    LibraryBook.findAll.mockResolvedValue([{ id: 'book-a', created_at: timestamp, updated_at: timestamp }]);
    LibraryIssue.findOne.mockResolvedValue(null);
    LibraryBook.destroy.mockResolvedValue(1);
    const res = response();
    const next = jest.fn();

    await undoLibraryImportBatch({
      params: { id: 'batch-a' }, query: { branch_id: 'forged-branch' }, user: { id: 'librarian-a', role: 'branch_admin' }
    }, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(LibraryImportBatch.findOne.mock.calls[0][0].where).toEqual({
      id: 'batch-a', school_id: 'school-a', branch_id: 'branch-a'
    });
    expect(LibraryBook.destroy).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { [require('sequelize').Op.in]: ['book-a'] }, school_id: 'school-a', branch_id: 'branch-a' },
      transaction
    }));
    expect(batch.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'undone', undo_ready: false }), { transaction });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { batch_id: 'batch-a', books_removed: 1 } }));
  });

  it('blocks undo when an imported book has issue history', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    const batch = { id: 'batch-a', school_id: 'school-a', branch_id: 'branch-a', status: 'completed', undo_ready: true, successful_rows: 1, update: jest.fn() };
    const timestamp = new Date('2026-01-01T00:00:00Z');
    sequelize.transaction.mockImplementation(async (options, callback) => callback(transaction));
    LibraryImportBatch.findOne.mockResolvedValue(batch);
    LibraryImportBatchRow.findAll.mockResolvedValue([{ book_id: 'book-a' }]);
    LibraryBook.findAll.mockResolvedValue([{ id: 'book-a', created_at: timestamp, updated_at: timestamp }]);
    LibraryIssue.findOne.mockResolvedValue({ id: 'issue-a' });
    const next = jest.fn();

    await undoLibraryImportBatch({ params: { id: 'batch-a' }, query: {}, user: { id: 'librarian-a' } }, response(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409, message: 'Undo blocked: imported books have issue history.' }));
    expect(LibraryBook.destroy).not.toHaveBeenCalled();
    expect(batch.update).not.toHaveBeenCalled();
  });

  it('rejects issuing a book to a user from another branch', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' }, rollback: jest.fn(), commit: jest.fn() };
    const book = { available: 1, update: jest.fn() };
    sequelize.transaction.mockResolvedValue(transaction);
    LibraryBook.findOne.mockResolvedValue(book);
    User.findOne.mockResolvedValue(null);
    const res = response();

    await issueBook(
      {
        body: {
          book_id: 'book-a',
          borrower_type: 'staff',
          user_id: 'user-other-branch',
          due_date: dateOffset(14)
        },
        user: { id: 'librarian-a' }
      },
      res
    );

    expect(User.findOne).toHaveBeenCalledWith({
      where: {
        id: 'user-other-branch',
        school_id: 'school-a',
        branch_id: 'branch-a',
        role: ['admin', 'branch_admin', 'teacher', 'accountant', 'receptionist', 'librarian']
      },
      transaction
    });
    expect(LibraryBook.findOne).toHaveBeenCalledWith({
      where: { id: 'book-a', school_id: 'school-a', branch_id: 'branch-a' },
      transaction,
      lock: 'UPDATE'
    });
    expect(LibraryIssue.create).not.toHaveBeenCalled();
    expect(book.update).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it.each([
    [{ issue_date: '2026-02-30', due_date: '2026-03-01' }, 'Issue and due dates must be valid, and due date cannot be before issue date'],
    [{ issue_date: '2026-10-29', due_date: '2026-10-28' }, 'Issue and due dates must be valid, and due date cannot be before issue date'],
    [{ fine_per_day: -1 }, 'Fine per day must be a non-negative amount'],
    [{ fine_per_day: 'Infinity' }, 'Fine per day must be a non-negative amount'],
    [{ fine_per_day: true }, 'Fine per day must be a non-negative amount']
  ])('rejects invalid loan dates/fines before opening a transaction', async (override, message) => {
    const res = response();
    await issueBook({
      body: { book_id: 'book-a', borrower_type: 'other', borrower_name: 'Visitor', issue_date: '2026-10-27', due_date: '2026-11-10', fine_per_day: 0, ...override },
      user: { id: 'librarian-a' }
    }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message });
    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(LibraryBook.findOne).not.toHaveBeenCalled();
  });

  it('locks and decrements stock when a valid loan is created', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' }, rollback: jest.fn(), commit: jest.fn() };
    const book = { available: 1, update: jest.fn() };
    sequelize.transaction.mockResolvedValue(transaction);
    LibraryBook.findOne.mockResolvedValue(book);
    LibraryIssue.create.mockResolvedValue({ id: 'issue-a' });
    const res = response();

    await issueBook(
      {
        body: {
          book_id: 'book-a', borrower_type: 'other', borrower_name: 'Visitor',
          due_date: dateOffset(14), fine_per_day: 2.5
        },
        user: { id: 'librarian-a' }
      },
      res
    );

    expect(LibraryBook.findOne).toHaveBeenCalledWith({
      where: { id: 'book-a', school_id: 'school-a', branch_id: 'branch-a' },
      transaction,
      lock: 'UPDATE'
    });
    expect(book.update).toHaveBeenCalledWith({ available: 0 }, { transaction });
    expect(LibraryIssue.create.mock.calls[0][0]).toMatchObject({ fine_per_day: 2.5 });
    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(transaction.rollback).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('locks an issue before returning so duplicate returns cannot increase stock twice', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' }, rollback: jest.fn(), commit: jest.fn() };
    const issue = { status: 'returned' };
    LibraryIssue.findOne.mockResolvedValue(issue);
    sequelize.transaction.mockResolvedValue(transaction);
    const res = response();

    await returnBook({ params: { id: 'issue-a' }, user: { id: 'librarian-a' } }, res);

    expect(LibraryIssue.findOne).toHaveBeenCalledWith({
      where: { id: 'issue-a', school_id: 'school-a', branch_id: 'branch-a' },
      transaction,
      lock: 'UPDATE'
    });
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  it('records a late-return fine and restores book availability', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' }, rollback: jest.fn(), commit: jest.fn() };
    const dueDate = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    const issue = {
      id: 'issue-a', book_id: 'book-a', status: 'issued', due_date: dueDate, fine_per_day: 3.5,
      update: jest.fn(async values => Object.assign(issue, values))
    };
    const book = { available: 2, update: jest.fn() };
    sequelize.transaction.mockResolvedValue(transaction);
    LibraryIssue.findOne.mockResolvedValue(issue);
    LibraryBook.findByPk.mockResolvedValue(book);
    const res = response();

    await returnBook({ params: { id: 'issue-a' }, user: { id: 'librarian-a' } }, res);

    expect(issue.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'returned', fine_amount: 7 }),
      { transaction }
    );
    expect(book.update).toHaveBeenCalledWith({ available: 3 }, { transaction });
    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
