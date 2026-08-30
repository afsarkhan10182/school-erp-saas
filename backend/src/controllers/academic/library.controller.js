const { LibraryBook, LibraryIssue, Student, User } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { sequelize } = require('~/config/database');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');
const Papa = require('papaparse');

const baseBookFields = ['id', 'title', 'author', 'isbn', 'category', 'quantity', 'available', 'school_id', 'branch_id'];
const parityBookFields = ['publisher', 'edition', 'purchase_date', 'purchase_price', 'sale_price', 'cover_image'];
let libraryBookColumns;

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
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateBook = async (req, res) => {
  try {
    const book = await LibraryBook.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!book) return res.status(404).json({ success: false, message: 'Not found' });
    const { parityFields } = await getBookFields();
    const changes = { ...req.body, updated_by: req.user.id };
    delete changes.school_id;
    delete changes.branch_id;
    parityBookFields.filter(field => !parityFields.includes(field)).forEach(field => delete changes[field]);
    if (changes.quantity !== undefined) {
      const quantity = Math.max(1, Number(changes.quantity));
      const issued = book.quantity - book.available;
      changes.quantity = quantity;
      changes.available = Math.max(0, quantity - issued);
    }
    await book.update(changes);
    return res.json({ success: true, data: { book } });
  } catch (error) {
    logger.error('library books update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const importBooks = async (req, res) => {
  try {
    if (!req.file?.buffer) return res.status(400).json({ success: false, message: 'CSV file is required' });
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    const { parityFields } = await getBookFields();
    const parsed = Papa.parse(req.file.buffer.toString('utf8'), { header: true, skipEmptyLines: true });
    const rows = parsed.data.map(row => {
      const quantity = Math.max(1, Number(row.quantity || row.qty || 1));
      return {
        title: row.title || row.book_title || row.name,
        author: row.author,
        isbn: row.isbn,
        category: row.category,
        ...pickFields(row, parityFields),
        quantity,
        available: quantity,
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        created_by: req.user.id
      };
    }).filter(row => row.title);
    if (!rows.length) return res.status(400).json({ success: false, message: 'No valid books found in CSV' });
    await LibraryBook.bulkCreate(rows);
    return res.status(201).json({ success: true, data: { imported: rows.length } });
  } catch (error) {
    logger.error('library books import', error);
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

const issueBook = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { book_id, student_id, user_id, due_date } = req.body;
    const borrowerType = req.body.borrower_type || 'student';
    if (!book_id || !due_date) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: 'book_id and due_date are required' });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    const book = await LibraryBook.findOne({
      where: { id: book_id, school_id: scope.school_id, branch_id: scope.branch_id },
      transaction: t
    });
    if (!book || book.available < 1) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Book not available' });
    }
    let borrowerName = req.body.borrower_name || '';
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
    } else if (user_id) {
      const user = await User.findOne({ where: { id: user_id, school_id: scope.school_id }, transaction: t });
      if (!user) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Invalid borrower user for this school' });
      }
      borrowerName = `${user.first_name} ${user.last_name || ''}`.trim() || user.email;
    }
    const issue = await LibraryIssue.create(
      {
        book_id,
        student_id: borrowerType === 'student' ? student_id : null,
        user_id: borrowerType === 'student' ? null : (user_id || null),
        borrower_type: borrowerType,
        borrower_name: borrowerName,
        issue_date: req.body.issue_date || new Date().toISOString().slice(0, 10),
        due_date,
        fine_per_day: req.body.fine_per_day || null,
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

const returnBook = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const issue = await LibraryIssue.findOne({
      where: { id: req.params.id, ...schoolWhere(req) },
      transaction: t
    });
    if (!issue || issue.status === 'returned') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Issue not found or already returned' });
    }
    const book = await LibraryBook.findByPk(issue.book_id, { transaction: t });
    const returnDate = new Date().toISOString().slice(0, 10);
    const lateDays = Math.max(0, Math.ceil((new Date(returnDate) - new Date(issue.due_date)) / 86400000));
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { listBooks, createBook, updateBook, importBooks, listIssues, issueBook, returnBook };
