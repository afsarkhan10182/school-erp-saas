require('module-alias/register');
const controller = require('../src/controllers/academic/online-exam.controller');
const { OnlineExam, OnlineExamQuestion, OnlineExamAttempt, Parent, Student } = require('../src/models');
const { Op } = require('sequelize');

describe('online exam role and child scope', () => {
  const originals = {
    findOne: OnlineExam.findOne,
    findAll: OnlineExam.findAll,
    questionFindOne: OnlineExamQuestion.findOne,
    questionFindAll: OnlineExamQuestion.findAll,
    attemptFindOne: OnlineExamAttempt.findOne,
    attemptFindAll: OnlineExamAttempt.findAll,
    attemptCreate: OnlineExamAttempt.create,
    parentFindOne: Parent.findOne,
    studentFindOne: Student.findOne
  };

  afterEach(() => {
    OnlineExam.findOne = originals.findOne;
    OnlineExam.findAll = originals.findAll;
    OnlineExamQuestion.findOne = originals.questionFindOne;
    OnlineExamQuestion.findAll = originals.questionFindAll;
    OnlineExamAttempt.findOne = originals.attemptFindOne;
    OnlineExamAttempt.findAll = originals.attemptFindAll;
    OnlineExamAttempt.create = originals.attemptCreate;
    Parent.findOne = originals.parentFindOne;
    Student.findOne = originals.studentFindOne;
  });

  const invoke = async (action, req) => {
    let payload;
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        payload = body;
        return this;
      }
    };
    await action(req, res);
    return { status: res.statusCode, payload };
  };

  it('limits a parent availability query to linked child class and branch combinations', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({
      students: [
        { class_id: 'class-main', branch_id: 'branch-main' },
        { class_id: 'class-second', branch_id: 'branch-second' }
      ]
    });
    OnlineExam.findAll = jest.fn().mockResolvedValue([]);

    await invoke(controller.available, {
      user: { id: 'parent-user', role: 'parent', school_id: 'school' },
      query: {},
      body: {}
    });

    const where = OnlineExam.findAll.mock.calls[0][0].where;
    expect(where.school_id).toBe('school');
    expect(where.status).toBe('published');
    expect(where[Op.or]).toEqual(expect.arrayContaining([
      { class_id: 'class-main', branch_id: 'branch-main' },
      { class_id: 'class-second', branch_id: 'branch-second' }
    ]));
    expect(where[Op.or]).not.toContainEqual({});
  });

  it('returns only a linked child’s safe exam progress, without answer data', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({
      students: [{ id: 'child-1', school_id: 'school', branch_id: 'branch-main' }]
    });
    OnlineExamAttempt.findAll = jest.fn().mockResolvedValue([{
      toJSON: () => ({
        id: 'attempt-1',
        status: 'submitted',
        score: '8.00',
        submitted_at: '2026-10-01T10:00:00.000Z',
        answers_json: { secret: 1 },
        exam: { id: 'exam-1', title: 'Math', total_marks: 10, pass_marks: '5.00' }
      })
    }, {
      toJSON: () => ({
        id: 'attempt-2',
        status: 'in_progress',
        score: '0.00',
        submitted_at: null,
        answers_json: { secret: 1 },
        exam: { id: 'exam-2', title: 'Science', total_marks: 10, pass_marks: '5.00' }
      })
    }, {
      toJSON: () => ({
        id: 'attempt-3',
        status: 'submitted',
        score: '1.00',
        submitted_at: '2026-06-20T10:00:00.000Z',
        answers_json: { secret: 1 },
        exam: { id: 'exam-3', title: 'Practice', total_marks: 0, pass_marks: '0.00' }
      })
    }, {
      toJSON: () => ({
        id: 'attempt-4',
        status: 'submitted',
        score: '8.00',
        submitted_at: '2026-06-19T10:00:00.000Z',
        answers_json: { secret: 1 },
        exam: { id: 'exam-4', title: 'Science', total_marks: 10, pass_marks: '0.00' }
      })
    }]);

    const result = await invoke(controller.parentProgress, {
      user: { id: 'parent-user', role: 'parent', school_id: 'school' },
      schoolId: 'school',
      query: { student_id: 'child-1' },
      body: {}
    });

    expect(result.status).toBe(200);
    expect(result.payload.data.attempts).toEqual([
      {
        id: 'attempt-1',
        status: 'submitted',
        submitted_at: '2026-10-01T10:00:00.000Z',
        exam: { id: 'exam-1', title: 'Math', total_marks: 10, pass_marks: '5.00' },
        score: '8.00',
        passed: true
      },
      {
        id: 'attempt-2',
        status: 'in_progress',
        submitted_at: null,
        exam: { id: 'exam-2', title: 'Science', total_marks: 10, pass_marks: '5.00' },
        score: null,
        passed: null
      },
      {
        id: 'attempt-3',
        status: 'submitted',
        submitted_at: '2026-06-20T10:00:00.000Z',
        exam: { id: 'exam-3', title: 'Practice', total_marks: 0, pass_marks: '0.00' },
        score: null,
        passed: null
      },
      {
        id: 'attempt-4',
        status: 'submitted',
        submitted_at: '2026-06-19T10:00:00.000Z',
        exam: { id: 'exam-4', title: 'Science', total_marks: 10, pass_marks: '0.00' },
        score: '8.00',
        passed: null
      }
    ]);
    expect(JSON.stringify(result.payload)).not.toContain('answers_json');
    expect(OnlineExamAttempt.findAll.mock.calls[0][0].where).toEqual({
      student_id: 'child-1', school_id: 'school'
    });
    expect(OnlineExamAttempt.findAll.mock.calls[0][0].include[0].where[Op.or]).toEqual([
      { branch_id: 'branch-main' }, { branch_id: null }
    ]);
  });

  it('rejects parent exam progress for a student who is not linked', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({ students: [] });
    OnlineExamAttempt.findAll = jest.fn();

    const result = await invoke(controller.parentProgress, {
      user: { id: 'parent-user', role: 'parent', school_id: 'school' },
      schoolId: 'school',
      query: { student_id: 'another-child' },
      body: {}
    });

    expect(result.status).toBe(404);
    expect(OnlineExamAttempt.findAll).not.toHaveBeenCalled();
  });

  it('shows a Student the persisted state of each available exam attempt', async () => {
    Student.findOne = jest.fn().mockResolvedValue({ id: 'student', class_id: 'class', branch_id: 'branch' });
    OnlineExam.findAll = jest.fn().mockResolvedValue([{ id: 'exam', toJSON: () => ({ id: 'exam', title: 'Quiz' }) }]);
    OnlineExamAttempt.findAll = jest.fn().mockResolvedValue([{ online_exam_id: 'exam', status: 'in_progress' }]);

    const result = await invoke(controller.available, {
      user: { id: 'student-user', role: 'student', school_id: 'school' }, query: {}, body: {}
    });

    expect(result.status).toBe(200);
    expect(result.payload.data.exams).toEqual([{ id: 'exam', title: 'Quiz', attempt_status: 'in_progress' }]);
    expect(OnlineExamAttempt.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { student_id: 'student', online_exam_id: { [Op.in]: ['exam'] } },
      attributes: ['online_exam_id', 'status']
    }));
  });

  it('does not let a parent open a student exam paper', async () => {
    OnlineExam.findOne = jest.fn();
    const result = await invoke(controller.takePaper, {
      params: { id: 'exam' },
      user: { id: 'parent-user', role: 'parent', school_id: 'school' },
      query: {},
      body: {}
    });

    expect(result.status).toBe(403);
    expect(OnlineExam.findOne).not.toHaveBeenCalled();
  });

  it('does not expose exam-management details to students', async () => {
    OnlineExam.findOne = jest.fn();
    const result = await invoke(controller.getOne, {
      params: { id: 'exam' },
      user: { id: 'student-user', role: 'student', school_id: 'school' },
      query: {},
      body: {}
    });

    expect(result.status).toBe(403);
    expect(OnlineExam.findOne).not.toHaveBeenCalled();
  });

  it('does not reveal student exam questions before the scheduled start', async () => {
    const exam = {
      id: 'exam',
      school_id: 'school',
      branch_id: 'branch',
      class_id: 'class',
      start_at: new Date(Date.now() + 60_000),
      end_at: null,
      toJSON: () => ({ questions: [{ id: 'question', question_text: 'Secret question', correct_option: 1 }] })
    };
    OnlineExam.findOne = jest.fn().mockResolvedValue(exam);
    Student.findOne = jest.fn().mockResolvedValue({ id: 'student', branch_id: 'branch', class_id: 'class' });
    OnlineExamAttempt.findOne = jest.fn().mockResolvedValue(null);
    OnlineExamAttempt.create = jest.fn().mockResolvedValue({ createdAt: new Date() });

    const result = await invoke(controller.takePaper, {
      params: { id: 'exam' },
      user: { id: 'student-user', role: 'student', school_id: 'school' },
      query: {},
      body: {}
    });

    expect(result.status).toBe(400);
    expect(result.payload.message).toBe('Exam is not currently available');
    expect(JSON.stringify(result.payload)).not.toContain('Secret question');
  });

  it('does not reveal student exam questions after the scheduled end', async () => {
    const attempt = { status: 'in_progress', createdAt: new Date(Date.now() - 60_000), update: jest.fn() };
    const exam = {
      id: 'exam',
      school_id: 'school',
      branch_id: 'branch',
      class_id: 'class',
      start_at: null,
      end_at: new Date(Date.now() - 60_000),
      toJSON: () => ({ questions: [{ id: 'question', question_text: 'Closed question', correct_option: 1 }] })
    };
    OnlineExam.findOne = jest.fn().mockResolvedValue(exam);
    Student.findOne = jest.fn().mockResolvedValue({ id: 'student', branch_id: 'branch', class_id: 'class' });
    OnlineExamAttempt.findOne = jest.fn().mockResolvedValue(attempt);

    const result = await invoke(controller.takePaper, {
      params: { id: 'exam' },
      user: { id: 'student-user', role: 'student', school_id: 'school' },
      query: {},
      body: {}
    });

    expect(result.status).toBe(400);
    expect(JSON.stringify(result.payload)).not.toContain('Closed question');
    expect(attempt.update).toHaveBeenCalledWith({ status: 'expired' });
  });

  it('still returns an eligible student paper during its scheduled window without answers', async () => {
    const exam = {
      id: 'exam',
      school_id: 'school',
      branch_id: 'branch',
      class_id: 'class',
      start_at: new Date(Date.now() - 60_000),
      end_at: new Date(Date.now() + 60_000),
      toJSON: () => ({ questions: [{ id: 'question', question_text: 'Open question', correct_option: 1 }] })
    };
    OnlineExam.findOne = jest.fn().mockResolvedValue(exam);
    Student.findOne = jest.fn().mockResolvedValue({ id: 'student', branch_id: 'branch', class_id: 'class' });
    OnlineExamAttempt.findOne = jest.fn().mockResolvedValue(null);
    OnlineExamAttempt.create = jest.fn().mockResolvedValue({ createdAt: new Date() });

    const result = await invoke(controller.takePaper, {
      params: { id: 'exam' },
      user: { id: 'student-user', role: 'student', school_id: 'school' },
      query: {},
      body: {}
    });

    expect(result.status).toBe(200);
    expect(result.payload.data.exam.questions).toEqual([
      { id: 'question', question_text: 'Open question', options_json: undefined, marks: undefined, sort_order: undefined }
    ]);
    expect(result.payload.data.exam.questions[0]).not.toHaveProperty('correct_option');
    expect(OnlineExamAttempt.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'in_progress', submitted_at: null }));
    expect(result.payload.data.remaining_seconds).toBeGreaterThan(0);
  });

  it('keeps staff paper preview from creating a student attempt', async () => {
    OnlineExam.findOne = jest.fn().mockResolvedValue({
      id: 'exam', status: 'published', toJSON: () => ({ questions: [{ id: 'q', correct_option: 1 }] })
    });
    OnlineExamAttempt.create = jest.fn();

    const result = await invoke(controller.takePaper, {
      params: { id: 'exam' }, user: { id: 'teacher-user', role: 'teacher', school_id: 'school' }, query: {}, body: {}
    });

    expect(result.status).toBe(200);
    expect(result.payload.data.exam.questions[0]).not.toHaveProperty('correct_option');
    expect(OnlineExamAttempt.create).not.toHaveBeenCalled();
  });

  it('returns saved answers when a Student resumes an attempt', async () => {
    const attempt = {
      status: 'in_progress', createdAt: new Date(Date.now() - 60_000),
      answers_json: { question: 1 }
    };
    OnlineExam.findOne = jest.fn().mockResolvedValue({
      id: 'exam', school_id: 'school', branch_id: 'branch', class_id: 'class', status: 'published', duration_minutes: 60,
      start_at: null, end_at: null, toJSON: () => ({ questions: [] })
    });
    Student.findOne = jest.fn().mockResolvedValue({ id: 'student', branch_id: 'branch', class_id: 'class' });
    OnlineExamAttempt.findOne = jest.fn().mockResolvedValue(attempt);

    const result = await invoke(controller.takePaper, {
      params: { id: 'exam' }, user: { id: 'student-user', role: 'student', school_id: 'school' }, query: {}, body: {}
    });

    expect(result.status).toBe(200);
    expect(result.payload.data.answers_json).toEqual({ question: 1 });
  });

  it('saves only valid answers for the Student active attempt', async () => {
    const attempt = { status: 'in_progress', createdAt: new Date(), update: jest.fn() };
    OnlineExam.findOne = jest.fn().mockResolvedValue({
      id: 'exam', school_id: 'school', branch_id: 'branch', class_id: 'class', status: 'published', duration_minutes: 60,
      start_at: null, end_at: null
    });
    Student.findOne = jest.fn().mockResolvedValue({ id: 'student', branch_id: 'branch', class_id: 'class' });
    OnlineExamAttempt.findOne = jest.fn().mockResolvedValue(attempt);
    OnlineExamQuestion.findAll = jest.fn().mockResolvedValue([
      { id: 'question', options_json: ['A', 'B'] }
    ]);

    const result = await invoke(controller.saveAnswers, {
      params: { id: 'exam' }, user: { id: 'student-user', role: 'student', school_id: 'school' },
      query: {}, body: { answers_json: { question: 1 } }
    });

    expect(result.status).toBe(200);
    expect(attempt.update).toHaveBeenCalledWith({ answers_json: { question: 1 } });
  });

  it('rejects answer drafts with an unknown question or invalid option index', async () => {
    const attempt = { status: 'in_progress', createdAt: new Date(), update: jest.fn() };
    OnlineExam.findOne = jest.fn().mockResolvedValue({
      id: 'exam', school_id: 'school', branch_id: 'branch', class_id: 'class', status: 'published', duration_minutes: 60,
      start_at: null, end_at: null
    });
    Student.findOne = jest.fn().mockResolvedValue({ id: 'student', branch_id: 'branch', class_id: 'class' });
    OnlineExamAttempt.findOne = jest.fn().mockResolvedValue(attempt);
    OnlineExamQuestion.findAll = jest.fn().mockResolvedValue([{ id: 'question', options_json: ['A', 'B'] }]);

    const result = await invoke(controller.saveAnswers, {
      params: { id: 'exam' }, user: { id: 'student-user', role: 'student', school_id: 'school' },
      query: {}, body: { answers_json: { question: 2 } }
    });

    expect(result.status).toBe(400);
    expect(attempt.update).not.toHaveBeenCalled();
  });

  it('does not let a Parent write a Student exam draft', async () => {
    OnlineExam.findOne = jest.fn();
    const result = await invoke(controller.saveAnswers, {
      params: { id: 'exam' }, user: { id: 'parent-user', role: 'parent', school_id: 'school' }, query: {}, body: { answers_json: {} }
    });

    expect(result.status).toBe(403);
    expect(OnlineExam.findOne).not.toHaveBeenCalled();
  });

  it('resumes a student attempt using its original server start time', async () => {
    const startedAt = new Date(Date.now() - 5 * 60_000);
    const attempt = { status: 'in_progress', createdAt: startedAt };
    OnlineExam.findOne = jest.fn().mockResolvedValue({
      id: 'exam', school_id: 'school', branch_id: 'branch', class_id: 'class', status: 'published', duration_minutes: 60,
      start_at: null, end_at: null,
      toJSON: () => ({ questions: [] })
    });
    Student.findOne = jest.fn().mockResolvedValue({ id: 'student', branch_id: 'branch', class_id: 'class' });
    OnlineExamAttempt.findOne = jest.fn().mockResolvedValue(attempt);
    OnlineExamAttempt.create = jest.fn();

    const result = await invoke(controller.takePaper, {
      params: { id: 'exam' }, user: { id: 'student-user', role: 'student', school_id: 'school' }, query: {}, body: {}
    });

    expect(result.status).toBe(200);
    expect(result.payload.data.remaining_seconds).toBeGreaterThan(3200);
    expect(result.payload.data.remaining_seconds).toBeLessThanOrEqual(3300);
    expect(OnlineExamAttempt.create).not.toHaveBeenCalled();
  });

  it('expires an attempt when its server-side duration has elapsed', async () => {
    const attempt = { status: 'in_progress', createdAt: new Date(Date.now() - 61 * 60_000), update: jest.fn() };
    OnlineExam.findOne = jest.fn().mockResolvedValue({
      id: 'exam', school_id: 'school', branch_id: 'branch', class_id: 'class', status: 'published', duration_minutes: 60,
      start_at: null, end_at: new Date(Date.now() + 60 * 60_000), toJSON: () => ({ questions: [] })
    });
    Student.findOne = jest.fn().mockResolvedValue({ id: 'student', branch_id: 'branch', class_id: 'class' });
    OnlineExamAttempt.findOne = jest.fn().mockResolvedValue(attempt);

    const result = await invoke(controller.takePaper, {
      params: { id: 'exam' }, user: { id: 'student-user', role: 'student', school_id: 'school' }, query: {}, body: {}
    });

    expect(result.status).toBe(410);
    expect(attempt.update).toHaveBeenCalledWith({ status: 'expired' });
  });

  it('submits within the server-side duration by completing the existing attempt', async () => {
    const attempt = {
      status: 'in_progress', createdAt: new Date(Date.now() - 60_000),
      update: jest.fn(async values => Object.assign(attempt, values))
    };
    OnlineExam.findOne = jest.fn().mockResolvedValue({
      id: 'exam', school_id: 'school', branch_id: 'branch', class_id: 'class', status: 'published', duration_minutes: 60,
      pass_marks: 1, total_marks: 2, start_at: null, end_at: new Date(Date.now() + 60 * 60_000),
      questions: [{ id: 'question', correct_option: 1, marks: 2 }]
    });
    Student.findOne = jest.fn().mockResolvedValue({ id: 'student' });
    OnlineExamAttempt.findOne = jest.fn().mockResolvedValue(attempt);

    const result = await invoke(controller.submit, {
      params: { id: 'exam' }, user: { id: 'student-user', role: 'student', school_id: 'school' },
      query: {}, body: { answers_json: { question: 1 } }
    });

    expect(result.status).toBe(200);
    expect(attempt.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'submitted', score: 2 }));
    expect(result.payload.data.score).toBe(2);
  });

  it('preserves staff preview scoring without starting a timed student attempt', async () => {
    const submittedAttempt = { id: 'staff-preview-attempt' };
    OnlineExam.findOne = jest.fn().mockResolvedValue({
      id: 'exam', school_id: 'school', status: 'published', pass_marks: 1, total_marks: 2,
      start_at: null, end_at: null, questions: [{ id: 'question', correct_option: 1, marks: 2 }]
    });
    Student.findOne = jest.fn().mockResolvedValue({ id: 'student' });
    OnlineExamAttempt.findOne = jest.fn().mockResolvedValue(null);
    OnlineExamAttempt.create = jest.fn().mockResolvedValue(submittedAttempt);

    const result = await invoke(controller.submit, {
      params: { id: 'exam' }, user: { id: 'teacher-user', role: 'teacher', school_id: 'school' },
      query: {}, body: { student_id: 'student', answers_json: { question: 1 } }
    });

    expect(result.status).toBe(200);
    expect(OnlineExamAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      student_id: 'student', status: 'submitted', submitted_at: expect.any(Date), score: 2
    }));
  });

  it('rejects a student submission after the server-side duration and expires the attempt', async () => {
    const attempt = { status: 'in_progress', createdAt: new Date(Date.now() - 61 * 60_000), update: jest.fn() };
    OnlineExam.findOne = jest.fn().mockResolvedValue({
      id: 'exam', school_id: 'school', branch_id: 'branch', class_id: 'class', status: 'published', duration_minutes: 60,
      pass_marks: 1, total_marks: 2, start_at: null, end_at: new Date(Date.now() + 60 * 60_000), questions: []
    });
    Student.findOne = jest.fn().mockResolvedValue({ id: 'student' });
    OnlineExamAttempt.findOne = jest.fn().mockResolvedValue(attempt);

    const result = await invoke(controller.submit, {
      params: { id: 'exam' }, user: { id: 'student-user', role: 'student', school_id: 'school' }, query: {}, body: { answers_json: {} }
    });

    expect(result.status).toBe(410);
    expect(attempt.update).toHaveBeenCalledWith({ status: 'expired' });
  });

  it('binds question deletion to the scoped exam instead of any question in the school', async () => {
    OnlineExam.findOne = jest.fn().mockResolvedValue({ id: 'main-exam' });
    OnlineExamQuestion.findOne = jest.fn().mockResolvedValue(null);
    const result = await invoke(controller.deleteQuestion, {
      params: { id: 'main-exam', questionId: 'other-exam-question' },
      user: { id: 'teacher-user', role: 'teacher', school_id: 'school', branch_id: 'main-branch' },
      branchId: 'main-branch',
      query: {},
      body: {}
    });

    expect(result.status).toBe(404);
    expect(OnlineExam.findOne).toHaveBeenCalledWith({
      where: { id: 'main-exam', school_id: 'school', branch_id: 'main-branch' }
    });
    expect(OnlineExamQuestion.findOne).toHaveBeenCalledWith({
      where: { id: 'other-exam-question', online_exam_id: 'main-exam', school_id: 'school' }
    });
  });
});
