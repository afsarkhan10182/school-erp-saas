require('module-alias/register');
const DashboardController = require('../src/controllers/shared/dashboard.controller');
const assert = require('assert');

describe('DashboardController Parameter Sanitization & Scoping', () => {
  it('reports only successful current-month subscription revenue, grouped by currency', async () => {
    const { School, Branch, User, Transaction } = require('../src/models');
    const originals = {
      schoolCount: School.count,
      schoolFindAll: School.findAll,
      branchCount: Branch.count,
      userCount: User.count,
      transactionFindAll: Transaction.findAll
    };
    let result;
    try {
      School.count = async () => 1;
      School.findAll = async () => [];
      Branch.count = async () => 2;
      User.count = async () => 3;
      Transaction.findAll = async options => {
        const { Op } = require('sequelize');
        const range = options.where.created_at;
        expect(options.where).toMatchObject({
          payment_status: 'completed', transaction_status: 'success'
        });
        expect(range[Op.gte]).toEqual(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
        expect(range[Op.lt]).toEqual(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
        expect(options).toMatchObject({ group: ['currency'], raw: true });
        return [{ currency: 'INR', amount: '2500.00' }, { currency: 'USD', amount: '12.50' }];
      };

      await DashboardController.getOverviewReport(
        { user: { role: 'super_admin' } },
        { json: payload => { result = payload.data; } },
        error => { if (error) throw error; }
      );

      expect(result.subscriptionRevenueByCurrency).toEqual([
        { currency: 'INR', amount: '2500.00' },
        { currency: 'USD', amount: '12.50' }
      ]);
    } finally {
      School.count = originals.schoolCount;
      School.findAll = originals.schoolFindAll;
      Branch.count = originals.branchCount;
      User.count = originals.userCount;
      Transaction.findAll = originals.transactionFindAll;
    }
  });

  it('does not expose global subscription revenue to school roles', async () => {
    const { Transaction } = require('../src/models');
    const originalFindAll = Transaction.findAll;
    let statusCode;
    let responseBody;
    let queried = false;
    try {
      Transaction.findAll = async () => { queried = true; throw new Error('should not query'); };
      await DashboardController.getOverviewReport(
        { user: { role: 'admin', school_id: 'school-1' } },
        {
          status: code => ({ json: payload => { statusCode = code; responseBody = payload; } }),
          json: payload => { responseBody = payload; }
        },
        error => { throw error; }
      );
      expect(statusCode).toBe(403);
      expect(responseBody).toMatchObject({ success: false });
      expect(queried).toBe(false);
    } finally {
      Transaction.findAll = originalFindAll;
    }
  });

  it('counts distinct parents linked to students in a Branch Admin’s school and branch', async () => {
    const { Student, StudentParent, FeeInvoice, User } = require('../src/models');
    const originals = {
      studentFindAll: Student.findAll,
      parentCount: StudentParent.count,
      invoiceFindAll: FeeInvoice.findAll,
      userCount: User.count
    };
    let result;
    try {
      Student.findAll = async () => [{ total_students: '1', new_students: '0', active_students: '1' }];
      FeeInvoice.findAll = async () => [{}];
      StudentParent.count = async options => {
        expect(options).toMatchObject({ distinct: true, col: 'parent_id' });
        expect(options.include[0]).toMatchObject({
          model: Student,
          as: 'student',
          required: true,
          where: { school_id: 'school-1', branch_id: 'branch-second' }
        });
        return 1;
      };
      User.count = async ({ where }) => where.role === 'teacher' ? 0 : 1;

      await DashboardController.getStats(
        {
          user: { role: 'branch_admin', school_id: 'school-1', branch_id: 'branch-second' },
          query: { academic_year: '2026-2027' }
        },
        { json: payload => { result = payload.data; } },
        error => { if (error) throw error; }
      );

      expect(result).toMatchObject({ totalStudents: 1, totalParents: 1 });
    } finally {
      Student.findAll = originals.studentFindAll;
      StudentParent.count = originals.parentCount;
      FeeInvoice.findAll = originals.invoiceFindAll;
      User.count = originals.userCount;
    }
  });

  it.each(['admin', 'super_admin'])(
    'counts distinct linked parents for %s with the selected branch scope',
    async role => {
      const { School, Branch, Student, StudentParent, FeeInvoice, User } = require('../src/models');
      const originals = {
        schoolCount: School.count,
        branchCount: Branch.count,
        branchFindOne: Branch.findOne,
        studentFindAll: Student.findAll,
        parentCount: StudentParent.count,
        invoiceFindAll: FeeInvoice.findAll,
        invoiceSum: FeeInvoice.sum,
        userCount: User.count
      };
      let result;
      try {
        School.count = async () => 1;
        Branch.count = async () => 2;
        Branch.findOne = async () => ({ id: 'branch-second' });
        Student.findAll = async () => [{ total_students: '1', new_students: '0', active_students: '1' }];
        FeeInvoice.findAll = async () => [{}];
        FeeInvoice.sum = async () => 0;
        StudentParent.count = async options => {
          expect(options).toMatchObject({ distinct: true, col: 'parent_id' });
          expect(options.include[0]).toMatchObject({
            model: Student,
            as: 'student',
            required: true,
            where: { school_id: 'school-1', branch_id: 'branch-second' }
          });
          return 1;
        };
        User.count = async () => 1;

        await DashboardController.getStats(
          {
            user: { role, school_id: 'school-1' },
            query: { school_id: 'school-1', branch_id: 'branch-second', academic_year: '2026-2027' }
          },
          { json: payload => { result = payload.data; } },
          error => { if (error) throw error; }
        );

        expect(result).toMatchObject({ totalStudents: 1, totalParents: 1 });
      } finally {
        School.count = originals.schoolCount;
        Branch.count = originals.branchCount;
        Branch.findOne = originals.branchFindOne;
        Student.findAll = originals.studentFindAll;
        StudentParent.count = originals.parentCount;
        FeeInvoice.findAll = originals.invoiceFindAll;
        FeeInvoice.sum = originals.invoiceSum;
        User.count = originals.userCount;
      }
    }
  );

  it('returns current-month accounting totals scoped to an Accountant assigned branch', async () => {
    const { School, FeeInvoice, FeePayment, SchoolTransaction } = require('../src/models');
    const originals = {
      schoolFindByPk: School.findByPk,
      invoiceCount: FeeInvoice.count,
      invoiceSum: FeeInvoice.sum,
      paymentSum: FeePayment.sum,
      transactionSum: SchoolTransaction.sum
    };
    const transactionQueries = [];
    let result;
    try {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-28T20:00:00.000Z'));
      School.findByPk = async () => ({ timezone: 'Asia/Kolkata' });
      FeeInvoice.count = async () => 0;
      FeeInvoice.sum = async () => 0;
      FeePayment.sum = async (_field, options) => {
        expect(options.where).toMatchObject({
          school_id: 'school-1', branch_id: 'branch-assigned', payment_status: 'completed'
        });
        if (typeof options.where.payment_date === 'string') {
          expect(options.where.payment_date).toBe('2026-10-29');
          return 250;
        }
        const { Op } = require('sequelize');
        expect(options.where.payment_date[Op.gte]).toMatch(/^\d{4}-\d{2}-01$/);
        expect(options.where.payment_date[Op.lt]).toMatch(/^\d{4}-\d{2}-01$/);
        return 900;
      };
      SchoolTransaction.sum = async (_field, options) => {
        transactionQueries.push(options.where);
        return 125;
      };

      await DashboardController.getStats(
        {
          user: { role: 'accountant', school_id: 'school-1', branch_id: 'branch-assigned' },
          query: { branch_id: 'branch-forged' }
        },
        { json: payload => { result = payload; } },
        error => { if (error) throw error; }
      );

      const { Op } = require('sequelize');
      const monthlyIncome = transactionQueries.find(where => where.type === 'income' && where.date);
      const monthlyExpense = transactionQueries.find(where => where.type === 'expense' && where.date);
      expect(monthlyIncome).toMatchObject({ school_id: 'school-1', branch_id: 'branch-assigned' });
      expect(monthlyExpense).toMatchObject({ school_id: 'school-1', branch_id: 'branch-assigned' });
      expect(monthlyIncome.date[Op.gte]).toMatch(/^\d{4}-\d{2}-01$/);
      expect(monthlyExpense.date[Op.lt]).toMatch(/^\d{4}-\d{2}-01$/);
      expect(result.data).toMatchObject({ feeCollection: 900, todayFeeCollection: 250, thisMonthIncome: 125, thisMonthExpense: 125 });
    } finally {
      jest.useRealTimers();
      School.findByPk = originals.schoolFindByPk;
      FeeInvoice.count = originals.invoiceCount;
      FeeInvoice.sum = originals.invoiceSum;
      FeePayment.sum = originals.paymentSum;
      SchoolTransaction.sum = originals.transactionSum;
    }
  });

  it('returns twelve months of fee and accounting income/expense for the Accountant branch', async () => {
    const { FeePayment, SchoolTransaction } = require('../src/models');
    const originals = { feeFindAll: FeePayment.findAll, transactionFindAll: SchoolTransaction.findAll };
    const currentMonth = new Date();
    const monthRow = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01 00:00:00+00`;
    let result;
    try {
      FeePayment.findAll = jest.fn().mockResolvedValue([{ month: monthRow, total: '300.50' }]);
      SchoolTransaction.findAll = jest.fn().mockResolvedValue([
        { month: monthRow, type: 'income', total: '200.25' },
        { month: monthRow, type: 'expense', total: '40.10' }
      ]);
      await DashboardController.getIncomeVsExpense(
        {
          user: { role: 'accountant', school_id: 'school-1', branch_id: 'branch-assigned' },
          query: { branch_id: 'branch-forged' }
        },
        { json: payload => { result = payload; } },
        error => { if (error) throw error; }
      );

      const { Op } = require('sequelize');
      for (const [model, key] of [[FeePayment, 'payment_date'], [SchoolTransaction, 'date']]) {
        const options = model.findAll.mock.calls[0][0];
        expect(options.where).toMatchObject({ school_id: 'school-1', branch_id: 'branch-assigned' });
        expect(options.where[key][Op.gte]).toMatch(/^\d{4}-\d{2}-01$/);
        expect(options.where[key][Op.lt]).toMatch(/^\d{4}-\d{2}-01$/);
      }
      expect(result.data.labels).toHaveLength(12);
      expect(result.data.income.at(-1)).toBe(500.75);
      expect(result.data.expense.at(-1)).toBe(40.1);
    } finally {
      FeePayment.findAll = originals.feeFindAll;
      SchoolTransaction.findAll = originals.transactionFindAll;
    }
  });

  it('counts only current-year students in a teacher’s class and subject assignments', async () => {
    const { ClassTeacher, SubjectTeacher, Homework, TimetableSlot, Student } = require('../src/models');
    const originals = {
      classFindAll: ClassTeacher.findAll,
      classCount: ClassTeacher.count,
      subjectFindAll: SubjectTeacher.findAll,
      homeworkCount: Homework.count,
      timetableCount: TimetableSlot.count,
      studentCount: Student.count
    };
    const classAssignment = {
      class_id: 'class-1', section_id: 'section-a', stream_id: null, branch_id: 'branch-main'
    };
    const subjectAssignment = {
      class_id: 'class-2', section_id: null, stream_id: 'stream-science', branch_id: 'branch-second'
    };
    let result;
    try {
      ClassTeacher.findAll = async options => {
        expect(options.where).toEqual({
          teacher_id: 'teacher-1', school_id: 'school-1', academic_year: '2026-2027', is_active: true
        });
        return [classAssignment];
      };
      SubjectTeacher.findAll = async options => {
        expect(options.where).toEqual({
          teacher_id: 'teacher-1', school_id: 'school-1', academic_year: '2026-2027'
        });
        return [subjectAssignment];
      };
      ClassTeacher.count = async () => 1;
      Homework.count = async () => 2;
      TimetableSlot.count = async () => 1;
      Student.count = async ({ where }) => {
        expect(where.school_id).toBe('school-1');
        expect(where.academic_year).toBe('2026-2027');
        expect(where[require('sequelize').Op.or]).toEqual([
          { class_id: 'class-1', branch_id: 'branch-main', section_id: 'section-a' },
          { class_id: 'class-2', branch_id: 'branch-second', stream_id: 'stream-science' }
        ]);
        return 2;
      };

      await DashboardController.getStats(
        {
          user: { id: 'teacher-1', role: 'teacher', school_id: 'school-1', branch_id: 'branch-main' },
          query: { academic_year: '2026-2027' }
        },
        { json: payload => { result = payload; } },
        error => { if (error) throw error; }
      );

      expect(result.data).toMatchObject({ role: 'teacher', totalStudents: 2 });
    } finally {
      ClassTeacher.findAll = originals.classFindAll;
      ClassTeacher.count = originals.classCount;
      SubjectTeacher.findAll = originals.subjectFindAll;
      Homework.count = originals.homeworkCount;
      TimetableSlot.count = originals.timetableCount;
      Student.count = originals.studentCount;
    }
  });

  it('returns only overdue unpaid invoices from the selected branch', async () => {
    const { FeeInvoice } = require('../src/models');
    const originalFindAll = FeeInvoice.findAll;
    let result;
    try {
      FeeInvoice.findAll = async options => {
        assert.deepStrictEqual(options.where, {
          school_id: 'school-demo',
          branch_id: 'branch-main',
          status: 'overdue',
          balance_amount: { [require('sequelize').Op.gt]: 0 }
        });
        assert.deepStrictEqual(options.attributes, [
          'id', 'invoice_number', 'class_name', 'section', 'balance_amount', 'due_date'
        ]);
        assert.strictEqual(options.include[0].as, 'student');
        assert.deepStrictEqual(options.include[0].attributes, ['id', 'first_name', 'last_name']);
        assert.strictEqual(options.limit, 5);
        return [{ id: 'invoice-demo', balance_amount: '2500.00' }];
      };
      await DashboardController.getOverdueFees(
        { user: { role: 'admin', school_id: 'school-demo' }, query: { branch_id: 'branch-main' } },
        { json: payload => { result = payload; } },
        err => { if (err) throw err; }
      );
      assert.deepStrictEqual(result, {
        success: true,
        data: { fees: [{ id: 'invoice-demo', balance_amount: '2500.00' }] }
      });
    } finally {
      FeeInvoice.findAll = originalFindAll;
    }
  });

  it('does not let a Branch Admin widen overdue fees through branch_id', async () => {
    const { FeeInvoice } = require('../src/models');
    const originalFindAll = FeeInvoice.findAll;
    try {
      FeeInvoice.findAll = async options => {
        assert.deepStrictEqual(options.where, {
          school_id: 'school-demo',
          branch_id: 'branch-second',
          status: 'overdue',
          balance_amount: { [require('sequelize').Op.gt]: 0 }
        });
        return [];
      };
      await DashboardController.getOverdueFees(
        {
          user: { role: 'branch_admin', school_id: 'school-demo', branch_id: 'branch-second' },
          query: { branch_id: 'branch-main' }
        },
        { json: () => {} },
        err => { if (err) throw err; }
      );
    } finally {
      FeeInvoice.findAll = originalFindAll;
    }
  });

  it('summarizes published daily attendance inside the selected branch', async () => {
    const req = {
      user: { role: 'admin', school_id: 'school-demo' },
      query: { branch_id: 'branch-main' }
    };
    const { AttendanceRecord, AttendanceSession, Student } = require('../src/models');
    const originals = [AttendanceRecord.findAll, AttendanceSession.findAll, Student.count];
    let result;
    try {
      Student.count = async options => {
        assert.deepStrictEqual(options.where, { school_id: 'school-demo', branch_id: 'branch-main' });
        return 3;
      };
      AttendanceSession.findAll = async options => {
        assert.deepStrictEqual(options.where, {
          school_id: 'school-demo', branch_id: 'branch-main', date: new Date().toISOString().slice(0, 10),
          attendance_type: 'daily', status: 'published'
        });
        return [{ id: 'session-demo' }];
      };
      AttendanceRecord.findAll = async options => {
        assert.deepStrictEqual(options.where, {
          school_id: 'school-demo', branch_id: 'branch-main', date: new Date().toISOString().slice(0, 10),
          session_id: { [require('sequelize').Op.in]: ['session-demo'] }
        });
        return [{ status: 'present', count: '2' }, { status: 'absent', count: '1' }];
      };
      await DashboardController.getTodayAttendance(req, { json: payload => { result = payload; } }, err => { if (err) throw err; });
      assert.deepStrictEqual(result.data.attendance, {
        date: new Date().toISOString().slice(0, 10), session_count: 1, enrolled: 3,
        present: 2, absent: 1, late: 0, excused: 0, marked: 3
      });
    } finally {
      AttendanceRecord.findAll = originals[0];
      AttendanceSession.findAll = originals[1];
      Student.count = originals[2];
    }
  });

  it('returns active notices with fields limited to the selected school and branch', async () => {
    const req = {
      user: { role: 'admin', school_id: 'school-demo' },
      query: { branch_id: 'branch-main' }
    };
    let result;
    const { DynamicEntityRecord } = require('../src/models');
    const originalFindAll = DynamicEntityRecord.findAll;
    try {
      DynamicEntityRecord.findAll = async options => {
        assert.deepStrictEqual(options.where, {
          school_id: 'school-demo',
          branch_id: 'branch-main',
          entity_type: ['school_notice', 'notice', 'announcement'],
          status: 'active'
        });
        assert.deepStrictEqual(options.attributes, [
          'id',
          'title',
          'notes',
          'date_value',
          'created_at'
        ]);
        assert.strictEqual(options.limit, 5);
        return [{ id: 'notice-1', title: 'Annual Day' }];
      };
      await DashboardController.getNotices(
        req,
        { json: payload => { result = payload; } },
        err => {
          if (err) throw err;
        }
      );
      assert.deepStrictEqual(result, {
        success: true,
        data: { notices: [{ id: 'notice-1', title: 'Annual Day' }] }
      });
    } finally {
      DynamicEntityRecord.findAll = originalFindAll;
    }
  });

  it('returns no tenant notices to a Platform Owner without a selected school', async () => {
    const { DynamicEntityRecord } = require('../src/models');
    const originalFindAll = DynamicEntityRecord.findAll;
    try {
      DynamicEntityRecord.findAll = async () => {
        throw new Error('unscoped notice query must not run');
      };
      let result;
      await DashboardController.getNotices(
        { user: { role: 'super_admin' }, query: {} },
        { json: payload => { result = payload; } },
        err => { if (err) throw err; }
      );
      assert.deepStrictEqual(result, { success: true, data: { notices: [] } });
    } finally {
      DynamicEntityRecord.findAll = originalFindAll;
    }
  });

  it('returns no notices when a staff account has no school scope', async () => {
    const { DynamicEntityRecord } = require('../src/models');
    const originalFindAll = DynamicEntityRecord.findAll;
    try {
      DynamicEntityRecord.findAll = async () => {
        throw new Error('unscoped notice query must not run');
      };
      let result;
      await DashboardController.getNotices(
        { user: { role: 'admin' }, query: {} },
        { json: payload => { result = payload; } },
        err => { if (err) throw err; }
      );
      assert.deepStrictEqual(result, { success: true, data: { notices: [] } });
    } finally {
      DynamicEntityRecord.findAll = originalFindAll;
    }
  });

  it('keeps a School Admin all-branches notice query within the school', async () => {
    const { DynamicEntityRecord } = require('../src/models');
    const originalFindAll = DynamicEntityRecord.findAll;
    try {
      DynamicEntityRecord.findAll = async options => {
        assert.deepStrictEqual(options.where, {
          school_id: 'school-demo',
          entity_type: ['school_notice', 'notice', 'announcement'],
          status: 'active'
        });
        return [];
      };
      await DashboardController.getNotices(
        { user: { role: 'admin', school_id: 'school-demo', branch_id: 'default-branch' }, query: {} },
        { json: () => {} },
        err => { if (err) throw err; }
      );
    } finally {
      DynamicEntityRecord.findAll = originalFindAll;
    }
  });

  it('handles "undefined" and "null" branch_id in getStudentsChartData without throwing error', async () => {
    let capturedWhere = null;
    const req = {
      user: { role: 'admin', school_id: 'a0000000-0000-0000-0000-000000000001' },
      query: { branch_id: 'undefined' }
    };
    const res = {
      json: (payload) => {
        capturedWhere = payload;
      }
    };
    const next = (err) => {
      if (err) throw err;
    };

    const { Student } = require('../src/models');
    const originalFindAll = Student.findAll;
    try {
      let queryOptionsUsed = null;
      Student.findAll = async (opts) => {
        queryOptionsUsed = opts;
        return [];
      };

      await DashboardController.getStudentsChartData(req, res, next);

      assert.strictEqual(queryOptionsUsed.where.school_id, 'a0000000-0000-0000-0000-000000000001');
      assert.strictEqual(queryOptionsUsed.where.branch_id, undefined, 'branch_id should be stripped when string is "undefined"');
      assert.deepStrictEqual(capturedWhere, { success: true, data: { labels: ['No Data'], data: [0] } });
    } finally {
      Student.findAll = originalFindAll;
    }
  });

  it('handles "undefined" and "null" in getFeeCollectionSummary without throwing error', async () => {
    const req = {
      user: { role: 'admin', school_id: 'a0000000-0000-0000-0000-000000000001' },
      query: { branch_id: 'null', academic_year: '2026-2027' }
    };
    let capturedJson = null;
    const res = {
      json: (payload) => {
        capturedJson = payload;
      }
    };
    const next = (err) => {
      if (err) throw err;
    };

    const { FeeInvoice } = require('../src/models');
    const originalFindAll = FeeInvoice.findAll;
    try {
      let queryOptionsUsed = null;
      FeeInvoice.findAll = async (opts) => {
        queryOptionsUsed = opts;
        return [{
          get: (col) => 0
        }];
      };

      await DashboardController.getFeeCollectionSummary(req, res, next);

      assert.strictEqual(queryOptionsUsed.where.school_id, 'a0000000-0000-0000-0000-000000000001');
      assert.strictEqual(queryOptionsUsed.where.branch_id, undefined, 'branch_id should be stripped when string is "null"');
      assert.strictEqual(queryOptionsUsed.where.academic_year, '2026-2027');
      assert.strictEqual(capturedJson.success, true);
    } finally {
      FeeInvoice.findAll = originalFindAll;
    }
  });

  it('applies cleanSchoolId and cleanBranchId correctly for super_admin', async () => {
    const req = {
      user: { role: 'super_admin' },
      query: { school_id: 'b0000000-0000-0000-0000-000000000001', branch_id: 'c0000000-0000-0000-0000-000000000001' }
    };
    const res = { json: () => {} };
    const next = (err) => { if (err) throw err; };

    const { Student } = require('../src/models');
    const originalFindAll = Student.findAll;
    try {
      let queryOptionsUsed = null;
      Student.findAll = async (opts) => {
        queryOptionsUsed = opts;
        return [];
      };

      await DashboardController.getStudentsChartData(req, res, next);

      assert.strictEqual(queryOptionsUsed.where.school_id, 'b0000000-0000-0000-0000-000000000001');
      assert.strictEqual(queryOptionsUsed.where.branch_id, 'c0000000-0000-0000-0000-000000000001');
    } finally {
      Student.findAll = originalFindAll;
    }
  });

  it.each(['accountant', 'teacher', 'receptionist', 'librarian'])(
    'keeps %s chart data inside the assigned branch even if another branch is requested',
    async role => {
      const req = {
        user: {
          id: 'u0000000-0000-0000-0000-000000000001',
          role,
          school_id: 'a0000000-0000-0000-0000-000000000001',
          branch_id: 'b0000000-0000-0000-0000-000000000001'
        },
        query: { branch_id: 'b0000000-0000-0000-0000-000000000002' }
      };
      const res = { json: () => {} };
      const { Student } = require('../src/models');
      const originalFindAll = Student.findAll;
      try {
        let queryOptionsUsed;
        Student.findAll = async options => {
          queryOptionsUsed = options;
          return [];
        };

        await DashboardController.getStudentsChartData(req, res, error => {
          if (error) throw error;
        });

        expect(queryOptionsUsed.where).toEqual({
          school_id: req.user.school_id,
          branch_id: req.user.branch_id
        });
      } finally {
        Student.findAll = originalFindAll;
      }
    }
  );

  it('reports available and overdue library copies from inventory and issue records', async () => {
    const { LibraryBook, LibraryIssue } = require('../src/models');
    const originals = {
      sum: LibraryBook.sum,
      count: LibraryIssue.count
    };
    const calls = [];
    let result;
    try {
      LibraryBook.sum = async (field, options) => {
        calls.push({ field, where: options.where });
        return field === 'quantity' ? 5 : 4;
      };
      LibraryIssue.count = async options => {
        calls.push({ where: options.where });
        return options.where[require('sequelize').Op.or] ? 1 : 1;
      };

      await DashboardController.getStats(
        { user: { role: 'librarian', school_id: 'school-1', branch_id: 'branch-1' }, query: {} },
        { json: payload => { result = payload.data; } },
        error => { if (error) throw error; }
      );

      expect(result).toMatchObject({ totalBooks: 5, issuedBooks: 1, availableBooks: 4, overdueBooks: 1 });
      expect(calls.every(call => call.where.school_id === 'school-1' && call.where.branch_id === 'branch-1')).toBe(true);
      expect(calls.some(call => call.where[require('sequelize').Op.or])).toBe(true);
    } finally {
      LibraryBook.sum = originals.sum;
      LibraryIssue.count = originals.count;
    }
  });
});
