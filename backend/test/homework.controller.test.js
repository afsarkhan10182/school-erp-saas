require('module-alias/register');
const {
  Branch, Class, ClassTeacher, Homework, HomeworkSubmission, Section, Student, Subject, SubjectTeacher
} = require('../src/models');
const { Op } = require('sequelize');
const {
  list,
  create,
  update,
  getMySubmission,
  submitWork,
  listSubmissions,
  gradeSubmission,
  remove
} = require('../src/controllers/academic/homework.controller');

const student = {
  id: 'student-1',
  user_id: 'student-user-1',
  school_id: 'school-1',
  branch_id: 'branch-1',
  class_id: 'class-1',
  section_id: 'section-1',
  academic_year: '2026-2027'
};
const homework = {
  id: 'homework-1',
  school_id: student.school_id,
  branch_id: student.branch_id,
  class_id: student.class_id,
  section_id: student.section_id,
  created_by: 'teacher-1'
};

const makeRequest = overrides => ({
  user: { id: student.user_id, role: 'student', school_id: student.school_id },
  schoolId: student.school_id,
  params: { id: homework.id },
  query: {},
  body: { submission_text: 'Completed work', student_id: 'spoofed-student' },
  ...overrides
});

const makeResponse = () => {
  const res = {};
  res.status = jest.fn(code => { res.statusCode = code; return res; });
  res.json = jest.fn(body => { res.body = body; return res; });
  return res;
};

describe('homework submissions', () => {
  const originals = {
    studentFindOne: Student.findOne,
    homeworkFindOne: Homework.findOne,
    homeworkFindAndCountAll: Homework.findAndCountAll,
    homeworkCreate: Homework.create,
    classFindOne: Class.findOne,
    classTeacherFindOne: ClassTeacher.findOne,
    branchFindOne: Branch.findOne,
    sectionFindOne: Section.findOne,
    subjectFindOne: Subject.findOne,
    subjectTeacherFindOne: SubjectTeacher.findOne,
    submissionFindOne: HomeworkSubmission.findOne,
    submissionCreate: HomeworkSubmission.create,
    submissionFindAll: HomeworkSubmission.findAll,
    submissionCount: HomeworkSubmission.count,
    studentCount: Student.count,
    homeworkDestroy: Homework.prototype.destroy
  };

  afterEach(() => {
    Student.findOne = originals.studentFindOne;
    Homework.findOne = originals.homeworkFindOne;
    Homework.findAndCountAll = originals.homeworkFindAndCountAll;
    Homework.create = originals.homeworkCreate;
    Class.findOne = originals.classFindOne;
    ClassTeacher.findOne = originals.classTeacherFindOne;
    Branch.findOne = originals.branchFindOne;
    Section.findOne = originals.sectionFindOne;
    Subject.findOne = originals.subjectFindOne;
    SubjectTeacher.findOne = originals.subjectTeacherFindOne;
    HomeworkSubmission.findOne = originals.submissionFindOne;
    HomeworkSubmission.create = originals.submissionCreate;
    HomeworkSubmission.findAll = originals.submissionFindAll;
    HomeworkSubmission.count = originals.submissionCount;
    Student.count = originals.studentCount;
    Homework.prototype.destroy = originals.homeworkDestroy;
    jest.clearAllMocks();
  });

  it('filters assignment lists by session while retaining legacy unassigned work', async () => {
    Homework.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    const res = makeResponse();

    await list(makeRequest({
      user: { id: 'admin-1', role: 'admin', school_id: student.school_id },
      query: { academic_year: student.academic_year }
    }), res);

    expect(Homework.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        school_id: student.school_id,
        [Op.and]: [{
          [Op.or]: [
            { academic_year: student.academic_year },
            { academic_year: null }
          ]
        }]
      },
      limit: 10,
      offset: 0
    }));
  });

  it('searches, sorts, and paginates homework with bounded page sizes', async () => {
    Homework.findAndCountAll = jest.fn().mockResolvedValue({ count: 37, rows: [] });
    const res = makeResponse();

    await list(makeRequest({
      user: { id: 'admin-1', role: 'admin', school_id: student.school_id },
      query: { page: '2', limit: '25', sort_by: 'title', sort_order: 'ASC', search: 'science' }
    }), res);

    const options = Homework.findAndCountAll.mock.calls[0][0];
    expect(options.limit).toBe(25);
    expect(options.offset).toBe(25);
    expect(options.order).toEqual([['title', 'ASC'], ['id', 'ASC']]);
    expect(options.where[Op.and][0][Op.or]).toEqual(expect.arrayContaining([
      { title: { [Op.iLike]: '%science%' } },
      { description: { [Op.iLike]: '%science%' } },
      { '$class.name$': { [Op.iLike]: '%science%' } },
      { '$section.name$': { [Op.iLike]: '%science%' } },
      { '$subject.name$': { [Op.iLike]: '%science%' } }
    ]));
    expect(res.body.data.pagination).toEqual({ page: 2, limit: 25, total: 37, totalPages: 2 });
  });

  it('returns submission progress scoped to the listed branch and rejects forged branch selectors', async () => {
    const record = { ...homework, toJSON: () => ({ ...homework }) };
    Branch.findOne = jest.fn().mockResolvedValue({ id: student.branch_id });
    Homework.findAndCountAll = jest.fn().mockResolvedValue({ count: 1, rows: [record] });
    Student.count = jest.fn().mockResolvedValue([
      { branch_id: student.branch_id, class_id: student.class_id, section_id: student.section_id, count: '6' }
    ]);
    HomeworkSubmission.findAll = jest.fn().mockResolvedValue([
      { homework_id: homework.id, submitted: '4', evaluated: '3' }
    ]);
    const res = makeResponse();

    await list(makeRequest({
      user: { id: 'branch-admin', role: 'branch_admin', school_id: student.school_id, branch_id: student.branch_id },
      query: { branch_id: 'branch-forged' }
    }), res);

    expect(Homework.findAndCountAll.mock.calls[0][0].where).toMatchObject({
      school_id: student.school_id, branch_id: student.branch_id
    });
    expect(HomeworkSubmission.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        school_id: student.school_id,
        homework_id: { [Op.in]: [homework.id] },
        branch_id: student.branch_id
      },
      group: ['homework_id'],
      raw: true
    }));
    expect(Student.count).toHaveBeenCalledWith({
      where: {
        school_id: student.school_id,
        status: 'active',
        class_id: { [Op.in]: [student.class_id] },
        branch_id: student.branch_id
      },
      group: ['branch_id', 'class_id', 'section_id']
    });
    expect(res.body.data.homeworks[0].submission_progress).toEqual({
      submitted: 4, evaluated: 3, total_enrolled: 6, pending_evaluation: 1
    });
    expect(res.body.data.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });

  it('sums active sections for class-wide homework and excludes other branches', async () => {
    const records = [
      { ...homework, id: 'homework-section', toJSON: () => ({ ...homework, id: 'homework-section' }) },
      { ...homework, id: 'homework-class', section_id: null, toJSON: () => ({ ...homework, id: 'homework-class', section_id: null }) }
    ];
    Homework.findAndCountAll = jest.fn().mockResolvedValue({ count: records.length, rows: records });
    HomeworkSubmission.findAll = jest.fn().mockResolvedValue([]);
    Student.count = jest.fn().mockResolvedValue([
      { branch_id: student.branch_id, class_id: student.class_id, section_id: student.section_id, count: '6' },
      { branch_id: student.branch_id, class_id: student.class_id, section_id: 'section-2', count: '4' },
      { branch_id: 'branch-other', class_id: student.class_id, section_id: student.section_id, count: '100' }
    ]);
    const res = makeResponse();

    await list(makeRequest({
      user: { id: 'admin-1', role: 'admin', school_id: student.school_id },
      query: {}
    }), res);

    expect(res.body.data.homeworks.map(item => item.submission_progress.total_enrolled)).toEqual([6, 10]);
    expect(Student.count).toHaveBeenCalledWith({
      where: {
        school_id: student.school_id,
        status: 'active',
        class_id: { [Op.in]: [student.class_id] }
      },
      group: ['branch_id', 'class_id', 'section_id']
    });
  });

  it('rejects teacher homework outside the teacher’s subject assignment', async () => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: student.branch_id });
    Class.findOne = jest.fn().mockResolvedValue({ id: student.class_id });
    Section.findOne = jest.fn().mockResolvedValue({ id: student.section_id });
    Subject.findOne = jest.fn().mockResolvedValue({ id: 'subject-1' });
    SubjectTeacher.findOne = jest.fn().mockResolvedValue(null);
    Homework.create = jest.fn();
    const res = makeResponse();

    await create(makeRequest({
      user: { id: 'teacher-1', role: 'teacher', school_id: student.school_id, branch_id: student.branch_id },
      body: {
        title: 'Fractions', due_date: '2026-11-03', class_id: student.class_id,
        section_id: student.section_id, subject_id: 'subject-1', academic_year: student.academic_year
      }
    }), res);

    expect(res.statusCode).toBe(403);
    expect(Homework.create).not.toHaveBeenCalled();
  });

  it('creates teacher homework only after resolving the exact assignment and branch', async () => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: student.branch_id });
    Class.findOne = jest.fn().mockResolvedValue({ id: student.class_id });
    Section.findOne = jest.fn().mockResolvedValue({ id: student.section_id });
    Subject.findOne = jest.fn().mockResolvedValue({ id: 'subject-1' });
    SubjectTeacher.findOne = jest.fn().mockResolvedValue({ id: 'assignment-1' });
    Homework.create = jest.fn().mockResolvedValue({ id: 'homework-new' });
    const res = makeResponse();

    await create(makeRequest({
      user: { id: 'teacher-1', role: 'teacher', school_id: student.school_id, branch_id: student.branch_id },
      body: {
        title: 'Fractions', due_date: '2026-11-03', class_id: student.class_id,
        section_id: student.section_id, subject_id: 'subject-1', academic_year: student.academic_year,
        attachment_url: 'https://resources.example.test/fractions'
      }
    }), res);

    expect(SubjectTeacher.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        teacher_id: 'teacher-1', school_id: student.school_id, branch_id: student.branch_id,
        class_id: student.class_id,
        [Op.or]: [{ section_id: null }, { section_id: student.section_id }],
        subject_id: 'subject-1', academic_year: student.academic_year
      })
    }));
    expect(Homework.create).toHaveBeenCalledWith(expect.objectContaining({
      school_id: student.school_id, branch_id: student.branch_id, created_by: 'teacher-1',
      attachment_url: 'https://resources.example.test/fractions'
    }));
    expect(res.statusCode).toBe(201);
  });

  it('stores uploaded homework files using the trusted school-scoped upload path', async () => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: student.branch_id });
    Class.findOne = jest.fn().mockResolvedValue({ id: student.class_id });
    Homework.create = jest.fn().mockResolvedValue({ id: 'homework-upload' });
    const res = makeResponse();

    await create(makeRequest({
      user: { id: 'admin-1', role: 'admin', school_id: student.school_id },
      body: {
        title: 'Fractions', due_date: '2026-11-03', class_id: student.class_id,
        branch_id: student.branch_id
      },
      file: { filename: 'attachment-123.pdf' },
      uploadMetadata: { schoolCode: 'DEMOERP', type: 'documents', year: 2026 }
    }), res);

    expect(Homework.create).toHaveBeenCalledWith(expect.objectContaining({
      attachment_url: '/uploads/schools/DEMOERP/documents/2026/attachment-123.pdf'
    }));
    expect(res.statusCode).toBe(201);
  });

  it('does not store uploaded homework files without trusted storage metadata', async () => {
    Homework.create = jest.fn();
    const res = makeResponse();

    await create(makeRequest({
      user: { id: 'admin-1', role: 'admin', school_id: student.school_id },
      body: { title: 'Fractions', due_date: '2026-11-03', class_id: student.class_id },
      file: { filename: 'attachment-123.pdf' }
    }), res);

    expect(Homework.create).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
  });

  it('replaces a homework attachment with the new school-scoped upload path', async () => {
    const updateHomework = { ...homework, academic_year: student.academic_year, update: jest.fn() };
    Homework.findOne = jest.fn().mockResolvedValue(updateHomework);
    Class.findOne = jest.fn().mockResolvedValue({ id: student.class_id });
    Section.findOne = jest.fn().mockResolvedValue({ id: student.section_id });
    HomeworkSubmission.count = jest.fn().mockResolvedValue(0);
    const res = makeResponse();

    await update(makeRequest({
      user: { id: 'admin-1', role: 'admin', school_id: student.school_id },
      body: { attachment_url: '' },
      file: { filename: 'replacement-456.pdf' },
      uploadMetadata: { schoolCode: 'DEMOERP', type: 'documents', year: 2026 }
    }), res);

    expect(res.body).toEqual({ success: true, data: { homework: updateHomework } });
    expect(updateHomework.update).toHaveBeenCalledWith(expect.objectContaining({
      attachment_url: '/uploads/schools/DEMOERP/documents/2026/replacement-456.pdf'
    }));
  });

  it('rejects unsafe homework resource URLs before any database lookup', async () => {
    Branch.findOne = jest.fn();
    Homework.create = jest.fn();
    const res = makeResponse();

    await create(makeRequest({
      user: { id: 'admin-1', role: 'admin', school_id: student.school_id },
      body: {
        title: 'Fractions', due_date: '2026-11-03', class_id: student.class_id,
        attachment_url: 'javascript:alert(1)'
      }
    }), res);

    expect(res.statusCode).toBe(400);
    expect(Branch.findOne).not.toHaveBeenCalled();
    expect(Homework.create).not.toHaveBeenCalled();
  });

  it('rejects unsafe homework resource URLs on update', async () => {
    const updateHomework = { ...homework, update: jest.fn() };
    Homework.findOne = jest.fn().mockResolvedValue(updateHomework);
    const res = makeResponse();

    await update(makeRequest({
      user: { id: 'admin-1', role: 'admin', school_id: student.school_id },
      body: { attachment_url: 'javascript:alert(1)' }
    }), res);

    expect(res.statusCode).toBe(400);
    expect(updateHomework.update).not.toHaveBeenCalled();
  });

  it('rejects teacher edits that move homework to an unassigned subject', async () => {
    const updateHomework = { ...homework, academic_year: student.academic_year, update: jest.fn() };
    Homework.findOne = jest.fn().mockResolvedValue(updateHomework);
    Class.findOne = jest.fn().mockResolvedValue({ id: student.class_id });
    Section.findOne = jest.fn().mockResolvedValue({ id: student.section_id });
    Subject.findOne = jest.fn().mockResolvedValue({ id: 'subject-1' });
    SubjectTeacher.findOne = jest.fn().mockResolvedValue(null);
    const res = makeResponse();

    await update(makeRequest({
      user: { id: 'teacher-1', role: 'teacher', school_id: student.school_id, branch_id: student.branch_id },
      body: { subject_id: 'subject-1' }
    }), res);

    expect(res.statusCode).toBe(403);
    expect(updateHomework.update).not.toHaveBeenCalled();
  });

  it('rejects a teacher-selected branch that differs from their assigned branch', async () => {
    Branch.findOne = jest.fn();
    Homework.create = jest.fn();
    const res = makeResponse();

    await create(makeRequest({
      user: { id: 'teacher-1', role: 'teacher', school_id: student.school_id, branch_id: student.branch_id },
      body: { title: 'Fractions', due_date: '2026-11-03', class_id: student.class_id, branch_id: 'branch-2' }
    }), res);

    expect(res.statusCode).toBe(403);
    expect(Branch.findOne).not.toHaveBeenCalled();
    expect(Homework.create).not.toHaveBeenCalled();
  });

  it('prevents changing the academic year after students have submitted work', async () => {
    const updateHomework = { ...homework, update: jest.fn() };
    Homework.findOne = jest.fn().mockResolvedValue(updateHomework);
    HomeworkSubmission.count = jest.fn().mockResolvedValue(1);
    Class.findOne = jest.fn().mockResolvedValue({ id: student.class_id });
    Section.findOne = jest.fn().mockResolvedValue({ id: student.section_id });
    const res = makeResponse();

    await update(makeRequest({
      user: { id: 'admin-1', role: 'admin', school_id: student.school_id },
      params: { id: homework.id },
      body: { academic_year: '2027-2028' }
    }), res);

    expect(res.statusCode).toBe(409);
    expect(updateHomework.update).not.toHaveBeenCalled();
  });

  it('updates editable fields without allowing callers to change record ownership or scope', async () => {
    const updateHomework = { ...homework, update: jest.fn() };
    Homework.findOne = jest.fn().mockResolvedValue(updateHomework);
    HomeworkSubmission.count = jest.fn().mockResolvedValue(0);
    Class.findOne = jest.fn().mockResolvedValue({ id: student.class_id });
    Section.findOne = jest.fn().mockResolvedValue({ id: student.section_id });
    const res = makeResponse();

    await update(makeRequest({
      user: { id: 'admin-1', role: 'admin', school_id: student.school_id },
      body: {
        title: 'Updated assignment',
        due_date: '2026-11-02',
        id: 'other-homework',
        created_by: 'other-user',
        updated_by: 'other-user',
        school_id: 'other-school',
        branch_id: 'other-branch'
      }
    }), res);

    expect(res.body.success).toBe(true);
    expect(updateHomework.update).toHaveBeenCalledWith({
      title: 'Updated assignment',
      due_date: '2026-11-02',
      updated_by: 'admin-1'
    });
  });

  it('creates a submission for the authenticated student, ignoring a spoofed student ID', async () => {
    Student.findOne = jest.fn().mockResolvedValue(student);
    Homework.findOne = jest.fn().mockResolvedValue(homework);
    HomeworkSubmission.findOne = jest.fn().mockResolvedValue(null);
    HomeworkSubmission.create = jest.fn().mockResolvedValue({ id: 'submission-1' });
    const res = makeResponse();

    await submitWork(makeRequest(), res);

    expect(Student.findOne).toHaveBeenCalledWith({ where: { user_id: student.user_id, school_id: student.school_id } });
    expect(Homework.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: homework.id,
        school_id: student.school_id,
        branch_id: student.branch_id,
        class_id: student.class_id,
        [Op.and]: expect.arrayContaining([
          { [Op.or]: [{ academic_year: student.academic_year }, { academic_year: null }] }
        ])
      })
    }));
    expect(HomeworkSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
      student_id: student.id,
      homework_id: homework.id,
      submission_text: 'Completed work'
    }));
    expect(res.statusCode).toBe(201);
  });

  it('rejects submissions when the homework is outside the student class/branch scope', async () => {
    Student.findOne = jest.fn().mockResolvedValue(student);
    Homework.findOne = jest.fn().mockResolvedValue(null);
    HomeworkSubmission.create = jest.fn();
    const res = makeResponse();

    await submitWork(makeRequest(), res);

    expect(res.statusCode).toBe(404);
    expect(HomeworkSubmission.create).not.toHaveBeenCalled();
  });

  it('does not allow students to change an evaluated submission', async () => {
    Student.findOne = jest.fn().mockResolvedValue(student);
    Homework.findOne = jest.fn().mockResolvedValue(homework);
    HomeworkSubmission.findOne = jest.fn().mockResolvedValue({ evaluated_at: new Date() });
    HomeworkSubmission.create = jest.fn();
    const res = makeResponse();

    await submitWork(makeRequest(), res);

    expect(res.statusCode).toBe(409);
    expect(HomeworkSubmission.create).not.toHaveBeenCalled();
  });

  it('returns only the authenticated student’s own submission', async () => {
    Student.findOne = jest.fn().mockResolvedValue(student);
    Homework.findOne = jest.fn().mockResolvedValue(homework);
    HomeworkSubmission.findOne = jest.fn().mockResolvedValue({ id: 'submission-1', student_id: student.id });
    const res = makeResponse();

    await getMySubmission(makeRequest({ query: { student_id: 'another-student' } }), res);

    expect(HomeworkSubmission.findOne).toHaveBeenCalledWith({
      where: { homework_id: homework.id, student_id: student.id, school_id: student.school_id }
    });
    expect(res.body.data.submission.student_id).toBe(student.id);
  });

  it('limits teachers to assignments they created', async () => {
    Homework.findOne = jest.fn().mockResolvedValue({ ...homework, created_by: 'another-teacher' });
    HomeworkSubmission.findAll = jest.fn();
    const res = makeResponse();

    await listSubmissions(makeRequest({ user: { id: 'teacher-1', role: 'teacher' } }), res);

    expect(res.statusCode).toBe(404);
    expect(HomeworkSubmission.findAll).not.toHaveBeenCalled();
  });

  it('pins teacher homework lookups to their own branch despite a forged branch filter', async () => {
    Homework.findOne = jest.fn().mockResolvedValue(null);
    const res = makeResponse();

    await update(makeRequest({
      user: { id: 'teacher-1', role: 'teacher', school_id: student.school_id, branch_id: student.branch_id },
      query: { branch_id: 'branch-2' },
      params: { id: homework.id },
      body: { title: 'Changed' }
    }), res);

    expect(Homework.findOne).toHaveBeenCalledWith({
      where: { id: homework.id, school_id: student.school_id, branch_id: student.branch_id }
    });
    expect(res.statusCode).toBe(404);
  });

  it('rejects negative marks before looking up a submission', async () => {
    HomeworkSubmission.findOne = jest.fn();
    const res = makeResponse();

    await gradeSubmission(makeRequest({ body: { marks: -1 }, params: { submissionId: 'submission-1' } }), res);

    expect(res.statusCode).toBe(400);
    expect(HomeworkSubmission.findOne).not.toHaveBeenCalled();
  });

  it('saves a grade only after resolving the submission homework inside the caller scope', async () => {
    const submission = { id: 'submission-1', homework, update: jest.fn().mockResolvedValue({ marks: 8 }) };
    HomeworkSubmission.findOne = jest.fn().mockResolvedValue(submission);
    Homework.findOne = jest.fn().mockResolvedValue({ id: homework.id });
    const res = makeResponse();

    await gradeSubmission(makeRequest({
      user: { id: 'admin-1', role: 'admin', school_id: student.school_id },
      params: { submissionId: submission.id },
      body: { marks: 8, remarks: 'Well done' }
    }), res);

    expect(Homework.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: homework.id, school_id: student.school_id })
    }));
    expect(submission.update).toHaveBeenCalledWith(expect.objectContaining({
      marks: 8,
      remarks: 'Well done',
      evaluated_by: 'admin-1'
    }));
    expect(res.body.success).toBe(true);
  });

  it('does not grade submissions from another branch', async () => {
    HomeworkSubmission.findOne = jest.fn().mockResolvedValue({ id: 'submission-1', homework, update: jest.fn() });
    Homework.findOne = jest.fn().mockResolvedValue(null);
    const res = makeResponse();

    await gradeSubmission(makeRequest({
      user: { id: 'branch-admin-2', role: 'branch_admin', school_id: student.school_id, branch_id: 'branch-2' },
      params: { submissionId: 'submission-1' },
      body: { marks: 5 }
    }), res);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('deletes homework when there are no student submissions', async () => {
    const homeworkRecord = { id: homework.id, destroy: jest.fn() };
    Homework.findOne = jest.fn().mockResolvedValue(homeworkRecord);
    HomeworkSubmission.count = jest.fn().mockResolvedValue(0);
    const res = makeResponse();

    await remove(makeRequest({
      user: { id: 'admin-1', role: 'admin', school_id: student.school_id },
      params: { id: homework.id }
    }), res);

    expect(res.body).toMatchObject({ success: true, message: 'Deleted' });
    expect(homeworkRecord.destroy).toHaveBeenCalledTimes(1);
  });

  it('prevents deletion of homework with student submissions', async () => {
    const homeworkRecord = { id: homework.id, destroy: jest.fn() };
    Homework.findOne = jest.fn().mockResolvedValue(homeworkRecord);
    HomeworkSubmission.count = jest.fn().mockResolvedValue(1);
    const res = makeResponse();

    await remove(makeRequest({ user: { id: 'admin-1', role: 'admin' }, params: { id: homework.id } }), res);

    expect(res.statusCode).toBe(409);
    expect(homeworkRecord.destroy).not.toHaveBeenCalled();
  });
});
