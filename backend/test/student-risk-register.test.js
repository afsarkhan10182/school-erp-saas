require('module-alias/register');
const models = require('../src/models');
const { Op } = require('sequelize');
const controller = require('../src/controllers/academic/student.controller');

describe('student risk register', () => {
  const originals = [
    [models.Student, 'findAndCountAll'],
    [models.Branch, 'findOne'],
    [models.ExamResult, 'findAll'],
    [models.GradingSystem, 'findOne'],
    [models.AttendanceSession, 'findAll'],
    [models.AttendanceRecord, 'findAll'],
    [models.FeeInvoice, 'findAll'],
    [models.StudentTransport, 'findAll'],
    [models.HostelAllocation, 'findAll'],
    [models.LibraryIssue, 'findAll']
  ].map(([model, method]) => [model, method, model[method]]);

  beforeEach(() => {
    models.StudentTransport.findAll = jest.fn().mockResolvedValue([]);
    models.HostelAllocation.findAll = jest.fn().mockResolvedValue([]);
    models.ExamResult.findAll = jest.fn().mockResolvedValue([]);
    models.LibraryIssue.findAll = jest.fn().mockResolvedValue([]);
    models.GradingSystem.findOne = jest.fn().mockResolvedValue({
      passing_percentage: 50,
      gradeScales: [{ min_percentage: 0, max_percentage: 49.99, is_passing: false }, { min_percentage: 50, max_percentage: 100, is_passing: true }]
    });
  });

  afterEach(() => originals.forEach(([model, method, original]) => { model[method] = original; }));

  const invoke = async (query = {}, role = 'branch_admin') => {
    let payload;
    let error;
    const response = { json: value => { payload = value; } };
    await controller.getStudentRiskRegister({
      user: { role, branch_id: 'branch-second' },
      schoolId: 'school-1',
      query
    }, response, value => { error = value; });
    return { payload, error };
  };

  it('calculates low-attendance and 30-day overdue signals within the assigned branch', async () => {
    models.Student.findAndCountAll = jest.fn().mockResolvedValue({
      count: 1,
      rows: [{ id: 'student-second', class_id: 'class-second', section_id: 'section-second', toJSON: () => ({ id: 'student-second', branch_id: 'branch-second' }) }]
    });
    models.AttendanceSession.findAll = jest.fn().mockResolvedValue([
      { id: 'session-present', class_id: 'class-second', section_id: 'section-second', date: '2026-10-01' },
      { id: 'session-absent', class_id: 'class-second', section_id: 'section-second', date: '2026-10-02' },
      { id: 'session-excused', class_id: 'class-second', section_id: 'section-second', date: '2026-10-03' }
    ]);
    models.AttendanceRecord.findAll = jest.fn().mockResolvedValue([
      { student_id: 'student-second', session_id: 'session-present', status: 'present' },
      { student_id: 'student-second', session_id: 'session-absent', status: 'absent' },
      { student_id: 'student-second', session_id: 'session-excused', status: 'excused' }
    ]);
    models.FeeInvoice.findAll = jest.fn().mockImplementation(async options => {
      expect(options.where).toMatchObject({ school_id: 'school-1', branch_id: 'branch-second' });
      return [{ student_id: 'student-second', balance_amount: '125.50', due_date: '2026-01-01' }];
    });
    models.StudentTransport.findAll = jest.fn().mockResolvedValue([{ student_id: 'student-second' }]);

    const { payload, error } = await invoke({
      branch_id: 'branch-main', class_id: 'class-second', section_id: 'section-second',
      category_id: 'category-second', gender: 'female'
    });

    expect(error).toBeUndefined();
    expect(models.Student.findAndCountAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-second', status: 'active',
      class_id: 'class-second', section_id: 'section-second', category_id: 'category-second', gender: 'female'
    });
    expect(models.AttendanceSession.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-second', status: 'published', attendance_type: 'daily'
    });
    expect(models.AttendanceRecord.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-second'
    });
    expect(models.StudentTransport.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-second'
    });
    expect(models.HostelAllocation.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-second'
    });
    expect(models.ExamResult.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-1', branch_id: 'branch-second'
    });
    expect(payload.data[0].risk).toMatchObject({
      attendance_rate: 50, attendance_marked_days: 2, overdue_balance: 125.5,
      signals: ['low_attendance', 'fees_overdue'],
      service_memberships: { transport: true, hostel: false }
    });
    expect(payload.summary.page_at_risk).toBe(1);
  });

  it('counts a published marked day with no student row as absent', async () => {
    models.Student.findAndCountAll = jest.fn().mockResolvedValue({
      count: 1,
      rows: [{ id: 'student-second', class_id: 'class-second', section_id: 'section-second', toJSON: () => ({ id: 'student-second' }) }]
    });
    models.AttendanceSession.findAll = jest.fn().mockResolvedValue([
      { id: 'session-missing-row', class_id: 'class-second', section_id: 'section-second', date: '2026-10-03' }
    ]);
    models.AttendanceRecord.findAll = jest.fn().mockResolvedValue([]);
    models.FeeInvoice.findAll = jest.fn().mockResolvedValue([]);

    const { payload } = await invoke();

    expect(payload.data[0].risk).toMatchObject({ attendance_rate: 0, attendance_marked_days: 1, signals: ['low_attendance'] });
  });

  it('does not call a student with no published session low-attendance', async () => {
    models.Student.findAndCountAll = jest.fn().mockResolvedValue({
      count: 1,
      rows: [{ id: 'student-second', class_id: 'class-second', section_id: 'section-second', toJSON: () => ({ id: 'student-second' }) }]
    });
    models.AttendanceSession.findAll = jest.fn().mockResolvedValue([]);
    models.AttendanceRecord.findAll = jest.fn().mockResolvedValue([]);
    models.FeeInvoice.findAll = jest.fn().mockResolvedValue([]);

    const { payload } = await invoke();

    expect(payload.data[0].risk).toMatchObject({ attendance_rate: null, signals: [] });
    expect(payload.summary.low_attendance).toBe(0);
  });

  it('supports one-, two-, or three-signal at-risk thresholds', async () => {
    models.Student.findAndCountAll = jest.fn().mockResolvedValue({
      count: 1,
      rows: [{ id: 'student-second', class_id: 'class-second', section_id: 'section-second', toJSON: () => ({ id: 'student-second' }) }]
    });
    models.AttendanceSession.findAll = jest.fn().mockResolvedValue([
      { id: 'session-absent', class_id: 'class-second', section_id: 'section-second', date: '2026-10-03' }
    ]);
    models.AttendanceRecord.findAll = jest.fn().mockResolvedValue([]);
    models.FeeInvoice.findAll = jest.fn().mockResolvedValue([
      { student_id: 'student-second', balance_amount: '50', due_date: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10) }
    ]);
    models.ExamResult.findAll = jest.fn().mockResolvedValue([{
      student_id: 'student-second', percentage: '40', grade: 'F', is_absent: false, updated_at: new Date().toISOString(),
      exam: { name: 'Latest Exam', publish_status: true, result_status: true, schedules: [{ class_id: 'class-second', section_id: 'section-second', exam_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10) }] }
    }]);

    const oneSignal = await invoke({ min_signals: 1 });
    const twoSignals = await invoke({ min_signals: 2 });
    const threeSignals = await invoke({ min_signals: 3 });

    expect(oneSignal.payload.summary).toMatchObject({ page_at_risk: 1, risk_thresholds: { min_signals: 1 } });
    expect(twoSignals.payload.summary).toMatchObject({ page_at_risk: 1, risk_thresholds: { min_signals: 2 } });
    expect(threeSignals.payload.summary).toMatchObject({ page_at_risk: 1, risk_thresholds: { min_signals: 3 } });
  });

  it('intersects service membership filters within the assigned branch before pagination', async () => {
    models.Student.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    models.StudentTransport.findAll = jest.fn().mockResolvedValue([
      { student_id: 'student-shared' }, { student_id: 'student-transport-only' }
    ]);
    models.HostelAllocation.findAll = jest.fn().mockResolvedValue([
      { student_id: 'student-shared' }, { student_id: 'student-hostel-only' }
    ]);
    models.LibraryIssue.findAll = jest.fn().mockResolvedValue([
      { student_id: 'student-shared', due_date: '2026-01-01', status: 'issued' },
      { student_id: 'student-library-only', due_date: '2026-01-01', status: 'issued' }
    ]);

    const { payload, error } = await invoke({ has_transport: true, has_hostel: true, library_out: true });

    expect(error).toBeUndefined();
    expect(models.StudentTransport.findAll.mock.calls[0][0].where).toEqual({ school_id: 'school-1', branch_id: 'branch-second' });
    expect(models.HostelAllocation.findAll.mock.calls[0][0].where).toEqual({ school_id: 'school-1', branch_id: 'branch-second' });
    expect(models.Student.findAndCountAll.mock.calls[0][0].where.id[Op.in]).toEqual(['student-shared']);
    expect(payload.pagination.total).toBe(0);
  });

  it('applies a single service filter without intersecting an unrequested service', async () => {
    models.Student.findAndCountAll = jest.fn().mockResolvedValue({
      count: 1,
      rows: [{ id: 'student-second', class_id: 'class-second', section_id: 'section-second', toJSON: () => ({ id: 'student-second' }) }]
    });
    models.StudentTransport.findAll = jest.fn().mockResolvedValue([{ student_id: 'student-second' }]);
    models.AttendanceSession.findAll = jest.fn().mockResolvedValue([]);
    models.AttendanceRecord.findAll = jest.fn().mockResolvedValue([]);
    models.FeeInvoice.findAll = jest.fn().mockResolvedValue([]);

    const { payload, error } = await invoke({ has_transport: true });

    expect(error).toBeUndefined();
    expect(models.Student.findAndCountAll.mock.calls[0][0].where.id[Op.in]).toEqual(['student-second']);
    expect(payload.pagination.total).toBe(1);
  });

  it('rejects malformed service membership filters', async () => {
    const { error } = await invoke({ has_transport: 'yes' });
    expect(error.message).toBe('Service filters must be true or false');
  });

  it('chooses the newest scheduled exam result, including unpublished results', async () => {
    const date = daysAgo => new Date(Date.now() + daysAgo * 86400000).toISOString().slice(0, 10);
    models.Student.findAndCountAll = jest.fn().mockResolvedValue({
      count: 1,
      rows: [{ id: 'student-second', class_id: 'class-second', section_id: 'section-second', toJSON: () => ({ id: 'student-second' }) }]
    });
    models.AttendanceSession.findAll = jest.fn().mockResolvedValue([]);
    models.AttendanceRecord.findAll = jest.fn().mockResolvedValue([]);
    models.FeeInvoice.findAll = jest.fn().mockResolvedValue([]);
    models.ExamResult.findAll = jest.fn().mockResolvedValue([
      {
        student_id: 'student-second', percentage: '82', grade: 'B', is_absent: false, updated_at: '2026-10-26T12:00:00Z',
        exam: { name: 'Earlier Exam', publish_status: true, result_status: true, schedules: [{ class_id: null, section_id: null, exam_date: date(-2) }] }
      },
      {
        student_id: 'student-second', percentage: '41', grade: 'D', is_absent: false, updated_at: '2026-10-27T12:00:00Z',
        exam: { name: 'Latest Exam', publish_status: false, result_status: false, schedules: [{ class_id: 'class-second', section_id: 'section-second', exam_date: date(-1) }] }
      },
      {
        student_id: 'student-second', percentage: '43', grade: 'D', is_absent: false, updated_at: '2026-10-28T12:00:00Z',
        exam: { name: 'Corrected Latest Exam', publish_status: false, result_status: false, schedules: [{ class_id: 'class-second', section_id: 'section-second', exam_date: date(-1) }] }
      },
      {
        student_id: 'student-second', percentage: '99', grade: 'A', is_absent: false, updated_at: '2026-10-28T12:00:00Z',
        exam: { name: 'Future Exam', publish_status: true, result_status: true, schedules: [{ class_id: 'class-second', section_id: 'section-second', exam_date: date(1) }] }
      }
    ]);

    const { payload, error } = await invoke();

    expect(error).toBeUndefined();
    expect(payload.data[0].risk.latest_result).toEqual({
      exam_name: 'Corrected Latest Exam', exam_date: date(-1), percentage: 43, grade: 'D',
      is_absent: false, is_passed: false, published: false, result_published: false
    });
    expect(payload.data[0].risk.signals).toContain('failed_latest_exam');
    expect(payload.summary.failed_latest_exam).toBe(1);
  });

  it('filters and reports unreturned student library loans within the assigned branch', async () => {
    models.Student.findAndCountAll = jest.fn().mockResolvedValue({
      count: 1,
      rows: [{ id: 'student-second', class_id: 'class-second', section_id: 'section-second', toJSON: () => ({ id: 'student-second' }) }]
    });
    models.AttendanceSession.findAll = jest.fn().mockResolvedValue([]);
    models.AttendanceRecord.findAll = jest.fn().mockResolvedValue([]);
    models.FeeInvoice.findAll = jest.fn().mockResolvedValue([]);
    models.LibraryIssue.findAll = jest.fn().mockResolvedValue([
      { student_id: 'student-second', status: 'overdue', due_date: '2026-10-01' }
    ]);

    const { payload, error } = await invoke({ library_out: 'true', library_overdue: 'true' });

    expect(error).toBeUndefined();
    expect(models.LibraryIssue.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        school_id: 'school-1', branch_id: 'branch-second', borrower_type: 'student',
        status: { [Op.in]: ['issued', 'overdue'] }, due_date: { [Op.lt]: expect.any(String) }
      })
    }));
    expect(models.Student.findAndCountAll.mock.calls[0][0].where.id).toEqual({ [Op.in]: ['student-second'] });
    expect(payload.data[0].risk.service_memberships).toMatchObject({ library_books_out: true, library_books_overdue: true });
  });

  it('does not send an undefined branch filter for school-wide admins', async () => {
    models.Student.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    models.AttendanceSession.findAll = jest.fn().mockResolvedValue([]);
    models.AttendanceRecord.findAll = jest.fn().mockResolvedValue([]);
    models.FeeInvoice.findAll = jest.fn().mockResolvedValue([]);

    const { payload, error } = await invoke({}, 'admin');

    expect(error).toBeUndefined();
    expect(models.Student.findAndCountAll.mock.calls[0][0].where).toEqual({
      school_id: 'school-1', status: 'active'
    });
    expect(payload.pagination.total).toBe(0);
  });

  it('rejects impossible risk thresholds', async () => {
    const { error } = await invoke({ attendance_below: 101 });
    expect(error).toMatchObject({ statusCode: 400 });
    const invalidSignalCount = await invoke({ min_signals: 4 });
    expect(invalidSignalCount.error).toMatchObject({ statusCode: 400 });
    const invalidLibraryFilter = await invoke({ library_overdue: 'yes' });
    expect(invalidLibraryFilter.error).toMatchObject({ statusCode: 400 });
  });

  it('rejects malformed and cross-school branch filters', async () => {
    const malformed = await invoke({ branch_id: 'not-a-uuid' }, 'admin');
    expect(malformed.error).toMatchObject({ statusCode: 400 });

    models.Branch.findOne = jest.fn().mockResolvedValue(null);
    const foreign = await invoke({ branch_id: '7ee374fc-0605-46af-b580-564b12a66eaf' }, 'admin');
    expect(foreign.error).toMatchObject({ statusCode: 400 });
    expect(models.Branch.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ school_id: 'school-1' })
    }));
  });
});
