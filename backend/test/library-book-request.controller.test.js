require('module-alias/register');

jest.mock('../src/models', () => ({
  LibraryBook: { findOne: jest.fn() },
  LibraryBookRequest: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  LibraryIssue: { create: jest.fn() },
  Parent: { findOne: jest.fn() },
  Student: { findOne: jest.fn() }
}));
jest.mock('../src/config/database', () => ({ sequelize: { transaction: jest.fn() } }));
jest.mock('../src/utils/shared/requestScope', () => ({
  resolveSchoolBranchScope: jest
    .fn()
    .mockResolvedValue({ school_id: 'school-a', branch_id: 'branch-a' }),
  schoolWhere: jest.fn(() => ({ school_id: 'school-a', branch_id: 'branch-a' }))
}));

const { LibraryBook, LibraryBookRequest, LibraryIssue, Parent, Student } = require('../src/models');
const { sequelize } = require('../src/config/database');
const { resolveSchoolBranchScope } = require('../src/utils/shared/requestScope');
const {
  listLibraryBookRequests,
  createPortalLibraryBookRequest,
  decideLibraryBookRequest,
  fulfillLibraryBookRequest
} = require('../src/controllers/academic/library-book-request.controller');

const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
let transaction;

describe('library book request lifecycle and scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transaction = { LOCK: { UPDATE: 'UPDATE' }, commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(transaction);
  });

  it('allows a parent to request only a linked child book in that child branch', async () => {
    const child = { id: 'student-a', school_id: 'school-a', branch_id: 'branch-a' };
    Parent.findOne.mockResolvedValue({ students: [child] });
    LibraryBook.findOne.mockResolvedValue({ id: 'book-a', available: 2 });
    LibraryBookRequest.findOne.mockResolvedValue(null);
    LibraryBookRequest.create.mockResolvedValue({ id: 'request-a', status: 'pending' });
    const res = response();

    await createPortalLibraryBookRequest(
      {
        user: { id: 'parent-a', role: 'parent' },
        schoolId: 'school-a',
        body: { student_id: 'student-a', book_id: 'book-a' }
      },
      res
    );

    expect(LibraryBook.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'book-a', school_id: 'school-a' }),
        transaction
      })
    );
    expect(LibraryBookRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: 'student-a',
        requested_by_user_id: 'parent-a',
        branch_id: 'branch-a'
      }),
      { transaction }
    );
    expect(transaction.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('preserves expected scope errors for the request queue instead of returning HTTP 500', async () => {
    resolveSchoolBranchScope.mockRejectedValueOnce(Object.assign(new Error('Invalid branch for this school'), { statusCode: 400 }));
    const res = response();

    await listLibraryBookRequests({ user: { role: 'super_admin' }, query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(LibraryBookRequest.findAll).not.toHaveBeenCalled();
  });

  it('rejects an unlinked child before looking up or creating a request', async () => {
    Parent.findOne.mockResolvedValue({ students: [] });
    const res = response();
    await createPortalLibraryBookRequest(
      {
        user: { id: 'parent-a', role: 'parent' },
        schoolId: 'school-a',
        body: { student_id: 'other-student', book_id: 'book-a' }
      },
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(LibraryBook.findOne).not.toHaveBeenCalled();
    expect(LibraryBookRequest.create).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalled();
  });

  it('rejects unavailable copies and duplicate active requests without creating rows', async () => {
    Parent.findOne.mockResolvedValue({
      students: [{ id: 'student-a', school_id: 'school-a', branch_id: 'branch-a' }]
    });
    const unavailable = response();
    LibraryBook.findOne.mockResolvedValue({ id: 'book-a', available: 0 });
    await createPortalLibraryBookRequest(
      {
        user: { id: 'parent-a', role: 'parent' },
        schoolId: 'school-a',
        body: { student_id: 'student-a', book_id: 'book-a' }
      },
      unavailable
    );
    expect(unavailable.status).toHaveBeenCalledWith(409);

    const duplicate = response();
    LibraryBook.findOne.mockResolvedValue({ id: 'book-a', available: 1 });
    LibraryBookRequest.findOne.mockResolvedValue({ id: 'existing-request' });
    await createPortalLibraryBookRequest(
      {
        user: { id: 'parent-a', role: 'parent' },
        schoolId: 'school-a',
        body: { student_id: 'student-a', book_id: 'book-a' }
      },
      duplicate
    );
    expect(duplicate.status).toHaveBeenCalledWith(409);
    expect(LibraryBookRequest.create).not.toHaveBeenCalled();
  });

  it('reserves a copy on approval and releases it on rejection', async () => {
    const book = {
      available: 2,
      update: jest.fn(function (data) {
        Object.assign(this, data);
      })
    };
    const request = {
      status: 'pending',
      book_id: 'book-a',
      school_id: 'school-a',
      branch_id: 'branch-a',
      update: jest.fn(function (data) {
        Object.assign(this, data);
      })
    };
    LibraryBookRequest.findOne.mockResolvedValue(request);
    LibraryBook.findOne.mockResolvedValue(book);
    const approveRes = response();
    await decideLibraryBookRequest(
      { params: { id: 'request-a' }, body: { status: 'approved' }, user: { id: 'librarian-a' } },
      approveRes
    );
    expect(LibraryBookRequest.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'request-a', school_id: 'school-a', branch_id: 'branch-a' },
        transaction
      })
    );
    expect(book.update).toHaveBeenCalledWith({ available: 1 }, { transaction });
    expect(request.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'approved', decided_by: 'librarian-a' }),
      { transaction }
    );

    request.status = 'approved';
    const rejectRes = response();
    await decideLibraryBookRequest(
      { params: { id: 'request-a' }, body: { status: 'rejected' }, user: { id: 'librarian-a' } },
      rejectRes
    );
    expect(book.update).toHaveBeenLastCalledWith({ available: 2 }, { transaction });
  });

  it('fulfills only approved requests by creating a normal issue and linking it', async () => {
    const request = {
      id: 'request-a',
      status: 'approved',
      book_id: 'book-a',
      student_id: 'student-a',
      school_id: 'school-a',
      branch_id: 'branch-a',
      update: jest.fn()
    };
    LibraryBookRequest.findOne.mockResolvedValue(request);
    LibraryBook.findOne.mockResolvedValue({ id: 'book-a' });
    Student.findOne.mockResolvedValue({ id: 'student-a', first_name: 'Sarah', last_name: 'Demo' });
    LibraryIssue.create.mockResolvedValue({ id: 'issue-a' });
    const res = response();

    await fulfillLibraryBookRequest(
      { params: { id: 'request-a' }, user: { id: 'librarian-a' } },
      res
    );

    expect(LibraryIssue.create).toHaveBeenCalledWith(
      expect.objectContaining({
        book_id: 'book-a',
        student_id: 'student-a',
        borrower_name: 'Sarah Demo',
        school_id: 'school-a',
        branch_id: 'branch-a'
      }),
      { transaction }
    );
    expect(request.update).toHaveBeenCalledWith(
      { status: 'fulfilled', library_issue_id: 'issue-a' },
      { transaction }
    );
    expect(transaction.commit).toHaveBeenCalled();
  });
});
