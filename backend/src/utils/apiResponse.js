const httpStatus = require('http-status');
const ApiError = require('./ApiError');

/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Formatted response
 */
const successResponse = (
  res,
  data = null,
  message = 'Success',
  statusCode = httpStatus.OK,
  metadata = {}
) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(Object.keys(metadata).length > 0 && { metadata }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {Error|ApiError} error - Error object
 * @param {Object} defaultError - Default error details
 * @returns {Object} - Formatted error response
 */
const errorResponse = (res, error, defaultError = {}) => {
  let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';
  let errors = {};
  let stack = undefined;

  // Handle different types of errors
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.details?.errors || {};
  } else if (error.name === 'ValidationError') {
    // Handle Mongoose validation errors
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Validation Error';
    Object.values(error.errors).forEach((err) => {
      errors[err.path] = err.message;
    });
  } else if (error.name === 'MongoError' && error.code === 11000) {
    // Handle MongoDB duplicate key errors
    statusCode = httpStatus.CONFLICT;
    message = 'Duplicate key error';
    const field = Object.keys(error.keyValue)[0];
    errors[field] = `${field} already exists`;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = httpStatus.UNAUTHORIZED;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = httpStatus.UNAUTHORIZED;
    message = 'Token expired';
  } else if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
    // Handle Sequelize validation errors
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Validation Error';
    error.errors.forEach((err) => {
      errors[err.path] = err.message;
    });
  } else if (error.response) {
    // Handle axios errors
    statusCode = error.response.status || httpStatus.INTERNAL_SERVER_ERROR;
    message = error.response.data?.message || error.message;
    errors = error.response.data?.errors || {};
  } else {
    // For all other errors, use default or provided values
    statusCode = defaultError.statusCode || statusCode;
    message = error.message || defaultError.message || message;
    errors = error.errors || defaultError.errors || {};
    
    // In development, include the stack trace
    if (process.env.NODE_ENV === 'development') {
      stack = error.stack;
    }
  }

  // Log the error
  if (statusCode >= 500) {
    console.error(error);
  }

  // Prepare error response
  const response = {
    success: false,
    message,
    ...(Object.keys(errors).length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Async handler to wrap around async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Wrapped route handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    errorResponse(res, err);
  });
};

module.exports = {
  success: successResponse,
  error: errorResponse,
  asyncHandler,
  // Common responses
  created: (res, data, message = 'Resource created successfully') => 
    successResponse(res, data, message, httpStatus.CREATED),
  
  noContent: (res, message = 'No content') => 
    res.status(httpStatus.NO_CONTENT).json({ success: true, message }),
  
  badRequest: (res, message = 'Bad Request', errors = {}) => 
    errorResponse(res, new Error(message), { statusCode: httpStatus.BAD_REQUEST, errors }),
  
  unauthorized: (res, message = 'Unauthorized') => 
    errorResponse(res, new Error(message), { statusCode: httpStatus.UNAUTHORIZED }),
  
  forbidden: (res, message = 'Forbidden') => 
    errorResponse(res, new Error(message), { statusCode: httpStatus.FORBIDDEN }),
  
  notFound: (res, message = 'Resource not found') => 
    errorResponse(res, new Error(message), { statusCode: httpStatus.NOT_FOUND }),
  
  conflict: (res, message = 'Conflict') => 
    errorResponse(res, new Error(message), { statusCode: httpStatus.CONFLICT }),
  
  internal: (res, message = 'Internal Server Error') => 
    errorResponse(res, new Error(message), { statusCode: httpStatus.INTERNAL_SERVER_ERROR }),
  
  validationError: (res, errors = {}, message = 'Validation Error') => 
    errorResponse(res, new Error(message), { 
      statusCode: httpStatus.UNPROCESSABLE_ENTITY, 
      errors 
    }),
};
