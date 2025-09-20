const { Op } = require('sequelize');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');

/**
 * Reusable Analytics Service
 * Provides common analytics functions that can be used across different modules
 */
class AnalyticsService {
  /**
   * Calculate percentage with safe division
   */
  static calculatePercentage(numerator, denominator, decimalPlaces = 2) {
    if (!denominator || denominator === 0) return 0;
    return parseFloat(((numerator / denominator) * 100).toFixed(decimalPlaces));
  }

  /**
   * Generate date range for analytics
   */
  static generateDateRange(period, customStart = null, customEnd = null) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        endDate = new Date(
          yesterday.getFullYear(),
          yesterday.getMonth(),
          yesterday.getDate(),
          23,
          59,
          59
        );
        break;
      case 'this_week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = new Date(
          startOfWeek.getFullYear(),
          startOfWeek.getMonth(),
          startOfWeek.getDate()
        );
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'last_week':
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
        const lastWeekEnd = new Date(now);
        lastWeekEnd.setDate(now.getDate() - now.getDay() - 1);
        startDate = new Date(
          lastWeekStart.getFullYear(),
          lastWeekStart.getMonth(),
          lastWeekStart.getDate()
        );
        endDate = new Date(
          lastWeekEnd.getFullYear(),
          lastWeekEnd.getMonth(),
          lastWeekEnd.getDate(),
          23,
          59,
          59
        );
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate());
        endDate = new Date(
          lastMonthEnd.getFullYear(),
          lastMonthEnd.getMonth(),
          lastMonthEnd.getDate()
        );
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;
      case 'custom':
        if (!customStart || !customEnd) {
          throw new ApiError(400, 'Custom start and end dates are required for custom period');
        }
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        break;
      default:
        throw new ApiError(400, `Invalid period: ${period}`);
    }

    return { startDate, endDate };
  }

  /**
   * Generate trend analysis
   */
  static calculateTrend(current, previous) {
    if (!previous || previous === 0) {
      return current > 0 ? 'up' : 'neutral';
    }

    const change = ((current - previous) / previous) * 100;

    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'neutral';
  }

  /**
   * Generate trend percentage
   */
  static calculateTrendPercentage(current, previous) {
    if (!previous || previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return parseFloat(((current - previous) / previous) * 100).toFixed(2);
  }

  /**
   * Generate distribution analysis
   */
  static generateDistribution(data, categories) {
    const distribution = {};
    const total = data.length;

    categories.forEach(category => {
      const count = data.filter(item => item === category).length;
      distribution[category] = {
        count,
        percentage: this.calculatePercentage(count, total)
      };
    });

    return distribution;
  }

  /**
   * Generate time series data for charts
   */
  static generateTimeSeriesData(records, dateField, valueField, groupBy = 'day') {
    const timeSeries = {};

    records.forEach(record => {
      const date = new Date(record[dateField]);
      let key;

      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + 1) / 7)).padStart(2, '0')}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = `${date.getFullYear()}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!timeSeries[key]) {
        timeSeries[key] = { date: key, value: 0, count: 0 };
      }

      timeSeries[key].value += record[valueField] || 0;
      timeSeries[key].count += 1;
    });

    return Object.values(timeSeries).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Generate comparative analysis
   */
  static generateComparativeAnalysis(currentData, previousData, metrics) {
    const comparison = {};

    metrics.forEach(metric => {
      const current = currentData[metric] || 0;
      const previous = previousData[metric] || 0;

      comparison[metric] = {
        current,
        previous,
        change: current - previous,
        changePercentage: this.calculateTrendPercentage(current, previous),
        trend: this.calculateTrend(current, previous)
      };
    });

    return comparison;
  }

  /**
   * Generate summary statistics
   */
  static generateSummaryStats(data, valueField) {
    if (!data || data.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        median: 0
      };
    }

    const values = data.map(item => item[valueField] || 0).sort((a, b) => a - b);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const min = values[0];
    const max = values[values.length - 1];
    const median =
      values.length % 2 === 0
        ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
        : values[Math.floor(values.length / 2)];

    return {
      total: parseFloat(total.toFixed(2)),
      average: parseFloat(average.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      median: parseFloat(median.toFixed(2))
    };
  }

  /**
   * Generate top performers analysis
   */
  static generateTopPerformers(data, valueField, limit = 10, order = 'desc') {
    if (!data || data.length === 0) return [];

    return data
      .sort((a, b) => {
        const aVal = a[valueField] || 0;
        const bVal = b[valueField] || 0;
        return order === 'desc' ? bVal - aVal : aVal - bVal;
      })
      .slice(0, limit)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
  }

  /**
   * Generate alert conditions
   */
  static generateAlerts(data, thresholds) {
    const alerts = [];

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const value = data[metric];

      if (value !== undefined && value !== null) {
        if (threshold.min !== undefined && value < threshold.min) {
          alerts.push({
            type: 'warning',
            metric,
            message: `${metric} is below minimum threshold (${value} < ${threshold.min})`,
            value,
            threshold: threshold.min
          });
        }

        if (threshold.max !== undefined && value > threshold.max) {
          alerts.push({
            type: 'error',
            metric,
            message: `${metric} exceeds maximum threshold (${value} > ${threshold.max})`,
            value,
            threshold: threshold.max
          });
        }
      }
    });

    return alerts;
  }
}

module.exports = AnalyticsService;
