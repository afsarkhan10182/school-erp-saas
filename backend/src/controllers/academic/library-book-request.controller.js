const { LibraryBook, LibraryBookRequest, LibraryIssue, Parent, Student } = require('~/models');
const { sequelize } = require('~/config/database');
const { resolveSchoolBranchScope, schoolWhere } = require('~/utils/shared/requestScope');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');

const resolvePortalStudent = async (req, requestedId, transaction) => {
  const schoolId = req.schoolId || req.user.school_id;
  if (!schoolId) return null;
  if (req.user.role === 'student') {
    return Student.findOne({
      where: {
        user_id: req.user.id,
        school_id: schoolId,
        ...(requestedId ? { id: requestedId } : {})
      },
      transaction
    });
  }
  const parent = await Parent.findOne({
    where: { user_id: req.user.id },
    include: [{ model: Student, as: 'students', attributes: ['id', 'school_id', 'branch_id'] }],
    transaction
  });
  return (
    (parent?.students || []).find(
      student => student.school_id === schoolId && (!requestedId || student.id === requestedId)
    ) || null
  );
};

const listLibraryBookRequests = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (
      req.query.status &&
      ['pending', 'approved', 'fulfilled', 'rejected'].includes(req.query.status)
    )
      where.status = req.query.status;
    const requests = await LibraryBookRequest.findAll({
      where,
      include: [
        { model: LibraryBook, as: 'book', attributes: ['id', 'title', 'available', 'quantity'] },
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 200
    });
    return res.json({ success: true, data: requests });
  } catch (error) {
    logger.error('library requests list', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const listPortalLibraryBookRequests = async (req, res) => {
  try {
    const student = await resolvePortalStudent(req, req.query.student_id);
    if (!student)
      return res.status(404).json({ success: false, message: 'Linked student not found' });
    const requests = await LibraryBookRequest.findAll({
      where: { student_id: student.id, school_id: student.school_id },
      include: [{ model: LibraryBook, as: 'book', attributes: ['id', 'title', 'author'] }],
      order: [['created_at', 'DESC']],
      limit: 50
    });
    return res.json({ success: true, data: requests });
  } catch (error) {
    logger.error('portal library requests list', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const createPortalLibraryBookRequest = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const student = await resolvePortalStudent(req, req.body.student_id, transaction);
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Linked student not found' });
    }
    const book = await LibraryBook.findOne({
      where: {
        id: req.body.book_id,
        school_id: student.school_id,
        [Op.or]: [{ branch_id: student.branch_id }, { branch_id: null }]
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!book) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Book not found for this branch' });
    }
    if (book.available < 1) {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: 'No copies are currently available' });
    }
    const existing = await LibraryBookRequest.findOne({
      where: {
        student_id: student.id,
        book_id: book.id,
        status: { [Op.in]: ['pending', 'approved'] }
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (existing) {
      await transaction.rollback();
      return res
        .status(409)
        .json({ success: false, message: 'An active request already exists for this book' });
    }
    const request = await LibraryBookRequest.create(
      {
        book_id: book.id,
        student_id: student.id,
        requested_by_user_id: req.user.id,
        status: 'pending',
        school_id: student.school_id,
        branch_id: student.branch_id
      },
      { transaction }
    );
    await transaction.commit();
    return res.status(201).json({ success: true, data: request });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    logger.error('portal library request create', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const decideLibraryBookRequest = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const request = await LibraryBookRequest.findOne({
      where: { id: req.params.id, ...schoolWhere(req) },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!request || !['pending', 'approved'].includes(request.status)) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Active request not found' });
    }
    const decision = req.body.status;
    if (!['approved', 'rejected'].includes(decision)) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, message: 'Status must be approved or rejected' });
    }
    const book = await LibraryBook.findOne({
      where: {
        id: request.book_id,
        school_id: request.school_id,
        [Op.or]: [{ branch_id: request.branch_id }, { branch_id: null }]
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!book) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Requested book not found' });
    }
    if (request.status === 'pending' && decision === 'approved') {
      if (book.available < 1) {
        await transaction.rollback();
        return res
          .status(409)
          .json({ success: false, message: 'No copies are currently available' });
      }
      await book.update({ available: book.available - 1 }, { transaction });
    } else if (request.status === 'approved' && decision === 'rejected') {
      await book.update({ available: book.available + 1 }, { transaction });
    }
    await request.update(
      {
        status: decision,
        decision_note:
          String(req.body.note || '')
            .trim()
            .slice(0, 500) || null,
        decided_by: req.user.id,
        decided_at: new Date()
      },
      { transaction }
    );
    await transaction.commit();
    return res.json({ success: true, data: request });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    logger.error('library request decision', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const fulfillLibraryBookRequest = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const request = await LibraryBookRequest.findOne({
      where: { id: req.params.id, ...schoolWhere(req) },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!request || request.status !== 'approved') {
      await transaction.rollback();
      return res
        .status(409)
        .json({ success: false, message: 'Only approved requests can be fulfilled' });
    }
    const book = await LibraryBook.findOne({
      where: {
        id: request.book_id,
        school_id: request.school_id,
        [Op.or]: [{ branch_id: request.branch_id }, { branch_id: null }]
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    const student = await Student.findOne({
      where: { id: request.student_id, school_id: request.school_id, branch_id: request.branch_id },
      transaction
    });
    if (!book || !student) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: 'Requested book or student not found' });
    }
    const issueDate = new Date().toISOString().slice(0, 10);
    const due = new Date(`${issueDate}T00:00:00.000Z`);
    due.setUTCDate(due.getUTCDate() + 14);
    const issue = await LibraryIssue.create(
      {
        book_id: book.id,
        student_id: student.id,
        borrower_type: 'student',
        borrower_name: `${student.first_name} ${student.last_name || ''}`.trim(),
        issue_date: issueDate,
        due_date: due.toISOString().slice(0, 10),
        status: 'issued',
        school_id: request.school_id,
        branch_id: request.branch_id,
        created_by: req.user.id
      },
      { transaction }
    );
    await request.update({ status: 'fulfilled', library_issue_id: issue.id }, { transaction });
    await transaction.commit();
    return res.json({ success: true, data: { request, issue } });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    logger.error('library request fulfillment', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listLibraryBookRequests,
  listPortalLibraryBookRequests,
  createPortalLibraryBookRequest,
  decideLibraryBookRequest,
  fulfillLibraryBookRequest
};
