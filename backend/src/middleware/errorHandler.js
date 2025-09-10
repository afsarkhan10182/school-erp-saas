const { logger } = require('~/utils/logger');
const { ValidationError } = require('sequelize');
const { JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken');
const { error: errorResponse } = require('~/utils/apiResponse');
// HTTP Status codes as constants
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  REQUEST_TIMEOUT: 408,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Global error handler middleware
 * Handles all errors in the application and sends appropriate responses
 * This is the last line of defense against server hangs
 */
const errorHandler = (err, req, res, next) => {
  // Prevent multiple error responses
  if (res.headersSent) {
    logger.warn('Headers already sent, cannot send error response', {
      url: req.originalUrl,
      method: req.method,
      error: err.message
    });
    return;
  }

  // Ensure we have a valid error object
  if (!err || typeof err !== 'object') {
    err = new Error(err || 'Unknown error occurred');
  }

  // Log the error with request details
  logger.error({
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: err.stack,
    ...(err.errors && { validationErrors: err.errors }),
    ...(err.code && { errorCode: err.code }),
    ...(err.statusCode && { statusCode: err.statusCode })
  });

  // Debug logging for status code issues
  logger.debug('Error object details:', {
    errorType: typeof err,
    errorConstructor: err.constructor.name,
    errorName: err.name,
    hasStatusCode: 'statusCode' in err,
    statusCodeValue: err.statusCode,
    statusCodeType: typeof err.statusCode,
    errorKeys: Object.keys(err),
    errorProperties: Object.getOwnPropertyNames(err),
    fullError: JSON.stringify(err, null, 2)
  });

  // Handle specific error types with proper status codes
  if (err instanceof ValidationError) {
    const errors = {};
    err.errors.forEach(error => {
      errors[error.path] = error.message;
    });
    return errorResponse(res, err, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Validation Error',
      errors
    });
  }

  // Handle ApiError with field-specific errors
  if (err.name === 'ApiError' && err.details && err.details.errors) {
    return errorResponse(res, err, {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.details.errors
    });
  }

  // Handle other specific error types
  switch (err.name) {
    case 'SequelizeUniqueConstraintError':
      return errorResponse(res, err, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'Duplicate entry',
        errors: { [err.errors[0].path]: 'This value already exists' }
      });

    case 'SequelizeDatabaseError':
      return errorResponse(res, err, {
        statusCode: 400,
        message: 'Database error'
      });

    case 'SequelizeConnectionError':
      return errorResponse(res, err, {
        statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
        message: 'Database connection error'
      });

    case 'JsonWebTokenError':
      return errorResponse(res, err, {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: 'Invalid token'
      });

    case 'TokenExpiredError':
      return errorResponse(res, err, {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: 'Token expired'
      });

    case 'UnauthorizedError':
      return errorResponse(res, err, {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: 'Not authorized to access this route'
      });

    case 'MulterError':
      return errorResponse(res, err, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'File upload error',
        errors: { file: err.message }
      });

    case 'SyntaxError':
      return errorResponse(res, err, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Invalid JSON'
      });

    case 'CastError':
      return errorResponse(res, err, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Invalid data format'
      });

    // Handle custom API errors
    case 'ApiError':
      return errorResponse(res, err, {
        statusCode: err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: err.message || 'API Error',
        errors: err.details?.errors || {}
      });

    // Handle timeout errors
    case 'TimeoutError':
      return errorResponse(res, err, {
        statusCode: HTTP_STATUS.REQUEST_TIMEOUT,
        message: 'Request timeout'
      });

    // Handle network errors
    case 'NetworkError':
      return errorResponse(res, err, {
        statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
        message: 'Network error'
      });

    case 'NotFoundError':
      return errorResponse(res, err, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: err.message || 'Resource not found'
      });

    // Default error handler
    default:
      // Determine status code based on error properties
      let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      let message = 'Internal Server Error';

      if (err.statusCode) {
        statusCode = err.statusCode;
      } else if (err.code === 'ENOTFOUND') {
        statusCode = HTTP_STATUS.NOT_FOUND;
        message = 'Resource not found';
      } else if (err.code === 'ECONNREFUSED') {
        statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
        message = 'Service unavailable';
      } else if (err.code === 'ETIMEDOUT') {
        statusCode = HTTP_STATUS.REQUEST_TIMEOUT;
        message = 'Request timeout';
      } else if (err.message) {
        message = err.message;
      }

      // Final fallback: ensure statusCode is always valid
      if (!statusCode || isNaN(parseInt(statusCode)) || statusCode < 100 || statusCode > 599) {
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      }

      // Also ensure err.statusCode is set for consistency
      err.statusCode = statusCode;

      return errorResponse(res, err, {
        statusCode,
        message,
        errors: err.errors || {}
      });
  }
};

/**
 * 404 Not Found handler
 * This should be placed before the error handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  error.name = 'NotFoundError';
  next(error);
};

/**
 * Graceful shutdown handler
 * @param {Object} server - Express server instance
 */
const gracefulShutdown = server => {
  return signal => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    server.close(err => {
      if (err) {
        logger.error('Error during server shutdown:', err);
        process.exit(1);
      }

      logger.info('Server closed successfully');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  gracefulShutdown
};
