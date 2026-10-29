const ApiError = require('~/utils/shared/ApiError');

const parseMonthlyPeriods = periods => {
  if (!periods) return [];

  let parsedPeriods;
  try {
    parsedPeriods = Array.isArray(periods) ? periods : JSON.parse(periods);
  } catch (error) {
    throw new ApiError(400, 'Periods must be a JSON array of month/year pairs.');
  }

  if (!Array.isArray(parsedPeriods) || parsedPeriods.length === 0) {
    throw new ApiError(400, 'Periods must contain at least one month/year pair.');
  }

  return parsedPeriods.map(period => {
    const month = Number(period?.month);
    const year = Number(period?.year);
    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      throw new ApiError(400, 'Each period must have a valid month and year.');
    }
    return { month, year };
  });
};

module.exports = parseMonthlyPeriods;
