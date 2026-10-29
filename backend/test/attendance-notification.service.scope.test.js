require('module-alias/register');

jest.mock('../src/utils/communication/email', () => ({ sendEmail: jest.fn() }));
jest.mock('../src/utils/communication/sms', () => ({ sendAttendanceNotificationSMS: jest.fn() }));
jest.mock('../src/models', () => ({
  Student: { findAll: jest.fn() },
  Parent: {},
  School: {},
  Branch: { findByPk: jest.fn() },
  Class: {},
  Section: {}
}));

const { Op } = require('sequelize');
const { Student, Branch } = require('../src/models');
const {
  sendAttendanceSummaryNotifications
} = require('../src/services/academic/attendance-notification.service');

describe('attendance summary notification query scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Student.findAll.mockResolvedValue([]);
    Branch.findByPk.mockResolvedValue({ School: { name: 'Demo School' } });
  });

  it('keeps summary recipients within the trusted tenant and teacher assignment scope', async () => {
    const classData = {
      id: 'class-a',
      school_id: 'school-a',
      branch_id: 'branch-a'
    };
    const sessionData = {
      class_id: 'class-a',
      section_id: 'section-a',
      stream_id: 'stream-a'
    };
    const assignmentScope = { [Op.and]: [{ [Op.or]: [{ class_id: 'class-a' }] }] };

    await sendAttendanceSummaryNotifications(classData, sessionData, assignmentScope);

    expect(Student.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-a',
      branch_id: 'branch-a',
      class_id: 'class-a',
      section_id: 'section-a',
      stream_id: 'stream-a',
      is_active: true
    });
    expect(Student.findAll.mock.calls[0][0].where[Op.and]).toEqual(assignmentScope[Op.and]);
  });
});
