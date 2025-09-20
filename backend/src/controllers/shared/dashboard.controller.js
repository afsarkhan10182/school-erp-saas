const { User, School, Branch, FeeInvoice, Student } = require('~/models');
const { Sequelize, sequelize } = require('~/config/database');
const SchoolService = require('~/services/administration/schools/school.service');
const BranchService = require('~/services/administration/schools/branch.service');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const { Op } = require('sequelize');

class DashboardController {
  static async getStats(req, res, next) {
    try {
      const user = req.user;
      const { branch_id, new_students_days = 30 } = req.query;
      console.log(
        '🔍 Dashboard getStats called for user:',
        user.role,
        'branch_id:',
        branch_id,
        'new_students_days:',
        new_students_days
      );
      let stats = {};

      if (user.role === 'super_admin') {
        // Global stats
        const [schoolCount, branchCount, userCount, totalRevenue] = await Promise.all([
          School.count(),
          Branch.count(),
          User.count(),
          // Calculate total revenue from all fee invoices
          FeeInvoice.sum('paid_amount', { where: { status: 'paid' } })
        ]);
        stats = {
          totalSchools: schoolCount,
          totalBranches: branchCount,
          totalUsers: userCount,
          totalRevenue: totalRevenue || 0
        };
      } else if (user.role === 'school_admin') {
        // School stats
        if (!user.school_id) throw new ApiError(400, 'No school assigned');

        // Build where clause for school with optional branch filter
        let schoolWhere = { school_id: user.school_id };
        let branchWhere = { school_id: user.school_id };

        if (branch_id) {
          schoolWhere.branch_id = branch_id;
          branchWhere.id = branch_id;
        }

        // Calculate date for new students (last N days)
        const newStudentsDate = new Date();
        newStudentsDate.setDate(newStudentsDate.getDate() - parseInt(new_students_days));
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        // Optimized: Single query for all student statistics
        const studentStats = await Student.findAll({
          where: schoolWhere,
          attributes: [
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_students'],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(
                  `CASE WHEN created_at >= '${newStudentsDate.toISOString()}' THEN 1 END`
                )
              ),
              'new_students'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(`CASE WHEN status IN ('active') OR status IS NULL THEN 1 END`)
              ),
              'active_students'
            ]
          ],
          raw: true
        });

        // Optimized: Single query for all fee statistics
        const feeStats = await FeeInvoice.findAll({
          where: schoolWhere,
          attributes: [
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(`CASE WHEN status IN ('sent', 'partial_paid') THEN 1 END`)
              ),
              'pending_fees'
            ],
            [
              Sequelize.fn('COUNT', Sequelize.literal(`CASE WHEN status = 'overdue' THEN 1 END`)),
              'overdue_fees'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('paid', 'partial_paid') AND last_payment_date >= '${currentMonthStart.toISOString()}' THEN paid_amount ELSE 0 END`
                )
              ),
              'fee_collection'
            ]
          ],
          raw: true
        });

        // Get branch count
        const totalBranches = await Branch.count({ where: branchWhere });

        // Extract results
        const studentData = studentStats[0] || {};
        const feeData = feeStats[0] || {};

        const totalStudents = parseInt(studentData.total_students || 0);
        const newStudents = parseInt(studentData.new_students || 0);
        const activeStudents = parseInt(studentData.active_students || 0);
        const pendingFees = parseInt(feeData.pending_fees || 0);
        const overdueFees = parseInt(feeData.overdue_fees || 0);
        const feeCollection = parseFloat(feeData.fee_collection || 0);

        stats = {
          totalStudents,
          totalBranches,
          newStudents, // New students in last N days
          newStudentsDays: parseInt(new_students_days),
          feeCollection: feeCollection || 0,
          activeStudents,
          pendingFees,
          overdueFees
        };
        console.log('✅ School admin stats calculated:', stats);
      } else if (user.role === 'branch_admin') {
        // Branch stats
        if (!user.branch_id) throw new ApiError(400, 'No branch assigned');

        // Calculate date for new students (last N days)
        const newStudentsDate = new Date();
        newStudentsDate.setDate(newStudentsDate.getDate() - parseInt(new_students_days));
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        // Optimized: Single query for all student statistics
        const studentStats = await Student.findAll({
          where: { branch_id: user.branch_id },
          attributes: [
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_students'],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(
                  `CASE WHEN created_at >= '${newStudentsDate.toISOString()}' THEN 1 END`
                )
              ),
              'new_students'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(`CASE WHEN status IN ('active') OR status IS NULL THEN 1 END`)
              ),
              'active_students'
            ]
          ],
          raw: true
        });

        // Optimized: Single query for all fee statistics
        const feeStats = await FeeInvoice.findAll({
          where: { branch_id: user.branch_id },
          attributes: [
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_invoices'],
            [
              Sequelize.fn('COUNT', Sequelize.literal(`CASE WHEN status = 'paid' THEN 1 END`)),
              'paid_invoices'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(`CASE WHEN status IN ('sent', 'partial_paid') THEN 1 END`)
              ),
              'pending_fees'
            ],
            [
              Sequelize.fn('COUNT', Sequelize.literal(`CASE WHEN status = 'overdue' THEN 1 END`)),
              'overdue_fees'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('paid', 'partial_paid') AND last_payment_date >= '${currentMonthStart.toISOString()}' THEN paid_amount ELSE 0 END`
                )
              ),
              'fee_collection'
            ]
          ],
          raw: true
        });

        // Extract results
        const studentData = studentStats[0] || {};
        const feeData = feeStats[0] || {};

        const totalStudents = parseInt(studentData.total_students || 0);
        const newStudents = parseInt(studentData.new_students || 0);
        const activeStudents = parseInt(studentData.active_students || 0);
        const totalInvoices = parseInt(feeData.total_invoices || 0);
        const paidInvoices = parseInt(feeData.paid_invoices || 0);
        const pendingFees = parseInt(feeData.pending_fees || 0);
        const overdueFees = parseInt(feeData.overdue_fees || 0);
        const feeCollection = parseFloat(feeData.fee_collection || 0);

        stats = {
          totalStudents,
          newStudents,
          newStudentsDays: parseInt(new_students_days),
          feeCollection: feeCollection || 0,
          overdueFees,
          activeStudents,
          pendingFees,
          totalInvoices,
          paidInvoices
        };
      } else {
        // For other roles, return basic info
        stats = { message: 'No dashboard stats for this role.' };
      }

      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Error in DashboardController.getStats:', error);
      next(error);
    }
  }

  static async getOverviewReport(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res
          .status(403)
          .json({ success: false, message: 'Only super admins can access this report.' });
      }
      // Count schools by status
      const [
        totalSchools,
        activeSchools,
        inactiveSchools,
        suspendedSchools,
        trialSchools,
        totalUsers,
        totalBranches
      ] = await Promise.all([
        School.count(),
        School.count({ where: { status: 'active' } }),
        School.count({ where: { status: 'inactive' } }),
        School.count({ where: { status: 'suspended' } }),
        School.count({ where: { status: 'trial' } }),
        User.count(),
        Branch.count()
      ]);
      // Expiring trials: status 'trial' and subscription_end_date within 7 days
      const now = new Date();
      const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const expiringTrials = await School.findAll({
        where: {
          status: 'trial',
          subscription_end_date: {
            [Op.lte]: in7days,
            [Op.gte]: now
          }
        },
        attributes: ['id', 'name', 'email', 'subscription_end_date']
      });
      res.json({
        success: true,
        data: {
          totalSchools,
          activeSchools,
          inactiveSchools,
          suspendedSchools,
          trialSchools,
          totalUsers,
          totalBranches,
          expiringTrials
        }
      });
    } catch (error) {
      logger.error('Error in DashboardController.getOverviewReport:', error);
      next(error);
    }
  }

  static async getSchoolReport(req, res, next) {
    try {
      if (req.user.role !== 'school_admin') {
        return res
          .status(403)
          .json({ success: false, message: 'Only school admins can access this report.' });
      }
      const schoolId = req.user.school_id;
      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'No school assigned.' });
      }
      // Count users by role
      const [totalStudents, totalTeachers, totalStaff, totalParents, totalBranches] =
        await Promise.all([
          User.count({ where: { school_id: schoolId, role: 'student' } }),
          User.count({ where: { school_id: schoolId, role: 'teacher' } }),
          User.count({
            where: {
              school_id: schoolId,
              role: [
                'accountant',
                'hr',
                'receptionist',
                'librarian',
                'transport_manager',
                'branch_admin',
                'school_admin'
              ]
            }
          }),
          User.count({ where: { school_id: schoolId, role: 'parent' } }),
          Branch.count({ where: { school_id: schoolId } })
        ]);
      // Get enabled modules
      const school = await School.findByPk(schoolId);
      const enabledModules = Array.isArray(school.modules) ? school.modules : [];
      res.json({
        success: true,
        data: {
          totalStudents,
          totalTeachers,
          totalStaff,
          totalParents,
          totalBranches,
          enabledModules
        }
      });
    } catch (error) {
      logger.error('Error in DashboardController.getSchoolReport:', error);
      next(error);
    }
  }

  static async getRecentActivities(req, res, next) {
    try {
      const user = req.user;
      const limit = parseInt(req.query.limit) || 10;
      const { branch_id } = req.query;
      const activities = [];

      if (user.role === 'super_admin') {
        // Optimized: Single query using UNION for all recent activities
        const recentActivities = await sequelize.query(
          `
          (SELECT 
            'student' as type,
            id,
            CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) as description,
            created_at,
            admission_number as extra_info
          FROM students 
          ORDER BY created_at DESC 
          LIMIT ${Math.ceil(limit / 3)})
          UNION ALL
          (SELECT 
            'payment' as type,
            id,
            CONCAT('₹', COALESCE(paid_amount, 0), ' payment received') as description,
            last_payment_date as created_at,
            NULL as extra_info
          FROM fee_invoices 
          WHERE status = 'paid' 
          ORDER BY last_payment_date DESC 
          LIMIT ${Math.ceil(limit / 3)})
          UNION ALL
          (SELECT 
            'user' as type,
            id,
            CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''), ' (', role, ')') as description,
            created_at,
            role as extra_info
          FROM users 
          ORDER BY created_at DESC 
          LIMIT ${Math.ceil(limit / 3)})
          ORDER BY created_at DESC
          LIMIT ${limit}
        `,
          {
            type: Sequelize.QueryTypes.SELECT
          }
        );

        recentActivities.forEach(activity => {
          const cleanDescription = activity.description.replace(/\s+/g, ' ').trim();
          activities.push({
            id: `${activity.type}_${activity.id}`,
            type:
              activity.type === 'student'
                ? 'student_added'
                : activity.type === 'payment'
                  ? 'fee_paid'
                  : 'user_created',
            title:
              activity.type === 'student'
                ? 'New Student Created'
                : activity.type === 'payment'
                  ? 'Fee Payment Received'
                  : 'New User Created',
            description: cleanDescription,
            created_at: activity.created_at ? new Date(activity.created_at).toISOString() : null
          });
        });
      } else if (user.role === 'school_admin') {
        // Optimized: Single query using UNION for school activities
        const schoolFilter = branch_id ? `AND branch_id = '${branch_id}'` : '';
        const recentActivities = await sequelize.query(
          `
          (SELECT 
            'student' as type,
            id,
            CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''), ' (', admission_number, ')') as description,
            created_at,
            admission_number as extra_info
          FROM students 
          WHERE school_id = '${user.school_id}' ${schoolFilter}
          ORDER BY created_at DESC 
          LIMIT ${Math.ceil(limit / 2)})
          UNION ALL
          (SELECT 
            'payment' as type,
            id,
            CONCAT('₹', COALESCE(paid_amount, 0), ' payment received') as description,
            last_payment_date as created_at,
            NULL as extra_info
          FROM fee_invoices 
          WHERE school_id = '${user.school_id}' ${schoolFilter} AND status = 'paid'
          ORDER BY last_payment_date DESC 
          LIMIT ${Math.ceil(limit / 2)})
          ORDER BY created_at DESC
          LIMIT ${limit}
        `,
          {
            type: Sequelize.QueryTypes.SELECT
          }
        );

        recentActivities.forEach(activity => {
          const cleanDescription = activity.description.replace(/\s+/g, ' ').trim();
          activities.push({
            id: `${activity.type}_${activity.id}`,
            type: activity.type === 'student' ? 'student_added' : 'fee_paid',
            title: activity.type === 'student' ? 'New Student Created' : 'Fee Payment Received',
            description: cleanDescription,
            created_at: activity.created_at ? new Date(activity.created_at).toISOString() : null
          });
        });
      } else if (user.role === 'branch_admin') {
        // Optimized: Single query using UNION for branch activities
        const recentActivities = await sequelize.query(
          `
          (SELECT 
            'student' as type,
            id,
            CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''), ' (', admission_number, ')') as description,
            created_at,
            admission_number as extra_info
          FROM students 
          WHERE branch_id = '${user.branch_id}'
          ORDER BY created_at DESC 
          LIMIT ${Math.ceil(limit / 2)})
          UNION ALL
          (SELECT 
            'payment' as type,
            id,
            CONCAT('₹', COALESCE(paid_amount, 0), ' payment received') as description,
            last_payment_date as created_at,
            NULL as extra_info
          FROM fee_invoices 
          WHERE branch_id = '${user.branch_id}' AND status = 'paid'
          ORDER BY last_payment_date DESC 
          LIMIT ${Math.ceil(limit / 2)})
          ORDER BY created_at DESC
          LIMIT ${limit}
        `,
          {
            type: Sequelize.QueryTypes.SELECT
          }
        );

        recentActivities.forEach(activity => {
          const cleanDescription = activity.description.replace(/\s+/g, ' ').trim();
          activities.push({
            id: `${activity.type}_${activity.id}`,
            type: activity.type === 'student' ? 'student_added' : 'fee_paid',
            title: activity.type === 'student' ? 'New Student Created' : 'Fee Payment Received',
            description: cleanDescription,
            created_at: activity.created_at ? new Date(activity.created_at).toISOString() : null
          });
        });
      }

      // Sort by created_at and limit
      activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      activities.splice(limit);

      return res.status(200).json({
        success: true,
        data: activities
      });
    } catch (error) {
      logger.error('Error in DashboardController.getRecentActivities:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch recent activities',
        error: error.message
      });
    }
  }

  static async getStudentsChartData(req, res, next) {
    try {
      const user = req.user;
      const { branch_id } = req.query;
      let where = {};

      if (user.role === 'school_admin') {
        where.school_id = user.school_id;
        // Add branch filter if provided
        if (branch_id) {
          where.branch_id = branch_id;
        }
      } else if (user.role === 'branch_admin') {
        where.branch_id = user.branch_id;
      }

      const students = await Student.findAll({
        where,
        attributes: [
          [Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at')), 'month'],
          [Sequelize.fn('count', Sequelize.col('id')), 'count']
        ],
        group: ['month'],
        order: [[Sequelize.col('month'), 'ASC']]
      });

      const labels = students.map(s =>
        new Date(s.get('month')).toLocaleString('default', { month: 'short' })
      );
      const data = students.map(s => s.get('count'));

      // If no data, provide default structure
      if (labels.length === 0) {
        labels.push('No Data');
        data.push(0);
      }

      res.json({ success: true, data: { labels, data } });
    } catch (error) {
      logger.error('Error in DashboardController.getStudentsChartData:', error);
      next(error);
    }
  }

  static async getFeesChartData(req, res, next) {
    try {
      const user = req.user;
      const { branch_id } = req.query;
      let where = {};

      if (user.role === 'school_admin') {
        where.school_id = user.school_id;
        // Add branch filter if provided
        if (branch_id) {
          where.branch_id = branch_id;
        }
      } else if (user.role === 'branch_admin') {
        where.school_id = user.school_id;
        where.branch_id = user.branch_id;
      }

      // Get amounts by status instead of counts
      const fees = await FeeInvoice.findAll({
        where,
        attributes: [
          'status',
          [Sequelize.fn('sum', Sequelize.col('paid_amount')), 'total_paid'],
          [Sequelize.fn('sum', Sequelize.col('balance_amount')), 'total_pending']
        ],
        group: ['status']
      });

      // Process the data to create proper chart labels and data
      const chartData = {
        labels: ['Paid', 'Pending', 'Overdue'],
        data: [0, 0, 0] // Initialize with zeros
      };

      fees.forEach(fee => {
        const status = fee.status;
        const paidAmount = parseFloat(fee.get('total_paid') || 0);
        const pendingAmount = parseFloat(fee.get('total_pending') || 0);

        if (status === 'paid') {
          chartData.data[0] += paidAmount; // Paid
        } else if (status === 'sent' || status === 'partial_paid') {
          chartData.data[1] += pendingAmount; // Pending
        } else if (status === 'overdue') {
          chartData.data[2] += pendingAmount; // Overdue
        }
      });

      // If no data, provide default structure
      if (chartData.data.every(amount => amount === 0)) {
        chartData.labels = ['No Data'];
        chartData.data = [0];
      }

      res.json({ success: true, data: chartData });
    } catch (error) {
      logger.error('Error in DashboardController.getFeesChartData:', error);
      next(error);
    }
  }

  static async getStudentDistributionData(req, res, next) {
    try {
      const user = req.user;
      const { branch_id } = req.query;
      let where = {};

      if (user.role === 'school_admin') {
        where.school_id = user.school_id;
        // Add branch filter if provided
        if (branch_id) {
          where.branch_id = branch_id;
        }
      } else if (user.role === 'branch_admin') {
        where.school_id = user.school_id;
        where.branch_id = user.branch_id;
      }

      const students = await Student.findAll({
        where,
        attributes: ['current_class', [Sequelize.fn('count', Sequelize.col('id')), 'count']],
        group: ['current_class'],
        order: [[Sequelize.col('current_class'), 'ASC']]
      });

      const labels = students.map(s => s.current_class || 'Unknown');
      const data = students.map(s => s.get('count'));

      // If no data, provide default structure
      if (labels.length === 0) {
        labels.push('No Data');
        data.push(0);
      }

      res.json({ success: true, data: { labels, data } });
    } catch (error) {
      logger.error('Error in DashboardController.getStudentDistributionData:', error);
      next(error);
    }
  }

  static async getFeeTrendData(req, res, next) {
    try {
      const user = req.user;
      const { months = 6, branch_id } = req.query;
      let where = {};

      if (user.role === 'school_admin') {
        where.school_id = user.school_id;
        // Add branch filter if provided
        if (branch_id) {
          where.branch_id = branch_id;
        }
      } else if (user.role === 'branch_admin') {
        where.school_id = user.school_id;
        where.branch_id = user.branch_id;
      }

      // Get fee collection data for last N months
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

      where.created_at = {
        [Op.gte]: monthsAgo
      };

      const fees = await FeeInvoice.findAll({
        where: { ...where, status: 'paid' },
        attributes: [
          [Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at')), 'month'],
          [Sequelize.fn('sum', Sequelize.col('paid_amount')), 'total_paid']
        ],
        group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at'))],
        order: [[Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at')), 'ASC']]
      });

      const labels = fees.map(f =>
        new Date(f.get('month')).toLocaleString('default', { month: 'short' })
      );
      const data = fees.map(f => parseFloat(f.get('total_paid') || 0));

      // If no data, provide default structure
      if (labels.length === 0) {
        labels.push('No Data');
        data.push(0);
      }

      res.json({ success: true, data: { labels, data } });
    } catch (error) {
      logger.error('Error in DashboardController.getFeeTrendData:', error);
      next(error);
    }
  }

  static async getAcademicYearMonths(req, res, next) {
    try {
      console.log(
        '📅 getAcademicYearMonths called by user:',
        req.user?.id,
        'role:',
        req.user?.role
      );
      const user = req.user;
      const {
        getCurrentAcademicYearForSchool,
        getAcademicYearMonths
      } = require('~/utils/academic/academicYearUtils');

      // Get current academic year for the school
      const currentAcademicYear = await getCurrentAcademicYearForSchool(user.school_id);

      if (!currentAcademicYear) {
        return res.status(404).json({
          success: false,
          message: 'No current academic year found'
        });
      }

      // Get school's starting month (default to 6 for June)
      const { School } = require('~/models');
      const school = await School.findByPk(user.school_id, {
        attributes: ['starting_month']
      });

      const startingMonth = school?.starting_month || 6; // Default to June

      // Get academic year months
      const academicMonths = getAcademicYearMonths(startingMonth, currentAcademicYear.name);

      console.log('📅 Academic year months generated:', {
        startingMonth,
        academicYear: currentAcademicYear.name,
        months: academicMonths
      });

      // Format for frontend - use calendar month numbers as values for backend compatibility
      const formattedMonths = academicMonths.map(month => ({
        value: month.month, // Calendar month number (1-12) for backend API
        label: month.display, // Academic year display (e.g., "June 2025")
        year: month.year,
        academicMonth: month.academicMonth,
        isCurrentMonth: month.isCurrentMonth
      }));

      console.log('📅 Formatted months for frontend:', formattedMonths);

      res.json({
        success: true,
        data: {
          academicYear: currentAcademicYear.name,
          startingMonth: startingMonth,
          months: formattedMonths
        }
      });
    } catch (error) {
      logger.error('Error in DashboardController.getAcademicYearMonths:', error);
      next(error);
    }
  }

  static async getFeeCollectionSummary(req, res, next) {
    try {
      const user = req.user;
      const { academic_year } = req.query;
      console.log(
        '🔍 Fee collection summary called for user:',
        user.role,
        'academic_year:',
        academic_year
      );

      // Get current academic year from database if not provided
      let targetAcademicYear = academic_year;
      if (!targetAcademicYear) {
        const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');
        const currentAcademicYear = await getCurrentAcademicYearForSchool(user.school_id);
        targetAcademicYear = currentAcademicYear ? currentAcademicYear.name : null;

        if (!targetAcademicYear) {
          // Fallback to calculated academic year if no current year in database
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1; // 1-12
          targetAcademicYear =
            currentMonth >= 6
              ? `${currentYear}-${currentYear + 1}`
              : `${currentYear - 1}-${currentYear}`;
        }
      }

      let where = {};
      let branchWhere = {};

      // Only filter by academic year if explicitly provided
      if (targetAcademicYear) {
        where.academic_year = targetAcademicYear;
      }

      if (user.role === 'super_admin') {
        // Super admin can see all schools
        // No additional filters needed
      } else if (user.role === 'school_admin') {
        where.school_id = user.school_id;
        branchWhere.school_id = user.school_id;

        // Add branch filter if provided
        if (req.query.branch_id) {
          where.branch_id = req.query.branch_id;
          branchWhere.id = req.query.branch_id;
        }
      } else if (user.role === 'branch_admin') {
        where.school_id = user.school_id;
        where.branch_id = user.branch_id;
        branchWhere.id = user.branch_id;
      } else {
        throw new ApiError(403, 'Access denied');
      }

      // Get all summary statistics in a single optimized query

      const summaryStats = await FeeInvoice.findAll({
        where,
        attributes: [
          [FeeInvoice.sequelize.fn('COUNT', FeeInvoice.sequelize.col('id')), 'total_invoices'],
          [
            FeeInvoice.sequelize.fn(
              'COUNT',
              FeeInvoice.sequelize.literal("CASE WHEN status = 'paid' THEN 1 END")
            ),
            'paid_count'
          ],
          [
            FeeInvoice.sequelize.fn(
              'COUNT',
              FeeInvoice.sequelize.literal(
                "CASE WHEN status IN ('sent', 'partial_paid') THEN 1 END"
              )
            ),
            'pending_count'
          ],
          [
            FeeInvoice.sequelize.fn(
              'COUNT',
              FeeInvoice.sequelize.literal("CASE WHEN status = 'overdue' THEN 1 END")
            ),
            'overdue_count'
          ],
          [
            FeeInvoice.sequelize.fn(
              'SUM',
              FeeInvoice.sequelize.literal(
                "CASE WHEN status IN ('paid', 'partial_paid') THEN paid_amount ELSE 0 END"
              )
            ),
            'total_collected'
          ],
          [
            FeeInvoice.sequelize.fn(
              'SUM',
              FeeInvoice.sequelize.literal(
                "CASE WHEN status IN ('sent', 'partial_paid', 'overdue') THEN balance_amount ELSE 0 END"
              )
            ),
            'total_pending'
          ]
        ],
        raw: true
      });

      const stats = summaryStats[0] || {};
      const totalInvoices = parseInt(stats.total_invoices || 0);
      const paidInvoices = parseInt(stats.paid_count || 0);
      const pendingInvoices = parseInt(stats.pending_count || 0);
      const overdueInvoices = parseInt(stats.overdue_count || 0);
      const totalCollected = parseFloat(stats.total_collected || 0);
      const totalPending = parseFloat(stats.total_pending || 0);

      console.log('💰 Dashboard calculation results (optimized single query):');
      console.log('   - Total Invoices:', totalInvoices);
      console.log('   - Paid Invoices:', paidInvoices);
      console.log('   - Pending Invoices:', pendingInvoices);
      console.log('   - Overdue Invoices:', overdueInvoices);
      console.log('   - Total Collected:', totalCollected);
      console.log('   - Total Pending:', totalPending);

      // Get branch-wise breakdown for school admin and super admin
      let branchBreakdown = [];
      if (user.role === 'school_admin' || user.role === 'super_admin') {
        const branches = await Branch.findAll({
          where: branchWhere,
          attributes: ['id', 'name']
        });

        if (branches.length > 0) {
          // Get all branch fee data in a single optimized query
          const branchIds = branches.map(b => b.id);
          const branchFeeData = await FeeInvoice.findAll({
            where: {
              ...where,
              branch_id: { [Op.in]: branchIds }
            },
            attributes: [
              'branch_id',
              [
                FeeInvoice.sequelize.fn(
                  'SUM',
                  FeeInvoice.sequelize.literal(
                    "CASE WHEN status IN ('paid', 'partial_paid') THEN paid_amount ELSE 0 END"
                  )
                ),
                'total_collected'
              ],
              [
                FeeInvoice.sequelize.fn(
                  'SUM',
                  FeeInvoice.sequelize.literal(
                    "CASE WHEN status IN ('sent', 'partial_paid', 'overdue') THEN balance_amount ELSE 0 END"
                  )
                ),
                'total_pending'
              ]
            ],
            group: ['branch_id'],
            raw: true
          });

          // Create a map for quick lookup
          const branchStatsMap = {};
          branchFeeData.forEach(stat => {
            branchStatsMap[stat.branch_id] = {
              total_collected: parseFloat(stat.total_collected || 0),
              total_pending: parseFloat(stat.total_pending || 0)
            };
          });

          // Build branch breakdown with fee data
          branchBreakdown = branches
            .map(branch => ({
              id: branch.id,
              name: branch.name,
              total_collected: branchStatsMap[branch.id]?.total_collected || 0,
              total_pending: branchStatsMap[branch.id]?.total_pending || 0
            }))
            .filter(branch => branch.total_collected > 0 || branch.total_pending > 0);
        }
      }

      // Build summary response with optimized data
      const summary = {
        academic_year: targetAcademicYear,
        total_collected: totalCollected,
        total_pending: totalPending,
        total_invoices: totalInvoices,
        paid_invoices: paidInvoices,
        pending_invoices: pendingInvoices,
        overdue_invoices: overdueInvoices,
        collection_rate: totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : 0,
        branch_breakdown: branchBreakdown
      };
      res.json({ success: true, data: summary });
    } catch (error) {
      logger.error('Error in DashboardController.getFeeCollectionSummary:', error);
      next(error);
    }
  }
}

module.exports = DashboardController;
