require('module-alias/register');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PassThrough } = require('stream');

jest.mock('../src/services/shared/unified-export.service', () => ({
  exportReport: jest.fn(),
  getColumnsForReport: jest.fn(),
  supportedReportTypes: [
    'receipts',
    'fees',
    'students',
    'attendance',
    'library',
    'transactions',
    'visitors',
    'audit_events'
  ]
}));

jest.mock('../src/utils/shared/apiResponse', () => ({
  success: (res, payload) => res.json(payload)
}));

const exportService = require('../src/services/shared/unified-export.service');
const {
  exportReport,
  exportHomeworkReport,
  exportClassworkReport,
  exportGatePassReport,
  exportVisitorReport,
  exportAdmissionEnquiryReport,
  getReportTypes,
  getReportColumns
} = require('../src/controllers/shared/export.controller');

describe('report export controller permissions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires the dedicated admission enquiry export route and an assigned Receptionist branch', async () => {
    const columns = [{ key: 'student_name', header: 'Student' }];
    exportService.getColumnsForReport.mockReturnValue(columns);
    exportService.exportReport.mockResolvedValue({ data: [], fileName: 'enquiries.csv' });
    const req = {
      method: 'GET',
      query: { report_type: 'admission_enquiries', format: 'print', columns: JSON.stringify(columns) },
      user: { role: 'receptionist', branch_id: 'branch-1' },
      schoolId: 'school-1'
    };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await exportReport(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(exportService.exportReport).not.toHaveBeenCalled();

    await exportAdmissionEnquiryReport(req, res, next);
    expect(exportService.exportReport).toHaveBeenCalledWith(
      'admission_enquiries', 'print', expect.objectContaining({ branch_id: 'branch-1' }),
      req.user, 'school-1', columns
    );
  });

  it.each(['students', 'library'])(
    'prevents accountants from exporting %s reports',
    async reportType => {
      const req = {
        method: 'GET',
        query: {
          report_type: reportType,
          columns: JSON.stringify([{ key: 'guardian_phone', header: 'Guardian phone' }])
        },
        user: { role: 'accountant' },
        schoolId: 'school-1'
      };
      const next = jest.fn();

      await exportReport(req, { json: jest.fn() }, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
      expect(exportService.exportReport).not.toHaveBeenCalled();
    }
  );

  it('does not allow the generic export route to export audit events', async () => {
    const req = {
      method: 'GET',
      query: { report_type: 'audit_events', format: 'print', columns: JSON.stringify([{ key: 'action', header: 'Activity' }]) },
      user: { role: 'admin' },
      schoolId: 'school-1'
    };
    const next = jest.fn();
    await exportReport(req, { json: jest.fn() }, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(exportService.exportReport).not.toHaveBeenCalled();
  });

  it('allows filtered audit export only when dispatched by the dedicated route', async () => {
    const columns = [{ key: 'action', header: 'Activity' }];
    exportService.getColumnsForReport.mockReturnValue(columns);
    exportService.exportReport.mockResolvedValue({ data: { data: [] }, fileName: 'audit.json' });
    const req = {
      method: 'GET',
      query: { report_type: 'audit_events', format: 'print', columns: JSON.stringify([{ key: 'action', header: '<script>untrusted</script>' }]), from: '2026-10-01', to: '2026-10-28', action: 'updated' },
      auditTrailExport: true,
      user: { role: 'admin' },
      schoolId: 'school-1'
    };
    await exportReport(req, { json: jest.fn() }, jest.fn());
    expect(exportService.exportReport).toHaveBeenCalledWith(
      'audit_events', 'print', expect.objectContaining({
        from_date: '2026-10-01', to_date: '2026-10-28', action: 'updated'
      }), req.user, 'school-1', columns
    );
  });

  it('keeps audit events out of the generic export catalog', async () => {
    const res = { json: jest.fn() };
    await getReportTypes({}, res, jest.fn());
    const reportTypes = res.json.mock.calls[0][0].data;
    expect(reportTypes.map(({ value }) => value)).not.toContain('audit_events');
  });

  it('passes library catalog filters for a Librarian export', async () => {
    exportService.exportReport.mockResolvedValue({ data: [], fileName: 'library.csv' });
    const req = {
      method: 'GET',
      query: {
        report_type: 'library',
        format: 'print',
        search: 'Mathematics',
        category: 'Textbook',
        branch_id: 'branch-other',
        columns: JSON.stringify([{ key: 'title', header: 'Title' }])
      },
      user: { role: 'librarian', branch_id: 'branch-1' },
      schoolId: 'school-1'
    };
    const res = { json: jest.fn() };

    await exportReport(req, res, jest.fn());

    expect(exportService.exportReport).toHaveBeenCalledWith(
      'library',
      'print',
      expect.objectContaining({
        search: 'Mathematics',
        category: 'Textbook',
        branch_id: 'branch-1'
      }),
      req.user,
      'school-1',
      [{ key: 'title', header: 'Title' }]
    );
  });

  it('allows accountants to export financial reports', async () => {
    exportService.exportReport.mockResolvedValue({ data: [], fileName: 'fees.csv' });
    const req = {
      method: 'GET',
      query: {
        report_type: 'fees',
        format: 'print',
        due_from: '2026-10-01',
        due_to: '2026-10-31',
        columns: JSON.stringify([{ key: 'total_amount', header: 'Total' }])
      },
      user: { role: 'accountant' },
      schoolId: 'school-1'
    };
    const res = { json: jest.fn() };

    await exportReport(req, res, jest.fn());

    expect(exportService.exportReport).toHaveBeenCalledWith(
      'fees',
      'print',
      expect.objectContaining({ due_from: '2026-10-01', due_to: '2026-10-31' }),
      req.user,
      'school-1',
      [{ key: 'total_amount', header: 'Total' }]
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('allows Accountants to export transaction reports with their selected filters', async () => {
    exportService.exportReport.mockResolvedValue({ data: [], fileName: 'transactions.json' });
    const req = {
      method: 'GET',
      query: {
        report_type: 'transactions',
        format: 'print',
        transaction_type: 'expense',
        category_id: 'category-1',
        search: 'utilities',
        branch_id: 'branch-1',
        sort_by: 'amount',
        sort_order: 'ASC',
        columns: JSON.stringify([{ key: 'amount', header: 'Amount' }])
      },
      user: { role: 'accountant', branch_id: 'branch-1' },
      schoolId: 'school-1'
    };
    const res = { json: jest.fn() };

    await exportReport(req, res, jest.fn());

    expect(exportService.exportReport).toHaveBeenCalledWith(
      'transactions',
      'print',
      expect.objectContaining({
        transaction_type: 'expense',
        category_id: 'category-1',
        search: 'utilities',
        branch_id: 'branch-1',
        sort_by: 'amount',
        sort_order: 'ASC'
      }),
      req.user,
      'school-1',
      [{ key: 'amount', header: 'Amount' }]
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('keeps homework exports on the dedicated route and forwards the fixed report type', async () => {
    exportService.getColumnsForReport.mockReturnValue([
      { key: 'title', header: 'Title' },
      { key: 'class_name', header: 'Class' }
    ]);
    exportService.exportReport.mockResolvedValue({ data: [], fileName: 'homeworks.json' });
    const req = {
      method: 'GET',
      query: {
        format: 'print',
        search: 'Math',
        branch_id: 'branch-1',
        columns: JSON.stringify([{ key: 'title', header: 'Title' }])
      },
      user: { role: 'teacher', branch_id: 'branch-1' },
      schoolId: 'school-1'
    };
    const res = { json: jest.fn() };

    await exportHomeworkReport(req, res, jest.fn());

    expect(exportService.exportReport).toHaveBeenCalledWith(
      'homeworks',
      'print',
      expect.objectContaining({ search: 'Math', branch_id: 'branch-1' }),
      req.user,
      'school-1',
      [{ key: 'title', header: 'Title' }]
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('keeps classwork exports on the dedicated route and validates date filters', async () => {
    exportService.getColumnsForReport.mockReturnValue([{ key: 'title', header: 'Topic' }]);
    exportService.exportReport.mockResolvedValue({ data: [], fileName: 'classwork.json' });
    const req = {
      method: 'GET', classworkExport: true,
      query: { format: 'print', from_date: '2026-01-01', to_date: '2026-01-31', columns: JSON.stringify([{ key: 'title', header: 'Caller supplied label' }]) },
      user: { role: 'teacher', branch_id: 'branch-1' }, schoolId: 'school-1'
    };
    const res = { json: jest.fn() };
    await exportClassworkReport(req, res, jest.fn());
    expect(exportService.exportReport).toHaveBeenCalledWith('classwork', 'print', expect.objectContaining({ from_date: '2026-01-01', to_date: '2026-01-31' }), req.user, 'school-1', [{ key: 'title', header: 'Topic' }]);

    exportService.exportReport.mockClear();
    const next = jest.fn();
    await exportClassworkReport({ ...req, query: { ...req.query, from_date: '2026-02-01', to_date: '2026-01-01' } }, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(exportService.exportReport).not.toHaveBeenCalled();
  });

  it('rejects using the generic export route for homework data', async () => {
    const req = {
      method: 'GET',
      query: {
        report_type: 'homeworks',
        columns: JSON.stringify([{ key: 'title', header: 'Title' }])
      },
      user: { role: 'admin' },
      schoolId: 'school-1'
    };
    const next = jest.fn();

    await exportReport(req, { json: jest.fn() }, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(exportService.exportReport).not.toHaveBeenCalled();
  });

  it('rejects unlisted homework columns before exporting', async () => {
    exportService.getColumnsForReport.mockReturnValue([{ key: 'title', header: 'Title' }]);
    const req = {
      method: 'GET',
      query: {
        report_type: 'homeworks',
        columns: JSON.stringify([{ key: 'description', header: 'Description' }])
      },
      homeworkExport: true,
      user: { role: 'teacher', branch_id: 'branch-1' },
      schoolId: 'school-1'
    };
    const next = jest.fn();

    await exportReport(req, { json: jest.fn() }, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(exportService.exportReport).not.toHaveBeenCalled();
  });

  it('requires the dedicated gate pass route and rejects sensitive columns', async () => {
    exportService.getColumnsForReport.mockReturnValue([{ key: 'pass_no', header: 'Pass number' }]);
    const next = jest.fn();
    const request = () => ({
      method: 'GET',
      query: {
        format: 'print',
        columns: JSON.stringify([{ key: 'collector_phone', header: 'Phone' }])
      },
      user: { role: 'receptionist', branch_id: 'branch-1' },
      schoolId: 'school-1'
    });
    await exportReport(
      { ...request(), query: { ...request().query, report_type: 'gate_passes' } },
      { json: jest.fn() },
      next
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    next.mockClear();
    const req = request();
    await exportGatePassReport(req, { json: jest.fn() }, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(exportService.exportReport).not.toHaveBeenCalled();
  });

  it('requires the dedicated visitor route and an assigned Receptionist branch', async () => {
    exportService.getColumnsForReport.mockReturnValue([
      { key: 'visitor_name', header: 'Visitor Name' },
      { key: 'phone', header: 'Phone' }
    ]);
    const next = jest.fn();
    const req = {
      method: 'GET',
      query: { format: 'csv', columns: JSON.stringify([{ key: 'phone', header: 'Phone' }]) },
      user: { role: 'receptionist', branch_id: 'branch-1' },
      schoolId: 'school-1'
    };
    await exportReport(
      { ...req, query: { ...req.query, report_type: 'visitors' } },
      { json: jest.fn() },
      next
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    next.mockClear();

    await exportVisitorReport(
      { ...req, user: { role: 'receptionist' } },
      { json: jest.fn() },
      next
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(exportService.exportReport).not.toHaveBeenCalled();
  });

  it('rejects Platform Owner transaction exports without an inspected school', async () => {
    const next = jest.fn();
    await exportReport(
      {
        method: 'GET',
        query: {
          report_type: 'transactions',
          columns: JSON.stringify([{ key: 'amount', header: 'Amount' }])
        },
        user: { role: 'super_admin' },
        schoolId: null
      },
      { json: jest.fn() },
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(exportService.exportReport).not.toHaveBeenCalled();
  });

  it('rejects Branch Admin transaction exports without an assigned branch', async () => {
    const next = jest.fn();
    await exportReport(
      {
        method: 'GET',
        query: {
          report_type: 'transactions',
          columns: JSON.stringify([{ key: 'amount', header: 'Amount' }])
        },
        user: { role: 'branch_admin', school_id: 'school-1' },
        schoolId: 'school-1'
      },
      { json: jest.fn() },
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(exportService.exportReport).not.toHaveBeenCalled();
  });

  it('streams a private export and removes its temporary directory after delivery', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'school-erp-export-controller-test-'));
    const filePath = path.join(tempDir, 'fees.csv');
    fs.writeFileSync(filePath, 'Total\n100\n');
    exportService.exportReport.mockResolvedValue({
      tempDir,
      filePath,
      fileName: 'fees.csv',
      contentType: 'text/csv'
    });
    const req = {
      method: 'GET',
      query: {
        report_type: 'fees',
        format: 'csv',
        columns: JSON.stringify([{ key: 'total_amount', header: 'Total' }])
      },
      user: { role: 'admin' },
      schoolId: 'school-1'
    };
    const res = new PassThrough();
    res.setHeader = jest.fn();
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    const finished = new Promise(resolve => res.once('finish', resolve));

    await exportReport(req, res, jest.fn());
    await finished;

    expect(Buffer.concat(chunks).toString()).toBe('Total\n100\n');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="fees.csv"'
    );
    expect(fs.existsSync(tempDir)).toBe(false);
  });

  it('removes a temporary export directory when the generated file is missing', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'school-erp-export-controller-test-'));
    exportService.exportReport.mockResolvedValue({
      tempDir,
      filePath: path.join(tempDir, 'missing.csv'),
      fileName: 'missing.csv',
      contentType: 'text/csv'
    });
    const next = jest.fn();

    await exportReport(
      {
        method: 'GET',
        query: {
          report_type: 'fees',
          format: 'csv',
          columns: JSON.stringify([{ key: 'total_amount', header: 'Total' }])
        },
        user: { role: 'admin' },
        schoolId: 'school-1'
      },
      { setHeader: jest.fn(), once: jest.fn() },
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
    expect(fs.existsSync(tempDir)).toBe(false);
  });

  it('rejects malformed or reversed due-date export filters', async () => {
    const next = jest.fn();
    await exportReport(
      {
        method: 'GET',
        query: {
          report_type: 'fees',
          due_from: '2026-11-01',
          due_to: '2026-10-01',
          columns: JSON.stringify([{ key: 'due_date', header: 'Due date' }])
        },
        user: { role: 'accountant', branch_id: 'branch-1' },
        schoolId: 'school-1'
      },
      { json: jest.fn() },
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Due date filters must be valid dates in ascending order'
      })
    );
    expect(exportService.exportReport).not.toHaveBeenCalled();
  });

  it('returns configured columns for a supported report type', async () => {
    const columns = [{ key: 'admission_number', header: 'Admission No.' }];
    exportService.getColumnsForReport.mockReturnValue(columns);
    const req = { query: { report_type: 'students' } };
    const res = { json: jest.fn() };

    await getReportColumns(req, res, jest.fn());

    expect(exportService.getColumnsForReport).toHaveBeenCalledWith('students');
    expect(res.json).toHaveBeenCalledWith({
      message: 'Report columns retrieved successfully',
      data: { report_type: 'students', columns }
    });
  });

  it.each(['unknown', 'audit_events'])('rejects %s for the generic columns endpoint', async report_type => {
    const next = jest.fn();

    await getReportColumns({ query: { report_type } }, { json: jest.fn() }, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(exportService.getColumnsForReport).not.toHaveBeenCalled();
  });
});
