require('module-alias/register');

jest.mock('../src/models', () => ({
  AttendanceSession: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    findAndCountAll: jest.fn()
  },
  AttendanceRecord: { bulkCreate: jest.fn(), count: jest.fn(), findAll: jest.fn() },
  Student: { findAll: jest.fn() },
  Class: { findOne: jest.fn() },
  Section: { findOne: jest.fn() },
  ClassTeacher: { findAll: jest.fn() },
  SubjectTeacher: { findAll: jest.fn() }
}));
jest.mock('../src/utils/communication/sms', () => ({
  ...jest.requireActual('../src/utils/communication/sms'),
  sendSMS: jest.fn().mockResolvedValue({ success: true })
}));

const AttendanceController = require('../src/controllers/academic/attendance/attendance.controller');
const { sendSMS } = require('../src/utils/communication/sms');
const {
  AttendanceSession,
  AttendanceRecord,
  Student,
  Class,
  ClassTeacher,
  SubjectTeacher
} = require('../src/models');

describe('Attendance teacher assignment and student scope', () => {
  const reqBase = {
    schoolId: 'school-a',
    branchId: 'branch-a',
    user: { id: 'teacher-a', role: 'teacher' }
  };

  beforeEach(() => jest.clearAllMocks());

  it('does not create a session for an unassigned class', async () => {
    Class.findOne.mockResolvedValue({ id: 'class-b' });
    ClassTeacher.findAll.mockResolvedValue([]);
    SubjectTeacher.findAll.mockResolvedValue([]);
    const next = jest.fn();

    await AttendanceController.upsertSession(
      {
        ...reqBase,
        body: {
          date: '2026-10-23',
          class_id: 'class-b',
          branch_id: 'branch-a',
          academic_year: '2026-2027'
        }
      },
      { status: () => ({ json: jest.fn() }) },
      next
    );

    expect(next.mock.calls[0][0].statusCode).toBe(403);
    expect(AttendanceSession.findOrCreate).not.toHaveBeenCalled();
  });

  it('limits a teacher session list to assigned class, section, branch, and year', async () => {
    ClassTeacher.findAll.mockResolvedValue([
      {
        class_id: 'class-a',
        section_id: 'section-a',
        stream_id: null,
        branch_id: 'branch-a',
        academic_year: '2026-2027'
      }
    ]);
    SubjectTeacher.findAll.mockResolvedValue([]);
    AttendanceSession.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await AttendanceController.listSessions({ ...reqBase, query: {} }, response, jest.fn());

    expect(AttendanceSession.findAndCountAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-a',
      branch_id: 'branch-a',
      [require('sequelize').Op.or]: [
        {
          class_id: 'class-a',
          section_id: 'section-a',
          branch_id: 'branch-a',
          academic_year: '2026-2027'
        }
      ]
    });
  });

  it('calculates attendance report summaries across all filtered rows, not only the current page', async () => {
    AttendanceRecord.count.mockResolvedValue([
      { status: 'present', count: '2' },
      { status: 'absent', count: '1' },
      { status: 'late', count: '1' }
    ]);
    AttendanceRecord.findAll.mockResolvedValue([{ status: 'absent' }, { status: 'late' }]);
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await AttendanceController.getReport(
      {
        schoolId: 'school-a',
        branchId: 'branch-a',
        user: { role: 'admin' },
        query: {
          date_from: '2026-10-01',
          date_to: '2026-10-31',
          academic_year: '2026-2027',
          page: '2',
          limit: '2'
        }
      },
      response,
      jest.fn()
    );

    expect(AttendanceRecord.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        school_id: 'school-a',
        branch_id: 'branch-a',
        academic_year: '2026-2027',
        date: { [require('sequelize').Op.between]: ['2026-10-01', '2026-10-31'] }
      }),
      group: ['status']
    });
    expect(AttendanceRecord.findAll.mock.calls[0][0]).toMatchObject({ limit: 2, offset: 2 });
    expect(response.json.mock.calls[0][0].data.summary).toEqual({
      total: 4,
      present: 2,
      absent: 1,
      late: 1,
      excused: 0
    });
  });

  it('returns the attendance debug date range using Sequelize aggregate helpers', async () => {
    AttendanceRecord.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);
    AttendanceRecord.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ earliest_date: '2026-10-01', latest_date: '2026-10-01' }]);
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await AttendanceController.debugAttendanceData(
      { schoolId: 'school-a', branchId: 'branch-a', query: {} },
      response,
      jest.fn()
    );

    expect(response.json.mock.calls[0][0].debug.dateRange).toEqual({
      earliest_date: '2026-10-01',
      latest_date: '2026-10-01'
    });
  });

  it('rejects a student outside the assigned class before writing records', async () => {
    AttendanceSession.findOne.mockResolvedValue({
      id: 'session-a',
      school_id: 'school-a',
      branch_id: 'branch-a',
      class_id: 'class-a',
      section_id: 'section-a',
      stream_id: null,
      academic_year: '2026-2027',
      date: '2026-10-23',
      status: 'draft'
    });
    ClassTeacher.findAll.mockResolvedValue([
      {
        class_id: 'class-a',
        section_id: 'section-a',
        stream_id: null,
        branch_id: 'branch-a',
        academic_year: '2026-2027'
      }
    ]);
    SubjectTeacher.findAll.mockResolvedValue([]);
    Student.findAll.mockResolvedValue([]);
    const next = jest.fn();

    await AttendanceController.saveRecords(
      {
        ...reqBase,
        body: {
          session_id: 'session-a',
          records: [{ student_id: 'student-other', status: 'present' }],
          publish: false
        }
      },
      { status: () => ({ json: jest.fn() }) },
      next
    );

    expect(AttendanceSession.findOne).toHaveBeenCalledWith({
      where: { id: 'session-a', school_id: 'school-a', branch_id: 'branch-a' }
    });
    expect(next.mock.calls[0][0].statusCode).toBe(403);
    expect(AttendanceRecord.bulkCreate).not.toHaveBeenCalled();
  });

  it('sends absence SMS through the shared object-based SMS utility', async () => {
    AttendanceSession.findOne.mockResolvedValue({
      id: 'session-a', school_id: 'school-a', branch_id: 'branch-a', status: 'published'
    });
    AttendanceRecord.findAll.mockResolvedValue([{
      date: '2026-10-23',
      student: {
        first_name: 'Sarah',
        last_name: 'Demo',
        parents: [{ guardian_phone: '+91 90000 00002' }]
      }
    }]);
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await AttendanceController.notifyAbsentees(
      { schoolId: 'school-a', branchId: 'branch-a', body: { session_id: 'session-a' } },
      response,
      jest.fn()
    );

    expect(AttendanceSession.findOne).toHaveBeenCalledWith({
      where: { id: 'session-a', school_id: 'school-a', branch_id: 'branch-a' }
    });
    expect(AttendanceRecord.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        session_id: 'session-a', school_id: 'school-a', branch_id: 'branch-a', status: 'absent'
      }
    }));
    expect(sendSMS).toHaveBeenCalledWith({
      to: '+919000000002',
      message: 'Absence Alert: Sarah Demo was absent on 2026-10-23.'
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ success: true, data: { notified: 1, count_absent: 1 } });
  });

  it('does not notify another branch session or query its absent records', async () => {
    AttendanceSession.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await AttendanceController.notifyAbsentees(
      { schoolId: 'school-a', branchId: 'branch-a', body: { session_id: 'session-b' } },
      {},
      next
    );

    expect(AttendanceSession.findOne).toHaveBeenCalledWith({
      where: { id: 'session-b', school_id: 'school-a', branch_id: 'branch-a' }
    });
    expect(AttendanceRecord.findAll).not.toHaveBeenCalled();
    expect(sendSMS).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });

  it('does not notify draft attendance sessions', async () => {
    AttendanceSession.findOne.mockResolvedValue({
      id: 'session-a', school_id: 'school-a', branch_id: 'branch-a', status: 'draft'
    });
    const next = jest.fn();

    await AttendanceController.notifyAbsentees(
      { schoolId: 'school-a', branchId: 'branch-a', body: { session_id: 'session-a' } },
      {},
      next
    );

    expect(AttendanceRecord.findAll).not.toHaveBeenCalled();
    expect(sendSMS).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});
