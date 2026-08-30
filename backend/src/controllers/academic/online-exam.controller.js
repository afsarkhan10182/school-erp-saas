const { Op } = require('sequelize');
const {
  OnlineExam,
  OnlineExamQuestion,
  OnlineExamAttempt,
  Student,
  Class
} = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, schoolIdOf, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const STAFF_ROLES = new Set(['super_admin', 'admin', 'branch_admin', 'teacher']);

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.class_id) where.class_id = req.query.class_id;
    const rows = await OnlineExam.findAll({
      where,
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'], required: false },
        {
          model: OnlineExamQuestion,
          as: 'questions',
          attributes: ['id', 'marks'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });
    return res.json({
      success: true,
      data: {
        exams: rows.map(e => {
          const j = e.toJSON();
          j.question_count = j.questions?.length || 0;
          delete j.questions;
          return j;
        })
      }
    });
  } catch (error) {
    logger.error('online exam list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const exam = await OnlineExam.findOne({
      where: { id: req.params.id, ...schoolWhere(req) },
      include: [
        {
          model: OnlineExamQuestion,
          as: 'questions',
          separate: true,
          order: [['sort_order', 'ASC']]
        },
        { model: Class, as: 'class', attributes: ['id', 'name'], required: false }
      ]
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Not found' });
    const data = exam.toJSON();
    if (!STAFF_ROLES.has(req.user.role)) {
      data.questions = (data.questions || []).map(({ correct_option, ...q }) => q);
    }
    return res.json({ success: true, data: { exam: data } });
  } catch (error) {
    logger.error('online exam get', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const available = async (req, res) => {
  try {
    const where = { ...schoolWhere(req), status: 'published' };
    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { user_id: req.user.id, school_id: schoolIdOf(req) } });
      if (!student) return res.json({ success: true, data: { exams: [] } });
      where[Op.or] = [{ class_id: student.class_id }, { class_id: null }];
      if (student.branch_id) where.branch_id = student.branch_id;
    }
    const exams = await OnlineExam.findAll({
      where,
      attributes: ['id', 'title', 'duration_minutes', 'total_marks', 'pass_marks', 'start_at', 'end_at', 'class_id'],
      include: [{ model: Class, as: 'class', attributes: ['id', 'name'], required: false }],
      order: [['start_at', 'ASC'], ['created_at', 'DESC']]
    });
    return res.json({ success: true, data: { exams } });
  } catch (error) {
    logger.error('online exam available', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    if (req.body.class_id) {
      const classRecord = await Class.findOne({ where: { id: req.body.class_id, school_id: scope.school_id, branch_id: scope.branch_id } });
      if (!classRecord) return res.status(400).json({ success: false, message: 'Invalid class for this branch' });
    }
    const exam = await OnlineExam.create({
      title: req.body.title || 'Untitled online exam',
      description: req.body.description || null,
      exam_id: req.body.exam_id || null,
      class_id: req.body.class_id || null,
      subject_id: req.body.subject_id || null,
      duration_minutes: Number(req.body.duration_minutes) || 60,
      pass_marks: Number(req.body.pass_marks) || 0,
      total_marks: Number(req.body.total_marks) || 0,
      start_at: req.body.start_at || null,
      end_at: req.body.end_at || null,
      status: req.body.status || 'draft',
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      created_by: req.user.id
    });
    return res.status(201).json({ success: true, data: { exam } });
  } catch (error) {
    logger.error('online exam create', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const exam = await OnlineExam.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Not found' });
    const keys = [
      'title',
      'description',
      'exam_id',
      'class_id',
      'subject_id',
      'duration_minutes',
      'pass_marks',
      'total_marks',
      'start_at',
      'end_at',
      'status'
    ];
    const patch = { updated_by: req.user.id };
    keys.forEach(k => {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    });
    delete patch.school_id;
    delete patch.branch_id;
    if (patch.class_id) {
      const classRecord = await Class.findOne({ where: { id: patch.class_id, school_id: exam.school_id, branch_id: exam.branch_id } });
      if (!classRecord) return res.status(400).json({ success: false, message: 'Invalid class for this branch' });
    }
    await exam.update(patch);
    return res.json({ success: true, data: { exam } });
  } catch (error) {
    logger.error('online exam update', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const exam = await OnlineExam.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Not found' });
    await OnlineExamQuestion.destroy({ where: { online_exam_id: exam.id } });
    await OnlineExamAttempt.destroy({ where: { online_exam_id: exam.id } });
    await exam.destroy();
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('online exam delete', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addQuestion = async (req, res) => {
  try {
    const exam = await OnlineExam.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const options = Array.isArray(req.body.options_json)
      ? req.body.options_json
      : ['Option A', 'Option B', 'Option C', 'Option D'];
    const count = await OnlineExamQuestion.count({ where: { online_exam_id: exam.id } });
    const q = await OnlineExamQuestion.create({
      online_exam_id: exam.id,
      question_text: req.body.question_text || 'Question',
      options_json: options,
      correct_option: Number(req.body.correct_option) || 0,
      marks: Number(req.body.marks) || 1,
      sort_order: req.body.sort_order ?? count,
      school_id: schoolIdOf(req)
    });
    const total = await OnlineExamQuestion.sum('marks', {
      where: { online_exam_id: exam.id }
    });
    await exam.update({ total_marks: total || 0 });
    return res.status(201).json({ success: true, data: { question: q } });
  } catch (error) {
    logger.error('online exam add question', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const q = await OnlineExamQuestion.findOne({
      where: { id: req.params.questionId, school_id: schoolIdOf(req) }
    });
    if (!q) return res.status(404).json({ success: false, message: 'Not found' });
    const examId = q.online_exam_id;
    await q.destroy();
    const total = await OnlineExamQuestion.sum('marks', { where: { online_exam_id: examId } });
    await OnlineExam.update({ total_marks: total || 0 }, { where: { id: examId } });
    return res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    logger.error('online exam delete question', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Take paper for student — hide correct answers */
const takePaper = async (req, res) => {
  try {
    const exam = await OnlineExam.findOne({
      where: { id: req.params.id, ...schoolWhere(req), status: 'published' },
      include: [
        {
          model: OnlineExamQuestion,
          as: 'questions',
          separate: true,
          order: [['sort_order', 'ASC']]
        }
      ]
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not available' });
    const paper = exam.toJSON();
    paper.questions = (paper.questions || []).map(q => ({
      id: q.id,
      question_text: q.question_text,
      options_json: q.options_json,
      marks: q.marks,
      sort_order: q.sort_order
    }));
    return res.json({ success: true, data: { exam: paper } });
  } catch (error) {
    logger.error('online exam take', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const submit = async (req, res) => {
  try {
    const exam = await OnlineExam.findOne({
      where: { id: req.params.id, ...schoolWhere(req) },
      include: [{ model: OnlineExamQuestion, as: 'questions' }]
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Exam is not published' });
    }
    const now = new Date();
    if ((exam.start_at && now < new Date(exam.start_at)) || (exam.end_at && now > new Date(exam.end_at))) {
      return res.status(400).json({ success: false, message: 'Exam is not currently available' });
    }

    const studentWhere = {
      school_id: exam.school_id,
      ...(exam.branch_id ? { branch_id: exam.branch_id } : {}),
      ...(exam.class_id ? { class_id: exam.class_id } : {})
    };
    if (req.user.role === 'student') {
      studentWhere.user_id = req.user.id;
    } else if (STAFF_ROLES.has(req.user.role) && req.body.student_id) {
      studentWhere.id = req.body.student_id;
    } else {
      return res.status(400).json({ success: false, message: 'student_id required' });
    }

    const student = await Student.findOne({ where: studentWhere });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const student_id = student.id;

    const existing = await OnlineExamAttempt.findOne({
      where: { online_exam_id: exam.id, student_id }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Exam already submitted' });
    }

    const answers = req.body.answers_json || {};
    let score = 0;
    (exam.questions || []).forEach(q => {
      const chosen = answers[q.id];
      if (chosen !== undefined && Number(chosen) === Number(q.correct_option)) {
        score += Number(q.marks) || 0;
      }
    });

    const attempt = await OnlineExamAttempt.create({
      online_exam_id: exam.id,
      student_id,
      answers_json: answers,
      score,
      status: 'submitted',
      school_id: exam.school_id,
      submitted_at: new Date()
    });

    const passed = score >= Number(exam.pass_marks || 0);
    return res.json({
      success: true,
      data: {
        attempt,
        score,
        total_marks: exam.total_marks,
        passed
      }
    });
  } catch (error) {
    logger.error('online exam submit', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const results = async (req, res) => {
  try {
    const exam = await OnlineExam.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Not found' });
    const attempts = await OnlineExamAttempt.findAll({
      where: { online_exam_id: exam.id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number']
        }
      ],
      order: [['score', 'DESC']]
    });
    const ranked = attempts.map((a, i) => ({
      position: i + 1,
      student_id: a.student_id,
      student_name: a.student
        ? `${a.student.first_name} ${a.student.last_name || ''}`.trim()
        : '—',
      admission_number: a.student?.admission_number,
      score: a.score,
      status: a.status,
      submitted_at: a.submitted_at,
      passed: Number(a.score) >= Number(exam.pass_marks || 0)
    }));
    return res.json({ success: true, data: { exam, results: ranked } });
  } catch (error) {
    logger.error('online exam results', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  list,
  getOne,
  available,
  create,
  update,
  remove,
  addQuestion,
  deleteQuestion,
  takePaper,
  submit,
  results
};
