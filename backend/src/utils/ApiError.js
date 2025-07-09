const httpStatus = require('http-status');

/**
 * Custom API error class that extends the built-in Error class.
 * Includes status code and isOperational flag.
 */
class ApiError extends Error {
  /**
   * Create a new API error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {boolean} isOperational - Whether the error is operational (expected) or not
   * @param {Object} details - Additional error details
   */
  constructor(
    statusCode = httpStatus.INTERNAL_SERVER_ERROR,
    message = 'Something went wrong',
    isOperational = true,
    details = {}
  ) {
    super(message);
    
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    
    // Set the prototype explicitly (only needed for V8)
    Object.setPrototypeOf(this, new.target.prototype);
    
    // Custom properties
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace, excluding constructor call from it
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Create a bad request error (400)
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static badRequest(message = 'Bad Request', details = {}) {
    return new ApiError(httpStatus.BAD_REQUEST, message, true, details);
  }
  
  /**
   * Create an unauthorized error (401)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(httpStatus.UNAUTHORIZED, message);
  }
  
  /**
   * Create a forbidden error (403)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static forbidden(message = 'Forbidden') {
    return new ApiError(httpStatus.FORBIDDEN, message);
  }
  
  /**
   * Create a not found error (404)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static notFound(message = 'Resource not found') {
    return new ApiError(httpStatus.NOT_FOUND, message);
  }
  
  /**
   * Create a conflict error (409)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static conflict(message = 'Conflict') {
    return new ApiError(httpStatus.CONFLICT, message);
  }
  
  /**
   * Create an internal server error (500)
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static internal(message = 'Internal Server Error', details = {}) {
    return new ApiError(httpStatus.INTERNAL_SERVER_ERROR, message, false, details);
  }
  
  /**
   * Create a validation error (422)
   * @param {string} message - Error message
   * @param {Object} errors - Validation errors
   * @returns {ApiError}
   */
  static validationError(message = 'Validation Error', errors = {}) {
    return new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      message,
      true,
      { errors }
    );
  }
  
  /**
   * Convert error to JSON for API responses
   * @returns {Object} - Error object for API response
   */
  toJSON() {
    return {
      status: this.status,
      statusCode: this.statusCode,
      message: this.message,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
      ...(Object.keys(this.details).length > 0 && { details: this.details }),
      timestamp: this.timestamp,
    };
  }
}

module.exports = ApiError;
