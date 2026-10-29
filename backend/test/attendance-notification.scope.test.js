require('module-alias/register');

jest.mock('../src/services/academic/attendance-notification.service', () => ({
  sendAbsenteeNotifications: jest.fn(),
  sendLateArrivalNotifications: jest.fn(),
  sendAttendanceSummaryNotifications: jest.fn()
}));

jest.mock('../src/models', () => ({
  Student: { findAll: jest.fn(), findAndCountAll: jest.fn(), count: jest.fn() },
  Parent: {},
  StudentParent: {},
  Class: { findOne: jest.fn() },
  Section: { findOne: jest.fn() },
  Branch: {},
  School: { findByPk: jest.fn() },
  ClassTeacher: { findAll: jest.fn() },
  SubjectTeacher: { findAll: jest.fn() }
}));

const Controller = require('../src/controllers/academic/attendance/attendance-notification.controller');
const service = require('../src/services/academic/attendance-notification.service');
const { Student, Class, Section, ClassTeacher, SubjectTeacher } = require('../src/models');
const { Op } = require('sequelize');

describe('attendance notification authorization scope', () => {
  const sessionData = {
    date: '2026-10-23',
    class_id: 'class-a',
    section_id: 'section-a',
    academic_year: '2026-2027'
  };
  const req = {
    school_id: 'school-a',
    branch_id: 'branch-a',
    user: { id: 'teacher-a', role: 'teacher' },
    body: { sessionData, absentStudents: [{ student_id: 'student-a' }] }
  };
  const classRecord = {
    id: 'class-a',
    name: 'Class 1',
    school_id: 'school-a',
    branch_id: 'branch-a'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Class.findOne.mockResolvedValue(classRecord);
    Section.findOne.mockResolvedValue({ id: 'section-a' });
    ClassTeacher.findAll.mockResolvedValue([{ section_id: 'section-a', stream_id: null }]);
    SubjectTeacher.findAll.mockResolvedValue([]);
    Student.findAll.mockResolvedValue([{ id: 'student-a' }]);
    service.sendAbsenteeNotifications.mockResolvedValue({ emailsSent: 1 });
  });

  it('does not notify a student outside the submitted class roster', async () => {
    Student.findAll.mockResolvedValue([]);
    const next = jest.fn();

    await Controller.sendAbsenceNotifications(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(service.sendAbsenteeNotifications).not.toHaveBeenCalled();
  });

  it('rejects unassigned teachers before any notification can be sent', async () => {
    ClassTeacher.findAll.mockResolvedValue([]);
    SubjectTeacher.findAll.mockResolvedValue([]);
    const next = jest.fn();

    await Controller.sendAbsenceNotifications(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(Student.findAll).not.toHaveBeenCalled();
    expect(service.sendAbsenteeNotifications).not.toHaveBeenCalled();
  });

  it('uses server-resolved school and branch context for valid notifications', async () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await Controller.sendAbsenceNotifications(req, response, jest.fn());

    expect(service.sendAbsenteeNotifications).toHaveBeenCalledWith(req.body.absentStudents, {
      ...sessionData,
      class_id: classRecord.id,
      branch_id: classRecord.branch_id
    });
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('passes trusted class and roster scope into summary delivery', async () => {
    const summaryReq = {
      ...req,
      body: { sessionData, classData: { id: 'attacker-controlled-id', branch_id: 'other-branch' } }
    };
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await Controller.sendAttendanceSummary(summaryReq, response, jest.fn());

    const [trustedClass, trustedSession, studentWhere] =
      service.sendAttendanceSummaryNotifications.mock.calls[0];
    expect(trustedClass).toMatchObject(classRecord);
    expect(trustedSession.branch_id).toBe('branch-a');
    expect(studentWhere).toMatchObject({
      school_id: 'school-a',
      branch_id: 'branch-a',
      class_id: 'class-a',
      section_id: 'section-a'
    });
    expect(studentWhere[Op.and]).toBeDefined();
  });
});
