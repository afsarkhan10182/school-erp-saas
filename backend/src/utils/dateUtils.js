/**
 * Date utility functions for consistent date handling across the application
 */

/**
 * Creates a date range that covers the entire day from start to end
 * @param {string} fromDate - Start date in YYYY-MM-DD format
 * @param {string} toDate - End date in YYYY-MM-DD format
 * @returns {Object} Object with fromDateTime and toDateTime
 */
const createDateRange = (fromDate, toDate) => {
  const fromDateTime = new Date(fromDate);
  const toDateTime = new Date(toDate);
  toDateTime.setHours(23, 59, 59, 999); // Set to end of day
  
  return {
    fromDateTime,
    toDateTime
  };
};

/**
 * Creates a Sequelize Op.between condition for date ranges
 * @param {string} fromDate - Start date in YYYY-MM-DD format
 * @param {string} toDate - End date in YYYY-MM-DD format
 * @returns {Object} Sequelize Op.between condition
 */
const createDateBetweenCondition = (fromDate, toDate) => {
  const { fromDateTime, toDateTime } = createDateRange(fromDate, toDate);
  return {
    [require('sequelize').Op.between]: [fromDateTime, toDateTime]
  };
};

module.exports = {
  createDateRange,
  createDateBetweenCondition
};
