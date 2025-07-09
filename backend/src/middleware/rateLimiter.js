const rateLimit = require('express-rate-limit');
const { ApiError } = require('../utils/ApiError');
const httpStatus = require('http-status');
const config = require('../config/config');

/**
 * Rate limiter middleware
 * Limits the number of requests from a single IP address
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.max, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      options.message,
      true,
      { retryAfter: `${options.windowMs / 1000} seconds` }
    );
  },
  skip: (req) => {
    // Skip rate limiting for certain paths (e.g., health checks)
    const skipPaths = ['/health', '/api/health'];
    return skipPaths.some(path => req.path.startsWith(path));
  },
  keyGenerator: (req) => {
    // Use the IP address and user ID (if authenticated) as the key
    return req.user ? `${req.user.id}_${req.ip}` : req.ip;
  },
});

/**
 * Strict rate limiter for sensitive routes (e.g., login, password reset)
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      options.message,
      true,
      { retryAfter: '15 minutes' }
    );
  },
});

module.exports = {
  apiLimiter,
  strictLimiter,
};
