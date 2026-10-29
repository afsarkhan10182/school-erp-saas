require('module-alias/register');
const assert = require('assert');
const exportService = require('../src/services/shared/unified-export.service');

describe('Unified fee exports', () => {
  it('exports teacher classwork only for the assigned school, branch, class, and author', async () => {
    const { DynamicEntityRecord, ClassTeacher, SubjectTeacher } = require('../src/models');
    const academicYears = require('../src/utils/academic/academicYearUtils');
    const originals = {
      records: DynamicEntityRecord.findAll,
      classes: ClassTeacher.findAll,
      subjects: SubjectTeacher.findAll,
      year: academicYears.getCurrentAcademicYearForSchool
    };
    try {
      academicYears.getCurrentAcademicYearForSchool = async () => ({ code: '2026-2027' });
      ClassTeacher.findAll = async () => [{ class_id: 'class-1', branch_id: 'branch-1' }];
      SubjectTeacher.findAll = async () => [];
      DynamicEntityRecord.findAll = async options => {
        expect(options.where).toMatchObject({
          school_id: 'school-1', branch_id: 'branch-1', created_by: 'teacher-1',
          class_id: 'class-1', entity_type: 'classwork_entry', date_value: { [require('sequelize').Op.gte]: '2026-10-01' }
        });
        return [{ date_value: '2026-10-04', title: 'Fractions', notes: 'Lesson', payload: { entry_type: 'Classwork', class_name: 'Class 1' } }];
      };
      await expect(exportService.getClassworkData(
        { branch_id: 'forged-branch', class_id: 'class-1', from_date: '2026-10-01', entry_type: 'Classwork' },
        { id: 'teacher-1', role: 'teacher', branch_id: 'branch-1' }, 'school-1'
      )).resolves.toEqual([expect.objectContaining({ title: 'Fractions', class_name: 'Class 1' })]);
    } finally {
      DynamicEntityRecord.findAll = originals.records;
      ClassTeacher.findAll = originals.classes;
      SubjectTeacher.findAll = originals.subjects;
      academicYears.getCurrentAcademicYearForSchool = originals.year;
    }
  });

  it('exports audit events only within the selected school and retention window', async () => {
    const { AuditEvent } = require('../src/models');
    const originalFindAll = AuditEvent.findAll;
    const { Op } = require('sequelize');
    let queryOptions;
    try {
      AuditEvent.findAll = async options => {
        queryOptions = options;
        expect(options.where.school_id).toBe('school-1');
        expect(options.where.branch_id).toBe('branch-1');
        expect(options.where.action).toBe('updated');
        expect(options.where.entity_name[Op.iLike]).toBe('%School%');
        expect(options.where[Op.or]).toEqual(expect.arrayContaining([
          { request_path: { [Op.iLike]: '%theme%' } }
        ]));
        expect(options.where.created_at[Op.gte]).toBeInstanceOf(Date);
        return [{ get: () => ({
          created_at: '2026-10-28T08:00:00.000Z', actor_role: 'admin', action: 'updated',
          entity_name: 'School', record_id: 'school-1', branch_id: 'branch-1',
          request_method: 'PUT', request_path: '/api/settings/system',
          actor: { first_name: 'Demo', last_name: 'Admin' },
          changes: { before: { theme: 'light' }, after: { theme: 'dark' } }
        }) }];
      };
      const rows = await exportService.getAuditEventsData(
        { branch_id: 'branch-1', action: 'updated', entity: 'School', search: 'theme', sort_by: 'user', sort_order: 'asc' },
        'school-1'
      );
      expect(queryOptions.order).toEqual([
        [{ model: require('../src/models').User, as: 'actor' }, 'first_name', 'ASC'],
        [{ model: require('../src/models').User, as: 'actor' }, 'last_name', 'ASC'],
        ['created_at', 'DESC']
      ]);
      expect(rows).toEqual([expect.objectContaining({
        actor_name: 'Demo Admin', action: 'updated', request: 'PUT /api/settings/system',
        changes: JSON.stringify({ before: { theme: 'light' }, after: { theme: 'dark' } })
      })]);
      expect(exportService.getReportTitle('audit_events')).toBe('Audit Trail');
    } finally {
      AuditEvent.findAll = originalFindAll;
    }
  });

  it('exports only approved admission enquiry fields and pins Receptionists to their branch', async () => {
    const { DynamicEntityRecord } = require('../src/models');
    const originalFindAll = DynamicEntityRecord.findAll;
    try {
      DynamicEntityRecord.findAll = async options => {
        expect(options.where).toMatchObject({
          school_id: 'school-1',
          branch_id: 'branch-assigned',
          entity_type: 'enquiry'
        });
        return [{ toJSON: () => ({
          title: 'Student',
          reference_no: '9000000000',
          date_value: null,
          created_at: '2026-10-28T08:00:00.000Z',
          notes: 'Call next week',
          status: 'pending',
          payload: { parent_name: 'Guardian', private_extra: 'omit' },
          class: { name: 'Class 1' }
        }) }];
      };
      const rows = await exportService.getAdmissionEnquiriesData(
        { branch_id: 'forged-branch', search: 'Guardian' },
        { role: 'receptionist', branch_id: 'branch-assigned' },
        'school-1'
      );
      expect(rows).toEqual([{
        student_name: 'Student',
        parent_name: 'Guardian',
        phone: '9000000000',
        enquiry_date: '2026-10-28T08:00:00.000Z',
        interested_class: 'Class 1',
        follow_up: 'Call next week',
        status: 'pending'
      }]);
      expect(Object.keys(rows[0])).not.toContain('private_extra');
      expect(exportService.getReportTitle('admission_enquiries')).toBe('Admission Enquiries');
    } finally {
      DynamicEntityRecord.findAll = originalFindAll;
    }
  });

  it('exports only whitelisted visitor fields and pins Receptionists to their branch', async () => {
    const { DynamicEntityRecord } = require('../src/models');
    const originalFindAll = DynamicEntityRecord.findAll;
    const { Op } = require('sequelize');
    try {
      DynamicEntityRecord.findAll = async options => {
        expect(options.where).toMatchObject({
          school_id: 'school-1',
          branch_id: 'branch-assigned',
          entity_type: 'visitor'
        });
        expect(options.where[Op.or]).toEqual(
          ['title', 'reference_no', 'notes'].map(field => ({
            [field]: { [Op.iLike]: '%guardian%' }
          }))
        );
        return [
          {
            toJSON: () => ({
              title: 'Demo Guardian',
              reference_no: '9000000000',
              notes: 'Meeting',
              created_at: '2026-10-28T08:00:00.000Z',
              status: 'active',
              payload: { exit_time: '2026-10-28T08:30:00.000Z', private_extra: 'omit' }
            })
          }
        ];
      };
      const rows = await exportService.getVisitorsData(
        { branch_id: 'forged-branch', search: 'guardian' },
        { role: 'receptionist', branch_id: 'branch-assigned' },
        'school-1'
      );

      expect(rows).toEqual([
        {
          visitor_name: 'Demo Guardian',
          phone: '9000000000',
          purpose: 'Meeting',
          in_time: '2026-10-28T08:00:00.000Z',
          out_time: '2026-10-28T08:30:00.000Z',
          status: 'active'
        }
      ]);
      expect(exportService.getColumnsForReport('visitors').map(({ key }) => key)).toEqual([
        'visitor_name',
        'phone',
        'purpose',
        'in_time',
        'out_time',
        'status'
      ]);
    } finally {
      DynamicEntityRecord.findAll = originalFindAll;
    }
  });

  it('exports only safe gate pass fields and pins Receptionists to their assigned branch', async () => {
    const { GatePass } = require('../src/models');
    const originalFindAll = GatePass.findAll;
    const { Op } = require('sequelize');
    try {
      GatePass.findAll = async options => {
        expect(options.where).toMatchObject({
          school_id: 'school-1',
          branch_id: 'branch-assigned',
          status: 'out'
        });
        expect(options.where[Op.or]).toEqual(
          expect.arrayContaining([
            { pass_no: { [Op.iLike]: '%Sarah%' } },
            { '$student.first_name$': { [Op.iLike]: '%Sarah%' } }
          ])
        );
        return [
          {
            toJSON: () => ({
              pass_no: 'GP-1',
              reason: 'parent_pickup',
              collector_name: 'Parent',
              collector_phone: 'private',
              collector_id_last4: '1234',
              internal_notes: 'private',
              status: 'out',
              student: {
                first_name: 'Sarah',
                last_name: 'Demo',
                admission_number: 'D-1',
                class: { name: 'Class 1' }
              },
              branch: { name: 'Main' }
            })
          }
        ];
      };
      const rows = await exportService.getGatePassesData(
        { branch_id: 'branch-forged', status: 'out', search: 'Sarah' },
        { role: 'receptionist', branch_id: 'branch-assigned' },
        'school-1'
      );
      expect(rows[0]).toMatchObject({
        student_name: 'Sarah Demo',
        admission_number: 'D-1',
        branch_name: 'Main'
      });
      expect(rows[0]).not.toHaveProperty('collector_phone');
      expect(rows[0]).not.toHaveProperty('collector_id_last4');
      expect(rows[0]).not.toHaveProperty('internal_notes');
      expect(
        exportService.getColumnsForReport('gate_passes').map(column => column.key)
      ).not.toContain('collector_phone');
    } finally {
      GatePass.findAll = originalFindAll;
    }
  });

  it('exports transactions with tenant, branch, type, category, date, and search scope', async () => {
    const { SchoolTransaction } = require('../src/models');
    const originalFindAll = SchoolTransaction.findAll;
    const { Op } = require('sequelize');
    try {
      SchoolTransaction.findAll = async options => {
        expect(options.where).toMatchObject({
          school_id: 'school-1',
          branch_id: 'branch-1',
          type: 'expense',
          category_id: 'category-1',
          date: { [Op.between]: ['2026-10-01', '2026-10-31'] }
        });
        expect(options.where[Op.or]).toEqual([
          { name: { [Op.iLike]: '%electric%' } },
          { reference_number: { [Op.iLike]: '%electric%' } }
        ]);
        expect(options.order).toEqual([
          ['amount', 'ASC'],
          ['date', 'DESC'],
          ['created_at', 'DESC']
        ]);
        expect(options.include.map(item => item.as)).toEqual(['category', 'branch']);
        return [
          {
            toJSON: () => ({
              name: 'Electricity',
              amount: '1000.00',
              category: { name: 'Utilities' },
              branch: { name: 'Main' }
            })
          }
        ];
      };

      const rows = await exportService.getTransactionsData(
        {
          branch_id: 'branch-other',
          transaction_type: 'expense',
          category_id: 'category-1',
          from_date: '2026-10-01',
          to_date: '2026-10-31',
          search: 'electric',
          sort_by: 'amount',
          sort_order: 'ASC'
        },
        { role: 'accountant', branch_id: 'branch-1' },
        'school-1'
      );

      expect(rows[0]).toMatchObject({ name: 'Electricity', category: 'Utilities', branch: 'Main' });
      expect(exportService.getColumnsForReport('transactions').map(column => column.key)).toContain(
        'amount'
      );
    } finally {
      SchoolTransaction.findAll = originalFindAll;
    }
  });

  it('returns print data without persisting a report file', async () => {
    const records = [{ student_name: 'Demo Student', guardian_email: 'parent@example.test' }];
    const result = await exportService.generatePrint('students', records, {}, 'students.json');

    assert.strictEqual(result.format, 'print');
    assert.strictEqual(result.filePath, undefined);
    assert.deepStrictEqual(result.data.data, records);
  });

  it('keeps Accountant exports inside the assigned branch even if the request omits or changes it', async () => {
    const { FeeInvoice, FeePayment } = require('../src/models');
    const originalInvoiceFindAll = FeeInvoice.findAll;
    const originalPaymentFindAll = FeePayment.findAll;
    const user = { role: 'accountant', branch_id: 'branch-assigned' };

    try {
      FeePayment.findAll = async options => {
        assert.strictEqual(options.where.school_id, 'school-1');
        assert.strictEqual(options.where.branch_id, 'branch-assigned');
        return [];
      };
      FeeInvoice.findAll = async options => {
        assert.strictEqual(options.where.school_id, 'school-1');
        assert.strictEqual(options.where.branch_id, 'branch-assigned');
        assert.strictEqual(options.include[0].where.branch_id, 'branch-assigned');
        return [];
      };

      await exportService.getReceiptsData({ branch_id: 'branch-other' }, user, 'school-1');
      await exportService.getFeesData({ branch_id: 'branch-other' }, user, 'school-1');
      await exportService.getMonthlyFeesData(
        { branch_id: 'branch-other', months: '10', year: 2026 },
        user,
        'school-1'
      );
    } finally {
      FeeInvoice.findAll = originalInvoiceFindAll;
      FeePayment.findAll = originalPaymentFindAll;
    }
  });

  it('keeps Platform Owner exports in the selected school and returns report columns', async () => {
    const { FeeInvoice } = require('../src/models');
    const originalFindAll = FeeInvoice.findAll;
    try {
      FeeInvoice.findAll = async options => {
        assert.strictEqual(options.where.school_id, 'school-selected');
        assert.strictEqual(options.where.academic_year, '2026-2027');
        assert.strictEqual(options.where.status, 'paid');
        assert.strictEqual(options.include[0].where.class_id, 'class-selected');
        assert.strictEqual(options.include[0].where.section_id, 'section-selected');
        assert.strictEqual(options.include[0].where.stream_id, 'stream-selected');
        assert.ok(options.include[0].where[require('sequelize').Op.or]);
        return [
          {
            invoice_number: 'INV-1',
            invoice_date: '2026-10-01',
            due_date: '2026-10-15',
            total_amount: 2500,
            paid_amount: 2500,
            balance_amount: 0,
            status: 'paid',
            student: {
              first_name: 'Demo',
              last_name: 'Student',
              admission_number: 'D-1',
              current_class: 'Class 1',
              section: 'A'
            },
            branch: { name: 'Main Branch' },
            stream: { name: 'Science' },
            feeStructure: { feeType: { name: 'Tuition' } }
          }
        ];
      };

      const rows = await exportService.getFeesData(
        {
          academic_year: '2026-2027',
          status: 'paid',
          class_id: 'class-selected',
          section_id: 'section-selected',
          stream_id: 'stream-selected',
          search: 'Demo'
        },
        { role: 'super_admin' },
        'school-selected'
      );

      assert.deepStrictEqual(
        {
          balance: rows[0].balance_amount,
          branch: rows[0].branch,
          stream: rows[0].stream,
          invoiceCount: rows[0].invoice_count
        },
        { balance: 0, branch: 'Main Branch', stream: 'Science', invoiceCount: 1 }
      );
    } finally {
      FeeInvoice.findAll = originalFindAll;
    }
  });

  it('exports due invoices using due-date, status, class, and section filters', async () => {
    const { FeeInvoice } = require('../src/models');
    const originalFindAll = FeeInvoice.findAll;
    const { Op } = require('sequelize');
    try {
      FeeInvoice.findAll = async options => {
        expect(options.where).toMatchObject({
          school_id: 'school-1',
          branch_id: 'branch-1',
          status: { [Op.in]: ['overdue', 'sent', 'partial_paid'] },
          academic_year: '2026-2027',
          due_date: { [Op.gte]: '2026-10-01', [Op.lte]: '2026-10-31' }
        });
        expect(options.include[0].where).toMatchObject({
          current_class: 'Class 1',
          section: 'A',
          branch_id: 'branch-1'
        });
        return [
          {
            invoice_number: 'INV-DUE-001',
            invoice_date: '2026-09-01',
            due_date: '2026-10-15',
            total_amount: '2500.00',
            paid_amount: '500.00',
            discount_amount: '100.00',
            late_fee_amount: '25.00',
            balance_amount: '1900.00',
            status: 'partial_paid',
            student: {
              first_name: 'Sarah',
              last_name: 'Demo',
              admission_number: 'DEMO-001',
              current_class: 'Class 1',
              section: 'A'
            },
            branch: { name: 'Main Branch' },
            stream: null,
            feeStructure: { feeType: { name: 'Tuition' } }
          },
          {
            invoice_number: 'INV-DUE-002',
            due_date: '2026-10-20',
            total_amount: '1000.00',
            paid_amount: '0.00',
            discount_amount: '0.00',
            late_fee_amount: '0.00',
            balance_amount: '1000.00',
            status: 'sent',
            student: {
              first_name: 'Alex',
              last_name: 'Demo',
              admission_number: 'DEMO-002',
              current_class: 'Class 1',
              section: 'A'
            },
            branch: { name: 'Main Branch' },
            stream: null,
            feeStructure: { feeType: { name: 'Tuition' } }
          }
        ];
      };

      const rows = await exportService.getFeesData(
        {
          status: 'overdue,sent,partial_paid',
          academic_year: '2026-2027',
          due_from: '2026-10-01',
          due_to: '2026-10-31',
          class_name: 'Class 1',
          section_name: 'A'
        },
        { role: 'accountant', branch_id: 'branch-1' },
        'school-1'
      );
      expect(rows[0]).toMatchObject({
        invoice_number: 'INV-DUE-001',
        student_name: 'Sarah Demo',
        due_date: '2026-10-15',
        discount_amount: '100.00',
        late_fee_amount: '25.00',
        balance_amount: '1900.00',
        status: 'Partially paid'
      });
      expect(rows[1]).toMatchObject({ invoice_number: 'INV-DUE-002', status: 'Pending' });
    } finally {
      FeeInvoice.findAll = originalFindAll;
    }
  });

  it('exports due invoices using selected class and section IDs', async () => {
    const { FeeInvoice } = require('../src/models');
    const originalFindAll = FeeInvoice.findAll;
    try {
      FeeInvoice.findAll = async options => {
        expect(options.include[0].where).toMatchObject({
          class_id: 'class-1',
          section_id: 'section-a',
          branch_id: 'branch-1'
        });
        return [];
      };

      await exportService.getFeesData(
        { class_id: 'class-1', section_id: 'section-a' },
        { role: 'accountant', branch_id: 'branch-1' },
        'school-1'
      );
    } finally {
      FeeInvoice.findAll = originalFindAll;
    }
  });

  it('does not lose zero-valued columns in CSV output', async () => {
    const Papa = require('papaparse');
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const fileName = `unified-export-test-${Date.now()}.csv`;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'school-erp-export-test-'));
    const requestedFilePath = path.join(tempDir, fileName);
    let filePath;
    try {
      ({ filePath } = await exportService.generateCSV(
        'fees',
        [{ balance_amount: 0 }],
        {},
        requestedFilePath,
        [{ key: 'balance_amount', header: 'Balance' }]
      ));
      const data = Papa.parse(fs.readFileSync(filePath, 'utf8')).data;
      assert.deepStrictEqual(data[data.length - 1], ['0']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('uses A4 landscape for reports with more than eight columns', async () => {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'school-erp-wide-pdf-test-'));
    const columns = Array.from({ length: 9 }, (_, index) => ({ key: `field_${index}`, header: `Field ${index}` }));
    const filePath = path.join(tempDir, 'wide.pdf');
    try {
      await exportService.generatePDF(
        'fees', [Object.fromEntries(columns.map(({ key }) => [key, 'value']))], {}, filePath, columns
      );
      expect(fs.readFileSync(filePath, 'latin1')).toContain('/MediaBox [0 0 841.89 595.28]');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('neutralizes formula-leading audit values in CSV exports', async () => {
    const Papa = require('papaparse');
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'school-erp-audit-export-test-'));
    try {
      const { filePath } = await exportService.generateCSV(
        'audit_events', [{ actor_name: '=1+1' }], {}, path.join(tempDir, 'audit.csv'),
        [{ key: 'actor_name', header: 'User' }]
      );
      const rows = Papa.parse(fs.readFileSync(filePath, 'utf8')).data;
      expect(rows[rows.length - 1]).toEqual(["'=1+1"]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it.each(['csv', 'excel', 'pdf'])(
    'writes %s report exports to isolated private directories outside public uploads',
    async format => {
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      const { resolveUploadsPath } = require('../src/utils/shared/pathHelper');
      const result = await exportService.generateExport(
        'fees',
        format,
        [{ total_amount: 100 }],
        {},
        { role: 'admin' },
        'school-1',
        [{ key: 'total_amount', header: 'Total' }]
      );

      try {
        expect(result.filePath).toBe(path.join(result.tempDir, result.fileName));
        expect(result.tempDir.startsWith(os.tmpdir())).toBe(true);
        expect(result.filePath.startsWith(resolveUploadsPath())).toBe(false);
        expect(fs.statSync(result.tempDir).mode & 0o777).toBe(0o700);
        expect(fs.statSync(result.filePath).size).toBeGreaterThan(0);
      } finally {
        fs.rmSync(result.tempDir, { recursive: true, force: true });
      }
    }
  );

  it('applies the selected payment method to fee exports', async () => {
    const { FeeInvoice, FeePayment } = require('../src/models');
    const originalInvoiceFindAll = FeeInvoice.findAll;
    const originalPaymentFindAll = FeePayment.findAll;
    try {
      FeePayment.findAll = async options => {
        assert.strictEqual(options.where.payment_method, 'cash');
        assert.strictEqual(options.where.school_id, 'school-selected');
        return [{ invoice_id: 'invoice-cash' }];
      };
      FeeInvoice.findAll = async options => {
        assert.deepStrictEqual(options.where.id, {
          [require('sequelize').Op.in]: ['invoice-cash']
        });
        return [];
      };

      const rows = await exportService.getFeesData(
        { payment_method: 'cash' },
        { role: 'super_admin' },
        'school-selected'
      );
      assert.deepStrictEqual(rows, []);
    } finally {
      FeeInvoice.findAll = originalInvoiceFindAll;
      FeePayment.findAll = originalPaymentFindAll;
    }
  });

  it('exports monthly invoices using month/year pairs across academic years', async () => {
    const { FeeInvoice } = require('../src/models');
    const originalFindAll = FeeInvoice.findAll;
    try {
      FeeInvoice.findAll = async options => {
        assert.deepStrictEqual(options.where[require('sequelize').Op.or], [
          { month: 12, year: 2026 },
          { month: 1, year: 2027 }
        ]);
        assert.strictEqual(options.where.year, undefined);
        assert.strictEqual(options.where.school_id, 'school-selected');
        return [];
      };
      const rows = await exportService.getMonthlyFeesData(
        {
          months: '12,1',
          year: 2026,
          periods: JSON.stringify([
            { month: 12, year: 2026 },
            { month: 1, year: 2027 }
          ])
        },
        { role: 'super_admin' },
        'school-selected'
      );
      assert.deepStrictEqual(rows, []);
    } finally {
      FeeInvoice.findAll = originalFindAll;
    }
  });
});

describe('Unified student exports', () => {
  it('provides export columns for each supported report type', () => {
    for (const reportType of exportService.supportedReportTypes) {
      const columns = exportService.getColumnsForReport(reportType);
      assert.ok(columns.length > 0, `${reportType} should expose columns`);
      assert.ok(columns.every(column => column.key && column.header));
    }
    assert.deepStrictEqual(
      exportService
        .getColumnsForReport('students')
        .filter(column => ['total_billed', 'total_due'].includes(column.key))
        .map(column => column.key),
      ['total_billed', 'total_due']
    );
    assert.deepStrictEqual(exportService.getColumnsForReport('unknown'), []);
  });

  it('keeps Platform Owner exports in the selected school, not a supplied school filter', async () => {
    const { Student } = require('../src/models');
    const originalFindAll = Student.findAll;
    let query;

    try {
      Student.findAll = async options => {
        query = options;
        return [];
      };

      await exportService.getStudentsData(
        { school_id: 'school-other', enrollment: 'full_register' },
        { role: 'super_admin' },
        'school-selected'
      );

      assert.strictEqual(query.where.school_id, 'school-selected');
    } finally {
      Student.findAll = originalFindAll;
    }
  });

  it('applies school, branch, roster, and search filters and returns guardian fields', async () => {
    const { Student, FeeInvoice } = require('../src/models');
    const originalFindAll = Student.findAll;
    const originalInvoiceFindAll = FeeInvoice.findAll;
    let query;

    try {
      FeeInvoice.findAll = async () => [
        {
          school_id: 'school-1',
          student_id: 'student-1',
          total_billed: '5000.00',
          total_due: '2500.00'
        }
      ];
      Student.findAll = async options => {
        query = options;
        assert.strictEqual(options.include[1].as, 'branch');
        return [
          {
            id: 'student-1',
            school_id: 'school-1',
            first_name: 'Sarah',
            last_name: 'Demo',
            admission_number: 'DEMO-001',
            current_class: 'Class 1',
            section: 'A',
            status: 'active',
            branch: { name: 'Main Branch' },
            parents: [
              {
                guardian_name: 'Demo Parent',
                guardian_phone: '9000000000',
                guardian_email: 'parent@example.test'
              }
            ]
          }
        ];
      };

      const rows = await exportService.getStudentsData(
        {
          branch_id: 'branch-main',
          class_id: 'class-1',
          section_id: 'section-a',
          stream_id: 'stream-science',
          category_id: 'category-1',
          gender: 'female',
          academic_year: '2026-2027',
          enrollment: 'full_register',
          search: 'Sarah'
        },
        { role: 'admin' },
        'school-1'
      );

      const { Op } = require('sequelize');
      assert.strictEqual(query.where.school_id, 'school-1');
      assert.strictEqual(query.where.branch_id, 'branch-main');
      assert.strictEqual(query.where.class_id, 'class-1');
      assert.strictEqual(query.where.section_id, 'section-a');
      assert.strictEqual(query.where.stream_id, 'stream-science');
      assert.strictEqual(query.where.category_id, 'category-1');
      assert.strictEqual(query.where.gender, 'female');
      assert.strictEqual(query.where.academic_year, undefined);
      assert.strictEqual(query.where[Op.or][0].first_name[Op.iLike], '%Sarah%');
      assert.strictEqual(query.where[Op.and][0].status[Op.ne], 'deleted');
      assert.strictEqual(rows[0].branch, 'Main Branch');
      assert.strictEqual(rows[0].guardian_phone, '9000000000');
      assert.strictEqual(rows[0].total_billed, 5000);
      assert.strictEqual(rows[0].total_due, 2500);
    } finally {
      Student.findAll = originalFindAll;
      FeeInvoice.findAll = originalInvoiceFindAll;
    }
  });

  it('keeps Branch Admin exports inside the assigned branch when a different branch is requested', async () => {
    const { Student, StudentParent } = require('../src/models');
    const originalStudentFindAll = Student.findAll;
    const originalStudentParentFindAll = StudentParent.findAll;
    let query;

    try {
      let siblingQueryCount = 0;
      StudentParent.findAll = async options => {
        siblingQueryCount += 1;
        if (siblingQueryCount === 1) {
          assert.strictEqual(options.include[0].where.school_id, 'school-1');
          return [{ parent_id: 'parent-1' }];
        }
        assert.strictEqual(options.include[0].where.school_id, 'school-1');
        return [{ student_id: 'student-1' }];
      };
      Student.findAll = async options => {
        query = options;
        return [];
      };

      await exportService.getStudentsData(
        { branch_id: 'branch-other', has_siblings: 'yes', enrollment: 'full_register' },
        { role: 'branch_admin', branch_id: 'branch-assigned' },
        'school-1'
      );

      const { Op } = require('sequelize');
      assert.strictEqual(query.where.school_id, 'school-1');
      assert.strictEqual(query.where.branch_id, 'branch-assigned');
      assert.deepStrictEqual(query.where.id[Op.in], ['student-1']);
    } finally {
      Student.findAll = originalStudentFindAll;
      StudentParent.findAll = originalStudentParentFindAll;
    }
  });

  it('keeps deleted students out of the shared export even when requested', async () => {
    const { Student } = require('../src/models');
    const originalFindAll = Student.findAll;
    const { Op } = require('sequelize');
    let query;
    try {
      Student.findAll = async options => {
        query = options;
        return [];
      };
      await exportService.getStudentsData(
        { status: 'deleted', category_id: 'category-1' },
        { role: 'admin' },
        'school-1'
      );
      assert.deepStrictEqual(query.where.status, { [Op.ne]: 'deleted' });
      assert.strictEqual(query.where.category_id, 'category-1');
    } finally {
      Student.findAll = originalFindAll;
    }
  });
});

describe('Unified library exports', () => {
  it('filters catalog exports and locks Librarians to their assigned branch', async () => {
    const { LibraryBook } = require('../src/models');
    const originalFindAll = LibraryBook.findAll;
    const { Op } = require('sequelize');
    let query;

    try {
      LibraryBook.findAll = async options => {
        query = options;
        return [];
      };

      await exportService.getLibraryData(
        { branch_id: 'branch-other', category: 'Textbook', search: '  demo  ' },
        { role: 'librarian', branch_id: 'branch-assigned' },
        'school-1'
      );

      expect(query.where).toMatchObject({
        school_id: 'school-1',
        branch_id: 'branch-assigned',
        category: 'Textbook'
      });
      expect(query.where[Op.or]).toEqual(
        ['title', 'author', 'isbn', 'category'].map(field => ({
          [field]: { [Op.like]: '%demo%' }
        }))
      );
      expect(query.attributes).not.toContain('school_id');
      expect(query.attributes).not.toContain('branch_id');
    } finally {
      LibraryBook.findAll = originalFindAll;
    }
  });

  it('exposes only catalog columns for the library report', () => {
    const columns = exportService.getColumnsForReport('library');
    expect(columns.map(column => column.key)).toEqual([
      'title',
      'author',
      'isbn',
      'category',
      'publisher',
      'edition',
      'quantity',
      'available',
      'purchase_date',
      'purchase_price',
      'sale_price'
    ]);
    expect(exportService.supportedReportTypes).toContain('library');
    expect(exportService.getReportTitle('library')).toBe('Library Catalog');
  });
});

describe('Unified homework exports', () => {
  it('exports all matching assignments and pins a Teacher to their assigned branch', async () => {
    const { Homework, Branch } = require('../src/models');
    const originalHomeworkFindAll = Homework.findAll;
    const originalBranchFindAll = Branch.findAll;
    const { Op } = require('sequelize');
    try {
      Homework.findAll = async options => {
        expect(options.where).toMatchObject({
          school_id: 'school-1',
          branch_id: 'branch-assigned',
          class_id: 'class-1'
        });
        expect(options.where.academic_year).toBeUndefined();
        expect(options.where[Op.and]).toEqual(
          expect.arrayContaining([
            { [Op.or]: [{ academic_year: '2026-2027' }, { academic_year: null }] },
            {
              [Op.or]: [
                { title: { [Op.iLike]: '%science%' } },
                { description: { [Op.iLike]: '%science%' } },
                { '$class.name$': { [Op.iLike]: '%science%' } },
                { '$section.name$': { [Op.iLike]: '%science%' } },
                { '$subject.name$': { [Op.iLike]: '%science%' } }
              ]
            }
          ])
        );
        expect(options.order).toEqual([
          ['title', 'ASC'],
          ['id', 'ASC']
        ]);
        return [
          {
            branch_id: 'branch-assigned',
            toJSON: () => ({
              title: 'Science lab',
              due_date: '2026-10-30',
              academic_year: '2026-2027',
              branch_id: 'branch-assigned',
              class: { name: 'Class 1' },
              section: { name: 'A' },
              subject: { name: 'Science' }
            })
          }
        ];
      };
      Branch.findAll = async options => {
        expect(options.where).toMatchObject({ school_id: 'school-1' });
        return [{ id: 'branch-assigned', name: 'Main Branch' }];
      };

      const rows = await exportService.getHomeworksData(
        {
          branch_id: 'branch-forged',
          class_id: 'class-1',
          academic_year: '2026-2027',
          search: 'science',
          sort_by: 'title',
          sort_order: 'ASC'
        },
        { role: 'teacher', branch_id: 'branch-assigned' },
        'school-1'
      );

      expect(rows).toEqual([
        {
          title: 'Science lab',
          class_name: 'Class 1',
          section_name: 'A',
          subject_name: 'Science',
          academic_year: '2026-2027',
          due_date: '2026-10-30',
          branch_name: 'Main Branch'
        }
      ]);
    } finally {
      Homework.findAll = originalHomeworkFindAll;
      Branch.findAll = originalBranchFindAll;
    }
  });
});
