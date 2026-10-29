require('module-alias/register');

const DashboardController = require('../src/controllers/shared/dashboard.controller');
const { DynamicEntityRecord, Student } = require('../src/models');

describe('Receptionist dashboard scope', () => {
  it('returns register counts scoped to the assigned school and branch', async () => {
    const originalRecordCount = DynamicEntityRecord.count;
    const originalStudentCount = Student.count;
    const countsByType = { enquiry: 2, visitor: 3, call_log: 4, postal: 5 };
    const queries = [];
    let result;

    try {
      DynamicEntityRecord.count = jest.fn(async ({ where }) => {
        queries.push(where);
        return countsByType[where.entity_type];
      });
      Student.count = jest.fn(async ({ where }) => {
        queries.push(where);
        return 6;
      });

      await DashboardController.getStats(
        {
          user: { role: 'receptionist', school_id: 'school-1', branch_id: 'branch-assigned' },
          query: { branch_id: 'branch-forged' }
        },
        { json: payload => { result = payload.data; } },
        error => { if (error) throw error; }
      );

      expect(result).toMatchObject({
        role: 'receptionist',
        totalEnquiries: 2,
        todayVisitors: 3,
        callLogs: 4,
        postalRecords: 5,
        totalStudents: 6
      });
      expect(queries).toHaveLength(5);
      expect(queries.every(where => where.school_id === 'school-1' && where.branch_id === 'branch-assigned')).toBe(true);
      expect(queries.some(where => where.branch_id === 'branch-forged')).toBe(false);
    } finally {
      DynamicEntityRecord.count = originalRecordCount;
      Student.count = originalStudentCount;
    }
  });
});
