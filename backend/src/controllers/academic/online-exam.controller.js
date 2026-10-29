const { Op } = require('sequelize');
const {
  OnlineExam,
  OnlineExamQuestion,
  OnlineExamAttempt,
  Student,
  Parent,
  Class
} = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, schoolIdOf, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const STAFF_ROLES = new Set(['super_admin', 'admin', 'branch_admin', 'teacher']);

const attemptDeadline = (attempt, exam) => {
  const durationEnd = new Date(new Date(attempt.createdAt).getTime() + Number(exam.duration_minutes || 60) * 60000);
  return exam.end_at && new Date(exam.end_at) < durationEnd ? new Date(exam.end_at) : durationEnd;
};

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
    if (!STAFF_ROLES.has(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only exam staff can manage online exams' });
    }
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
    return res.json({ success: true, data: { exam: data } });
  } catch (error) {
    logger.error('online exam get', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const available = async (req, res) => {
  try {
    const where = { ...schoolWhere(req), status: 'published' };
    let student;
    if (req.user.role === 'student') {
      student = await Student.findOne({ where: { user_id: req.user.id, school_id: schoolIdOf(req) } });
      if (!student) return res.json({ success: true, data: { exams: [] } });
      where[Op.or] = [{ class_id: student.class_id }, { class_id: null }];
      if (student.branch_id) where.branch_id = student.branch_id;
    } else if (req.user.role === 'parent') {
      const parent = await Parent.findOne({
        where: { user_id: req.user.id, school_id: schoolIdOf(req) },
        attributes: ['id'],
        include: [{
          model: Student,
          as: 'students',
          attributes: ['class_id', 'branch_id'],
          through: { attributes: [] }
        }]
      });
      const childScopes = [...new Map((parent?.students || []).flatMap(student => [
        { class_id: student.class_id, branch_id: student.branch_id },
        { class_id: student.class_id, branch_id: null },
        { class_id: null, branch_id: student.branch_id },
        { class_id: null, branch_id: null }
      ]).map(scope => [`${scope.class_id || '*'}:${scope.branch_id || '*'}`, scope])).values()];
      if (!childScopes.length) return res.json({ success: true, data: { exams: [] } });
      where[Op.or] = childScopes;
    }
    const exams = await OnlineExam.findAll({
      where,
      attributes: ['id', 'title', 'duration_minutes', 'total_marks', 'pass_marks', 'start_at', 'end_at', 'class_id'],
      include: [{ model: Class, as: 'class', attributes: ['id', 'name'], required: false }],
      order: [['start_at', 'ASC'], ['created_at', 'DESC']]
    });
    let attemptStatuses = new Map();
    if (req.user.role === 'student' && exams.length) {
      const attempts = await OnlineExamAttempt.findAll({
        where: { student_id: student.id, online_exam_id: { [Op.in]: exams.map(exam => exam.id) } },
        attributes: ['online_exam_id', 'status']
      });
      attemptStatuses = new Map(attempts.map(attempt => [attempt.online_exam_id, attempt.status]));
    }
    return res.json({
      success: true,
      data: { exams: exams.map(exam => ({ ...exam.toJSON(), attempt_status: attemptStatuses.get(exam.id) || null })) }
    });
  } catch (error) {
    logger.error('online exam available', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const parentProgress = async (req, res) => {
  try {
    const studentId = req.query.student_id;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student is required.' });
    }
    const parent = await Parent.findOne({
      where: { user_id: req.user.id, school_id: schoolIdOf(req) },
      attributes: ['id'],
      include: [{
        model: Student,
        as: 'students',
        attributes: ['id', 'school_id', 'branch_id'],
        through: { attributes: [] }
      }]
    });
    const student = parent?.students?.find(child => child.id === studentId);
    if (!student || student.school_id !== schoolIdOf(req)) {
      return res.status(404).json({ success: false, message: 'Linked student not found.' });
    }

    const attempts = await OnlineExamAttempt.findAll({
      where: { student_id: student.id, school_id: schoolIdOf(req) },
      attributes: ['id', 'status', 'score', 'submitted_at'],
      include: [{
        model: OnlineExam,
        as: 'exam',
        where: {
          school_id: schoolIdOf(req),
          ...(student.branch_id
            ? { [Op.or]: [{ branch_id: student.branch_id }, { branch_id: null }] }
            : { branch_id: null })
        },
        attributes: ['id', 'title', 'total_marks', 'pass_marks'],
        required: true
      }],
      order: [['submitted_at', 'DESC']]
    });
    return res.json({
      success: true,
      data: {
        attempts: attempts.map(attempt => {
          const row = attempt.toJSON();
          const submitted = row.status === 'submitted';
          const totalMarks = Number(row.exam.total_marks);
          const score = Number(row.score);
          const passMarks = Number(row.exam.pass_marks);
          const scoreAvailable =
            submitted && Number.isFinite(score) && Number.isFinite(totalMarks) && totalMarks > 0;
          const passThresholdAvailable =
            scoreAvailable && Number.isFinite(passMarks) && passMarks > 0 && passMarks <= totalMarks;
          return {
            id: row.id,
            status: row.status,
            submitted_at: row.submitted_at,
            exam: row.exam,
            score: scoreAvailable ? row.score : null,
            passed: passThresholdAvailable ? score >= passMarks : null
          };
        })
      }
    });
  } catch (error) {
    logger.error('online exam parent progress', error);
    return res.status(500).json({ success: false, message: 'Unable to load exam progress.' });
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
    const exam = await OnlineExam.findOne({
      where: { id: req.params.id, ...schoolWhere(req) }
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const q = await OnlineExamQuestion.findOne({
      where: { id: req.params.questionId, online_exam_id: exam.id, school_id: schoolIdOf(req) }
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
    if (!STAFF_ROLES.has(req.user.role) && req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can take online exams' });
    }
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
    let remainingSeconds;
    let savedAnswers;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { user_id: req.user.id, school_id: exam.school_id } });
      if (!student || (exam.branch_id && student.branch_id !== exam.branch_id) || (exam.class_id && student.class_id !== exam.class_id)) {
        return res.status(404).json({ success: false, message: 'Exam not available' });
      }
      const now = new Date();
      if (exam.start_at && now < new Date(exam.start_at)) {
        return res.status(400).json({ success: false, message: 'Exam is not currently available' });
      }
      let attempt = await OnlineExamAttempt.findOne({ where: { online_exam_id: exam.id, student_id: student.id } });
      if (exam.end_at && now > new Date(exam.end_at)) {
        if (attempt?.status === 'in_progress') await attempt.update({ status: 'expired' });
        return res.status(400).json({ success: false, message: 'Exam is not currently available' });
      }
      if (attempt && attempt.status !== 'in_progress') {
        return res.status(409).json({ success: false, message: attempt.status === 'expired' ? 'Exam attempt expired' : 'Exam already submitted' });
      }
      if (attempt && now >= attemptDeadline(attempt, exam)) {
        await attempt.update({ status: 'expired' });
        return res.status(410).json({ success: false, message: 'Exam attempt expired' });
      }
      if (!attempt) {
        try {
          attempt = await OnlineExamAttempt.create({
            online_exam_id: exam.id,
            student_id: student.id,
            answers_json: {},
            score: 0,
            status: 'in_progress',
            school_id: exam.school_id,
            submitted_at: null
          });
        } catch (error) {
          if (error.name !== 'SequelizeUniqueConstraintError') throw error;
          attempt = await OnlineExamAttempt.findOne({ where: { online_exam_id: exam.id, student_id: student.id } });
          if (!attempt || attempt.status !== 'in_progress') {
            return res.status(409).json({ success: false, message: 'Exam already submitted' });
          }
        }
      }
      remainingSeconds = Math.max(0, Math.ceil((attemptDeadline(attempt, exam).getTime() - now.getTime()) / 1000));
      savedAnswers = attempt.answers_json || {};
    }
    const paper = exam.toJSON();
    paper.questions = (paper.questions || []).map(q => ({
      id: q.id,
      question_text: q.question_text,
      options_json: q.options_json,
      marks: q.marks,
      sort_order: q.sort_order
    }));
    return res.json({
      success: true,
      data: {
        exam: paper,
        remaining_seconds: remainingSeconds,
        ...(req.user.role === 'student' ? { answers_json: savedAnswers } : {})
      }
    });
  } catch (error) {
    logger.error('online exam take', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const saveAnswers = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can save exam answers' });
    }
    const exam = await OnlineExam.findOne({
      where: { id: req.params.id, ...schoolWhere(req), status: 'published' }
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not available' });
    const student = await Student.findOne({ where: { user_id: req.user.id, school_id: exam.school_id } });
    if (!student || (exam.branch_id && student.branch_id !== exam.branch_id) || (exam.class_id && student.class_id !== exam.class_id)) {
      return res.status(404).json({ success: false, message: 'Exam not available' });
    }
    const answers = req.body.answers_json;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'answers_json must be an object' });
    }
    const attempt = await OnlineExamAttempt.findOne({
      where: { online_exam_id: exam.id, student_id: student.id }
    });
    if (!attempt || attempt.status !== 'in_progress') {
      return res.status(409).json({ success: false, message: 'No active exam attempt to save' });
    }
    const now = new Date();
    if ((exam.start_at && now < new Date(exam.start_at)) || (exam.end_at && now > new Date(exam.end_at)) || now >= attemptDeadline(attempt, exam)) {
      await attempt.update({ status: 'expired' });
      return res.status(410).json({ success: false, message: 'Exam attempt expired' });
    }
    const questions = await OnlineExamQuestion.findAll({
      where: { online_exam_id: exam.id, school_id: exam.school_id },
      attributes: ['id', 'options_json']
    });
    const questionById = new Map(questions.map(question => [question.id, question]));
    const saved = {};
    for (const [questionId, choice] of Object.entries(answers)) {
      const options = questionById.get(questionId)?.options_json;
      const optionIndex = Number(choice);
      if (!Array.isArray(options) || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) {
        return res.status(400).json({ success: false, message: 'One or more answers are invalid' });
      }
      saved[questionId] = optionIndex;
    }
    await attempt.update({ answers_json: saved });
    return res.json({ success: true, data: { saved: true } });
  } catch (error) {
    logger.error('online exam save answers', error);
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
    if (exam.start_at && now < new Date(exam.start_at)) {
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
    if (req.user.role === 'student') {
      if (!existing || existing.status !== 'in_progress') {
        return res.status(409).json({ success: false, message: existing?.status === 'expired' ? 'Exam attempt expired' : 'Start the exam before submitting' });
      }
      if ((exam.end_at && now > new Date(exam.end_at)) || now >= attemptDeadline(existing, exam)) {
        await existing.update({ status: 'expired' });
        return res.status(410).json({ success: false, message: 'Exam attempt expired' });
      }
    } else if (existing) {
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

    const attempt = req.user.role === 'student'
      ? await existing.update({ answers_json: answers, score, status: 'submitted', submitted_at: now })
      : await OnlineExamAttempt.create({
        online_exam_id: exam.id,
        student_id,
        answers_json: answers,
        score,
        status: 'submitted',
        school_id: exam.school_id,
        submitted_at: now
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
      where: { online_exam_id: exam.id, status: 'submitted' },
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
  parentProgress,
  create,
  update,
  remove,
  addQuestion,
  deleteQuestion,
  takePaper,
  saveAnswers,
  submit,
  results
};
