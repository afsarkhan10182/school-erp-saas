require('module-alias/register');
const {
  sequelize,
  Branch,
  Parent,
  StudentParent,
  Student,
  Class,
  Section,
  ClassTeacher,
  ParentTeacherMeeting,
  ParentTeacherMeetingStudent
} = require('../src/models');
const {
  create,
  list,
  recordAttendance,
  submitFeedback
} = require('../src/controllers/academic/parent-teacher-meeting.controller');

const makeRequest = overrides => ({
  user: { id: 'admin-1', role: 'admin', school_id: 'school-1' },
  schoolId: 'school-1',
  params: { id: 'meeting-1' },
  query: {},
  body: {},
  ...overrides
});

const makeResponse = () => {
  const res = {};
  res.status = jest.fn(code => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn(body => {
    res.body = body;
    return res;
  });
  return res;
};

describe('parent-teacher meeting boundaries', () => {
  const methods = [
    [Branch, 'findOne'],
    [Parent, 'findOne'],
    [StudentParent, 'findOne'],
    [Student, 'findOne'],
    [Student, 'findAll'],
    [Class, 'findOne'],
    [Section, 'findOne'],
    [ClassTeacher, 'findAll'],
    [ParentTeacherMeeting, 'create'],
    [ParentTeacherMeeting, 'findAll'],
    [ParentTeacherMeeting, 'findOne'],
    [ParentTeacherMeetingStudent, 'bulkCreate'],
    [ParentTeacherMeetingStudent, 'findAll'],
    [ParentTeacherMeetingStudent, 'findOne'],
    [ParentTeacherMeetingStudent, 'update'],
    [sequelize, 'transaction']
  ];
  let originals;

  beforeEach(() => {
    originals = methods.map(([object, key]) => [object, key, object[key]]);
  });
  afterEach(() => {
    originals.forEach(([object, key, original]) => {
      object[key] = original;
    });
    jest.clearAllMocks();
  });

  it('creates a branch-scoped meeting and its active-student roster atomically', async () => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    Class.findOne = jest.fn().mockResolvedValue({ id: 'class-1' });
    Section.findOne = jest.fn().mockResolvedValue({ id: 'section-1' });
    Student.findAll = jest.fn().mockResolvedValue([{ id: 'student-1' }, { id: 'student-2' }]);
    ParentTeacherMeeting.create = jest.fn().mockResolvedValue({ id: 'meeting-1' });
    ParentTeacherMeetingStudent.bulkCreate = jest.fn().mockResolvedValue([]);
    sequelize.transaction = jest.fn(async callback => callback({ id: 'transaction' }));
    const res = makeResponse();

    await create(
      makeRequest({
        body: {
          branch_id: 'branch-1',
          class_id: 'class-1',
          section_id: 'section-1',
          title: 'Term review',
          meeting_date: '2026-11-20',
          start_time: '09:00',
          end_time: '10:00',
          mode: 'in_person'
        }
      }),
      res
    );

    expect(res.statusCode).toBe(201);
    expect(res.body.data.invited_count).toBe(2);
    expect(ParentTeacherMeetingStudent.bulkCreate).toHaveBeenCalledWith(
      [
        { meeting_id: 'meeting-1', student_id: 'student-1' },
        { meeting_id: 'meeting-1', student_id: 'student-2' }
      ],
      { transaction: { id: 'transaction' } }
    );
    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it('lists all school branches for an admin when no branch is selected', async () => {
    ParentTeacherMeeting.findAll = jest.fn().mockResolvedValue([]);
    const res = makeResponse();

    await list(
      makeRequest({ user: { id: 'admin-1', role: 'admin', school_id: 'school-1', branch_id: 'branch-1' } }),
      res
    );

    expect(ParentTeacherMeeting.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { school_id: 'school-1' } })
    );
    expect(res.body.data).toEqual([]);
  });

  it.each([
    ['javascript:alert(1)', 'in_person'],
    ['https://user:secret@example.test/room', 'online'],
    ['http://example.test/room', 'hybrid']
  ])('rejects unsafe meeting link %s in %s mode before scheduling', async (online_url, mode) => {
    Branch.findOne = jest.fn();
    ParentTeacherMeeting.create = jest.fn();
    const res = makeResponse();

    await create(makeRequest({
      body: {
        title: 'Term review', meeting_date: '2026-11-20', start_time: '09:00', end_time: '10:00',
        mode, online_url
      }
    }), res);

    expect(res.statusCode).toBe(400);
    expect(Branch.findOne).not.toHaveBeenCalled();
    expect(ParentTeacherMeeting.create).not.toHaveBeenCalled();
  });

  it('rejects Branch Admins with no assigned branch before reading the school roster', async () => {
    Student.findAll = jest.fn();
    const res = makeResponse();

    await create(
      makeRequest({
        user: { id: 'branch-admin', role: 'branch_admin', school_id: 'school-1', branch_id: null },
        body: { title: 'PTM', meeting_date: '2026-11-20', start_time: '09:00', end_time: '10:00' }
      }),
      res
    );

    expect(res.statusCode).toBe(403);
    expect(Student.findAll).not.toHaveBeenCalled();
  });

  it('does not allow an assigned-section teacher to update an unrelated student', async () => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    ParentTeacherMeeting.findOne = jest.fn().mockResolvedValue({
      id: 'meeting-1',
      school_id: 'school-1',
      branch_id: 'branch-1',
      class_id: 'class-1',
      section_id: null,
      status: 'scheduled'
    });
    ClassTeacher.findAll = jest
      .fn()
      .mockResolvedValue([{ class_id: 'class-1', section_id: 'section-a' }]);
    Student.findAll = jest.fn().mockResolvedValue([{ id: 'student-a' }]);
    ParentTeacherMeetingStudent.findAll = jest.fn();
    const res = makeResponse();

    await recordAttendance(
      makeRequest({
        user: { id: 'teacher-1', role: 'teacher', school_id: 'school-1', branch_id: 'branch-1' },
        body: {
          branch_id: 'other-branch',
          attendees: [{ student_id: 'student-b', attendance_status: 'present' }]
        }
      }),
      res
    );

    expect(res.statusCode).toBe(404);
    expect(Branch.findOne).toHaveBeenCalledWith({
      where: { id: 'branch-1', school_id: 'school-1', status: 'active' }
    });
    expect(ParentTeacherMeetingStudent.findAll).not.toHaveBeenCalled();
  });

  it('accepts feedback only from a parent linked to the specified meeting student', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({ id: 'parent-1' });
    StudentParent.findOne = jest.fn().mockResolvedValue({ id: 'link-1' });
    Student.findOne = jest
      .fn()
      .mockResolvedValue({ id: 'student-1', school_id: 'school-1', branch_id: 'branch-1' });
    const participant = {
      meeting: { meeting_date: '2026-01-01' },
      update: jest.fn().mockResolvedValue(undefined)
    };
    ParentTeacherMeetingStudent.findOne = jest.fn().mockResolvedValue(participant);
    const res = makeResponse();

    await submitFeedback(
      makeRequest({
        user: { id: 'parent-user', role: 'parent', school_id: 'school-1' },
        body: { student_id: 'student-1', rating: 5, feedback: 'Helpful discussion' }
      }),
      res
    );

    expect(res.statusCode).toBeUndefined();
    expect(ParentTeacherMeetingStudent.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { meeting_id: 'meeting-1', student_id: 'student-1' }
      })
    );
    expect(participant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        parent_rating: 5,
        parent_feedback: 'Helpful discussion',
        feedback_parent_id: 'parent-1'
      })
    );
    expect(res.body.success).toBe(true);
  });

  it('keeps parent feedback closed until the meeting date', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({ id: 'parent-1' });
    StudentParent.findOne = jest.fn().mockResolvedValue({ id: 'link-1' });
    Student.findOne = jest
      .fn()
      .mockResolvedValue({ id: 'student-1', school_id: 'school-1', branch_id: 'branch-1' });
    const participant = { meeting: { meeting_date: '2099-01-01' }, update: jest.fn() };
    ParentTeacherMeetingStudent.findOne = jest.fn().mockResolvedValue(participant);
    const res = makeResponse();

    await submitFeedback(
      makeRequest({
        user: { id: 'parent-user', role: 'parent', school_id: 'school-1' },
        body: { student_id: 'student-1', rating: 5, feedback: 'Too early' }
      }),
      res
    );

    expect(res.statusCode).toBe(409);
    expect(participant.update).not.toHaveBeenCalled();
  });
});
