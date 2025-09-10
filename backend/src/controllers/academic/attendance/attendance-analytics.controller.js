const { logger } = require('~/utils/logger');
const ApiError = require('~/utils/ApiError');
const { apiResponse } = require('~/utils/apiResponse');
const AttendanceAnalyticsService = require('~/services/academic/attendance-analytics.service');
const CommonService = require('~/services/shared/common.service');

/**
 * Enhanced Attendance Analytics Controller
 * Provides comprehensive attendance analytics and reporting endpoints
 */
class AttendanceAnalyticsController {
  /**
   * Get comprehensive attendance analytics dashboard
   * @route GET /api/attendance/analytics
   */
  static async getAttendanceAnalytics(req, res, next) {
    try {
      const filters = req.query;
      const analytics = await AttendanceAnalyticsService.getAttendanceAnalytics(filters, req.user);

      return res
        .status(200)
        .json(
          CommonService.formatSuccessResponse(
            'Attendance analytics retrieved successfully',
            analytics
          )
        );
    } catch (error) {
      logger.error('Error in getAttendanceAnalytics:', error);
      return next(error);
    }
  }

  /**
   * Get detailed attendance report
   * @route GET /api/attendance/reports/detailed
   */
  static async getDetailedReport(req, res, next) {
    try {
      const filters = req.query;
      const report = await AttendanceAnalyticsService.getDetailedAttendanceReport(
        filters,
        req.user
      );

      return res
        .status(200)
        .json(
          CommonService.formatSuccessResponse(
            'Detailed attendance report retrieved successfully',
            report
          )
        );
    } catch (error) {
      logger.error('Error in getDetailedReport:', error);
      return next(error);
    }
  }

  /**
   * Get attendance trends over time
   * @route GET /api/attendance/trends
   */
  static async getAttendanceTrends(req, res, next) {
    try {
      const filters = req.query;
      const trends = await AttendanceAnalyticsService.getAttendanceTrends(filters, req.user);

      return res
        .status(200)
        .json(
          CommonService.formatSuccessResponse('Attendance trends retrieved successfully', trends)
        );
    } catch (error) {
      logger.error('Error in getAttendanceTrends:', error);
      return next(error);
    }
  }

  /**
   * Get student attendance history
   * @route GET /api/attendance/student/:studentId/history
   */
  static async getStudentAttendanceHistory(req, res, next) {
    try {
      const { studentId } = req.params;
      const filters = req.query;

      const history = await AttendanceAnalyticsService.getStudentAttendanceHistory(
        studentId,
        filters,
        req.user
      );

      return res
        .status(200)
        .json(
          CommonService.formatSuccessResponse(
            'Student attendance history retrieved successfully',
            history
          )
        );
    } catch (error) {
      logger.error('Error in getStudentAttendanceHistory:', error);
      return next(error);
    }
  }

  /**
   * Get attendance summary for dashboard widgets
   * @route GET /api/attendance/summary
   */
  static async getAttendanceSummary(req, res, next) {
    try {
      const { period = 'this_month', class_id, section_id, academic_year } = req.query;

      const filters = {
        period,
        class_id,
        section_id,
        academic_year
      };

      const analytics = await AttendanceAnalyticsService.getAttendanceAnalytics(filters, req.user);

      // Extract summary data for dashboard widgets
      const summary = {
        overview: analytics.overview,
        alerts: analytics.alerts,
        topClasses: analytics.classPerformance.slice(0, 5),
        recentTrends: analytics.trends
      };

      return res
        .status(200)
        .json(
          CommonService.formatSuccessResponse('Attendance summary retrieved successfully', summary)
        );
    } catch (error) {
      logger.error('Error in getAttendanceSummary:', error);
      return next(error);
    }
  }

  /**
   * Get attendance performance by class
   * @route GET /api/attendance/performance/classes
   */
  static async getClassPerformance(req, res, next) {
    try {
      const { period = 'this_month', academic_year } = req.query;

      const filters = {
        period,
        academic_year
      };

      const analytics = await AttendanceAnalyticsService.getAttendanceAnalytics(filters, req.user);

      return res.status(200).json(
        CommonService.formatSuccessResponse('Class performance retrieved successfully', {
          classes: analytics.classPerformance
        })
      );
    } catch (error) {
      logger.error('Error in getClassPerformance:', error);
      return next(error);
    }
  }

  /**
   * Get attendance performance by student
   * @route GET /api/attendance/performance/students
   */
  static async getStudentPerformance(req, res, next) {
    try {
      const { period = 'this_month', class_id, section_id, academic_year } = req.query;

      const filters = {
        period,
        class_id,
        section_id,
        academic_year
      };

      const analytics = await AttendanceAnalyticsService.getAttendanceAnalytics(filters, req.user);

      return res.status(200).json(
        CommonService.formatSuccessResponse('Student performance retrieved successfully', {
          students: analytics.studentPerformance
        })
      );
    } catch (error) {
      logger.error('Error in getStudentPerformance:', error);
      return next(error);
    }
  }

  /**
   * Export attendance analytics data
   * @route GET /api/attendance/analytics/export
   */
  static async exportAttendanceAnalytics(req, res, next) {
    try {
      const { format = 'xlsx', ...filters } = req.query;

      // Get analytics data
      const analytics = await AttendanceAnalyticsService.getAttendanceAnalytics(filters, req.user);

      // Get detailed report data
      const report = await AttendanceAnalyticsService.getDetailedAttendanceReport(
        filters,
        req.user
      );

      // Prepare export data
      const exportData = {
        analytics: {
          overview: analytics.overview,
          trends: analytics.trends,
          classPerformance: analytics.classPerformance,
          studentPerformance: analytics.studentPerformance
        },
        detailedReport: {
          records: report.records,
          summary: report.summary
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          filters,
          generatedBy: req.user.id
        }
      };

      // Set response headers based on format
      const filename = `attendance-analytics-${new Date().toISOString().split('T')[0]}`;

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        return res.status(200).json(exportData);
      } else if (format === 'csv') {
        // Convert to CSV format
        const csvData = this.convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.status(200).send(csvData);
      } else {
        // Default to JSON for other formats
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        return res.status(200).json(exportData);
      }
    } catch (error) {
      logger.error('Error in exportAttendanceAnalytics:', error);
      return next(error);
    }
  }

  /**
   * Get attendance alerts and notifications
   * @route GET /api/attendance/alerts
   */
  static async getAttendanceAlerts(req, res, next) {
    try {
      const { period = 'this_month', class_id, section_id, academic_year } = req.query;

      const filters = {
        period,
        class_id,
        section_id,
        academic_year
      };

      const analytics = await AttendanceAnalyticsService.getAttendanceAnalytics(filters, req.user);

      return res.status(200).json(
        CommonService.formatSuccessResponse('Attendance alerts retrieved successfully', {
          alerts: analytics.alerts,
          summary: analytics.summary
        })
      );
    } catch (error) {
      logger.error('Error in getAttendanceAlerts:', error);
      return next(error);
    }
  }

  /**
   * Convert analytics data to CSV format
   */
  static convertToCSV(data) {
    const csvRows = [];

    // Add overview data
    csvRows.push('Overview');
    csvRows.push('Metric,Current,Previous,Change,Change Percentage');

    const overview = data.analytics.overview;
    Object.entries(overview.comparison).forEach(([metric, values]) => {
      csvRows.push(
        `${metric},${values.current},${values.previous},${values.change},${values.changePercentage}%`
      );
    });

    csvRows.push(''); // Empty row

    // Add class performance data
    csvRows.push('Class Performance');
    csvRows.push('Class,Total,Present,Absent,Late,Excused,Attendance Rate');

    data.analytics.classPerformance.forEach(classData => {
      csvRows.push(
        `${classData.class.name},${classData.total},${classData.present},${classData.absent},${classData.late},${classData.excused},${classData.attendanceRate}%`
      );
    });

    csvRows.push(''); // Empty row

    // Add detailed records
    csvRows.push('Detailed Records');
    csvRows.push('Date,Student,Admission Number,Class,Section,Status,Remarks');

    data.detailedReport.records.forEach(record => {
      csvRows.push(
        `${record.session.date},${record.student.first_name} ${record.student.last_name},${record.student.admission_number},${record.student.class?.name || 'N/A'},${record.student.sectionInfo?.name || 'N/A'},${record.status},${record.remarks || ''}`
      );
    });

    return csvRows.join('\n');
  }
}

module.exports = AttendanceAnalyticsController;
