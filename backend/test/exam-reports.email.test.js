require('module-alias/register');
jest.mock('~/utils/communication/email', () => ({ sendEmail: jest.fn() }));

const { sendEmail } = require('~/utils/communication/email');
const {
  sendReportCardEmails
} = require('../src/controllers/academic/exam-reports/exam-reports.controller');

describe('Report-card email delivery', () => {
  beforeEach(() => sendEmail.mockReset());

  it('sends one student-only PDF per valid, deduplicated recipient and reports misses', async () => {
    sendEmail.mockResolvedValue({ messageId: 'test-message' });
    const student = {
      id: 'student-1',
      first_name: 'Sarah',
      last_name: 'Demo',
      roll_number: 'DEMO-001',
      email: 'sarah@example.test',
      user: { email: 'sarah@example.test' },
      class: { name: 'Class 1' },
      sectionInfo: { name: 'A' },
      parents: [
        {
          guardian_email: 'parent@example.test',
          father_email: 'parent@example.test',
          mother_email: 'invalid-address',
          user: { email: 'parent@example.test' }
        }
      ]
    };
    const noRecipients = { id: 'student-2', first_name: 'Alex', last_name: 'Demo' };
    const delivery = await sendReportCardEmails(
      { name: 'First Term Examination', school: { name: 'Demo School' } },
      [student, noRecipients],
      { 'student-1': { marks_obtained: 86, percentage: 86, grade: 'A', rank: 1 } },
      { name: 'Demo Student Report Card', config: { show_rank: true } },
      { to_parents: true, to_students: true }
    );

    expect(delivery).toEqual({ sent: 2, failed: 0, skipped_students: 1 });
    expect(sendEmail).toHaveBeenCalledTimes(2);
    for (const [message] of sendEmail.mock.calls) {
      expect(message.attachments[0].content.subarray(0, 4).toString()).toBe('%PDF');
      expect(message.attachments[0].filename).toBe('report-card-DEMO-001.pdf');
    }
    expect(sendEmail.mock.calls.map(([message]) => message.to).sort()).toEqual([
      'parent@example.test',
      'sarah@example.test'
    ]);
  });

  it('counts failed deliveries without aborting later recipients', async () => {
    sendEmail.mockRejectedValueOnce(new Error('SMTP unavailable')).mockResolvedValueOnce({});
    const student = {
      id: 'student-1',
      first_name: 'Sarah',
      email: 'sarah@example.test',
      parents: [{ guardian_email: 'parent@example.test' }]
    };
    const delivery = await sendReportCardEmails(
      { name: 'First Term Examination', school: { name: 'Demo School' } },
      [student],
      {},
      { name: 'Demo Student Report Card', config: {} },
      { to_parents: true, to_students: true }
    );

    expect(delivery).toEqual({ sent: 1, failed: 1, skipped_students: 0 });
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });
});
