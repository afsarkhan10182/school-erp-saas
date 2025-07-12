const { logger } = require('../utils/logger');
const { ValidationError } = require('sequelize');
const { JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken');
const { error: errorResponse } = require('../utils/apiResponse');
const httpStatus = require('http-status');

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
    ...(err.statusCode && { statusCode: err.statusCode }),
  });

  // Handle specific error types with proper status codes
  if (err instanceof ValidationError) {
    const errors = {};
    err.errors.forEach((error) => {
      errors[error.path] = error.message;
    });
    return errorResponse(res, err, {
      statusCode: httpStatus.BAD_REQUEST,
      message: 'Validation Error',
      errors,
    });
  }

  // Handle other specific error types
  switch (err.name) {
    case 'SequelizeUniqueConstraintError':
      return errorResponse(res, err, {
        statusCode: httpStatus.CONFLICT,
        message: 'Duplicate entry',
        errors: { [err.errors[0].path]: 'This value already exists' },
      });
    
    case 'SequelizeDatabaseError':
      return errorResponse(res, err, {
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Database error',
      });
    
    case 'SequelizeConnectionError':
      return errorResponse(res, err, {
        statusCode: httpStatus.SERVICE_UNAVAILABLE,
        message: 'Database connection error',
      });
    
    case 'JsonWebTokenError':
      return errorResponse(res, err, {
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
    
    case 'TokenExpiredError':
      return errorResponse(res, err, {
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'Token expired',
      });
    
    case 'UnauthorizedError':
      return errorResponse(res, err, {
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'Not authorized to access this route',
      });
    
    case 'MulterError':
      return errorResponse(res, err, {
        statusCode: httpStatus.BAD_REQUEST,
        message: 'File upload error',
        errors: { file: err.message },
      });
    
    case 'SyntaxError':
      return errorResponse(res, err, {
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Invalid JSON',
      });
    
    case 'CastError':
      return errorResponse(res, err, {
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Invalid data format',
      });
    
    // Handle custom API errors
    case 'ApiError':
      return errorResponse(res, err, {
        statusCode: err.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
        message: err.message || 'API Error',
        errors: err.details?.errors || {},
      });
    
    // Handle timeout errors
    case 'TimeoutError':
      return errorResponse(res, err, {
        statusCode: httpStatus.REQUEST_TIMEOUT,
        message: 'Request timeout',
      });
    
    // Handle network errors
    case 'NetworkError':
      return errorResponse(res, err, {
        statusCode: httpStatus.SERVICE_UNAVAILABLE,
        message: 'Network error',
      });
    
    case 'NotFoundError':
      return errorResponse(res, err, {
        statusCode: httpStatus.NOT_FOUND,
        message: err.message || 'Resource not found',
      });
    
    // Default error handler
    default:
      // Determine status code based on error properties
      let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal Server Error';
      
      if (err.statusCode) {
        statusCode = err.statusCode;
      } else if (err.code === 'ENOTFOUND') {
        statusCode = httpStatus.NOT_FOUND;
        message = 'Resource not found';
      } else if (err.code === 'ECONNREFUSED') {
        statusCode = httpStatus.SERVICE_UNAVAILABLE;
        message = 'Service unavailable';
      } else if (err.code === 'ETIMEDOUT') {
        statusCode = httpStatus.REQUEST_TIMEOUT;
        message = 'Request timeout';
      } else if (err.message) {
        message = err.message;
      }
      
      // Final fallback: ensure statusCode is always valid
      if (!err.statusCode || isNaN(parseInt(err.statusCode)) || err.statusCode < 100 || err.statusCode > 599) {
        err.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      }

      return errorResponse(res, err, {
        statusCode,
        message,
        errors: err.errors || {},
      });
  }
};

/**
 * 404 Not Found handler
 * This should be placed before the error handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`);
  error.statusCode = httpStatus.NOT_FOUND;
  error.name = 'NotFoundError';
  next(error);
};

/**
 * Graceful shutdown handler
 * @param {Object} server - Express server instance
 */
const gracefulShutdown = (server) => {
  return (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err) => {
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
