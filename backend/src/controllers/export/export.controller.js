const unifiedExportService = require('../../services/unified-export.service');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');
const { success: successResponse } = require('../../utils/apiResponse');

/**
 * Unified export endpoint for all report types
 */
const exportReport = async (req, res, next) => {
  try {
    // Handle both GET and POST requests
    const isPostRequest = req.method === 'POST';
    const requestData = isPostRequest ? req.body : req.query;
    
    const { 
      report_type, 
      format = 'excel',
      // Common filters
      from_date,
      to_date,
      branch_id,
      // Receipts specific filters
      status,
      // Students specific filters
      academic_year,
      class_name,
      section_name,
      // Attendance specific filters
      class_id,
      section_id,
      student_id,
      date_from,
      date_to,
      date,
      // Fees specific filters
      search,
      report_type: fee_report_type,
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

    // Normalize filter names for consistency
    const filters = {
      // Date filters
      from_date: from_date || date_from,
      to_date: to_date || date_to,
      date,
      
      // Branch filter
      branch_id,
      
      // Status filter
      status,
      
      // Academic filters
      academic_year,
      class_name,
      class_id,
      section_name,
      section_id,
      student_id,
      
      // Search filter
      search,
      
      // Fee report type
      report_type: fee_report_type,
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

    // Handle different response types based on format
    if (format === 'print') {
      return successResponse(res, {
        message: 'Export data generated successfully',
        data: result.data,
        fileName: result.fileName,
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
      fileStream.pipe(res);
      
      // Clean up file after sending
      fileStream.on('end', () => {
        require('fs').unlink(result.filePath, (err) => {
          if (err) {
            logger.warn('Failed to delete temporary export file:', err);
          }
        });
      });
    } else {
      throw new ApiError(500, 'Failed to generate export file');
    }

  } catch (error) {
    logger.error('Export controller error:', error);
    return next(error);
  }
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
      description: getFormatDescription(format),
    }));

    return successResponse(res, {
      message: 'Export formats retrieved successfully',
      data: {
        report_type,
        formats,
      },
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
    const reportTypes = unifiedExportService.supportedReportTypes.map(type => ({
      value: type,
      label: getReportTypeLabel(type),
      description: getReportTypeDescription(type),
    }));

    return successResponse(res, {
      message: 'Report types retrieved successfully',
      data: reportTypes,
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

    const columns = unifiedExportService.getColumnsForReport(report_type);

    return successResponse(res, {
      message: 'Report columns retrieved successfully',
      data: {
        report_type,
        columns,
      },
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
    print: 'Print-friendly format - Best for browser printing',
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
  };
  return descriptions[type] || 'Report data';
}

module.exports = {
  exportReport,
  getExportFormats,
  getReportTypes,
  getReportColumns
};
