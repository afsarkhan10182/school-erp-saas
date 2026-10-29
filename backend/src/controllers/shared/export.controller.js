const unifiedExportService = require('~/services/shared/unified-export.service');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const { success: successResponse } = require('~/utils/shared/apiResponse');

/**
 * Unified export endpoint for all report types
 */
const exportReport = async (req, res, next) => {
  let exportTempDir;
  let exportTempDirRemoved = false;
  const cleanupExportTempDir = () => {
    if (!exportTempDir || exportTempDirRemoved) return;
    exportTempDirRemoved = true;
    try {
      require('fs').rmSync(exportTempDir, { recursive: true, force: true });
    } catch (error) {
      logger.warn('Failed to delete temporary export directory:', error);
    }
  };

  try {
    // Handle both GET and POST requests
    const isPostRequest = req.method === 'POST';
    const requestData = isPostRequest
      ? req.body
      : {
          ...req.query,
          ...(req.homeworkExport ? { report_type: 'homeworks' } : {}),
          ...(req.classworkExport ? { report_type: 'classwork' } : {}),
          ...(req.gatePassExport ? { report_type: 'gate_passes' } : {}),
          ...(req.visitorExport ? { report_type: 'visitors' } : {}),
          ...(req.admissionEnquiryExport ? { report_type: 'admission_enquiries' } : {}),
          ...(req.auditTrailExport ? {
            report_type: 'audit_events',
            from_date: req.query.from,
            to_date: req.query.to
          } : {})
        };

    const {
      report_type,
      format = 'excel',
      // Common filters
      from_date,
      to_date,
      action,
      entity,
      branch_id,
      transaction_type,
      category_id,
      sort_by,
      sort_order,
      // Receipts specific filters
      status,
      // Students specific filters
      academic_year,
      class_name,
      section_name,
      // Attendance specific filters
      class_id,
      section_id,
      stream_id,
      student_id,
      has_siblings,
      enrollment,
      date_from,
      date_to,
      date,
      // Fees specific filters
      due_from,
      due_to,
      search,
      entry_type,
      category,
      report_type: fee_report_type,
      payment_model,
      payment_method,
      periods,
      months,
      year
    } = requestData;

    // Extract and validate columns based on request method
    let columns;

    if (req.method === 'POST') {
      columns = requestData?.columns;
      if (!columns) {
        throw new ApiError(400, 'Columns are required in request body for POST requests.');
      }
    } else {
      if (!req.query.columns) {
        throw new ApiError(400, 'Columns parameter is required in query string for GET requests.');
      }
      try {
        columns = JSON.parse(req.query.columns);
      } catch (error) {
        throw new ApiError(400, 'Invalid columns format. Expected JSON array.');
      }
    }

    // Validate columns structure
    if (!Array.isArray(columns) || columns.length === 0) {
      throw new ApiError(400, 'Columns must be a non-empty array.');
    }

    // Validate each column has required properties
    const invalidColumns = columns.filter(col => !col || !col.key || !col.header);
    if (invalidColumns.length > 0) {
      throw new ApiError(400, 'Each column must have key and header properties.');
    }

    // Validate required parameters
    if (!report_type) {
      throw new ApiError(400, 'report_type is required');
    }
    if (report_type === 'audit_events' && !req.auditTrailExport) {
      throw new ApiError(403, 'Audit exports require the dedicated audit-trail route.');
    }
    if (report_type === 'audit_events') {
      if (!req.schoolId) throw new ApiError(400, 'Select a school before exporting audit events.');
      const allowedColumns = unifiedExportService.getColumnsForReport('audit_events');
      const allowedKeys = new Set(allowedColumns.map(column => column.key));
      if (columns.some(column => !allowedKeys.has(column.key))) {
        throw new ApiError(400, 'Invalid audit export column.');
      }
      columns = columns.map(column => allowedColumns.find(allowed => allowed.key === column.key));
    }
    if (report_type === 'homeworks' && !req.homeworkExport) {
      throw new ApiError(403, 'Homework exports require the dedicated homework export route.');
    }
    if (report_type === 'classwork' && !req.classworkExport) {
      throw new ApiError(403, 'Classwork exports require the dedicated classwork export route.');
    }
    if (report_type === 'classwork') {
      const allowedColumns = unifiedExportService.getColumnsForReport('classwork');
      const allowedKeys = new Set(allowedColumns.map(column => column.key));
      if (columns.some(column => !allowedKeys.has(column.key))) throw new ApiError(400, 'Invalid classwork export column.');
      columns = columns.map(column => allowedColumns.find(allowed => allowed.key === column.key));
    }
    if (report_type === 'homeworks') {
      const allowedKeys = new Set(
        unifiedExportService.getColumnsForReport('homeworks').map(column => column.key)
      );
      if (columns.some(column => !allowedKeys.has(column.key))) {
        throw new ApiError(400, 'Invalid homework export column.');
      }
    }
    if (report_type === 'gate_passes' && !req.gatePassExport) {
      throw new ApiError(403, 'Gate pass exports require the dedicated gate pass export route.');
    }
    if (report_type === 'gate_passes') {
      const allowedKeys = new Set(
        unifiedExportService.getColumnsForReport('gate_passes').map(column => column.key)
      );
      if (columns.some(column => !allowedKeys.has(column.key))) {
        throw new ApiError(400, 'Invalid gate pass export column.');
      }
    }
    if (report_type === 'visitors' && !req.visitorExport) {
      throw new ApiError(403, 'Visitor exports require the dedicated visitor export route.');
    }
    if (report_type === 'visitors') {
      const allowedKeys = new Set(
        unifiedExportService.getColumnsForReport('visitors').map(column => column.key)
      );
      if (columns.some(column => !allowedKeys.has(column.key))) {
        throw new ApiError(400, 'Invalid visitor export column.');
      }
      if (req.user.role === 'receptionist' && !req.user.branch_id) {
        throw new ApiError(403, 'Receptionist must be assigned to a branch to export visitors.');
      }
    }
    if (report_type === 'admission_enquiries' && !req.admissionEnquiryExport) {
      throw new ApiError(403, 'Admission enquiry exports require the dedicated export route.');
    }
    if (report_type === 'admission_enquiries') {
      const allowedKeys = new Set(
        unifiedExportService.getColumnsForReport('admission_enquiries').map(column => column.key)
      );
      if (columns.some(column => !allowedKeys.has(column.key))) {
        throw new ApiError(400, 'Invalid admission enquiry export column.');
      }
      if (req.user.role === 'receptionist' && !req.user.branch_id) {
        throw new ApiError(403, 'Receptionist must be assigned to a branch to export admission enquiries.');
      }
    }

    const isIsoDate = value => {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const parsed = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    };
    if (
      (due_from && !isIsoDate(due_from)) ||
      (due_to && !isIsoDate(due_to)) ||
      (due_from && due_to && due_from > due_to)
    ) {
      throw new ApiError(400, 'Due date filters must be valid dates in ascending order');
    }
    if (
      report_type === 'classwork' &&
      ((from_date && !isIsoDate(from_date)) || (to_date && !isIsoDate(to_date)) || (from_date && to_date && from_date > to_date))
    ) {
      throw new ApiError(400, 'Classwork date filters must be valid dates in ascending order');
    }

    if (
      req.user.role === 'accountant' &&
      !['fees', 'receipts', 'transactions'].includes(report_type)
    ) {
      throw new ApiError(403, 'Accountants can only export fee, receipt, and transaction reports.');
    }
    if (report_type === 'transactions' && req.user.role === 'super_admin' && !req.schoolId) {
      throw new ApiError(400, 'School ID is required to export accounting transactions.');
    }
    if (report_type === 'transactions' && req.user.role === 'branch_admin' && !req.user.branch_id) {
      throw new ApiError(403, 'Branch Admin must be assigned to a branch to export transactions.');
    }
    if (report_type === 'library' && req.user.role === 'branch_admin' && !req.user.branch_id) {
      throw new ApiError(
        403,
        'Branch admin must be assigned to a branch to export library reports.'
      );
    }

    // Normalize filter names for consistency
    const filters = {
      // Date filters
      from_date: from_date || date_from,
      to_date: to_date || date_to,
      action,
      entity,
      date,
      due_from,
      due_to,

      // Branch filter
      branch_id:
        req.user.role === 'branch_admin' ||
        req.user.role === 'receptionist' ||
        (req.user.role === 'librarian' && req.user.branch_id)
          ? req.user.branch_id
          : branch_id,

      // Status filter
      status,

      // Academic filters
      academic_year,
      class_name,
      class_id,
      section_name,
      section_id,
      stream_id,
      student_id,
      has_siblings,
      enrollment,

      // Search filter
      search,
      entry_type,
      category,
      transaction_type,
      category_id,
      sort_by,
      sort_order,

      // Fee report type
      report_type: fee_report_type,

      // Monthly payment filters
      payment_model,
      payment_method,
      periods,
      months,
      year
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    // Call unified export service
    const result = await unifiedExportService.exportReport(
      report_type,
      format,
      filters,
      req.user,
      req.schoolId,
      columns
    );
    exportTempDir = result.tempDir;

    // Handle different response types based on format
    if (format === 'print') {
      return successResponse(res, {
        message: 'Export data generated successfully',
        data: result.data,
        fileName: result.fileName
      });
    }

    // For file formats, send the file
    if (result.filePath && require('fs').existsSync(result.filePath)) {
      const stats = require('fs').statSync(result.filePath);

      if (stats.size === 0) {
        throw new ApiError(500, 'Generated file is empty');
      }

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);

      const fileStream = require('fs').createReadStream(result.filePath);
      fileStream.once('error', error => {
        cleanupExportTempDir();
        if (!res.headersSent) return next(error);
        logger.error('Report export stream failed after response started:', error);
        res.destroy(error);
      });
      res.once('finish', cleanupExportTempDir);
      res.once('close', cleanupExportTempDir);
      fileStream.pipe(res);
    } else {
      throw new ApiError(500, 'Failed to generate export file');
    }
  } catch (error) {
    cleanupExportTempDir();
    logger.error('Export controller error:', error);
    return next(error);
  }
};

const exportHomeworkReport = (req, res, next) => {
  req.homeworkExport = true;
  return exportReport(req, res, next);
};

const exportClassworkReport = (req, res, next) => {
  req.classworkExport = true;
  return exportReport(req, res, next);
};

const exportGatePassReport = (req, res, next) => {
  req.gatePassExport = true;
  return exportReport(req, res, next);
};

const exportVisitorReport = (req, res, next) => {
  req.visitorExport = true;
  return exportReport(req, res, next);
};

const exportAdmissionEnquiryReport = (req, res, next) => {
  req.admissionEnquiryExport = true;
  return exportReport(req, res, next);
};

/**
 * Get available export formats for a report type
 */
const getExportFormats = async (req, res, next) => {
  try {
    const { report_type } = req.query;

    if (!report_type) {
      throw new ApiError(400, 'report_type is required');
    }

    const formats = unifiedExportService.supportedFormats.map(format => ({
      value: format,
      label: format.toUpperCase(),
      description: getFormatDescription(format)
    }));

    return successResponse(res, {
      message: 'Export formats retrieved successfully',
      data: {
        report_type,
        formats
      }
    });
  } catch (error) {
    logger.error('Get export formats error:', error);
    return next(error);
  }
};

/**
 * Get available report types
 */
const getReportTypes = async (req, res, next) => {
  try {
    const reportTypes = unifiedExportService.supportedReportTypes.filter(type => type !== 'audit_events').map(type => ({
      value: type,
      label: getReportTypeLabel(type),
      description: getReportTypeDescription(type)
    }));

    return successResponse(res, {
      message: 'Report types retrieved successfully',
      data: reportTypes
    });
  } catch (error) {
    logger.error('Get report types error:', error);
    return next(error);
  }
};

/**
 * Get columns configuration for a report type
 */
const getReportColumns = async (req, res, next) => {
  try {
    const { report_type } = req.query;

    if (!report_type) {
      throw new ApiError(400, 'report_type is required');
    }
    if (!unifiedExportService.supportedReportTypes.includes(report_type) || report_type === 'audit_events') {
      throw new ApiError(400, 'Unsupported report type');
    }

    const columns = unifiedExportService.getColumnsForReport(report_type);

    return successResponse(res, {
      message: 'Report columns retrieved successfully',
      data: {
        report_type,
        columns
      }
    });
  } catch (error) {
    logger.error('Get report columns error:', error);
    return next(error);
  }
};

/**
 * Helper function to get format description
 */
function getFormatDescription(format) {
  const descriptions = {
    pdf: 'Portable Document Format - Best for printing and sharing',
    excel: 'Microsoft Excel format - Best for data analysis',
    csv: 'Comma Separated Values - Best for data import',
    print: 'Print-friendly format - Best for browser printing'
  };
  return descriptions[format] || 'Export format';
}

/**
 * Helper function to get report type label
 */
function getReportTypeLabel(type) {
  const labels = {
    receipts: 'Receipts Report',
    fees: 'Fee Invoices Report',
    students: 'Students Report',
    attendance: 'Attendance Report',
    library: 'Library Catalog Report',
    transactions: 'Accounting Transactions Report',
    homeworks: 'Homework Assignments Report',
    gate_passes: 'Gate Pass Register Report',
    visitors: 'Visitor Register Report',
    admission_enquiries: 'Admission Enquiries Report'
  };
  return labels[type] || type;
}

/**
 * Helper function to get report type description
 */
function getReportTypeDescription(type) {
  const descriptions = {
    receipts: 'Export payment receipts with student and fee details',
    fees: 'Export fee invoices with payment status and amounts',
    students: 'Export student information with guardian details',
    attendance: 'Export attendance records with student and class details',
    library: 'Export branch-scoped library catalog details',
    transactions: 'Export school income and expense transactions',
    homeworks: 'Export school and branch scoped homework assignments',
    gate_passes: 'Export safe, school and branch scoped gate pass records',
    visitors: 'Export school and branch scoped visitor register records',
    admission_enquiries: 'Export safe school and branch scoped admission enquiry records'
  };
  return descriptions[type] || 'Report data';
}

module.exports = {
  exportReport,
  exportHomeworkReport,
  exportClassworkReport,
  exportGatePassReport,
  exportVisitorReport,
  exportAdmissionEnquiryReport,
  getExportFormats,
  getReportTypes,
  getReportColumns
};
