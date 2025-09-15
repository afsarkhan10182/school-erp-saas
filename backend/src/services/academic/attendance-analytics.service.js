const { Op } = require('sequelize');
const {
  AttendanceRecord,
  AttendanceSession,
  Student,
  Class,
  Section,
  School,
  Branch
} = require('~/models');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const AnalyticsService = require('~/services/shared/analytics.service');

/**
 * Enhanced Attendance Analytics Service
 * Provides comprehensive attendance analytics and reporting
 */
class AttendanceAnalyticsService {
  /**
   * Get comprehensive attendance analytics dashboard data
   */
  static async getAttendanceAnalytics(filters, user) {
    try {
      const {
        period = 'this_month',
        custom_start_date,
        custom_end_date,
        class_id,
        section_id,
        academic_year
      } = filters;

      // Generate date range
      const { startDate, endDate } = AnalyticsService.generateDateRange(
        period,
        custom_start_date,
        custom_end_date
      );

      // Build base where clause
      const baseWhere = this.buildBaseWhereClause(user, {
        class_id,
        section_id,
        academic_year,
        startDate,
        endDate
      });

      // Get current period data
      const currentData = await this.getAttendanceData(
        baseWhere,
        startDate,
        endDate,
        academic_year
      );

      // Get previous period data for comparison
      const previousPeriod = this.getPreviousPeriod(period, startDate, endDate);
      const previousData = await this.getAttendanceData(
        baseWhere,
        previousPeriod.startDate,
        previousPeriod.endDate,
        academic_year
      );

      // Generate analytics
      const analytics = {
        overview: this.generateOverviewAnalytics(currentData, previousData),
        trends: this.generateTrendAnalytics(currentData, previousData),
        classPerformance: await this.generateClassPerformanceAnalytics(
          baseWhere,
          startDate,
          endDate
        ),
        studentPerformance: await this.generateStudentPerformanceAnalytics(
          baseWhere,
          startDate,
          endDate
        ),
        timeSeries: this.generateTimeSeriesAnalytics(currentData),
        alerts: this.generateAttendanceAlerts(currentData),
        summary: this.generateAttendanceSummary(currentData)
      };

      return analytics;
    } catch (error) {
      logger.error('Error in getAttendanceAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get detailed attendance report with filters
   */
  static async getDetailedAttendanceReport(filters, user) {
    try {
      const {
        report_type = 'daily',
        date_from,
        date_to,
        class_id,
        section_id,
        student_id,
        academic_year,
        status,
        page = 1,
        limit = 50
      } = filters;

      // Build where clause
      const whereClause = this.buildBaseWhereClause(user, {
        class_id,
        section_id,
        academic_year,
        date_from,
        date_to
      });

      if (student_id) {
        whereClause.student_id = student_id;
      }

      if (status) {
        whereClause.status = status;
      }

      // Get attendance records with pagination
      const { count, rows } = await AttendanceRecord.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['id', 'first_name', 'last_name', 'admission_number', 'roll_number'],
            include: [
              {
                model: Class,
                as: 'class',
                attributes: ['id', 'name', 'code']
              },
              {
                model: Section,
                as: 'sectionInfo',
                attributes: ['id', 'name']
              }
            ]
          },
          {
            model: AttendanceSession,
            as: 'session',
            attributes: ['id', 'date', 'attendance_type', 'academic_year']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      // Generate summary
      const summary = this.generateReportSummary(rows);

      return {
        records: rows,
        summary,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      };
    } catch (error) {
      logger.error('Error in getDetailedAttendanceReport:', error);
      throw error;
    }
  }

  /**
   * Get attendance trends over time
   */
  static async getAttendanceTrends(filters, user) {
    try {
      const {
        period = 'this_year',
        custom_start_date,
        custom_end_date,
        class_id,
        section_id,
        academic_year,
        group_by = 'month'
      } = filters;

      const { startDate, endDate } = AnalyticsService.generateDateRange(
        period,
        custom_start_date,
        custom_end_date
      );

      const baseWhere = this.buildBaseWhereClause(user, {
        class_id,
        section_id,
        academic_year,
        startDate,
        endDate
      });

      // Get attendance data grouped by time period
      const records = await AttendanceRecord.findAll({
        where: baseWhere,
        include: [
          {
            model: AttendanceSession,
            as: 'session',
            attributes: ['date'],
            where: {
              date: {
                [Op.between]: [startDate, endDate]
              }
            }
          }
        ],
        order: [['session', 'date', 'ASC']]
      });

      // Generate time series data
      const timeSeries = AnalyticsService.generateTimeSeriesData(
        records,
        'session.date',
        'status',
        group_by
      );

      // Calculate trends for each status
      const trends = {
        present: this.calculateStatusTrend(records, 'present', group_by),
        absent: this.calculateStatusTrend(records, 'absent', group_by),
        late: this.calculateStatusTrend(records, 'late', group_by),
        excused: this.calculateStatusTrend(records, 'excused', group_by)
      };

      return {
        timeSeries,
        trends,
        period: { startDate, endDate },
        groupBy: group_by
      };
    } catch (error) {
      logger.error('Error in getAttendanceTrends:', error);
      throw error;
    }
  }

  /**
   * Get student attendance history
   */
  static async getStudentAttendanceHistory(studentId, filters, user) {
    try {
      const { period = 'this_year', custom_start_date, custom_end_date, academic_year } = filters;

      const { startDate, endDate } = AnalyticsService.generateDateRange(
        period,
        custom_start_date,
        custom_end_date
      );

      const whereClause = {
        student_id: studentId,
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      // Build session where condition
      const sessionWhere = {
        date: {
          [Op.between]: [startDate, endDate]
        }
      };

      if (academic_year) {
        sessionWhere.academic_year = academic_year;
      }

      // Get student attendance records
      const records = await AttendanceRecord.findAll({
        where: whereClause,
        include: [
          {
            model: AttendanceSession,
            as: 'session',
            attributes: ['date', 'attendance_type', 'academic_year'],
            where: sessionWhere,
            required: true
          }
        ],
        order: [['session', 'date', 'DESC']]
      });

      // Calculate student statistics
      const stats = this.calculateStudentAttendanceStats(records);

      // Generate monthly breakdown
      const monthlyBreakdown = this.generateMonthlyBreakdown(records);

      return {
        student: await Student.findByPk(studentId, {
          attributes: ['id', 'first_name', 'last_name', 'admission_number'],
          include: [
            {
              model: Class,
              as: 'class',
              attributes: ['name']
            },
            {
              model: Section,
              as: 'sectionInfo',
              attributes: ['name']
            }
          ]
        }),
        records,
        stats,
        monthlyBreakdown,
        period: { startDate, endDate }
      };
    } catch (error) {
      logger.error('Error in getStudentAttendanceHistory:', error);
      throw error;
    }
  }

  /**
   * Build base where clause for attendance queries
   */
  static buildBaseWhereClause(user, filters) {
    const whereClause = {
      school_id: user.school_id
    };

    if (user.role === 'branch_admin') {
      whereClause.branch_id = user.branch_id;
    }

    if (filters.class_id) {
      whereClause.class_id = filters.class_id;
    }

    if (filters.section_id) {
      whereClause.section_id = filters.section_id;
    }

    // Note: academic_year filtering will be handled through include conditions
    // since AttendanceRecord doesn't have academic_year column directly

    if (filters.date_from && filters.date_to) {
      whereClause.date = {
        [Op.between]: [filters.date_from, filters.date_to]
      };
    } else if (filters.startDate && filters.endDate) {
      whereClause.date = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    }

    return whereClause;
  }

  /**
   * Get attendance data for analytics
   */
  static async getAttendanceData(baseWhere, startDate, endDate, academicYear = null) {
    const whereClause = {
      ...baseWhere,
      date: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Build include conditions
    const includeConditions = [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'class_id', 'section_id']
      },
      {
        model: AttendanceSession,
        as: 'session',
        attributes: ['date', 'academic_year'],
        where: academicYear ? { academic_year: academicYear } : undefined,
        required: true
      }
    ];

    return await AttendanceRecord.findAll({
      where: whereClause,
      include: includeConditions
    });
  }

  /**
   * Generate overview analytics
   */
  static generateOverviewAnalytics(currentData, previousData) {
    const currentStats = this.calculateAttendanceStats(currentData);
    const previousStats = this.calculateAttendanceStats(previousData);

    return {
      current: currentStats,
      previous: previousStats,
      comparison: AnalyticsService.generateComparativeAnalysis(currentStats, previousStats, [
        'total',
        'present',
        'absent',
        'late',
        'excused',
        'attendanceRate'
      ])
    };
  }

  /**
   * Calculate attendance statistics
   */
  static calculateAttendanceStats(records) {
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;
    const attendanceRate = AnalyticsService.calculatePercentage(present + late, total);

    return {
      total,
      present,
      absent,
      late,
      excused,
      attendanceRate
    };
  }

  /**
   * Generate trend analytics
   */
  static generateTrendAnalytics(currentData, previousData) {
    const currentStats = this.calculateAttendanceStats(currentData);
    const previousStats = this.calculateAttendanceStats(previousData);

    return {
      attendanceRate: {
        current: currentStats.attendanceRate,
        previous: previousStats.attendanceRate,
        trend: AnalyticsService.calculateTrend(
          currentStats.attendanceRate,
          previousStats.attendanceRate
        ),
        changePercentage: AnalyticsService.calculateTrendPercentage(
          currentStats.attendanceRate,
          previousStats.attendanceRate
        )
      },
      totalStudents: {
        current: currentStats.total,
        previous: previousStats.total,
        trend: AnalyticsService.calculateTrend(currentStats.total, previousStats.total),
        changePercentage: AnalyticsService.calculateTrendPercentage(
          currentStats.total,
          previousStats.total
        )
      }
    };
  }

  /**
   * Generate class performance analytics
   */
  static async generateClassPerformanceAnalytics(baseWhere, startDate, endDate) {
    const records = await AttendanceRecord.findAll({
      where: {
        ...baseWhere,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['class_id'],
          include: [
            {
              model: Class,
              as: 'class',
              attributes: ['id', 'name', 'code']
            }
          ]
        }
      ]
    });

    // Group by class
    const classStats = {};
    records.forEach(record => {
      const classId = record.student.class_id;
      if (!classStats[classId]) {
        classStats[classId] = {
          class: record.student.class,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        };
      }

      classStats[classId].total++;
      classStats[classId][record.status]++;
    });

    // Calculate percentages and sort by attendance rate
    return Object.values(classStats)
      .map(stats => ({
        ...stats,
        attendanceRate: AnalyticsService.calculatePercentage(
          stats.present + stats.late,
          stats.total
        )
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate);
  }

  /**
   * Generate student performance analytics
   */
  static async generateStudentPerformanceAnalytics(baseWhere, startDate, endDate) {
    const records = await AttendanceRecord.findAll({
      where: {
        ...baseWhere,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number', 'class_id'],
          include: [
            {
              model: Class,
              as: 'class',
              attributes: ['name']
            }
          ]
        }
      ]
    });

    // Group by student
    const studentStats = {};
    records.forEach(record => {
      const studentId = record.student_id;
      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          student: record.student,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        };
      }

      studentStats[studentId].total++;
      studentStats[studentId][record.status]++;
    });

    // Calculate percentages and get top/bottom performers
    const studentsWithStats = Object.values(studentStats).map(stats => ({
      ...stats,
      attendanceRate: AnalyticsService.calculatePercentage(stats.present + stats.late, stats.total)
    }));

    return {
      topPerformers: AnalyticsService.generateTopPerformers(
        studentsWithStats,
        'attendanceRate',
        10,
        'desc'
      ),
      bottomPerformers: AnalyticsService.generateTopPerformers(
        studentsWithStats,
        'attendanceRate',
        10,
        'asc'
      ),
      averageAttendanceRate: AnalyticsService.generateSummaryStats(
        studentsWithStats,
        'attendanceRate'
      ).average
    };
  }

  /**
   * Generate time series analytics
   */
  static generateTimeSeriesAnalytics(records) {
    return AnalyticsService.generateTimeSeriesData(records, 'date', 'status', 'day');
  }

  /**
   * Generate attendance alerts
   */
  static generateAttendanceAlerts(data) {
    const stats = this.calculateAttendanceStats(data);

    const thresholds = {
      attendanceRate: { min: 80 }, // Alert if attendance rate below 80%
      absentCount: { max: 50 } // Alert if more than 50 absent students
    };

    return AnalyticsService.generateAlerts(stats, thresholds);
  }

  /**
   * Generate attendance summary
   */
  static generateAttendanceSummary(data) {
    const stats = this.calculateAttendanceStats(data);

    return {
      ...stats,
      distribution: AnalyticsService.generateDistribution(
        data.map(r => r.status),
        ['present', 'absent', 'late', 'excused']
      )
    };
  }

  /**
   * Get previous period for comparison
   */
  static getPreviousPeriod(period, startDate, endDate) {
    const duration = endDate - startDate;
    const previousEndDate = new Date(startDate);
    const previousStartDate = new Date(previousEndDate - duration);

    return { startDate: previousStartDate, endDate: previousEndDate };
  }

  /**
   * Calculate status trend
   */
  static calculateStatusTrend(records, status, groupBy) {
    const statusRecords = records.filter(r => r.status === status);
    return AnalyticsService.generateTimeSeriesData(
      statusRecords,
      'session.date',
      'status',
      groupBy
    );
  }

  /**
   * Generate report summary
   */
  static generateReportSummary(records) {
    return this.calculateAttendanceStats(records);
  }

  /**
   * Calculate student attendance statistics
   */
  static calculateStudentAttendanceStats(records) {
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;

    return {
      total,
      present,
      absent,
      late,
      excused,
      attendanceRate: AnalyticsService.calculatePercentage(present + late, total),
      presentRate: AnalyticsService.calculatePercentage(present, total),
      absentRate: AnalyticsService.calculatePercentage(absent, total),
      lateRate: AnalyticsService.calculatePercentage(late, total),
      excusedRate: AnalyticsService.calculatePercentage(excused, total)
    };
  }

  /**
   * Generate monthly breakdown
   */
  static generateMonthlyBreakdown(records) {
    const monthlyData = {};

    records.forEach(record => {
      const date = new Date(record.session.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        };
      }

      monthlyData[monthKey].total++;
      monthlyData[monthKey][record.status]++;
    });

    // Calculate percentages
    return Object.values(monthlyData)
      .map(data => ({
        ...data,
        attendanceRate: AnalyticsService.calculatePercentage(data.present + data.late, data.total)
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}

module.exports = AttendanceAnalyticsService;
