const { validationResult } = require('express-validator');
const { validationError } = require('../utils/apiResponse');

/**
 * Middleware to validate request data using express-validator
 * @param {Array} validations - Array of validation chains
 * @returns {Function} - Express middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
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

    // Send validation error response
    return validationError(res, formattedErrors);
  };
};

/**
 * Middleware to validate request query parameters
 * @param {Array} validations - Array of validation chains for query params
 * @returns {Function} - Express middleware function
 */
const validateQuery = (validations) => {
  return async (req, res, next) => {
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
  };
};

/**
 * Middleware to validate request parameters
 * @param {Array} validations - Array of validation chains for route params
 * @returns {Function} - Express middleware function
 */
const validateParams = (validations) => {
  return async (req, res, next) => {
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
  };
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
};
