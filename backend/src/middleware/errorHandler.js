const { logger } = require('../utils/logger');
const { ValidationError } = require('sequelize');
const { JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken');
const { error: errorResponse } = require('../utils/apiResponse');

/**
 * Global error handler middleware
 * Handles all errors in the application and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  // Log the error with request details
  logger.error({
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: err.stack,
    ...(err.errors && { validationErrors: err.errors }),
  });

  // Handle specific error types
  if (err instanceof ValidationError) {
    const errors = {};
    err.errors.forEach((error) => {
      errors[error.path] = error.message;
    });
    return errorResponse(res, err, {
      statusCode: 400,
      message: 'Validation Error',
      errors,
    });
  }

  // Handle other specific error types
  switch (err.name) {
    case 'SequelizeUniqueConstraintError':
      return errorResponse(res, err, {
        statusCode: 409,
        message: 'Duplicate entry',
        errors: { [err.errors[0].path]: 'This value already exists' },
      });
    
    case 'SequelizeDatabaseError':
      return errorResponse(res, err, {
        statusCode: 400,
        message: 'Database error',
      });
    
    case 'JsonWebTokenError':
      return errorResponse(res, err, {
        statusCode: 401,
        message: 'Invalid token',
      });
    
    case 'TokenExpiredError':
      return errorResponse(res, err, {
        statusCode: 401,
        message: 'Token expired',
      });
    
    case 'UnauthorizedError':
      return errorResponse(res, err, {
        statusCode: 401,
        message: 'Not authorized to access this route',
      });
    
    // Handle custom API errors
    case 'ApiError':
      return errorResponse(res, err, {
        statusCode: err.statusCode,
        message: err.message,
        errors: err.details?.errors || {},
      });
    
    // Default error handler
    default:
      return errorResponse(res, err, {
        statusCode: err.statusCode || 500,
        message: err.message || 'Internal Server Error',
      });
  }
};

module.exports = { errorHandler };
