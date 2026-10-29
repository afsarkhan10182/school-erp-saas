const { LibraryBook, LibraryIssue, LibraryImportBatch, LibraryImportBatchRow, Branch, Student, User } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { sequelize } = require('~/config/database');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');
const { Op, Transaction } = require('sequelize');
const ApiError = require('~/utils/shared/ApiError');
const Papa = require('papaparse');

const baseBookFields = ['id', 'title', 'author', 'isbn', 'category', 'quantity', 'available', 'school_id', 'branch_id'];
const parityBookFields = ['publisher', 'edition', 'purchase_date', 'purchase_price', 'sale_price', 'cover_image'];
let libraryBookColumns;

const isValidDateOnly = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const getBookFields = async () => {
  if (!libraryBookColumns) {
    libraryBookColumns = await sequelize.getQueryInterface().describeTable('library_books').catch(() => ({}));
  }
  const has = field => !!libraryBookColumns[field];
  return {
    attributes: [...baseBookFields, ...parityBookFields.filter(has)],
    parityFields: parityBookFields.filter(has)
  };
};

const pickFields = (body, fields) =>
  fields.reduce((out, field) => {
    if (body[field] !== undefined) out[field] = body[field] || null;
    return out;
  }, {});

const listBooks = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    const { attributes } = await getBookFields();
    const books = await LibraryBook.findAll({
      where,
      attributes,
      order: [['title', 'ASC']]
    });
    return res.json({ success: true, data: { books } });
  } catch (error) {
    logger.error('library books list', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const listBorrowers = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = {
      school_id: scope.school_id,
      role: [
        'admin',
        'branch_admin',
        'teacher',
        'accountant',
        'receptionist',
        'librarian',
        'parent'
      ]
    };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    const users = await User.findAll({
      where,
      attributes: ['id', 'first_name', 'last_name', 'role'],
      order: [
        ['first_name', 'ASC'],
        ['last_name', 'ASC']
      ]
    });
    return res.json({ success: true, data: { users } });
  } catch (error) {
    logger.error('library borrowers list', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const listStudents = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    const students = await Student.findAll({
      where: { school_id: scope.school_id, branch_id: scope.branch_id },
      attributes: ['id', 'first_name', 'last_name', 'admission_number'],
      order: [
        ['first_name', 'ASC'],
        ['last_name', 'ASC']
      ]
    });
    return res.json({ success: true, data: { students } });
  } catch (error) {
    logger.error('library students list', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const createBook = async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    const quantity = Math.max(1, Number(req.body.quantity || 1));
    const { parityFields } = await getBookFields();
    const book = await LibraryBook.create({
      title: req.body.title,
      author: req.body.author,
      isbn: req.body.isbn,
      category: req.body.category,
      ...pickFields(req.body, parityFields),
      quantity,
      available: quantity,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      created_by: req.user.id
    });
    return res.status(201).json({ success: true, data: { book } });
  } catch (error) {
    logger.error('library books create', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const updateBook = async (req, res) => {
  try {
    const book = await LibraryBook.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!book) return res.status(404).json({ success: false, message: 'Not found' });
    const { parityFields } = await getBookFields();
    const editableFields = ['title', 'author', 'isbn', 'category', ...parityFields];
    if (req.body.title !== undefined && !String(req.body.title).trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    const changes = pickFields(req.body, editableFields);
    if (req.body.quantity !== undefined) {
      const quantity = Number(req.body.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res
          .status(400)
          .json({ success: false, message: 'Quantity must be a positive whole number' });
      }
      const issued = book.quantity - book.available;
      changes.quantity = quantity;
      changes.available = Math.max(0, quantity - issued);
    }
    changes.updated_by = req.user.id;
    await book.update(changes);
    return res.json({ success: true, data: { book } });
  } catch (error) {
    logger.error('library books update', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const importBooks = async (req, res) => {
  try {
    if (!req.file?.buffer) return res.status(400).json({ success: false, message: 'CSV file is required' });
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    const { parityFields } = await getBookFields();
    const parsed = Papa.parse(req.file.buffer.toString('utf8').replace(/^\uFEFF/, ''), {
      header: true,
      skipEmptyLines: true
    });
    const parseErrorRows = new Set(parsed.errors.map(error => error.row));
    const rows = [];
    const previewRows = [];
    parsed.data.forEach((source, index) => {
      const title = String(source.title || source.book_title || source.name || '').trim();
      const rawQuantity = source.quantity || source.qty || '1';
      const quantity = Number(rawQuantity);
      const errors = [];
      if (!title) errors.push('Book title is required');
      if (!Number.isInteger(quantity) || quantity < 1) errors.push('Quantity must be a positive whole number');
      if (parseErrorRows.has(index)) errors.push('CSV row could not be parsed');
      const lengthLimits = { title: 255, author: 255, isbn: 50, category: 100, publisher: 255, edition: 100, cover_image: 255 };
      Object.entries(lengthLimits).forEach(([field, max]) => {
        if ((field === 'title' || parityFields.includes(field)) && String(source[field] || '').length > max) {
          errors.push(`${field.replace('_', ' ')} must be ${max} characters or fewer`);
        }
      });
      const optionalNumbers = {};
      ['purchase_price', 'sale_price'].forEach(field => {
        if (!parityFields.includes(field) || !String(source[field] || '').trim()) return;
        const amount = Number(source[field]);
        if (!Number.isFinite(amount) || amount < 0) errors.push(`${field.replace('_', ' ')} must be a non-negative number`);
        else optionalNumbers[field] = amount;
      });
      if (parityFields.includes('purchase_date') && String(source.purchase_date || '').trim()) {
        const date = String(source.purchase_date).trim();
        const parsedDate = new Date(`${date}T00:00:00.000Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
          errors.push('purchase date must use a valid YYYY-MM-DD date');
        }
      }

      const row = {
        title,
        author: source.author,
        isbn: source.isbn,
        category: source.category,
        ...pickFields(source, parityFields),
        ...optionalNumbers,
        quantity,
        available: quantity,
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        created_by: req.user.id
      };
      if (!errors.length) rows.push(row);
      previewRows.push({
        row_number: index + 2,
        title: title || '—',
        author: String(source.author || ''),
        isbn: String(source.isbn || ''),
        category: String(source.category || ''),
        quantity: Number.isFinite(quantity) ? quantity : String(rawQuantity),
        errors
      });
    });

    if (req.query.preview === 'true') {
      return res.json({
        success: true,
        data: {
          total_rows: parsed.data.length,
          valid_rows: rows.length,
          invalid_rows: parsed.data.length - rows.length,
          preview_rows: previewRows.slice(0, 50)
        }
      });
    }
    if (!rows.length || rows.length !== parsed.data.length) {
      return res.status(400).json({
        success: false,
        message: rows.length ? 'Fix invalid rows before importing the CSV' : 'No valid books found in CSV',
        data: {
          total_rows: parsed.data.length,
          valid_rows: rows.length,
          invalid_rows: parsed.data.length - rows.length,
          preview_rows: previewRows.slice(0, 50)
        }
      });
    }
    let batchId;
    const fileName = String(req.file.originalname || 'library.csv').split(/[\\/]/).pop().slice(0, 255);
    await sequelize.transaction(async transaction => {
      const batch = await LibraryImportBatch.create({
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        imported_by: req.user.id,
        file_name: fileName,
        status: 'in_progress',
        total_rows: rows.length
      }, { transaction });
      const createdBooks = await LibraryBook.bulkCreate(rows, { transaction, returning: true });
      if (createdBooks.length !== rows.length || createdBooks.some(book => !book.id)) {
        throw new Error('Could not verify ownership of all imported library books');
      }
      await LibraryImportBatchRow.bulkCreate(
        createdBooks.map(book => ({ batch_id: batch.id, book_id: book.id })),
        { transaction }
      );
      await batch.update({
        status: 'completed',
        successful_rows: createdBooks.length,
        undo_ready: true,
        completed_at: new Date()
      }, { transaction });
      batchId = batch.id;
    });
    return res.status(201).json({ success: true, data: { imported: rows.length, batch_id: batchId } });
  } catch (error) {
    logger.error('library books import', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getLibraryImportHistory = async (req, res, next) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    const batches = await LibraryImportBatch.findAll({
      where,
      attributes: [
        'id', 'branch_id', 'imported_by', 'file_name', 'status', 'total_rows',
        'successful_rows', 'failed_rows', 'created_at', 'completed_at', 'undo_ready',
        'undone_at', 'undo_details'
      ],
      include: [{ model: Branch, as: 'branch', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
      limit: 20
    });
    return res.status(200).json({ success: true, data: batches });
  } catch (error) {
    return next(error);
  }
};

const undoLibraryImportBatch = async (req, res, next) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const result = await sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async transaction => {
        const where = { id: req.params.id, school_id: scope.school_id };
        if (scope.branch_id) where.branch_id = scope.branch_id;
        const batch = await LibraryImportBatch.findOne({ where, transaction, lock: transaction.LOCK.UPDATE });
        if (!batch) throw new ApiError(404, 'Library import batch not found');
        if (batch.undone_at || batch.status === 'undone') throw new ApiError(409, 'This library import was already undone');
        if (batch.status !== 'completed' || !batch.undo_ready || !batch.branch_id) {
          throw new ApiError(409, 'This import does not have complete undo ownership records');
        }

        const rows = await LibraryImportBatchRow.findAll({
          where: { batch_id: batch.id },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        const bookIds = rows.map(row => row.book_id);
        if (
          rows.length !== batch.successful_rows ||
          bookIds.some(id => !id) ||
          new Set(bookIds).size !== bookIds.length
        ) {
          throw new ApiError(409, 'Import ownership records are incomplete; no books were changed');
        }

        const books = await LibraryBook.findAll({
          where: { id: { [Op.in]: bookIds }, school_id: batch.school_id, branch_id: batch.branch_id },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (books.length !== bookIds.length) {
          throw new ApiError(409, 'Some imported books moved or no longer exist; no books were changed');
        }
        if (books.some(book => new Date(book.updated_at).getTime() > new Date(book.created_at).getTime())) {
          throw new ApiError(409, 'Imported books were edited after the import; no books were changed');
        }
        const issue = await LibraryIssue.findOne({
          where: { book_id: { [Op.in]: bookIds }, school_id: batch.school_id },
          attributes: ['id'],
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (issue) throw new ApiError(409, 'Undo blocked: imported books have issue history.');

        const removed = await LibraryBook.destroy({
          where: { id: { [Op.in]: bookIds }, school_id: batch.school_id, branch_id: batch.branch_id },
          transaction
        });
        if (removed !== bookIds.length) throw new ApiError(409, 'Imported books changed during undo; no batch was marked undone');
        await batch.update({
          status: 'undone',
          undo_ready: false,
          undone_at: new Date(),
          undone_by: req.user.id,
          undo_details: { books_removed: removed }
        }, { transaction });
        return { books_removed: removed };
      }
    );

    return res.status(200).json({
      success: true,
      data: { batch_id: req.params.id, ...result },
      message: `Import undone. ${result.books_removed} books removed.`
    });
  } catch (error) {
    return next(error);
  }
};

const listIssues = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.query.status) where.status = req.query.status;
    const issues = await LibraryIssue.findAll({
      where,
      include: [
        { model: LibraryBook, as: 'book', attributes: ['id', 'title'] },
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number']
        }
      ],
      order: [['issue_date', 'DESC']]
    });
    return res.json({ success: true, data: { issues } });
  } catch (error) {
    logger.error('library issues list', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const issueBook = async (req, res) => {
  const body = req.body || {};
  const issueDate = body.issue_date || new Date().toISOString().slice(0, 10);
  const dueDate = body.due_date;
  const rawFinePerDay = body.fine_per_day;
  const finePerDay = rawFinePerDay === undefined || rawFinePerDay === null || rawFinePerDay === ''
    ? 0
    : typeof rawFinePerDay === 'number' || typeof rawFinePerDay === 'string'
      ? Number(rawFinePerDay)
      : Number.NaN;
  if (!isValidDateOnly(issueDate) || !isValidDateOnly(dueDate) || dueDate < issueDate) {
    return res.status(400).json({ success: false, message: 'Issue and due dates must be valid, and due date cannot be before issue date' });
  }
  if (!Number.isFinite(finePerDay) || finePerDay < 0) {
    return res.status(400).json({ success: false, message: 'Fine per day must be a non-negative amount' });
  }

  const t = await sequelize.transaction();
  try {
    const { book_id, student_id, user_id } = body;
    const borrowerType = body.borrower_type || 'student';
    if (!book_id || !['student', 'staff', 'parent', 'other'].includes(borrowerType)) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: 'Valid book, borrower type and due date are required' });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    const book = await LibraryBook.findOne({
      where: { id: book_id, school_id: scope.school_id, branch_id: scope.branch_id },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!book || book.available < 1) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Book not available' });
    }
    let borrowerName = body.borrower_name || '';
    if (borrowerType === 'student') {
      const student = await Student.findOne({
        where: { id: student_id, school_id: scope.school_id, branch_id: scope.branch_id },
        transaction: t
      });
      if (!student) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Invalid student for this branch' });
      }
      borrowerName = `${student.first_name} ${student.last_name || ''}`.trim();
    } else if (borrowerType === 'other') {
      if (typeof borrowerName !== 'string' || !borrowerName.trim()) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Borrower name is required' });
      }
    } else if (user_id) {
      const borrowerWhere = {
        id: user_id,
        school_id: scope.school_id,
        role:
          borrowerType === 'parent'
            ? 'parent'
            : ['admin', 'branch_admin', 'teacher', 'accountant', 'receptionist', 'librarian']
      };
      if (scope.branch_id) borrowerWhere.branch_id = scope.branch_id;
      const user = await User.findOne({ where: borrowerWhere, transaction: t });
      if (!user) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: 'Invalid borrower user for this branch' });
      }
      borrowerName = `${user.first_name} ${user.last_name || ''}`.trim() || user.email;
    } else {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Borrower is required' });
    }
    const issue = await LibraryIssue.create(
      {
        book_id,
        student_id: borrowerType === 'student' ? student_id : null,
        user_id: borrowerType === 'student' ? null : user_id || null,
        borrower_type: borrowerType,
        borrower_name: borrowerName,
        issue_date: issueDate,
        due_date: dueDate,
        fine_per_day: finePerDay || null,
        fine_amount: 0,
        status: 'issued',
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        created_by: req.user.id
      },
      { transaction: t }
    );
    await book.update({ available: book.available - 1 }, { transaction: t });
    await t.commit();
    return res.status(201).json({ success: true, data: { issue } });
  } catch (error) {
    await t.rollback();
    logger.error('library issue', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const returnBook = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const issue = await LibraryIssue.findOne({
      where: { id: req.params.id, ...schoolWhere(req) },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!issue || issue.status === 'returned') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Issue not found or already returned' });
    }
    const book = await LibraryBook.findByPk(issue.book_id, { transaction: t, lock: t.LOCK.UPDATE });
    const returnDate = new Date().toISOString().slice(0, 10);
    const lateDays = Math.max(
      0,
      Math.ceil((new Date(returnDate) - new Date(issue.due_date)) / 86400000)
    );
    const fineAmount = lateDays * Number(issue.fine_per_day || 0);
    await issue.update(
      { status: 'returned', return_date: returnDate, fine_amount: fineAmount },
      { transaction: t }
    );
    if (book) await book.update({ available: book.available + 1 }, { transaction: t });
    await t.commit();
    return res.json({ success: true, data: { issue } });
  } catch (error) {
    await t.rollback();
    logger.error('library return', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listBooks,
  listBorrowers,
  listStudents,
  createBook,
  updateBook,
  importBooks,
  getLibraryImportHistory,
  undoLibraryImportBatch,
  listIssues,
  issueBook,
  returnBook
};
