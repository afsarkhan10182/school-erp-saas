const { logger } = require('../utils/logger');
const { safeAsyncHandler, withTimeout } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

/**
 * Robust middleware wrapper that provides:
 * - Error handling
 * - Timeout protection
 * - Graceful degradation
 * - Performance monitoring
 * @param {Function} middleware - The middleware function to wrap
 * @param {Object} options - Configuration options
 * @returns {Function} - Wrapped middleware
 */
const robustMiddleware = (middleware, options = {}) => {
  const {
    timeout = 30000, // 30 seconds default
    fallback = null, // Fallback function if middleware fails
    critical = false, // Whether this middleware is critical
    name = 'Unknown Middleware' // Name for logging
  } = options;

  return async (req, res, next) => {
    const startTime = Date.now();
    
    try {
      // Add timeout protection
      const timeoutMiddleware = withTimeout(middleware, timeout);
      
      await timeoutMiddleware(req, res, next);
      
      // Log performance if middleware takes too long
      const duration = Date.now() - startTime;
      if (duration > 1000) { // Log if takes more than 1 second
        logger.warn(`${name} took ${duration}ms to complete`, {
          url: req.originalUrl,
          method: req.method,
          duration
        });
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`${name} failed after ${duration}ms`, {
        url: req.originalUrl,
        method: req.method,
        error: error.message,
        stack: error.stack,
        duration
      });

      // If middleware is critical, don't continue
      if (critical) {
        if (!res.headersSent) {
          return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Critical middleware failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }
        return;
      }

      // Try fallback if provided
      if (fallback && typeof fallback === 'function') {
        try {
          await fallback(req, res, next);
          return;
        } catch (fallbackError) {
          logger.error(`${name} fallback also failed`, {
            error: fallbackError.message,
            originalError: error.message
          });
        }
      }

      // Continue to next middleware with error
      next(error);
    }
  };
};

/**
 * Safe middleware that never throws
 * Use for non-critical middleware that should not break the request
 * @param {Function} middleware - The middleware function
 * @param {string} name - Middleware name for logging
 * @returns {Function} - Safe middleware
 */
const safeMiddleware = (middleware, name = 'Safe Middleware') => {
  return safeAsyncHandler(async (req, res, next) => {
    try {
      await middleware(req, res, next);
    } catch (error) {
      logger.warn(`${name} failed but continuing`, {
        url: req.originalUrl,
        method: req.method,
        error: error.message
      });
      // Continue without the middleware
      next();
    }
  });
};

/**
 * Conditional middleware that only runs under certain conditions
 * @param {Function} condition - Function that returns true/false
 * @param {Function} middleware - The middleware to run if condition is true
 * @param {Function} fallback - Optional fallback middleware if condition is false
 * @returns {Function} - Conditional middleware
 */
const conditionalMiddleware = (condition, middleware, fallback = null) => {
  return async (req, res, next) => {
    try {
      const shouldRun = await condition(req, res);
      
      if (shouldRun) {
        await middleware(req, res, next);
      } else if (fallback) {
        await fallback(req, res, next);
      } else {
        next();
      }
    } catch (error) {
      logger.error('Conditional middleware error', {
        url: req.originalUrl,
        method: req.method,
        error: error.message
      });
      next(error);
    }
  };
};

/**
 * Retry middleware that retries failed operations
 * @param {Function} middleware - The middleware function
 * @param {Object} options - Retry options
 * @returns {Function} - Retry middleware
 */
const retryMiddleware = (middleware, options = {}) => {
  const {
    maxRetries = 3,
    delay = 1000, // 1 second
    backoff = 2, // Exponential backoff multiplier
    retryCondition = (error) => true // Function to determine if error is retryable
  } = options;

  return async (req, res, next) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await middleware(req, res, next);
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        if (!retryCondition(error)) {
          break;
        }
        
        // If this is the last attempt, don't wait
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retry with exponential backoff
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        logger.warn(`Middleware failed, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})`, {
          url: req.originalUrl,
          method: req.method,
          error: error.message,
          attempt
        });
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // All retries failed
    logger.error(`Middleware failed after ${maxRetries} attempts`, {
      url: req.originalUrl,
      method: req.method,
      error: lastError.message
    });
    
    next(lastError);
  };
};

/**
 * Circuit breaker middleware
 * Prevents cascading failures by temporarily disabling failing middleware
 * @param {Function} middleware - The middleware function
 * @param {Object} options - Circuit breaker options
 * @returns {Function} - Circuit breaker middleware
 */
const circuitBreakerMiddleware = (middleware, options = {}) => {
  const {
    failureThreshold = 5, // Number of failures before opening circuit
    recoveryTimeout = 60000, // Time to wait before trying again (1 minute)
    name = 'Circuit Breaker'
  } = options;

  let failureCount = 0;
  let lastFailureTime = 0;
  let circuitState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

  return async (req, res, next) => {
    const now = Date.now();

    // Check circuit state
    if (circuitState === 'OPEN') {
      if (now - lastFailureTime > recoveryTimeout) {
        circuitState = 'HALF_OPEN';
        logger.info(`${name} circuit breaker transitioning to HALF_OPEN`);
      } else {
        logger.warn(`${name} circuit breaker is OPEN, skipping middleware`);
        return next(new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Service temporarily unavailable'));
      }
    }

    try {
      await middleware(req, res, next);
      
      // Success - reset failure count and close circuit
      if (circuitState === 'HALF_OPEN') {
        circuitState = 'CLOSED';
        logger.info(`${name} circuit breaker transitioning to CLOSED`);
      }
      failureCount = 0;
      
    } catch (error) {
      failureCount++;
      lastFailureTime = now;
      
      logger.error(`${name} middleware failed (${failureCount}/${failureThreshold})`, {
        url: req.originalUrl,
        method: req.method,
        error: error.message
      });

      // Open circuit if threshold reached
      if (failureCount >= failureThreshold) {
        circuitState = 'OPEN';
        logger.error(`${name} circuit breaker OPENED due to ${failureCount} consecutive failures`);
      }

      next(error);
    }
  };
};

/**
 * Performance monitoring middleware
 * @param {Function} middleware - The middleware function
 * @param {string} name - Middleware name
 * @returns {Function} - Monitored middleware
 */
const monitoredMiddleware = (middleware, name = 'Monitored Middleware') => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      await middleware(req, res, next);
      
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();
      const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;
      
      // Log performance metrics
      if (duration > 1000 || memoryDiff > 1024 * 1024) { // 1s or 1MB
        logger.info(`${name} performance metrics`, {
          url: req.originalUrl,
          method: req.method,
          duration: `${duration}ms`,
          memoryUsage: `${Math.round(memoryDiff / 1024)}KB`
        });
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`${name} failed after ${duration}ms`, {
        url: req.originalUrl,
        method: req.method,
        error: error.message,
        duration
      });
      next(error);
    }
  };
};

module.exports = {
  robustMiddleware,
  safeMiddleware,
  conditionalMiddleware,
  retryMiddleware,
  circuitBreakerMiddleware,
  monitoredMiddleware
}; 