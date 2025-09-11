const { logger } = require('~/utils/logger');
const ApiError = require('~/utils/ApiError');

/**
 * Validate export request parameters
 */
const validateExportRequest = (req, res, next) => {
  try {
    const { report_type, format } = req.query;

    // Validate report type
    const supportedReportTypes = ['receipts', 'fees', 'students', 'attendance'];
    if (!report_type || !supportedReportTypes.includes(report_type)) {
      throw new ApiError(
        400,
        `Invalid report_type. Supported types: ${supportedReportTypes.join(', ')}`
      );
    }

    // Validate format
    const supportedFormats = ['pdf', 'excel', 'csv', 'print'];
    if (format && !supportedFormats.includes(format)) {
      throw new ApiError(400, `Invalid format. Supported formats: ${supportedFormats.join(', ')}`);
    }

    // Validate date ranges
    const { from_date, to_date, date_from, date_to } = req.query;
    const startDate = from_date || date_from;
    const endDate = to_date || date_to;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ApiError(400, 'Invalid date format. Use YYYY-MM-DD format');
      }

      if (start > end) {
        throw new ApiError(400, 'Start date cannot be after end date');
      }
    }

    // Validate single date
    if (req.query.date) {
      const date = new Date(req.query.date);
      if (isNaN(date.getTime())) {
        throw new ApiError(400, 'Invalid date format. Use YYYY-MM-DD format');
      }
    }

    next();
  } catch (error) {
    logger.error('Export validation error:', error);
    return next(error);
  }
};

/**
 * Check export permissions based on user role and report type
 */
const checkExportPermissions = (req, res, next) => {
  try {
    const { report_type } = req.query;
    const userRole = req.user.role;

    // Define permissions for each report type
    const permissions = {
      receipts: ['super_admin', 'school_admin', 'branch_admin', 'accountant'],
      fees: ['super_admin', 'school_admin', 'branch_admin', 'accountant'],
      students: ['super_admin', 'school_admin', 'branch_admin', 'teacher'],
      attendance: ['super_admin', 'school_admin', 'branch_admin', 'teacher']
    };

    const allowedRoles = permissions[report_type] || [];

    if (!allowedRoles.includes(userRole)) {
      throw new ApiError(403, `You don't have permission to export ${report_type} reports`);
    }

    // Additional role-based restrictions
    if (userRole === 'branch_admin') {
      // Branch admins can only export data from their assigned branch
      if (!req.user.branch_id) {
        throw new ApiError(403, 'Branch admin must be assigned to a branch to export reports');
      }
    }

    if (userRole === 'super_admin') {
      // Super admin must provide school_id for most reports
      if (report_type !== 'students' && !req.query.school_id) {
        throw new ApiError(400, 'School ID is required for super admin export requests');
      }
    }

    next();
  } catch (error) {
    logger.error('Export permission check error:', error);
    return next(error);
  }
};

/**
 * Rate limiting for export requests
 */
const rateLimitExports = (req, res, next) => {
  try {
    // Simple in-memory rate limiting (in production, use Redis)
    const userKey = `export_${req.user.id}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 10; // Max 10 exports per minute

    // Initialize rate limit tracking if not exists
    if (!req.app.locals.exportRateLimit) {
      req.app.locals.exportRateLimit = new Map();
    }

    const userLimits = req.app.locals.exportRateLimit.get(userKey) || {
      count: 0,
      resetTime: now + windowMs
    };

    // Reset counter if window has passed
    if (now > userLimits.resetTime) {
      userLimits.count = 0;
      userLimits.resetTime = now + windowMs;
    }

    // Check if limit exceeded
    if (userLimits.count >= maxRequests) {
      const remainingTime = Math.ceil((userLimits.resetTime - now) / 1000);
      throw new ApiError(429, `Export rate limit exceeded. Try again in ${remainingTime} seconds`);
    }

    // Increment counter
    userLimits.count++;
    req.app.locals.exportRateLimit.set(userKey, userLimits);

    next();
  } catch (error) {
    logger.error('Export rate limit error:', error);
    return next(error);
  }
};

/**
 * Log export requests for audit
 */
const logExportRequest = (req, res, next) => {
  try {
    const { report_type, format } = req.query;

    logger.info('Export request initiated', {
      userId: req.user.id,
      userRole: req.user.role,
      schoolId: req.schoolId,
      reportType: report_type,
      format,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    // Don't fail the request for logging errors
    logger.warn('Failed to log export request:', error);
    next();
  }
};

/**
 * Sanitize export filters to prevent injection
 */
const sanitizeExportFilters = (req, res, next) => {
  try {
    const filters = req.query;

    // Sanitize string values
    Object.keys(filters).forEach(key => {
      if (typeof filters[key] === 'string') {
        // Remove any potentially dangerous characters
        filters[key] = filters[key].replace(/[<>\"'&]/g, '');

        // Limit string length
        if (filters[key].length > 100) {
          filters[key] = filters[key].substring(0, 100);
        }
      }
    });

    // Validate numeric values
    const numericFields = ['branch_id', 'class_id', 'section_id', 'student_id'];
    numericFields.forEach(field => {
      if (filters[field] && isNaN(parseInt(filters[field]))) {
        throw new ApiError(400, `Invalid ${field}: must be a number`);
      }
    });

    next();
  } catch (error) {
    logger.error('Export filter sanitization error:', error);
    return next(error);
  }
};

module.exports = {
  validateExportRequest,
  checkExportPermissions,
  rateLimitExports,
  logExportRequest,
  sanitizeExportFilters
};
