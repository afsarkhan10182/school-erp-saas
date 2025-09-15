const ApiError = require('~/utils/shared/ApiError');
const httpStatus = require('http-status');
const config = require('~/config/config');
const logger = require('~/utils/shared/logger');

/**
 * Middleware that handles 404 Not Found errors.
 * This should be the last middleware in the chain.
 */
const notFound = (req, res, next) => {
  const error = new ApiError(httpStatus.NOT_FOUND, `Not Found - ${req.method} ${req.originalUrl}`);

  // Log the 404 error in development or if debug is enabled
  if (config.env === 'development' || config.logging.level === 'debug') {
    logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  }

  next(error);
};

module.exports = notFound;
