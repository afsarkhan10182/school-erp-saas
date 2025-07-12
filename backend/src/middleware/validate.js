const { validationResult } = require('express-validator');
const apiResponse = require('../utils/apiResponse');
const { safeMiddleware } = require('./robust');
const { logger } = require('../utils/logger');

// Test if validationError is available
if (!apiResponse.validationError) {
  throw new Error('validationError is not exported from apiResponse');
}

const { validationError } = apiResponse;

/**
 * Middleware to validate request data using express-validator
 * @param {Array} validations - Array of validation chains
 * @returns {Function} - Express middleware function
 */
const validate = (validations) => {
  const validationLogic = async (req, res, next) => {
    try {
      // Log the request body for debugging
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Validation middleware - Request body:', req.body);
        logger.debug('Validation middleware - Request files:', req.files);
      }

      // Run all validations
      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      // Format validation errors
      const formattedErrors = {};
      errors.array().forEach(error => {
        if (!formattedErrors[error.param]) {
          formattedErrors[error.param] = error.msg;
        }
      });

      // Log validation errors for debugging
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Validation errors:', formattedErrors);
      }

      // Send validation error response
      return validationError(res, formattedErrors);
    } catch (error) {
      logger.error('Validation middleware error:', error);
      return validationError(res, { 
        validation: 'Validation process failed' 
      });
    }
  };

  return safeMiddleware(validationLogic, 'Request Validation');
};

/**
 * Middleware to validate request query parameters
 * @param {Array} validations - Array of validation chains for query params
 * @returns {Function} - Express middleware function
 */
const validateQuery = (validations) => {
  const queryValidationLogic = async (req, res, next) => {
    try {
      req.query = Object.fromEntries(
        Object.entries(req.query).map(([key, value]) => [key, value])
      );
      
      await Promise.all(validations.map(validation => validation.run({ ...req, body: req.query })));

      const errors = validationResult({ ...req, body: req.query });
      if (errors.isEmpty()) {
        return next();
      }

      // Format validation errors
      const formattedErrors = {};
      errors.array().forEach(error => {
        if (!formattedErrors[error.param]) {
          formattedErrors[error.param] = error.msg;
        }
      });

      // Send validation error response
      return validationError(res, formattedErrors);
    } catch (error) {
      logger.error('Query validation middleware error:', error);
      return validationError(res, { 
        query: 'Query validation process failed' 
      });
    }
  };

  return safeMiddleware(queryValidationLogic, 'Query Validation');
};

/**
 * Middleware to validate request parameters
 * @param {Array} validations - Array of validation chains for route params
 * @returns {Function} - Express middleware function
 */
const validateParams = (validations) => {
  const paramsValidationLogic = async (req, res, next) => {
    try {
      await Promise.all(validations.map(validation => validation.run({ ...req, body: req.params })));

      const errors = validationResult({ ...req, body: req.params });
      if (errors.isEmpty()) {
        return next();
      }

      // Format validation errors
      const formattedErrors = {};
      errors.array().forEach(error => {
        if (!formattedErrors[error.param]) {
          formattedErrors[error.param] = error.msg;
        }
      });

      // Send validation error response
      return validationError(res, formattedErrors);
    } catch (error) {
      logger.error('Params validation middleware error:', error);
      return validationError(res, { 
        params: 'Parameters validation process failed' 
      });
    }
  };

  return safeMiddleware(paramsValidationLogic, 'Parameters Validation');
};

/**
 * Sanitize request data to prevent injection attacks
 * @param {Object} sanitizers - Object with sanitization rules
 * @returns {Function} - Express middleware function
 */
const sanitize = (sanitizers) => {
  const sanitizeLogic = async (req, res, next) => {
    try {
      // Sanitize body
      if (req.body && sanitizers.body) {
        Object.keys(sanitizers.body).forEach(field => {
          if (req.body[field]) {
            const sanitizer = sanitizers.body[field];
            if (typeof sanitizer === 'function') {
              req.body[field] = sanitizer(req.body[field]);
            } else if (typeof sanitizer === 'string') {
              // Apply common sanitization
              switch (sanitizer) {
                case 'trim':
                  req.body[field] = String(req.body[field]).trim();
                  break;
                case 'lowercase':
                  req.body[field] = String(req.body[field]).toLowerCase();
                  break;
                case 'uppercase':
                  req.body[field] = String(req.body[field]).toUpperCase();
                  break;
                case 'escape':
                  req.body[field] = String(req.body[field])
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;');
                  break;
              }
            }
          }
        });
      }

      // Sanitize query
      if (req.query && sanitizers.query) {
        Object.keys(sanitizers.query).forEach(field => {
          if (req.query[field]) {
            const sanitizer = sanitizers.query[field];
            if (typeof sanitizer === 'function') {
              req.query[field] = sanitizer(req.query[field]);
            }
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Sanitization middleware error:', error);
      next();
    }
  };

  return safeMiddleware(sanitizeLogic, 'Data Sanitization');
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  sanitize,
};
