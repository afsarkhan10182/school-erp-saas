const { User, School, Branch, FeeInvoice, Admission, Student } = require('../../models');
const { Sequelize } = require('../../config/database');
const SchoolService = require('../../services/school/school.service');
const BranchService = require('../../services/school/branch.service');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');
const { Op } = require('sequelize');

class DashboardController {
  static async getStats(req, res, next) {
    try {
      const user = req.user;
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
          totalRevenue: totalRevenue || 0,
        };
      } else if (user.role === 'school_admin') {
        // School stats
        if (!user.school_id) throw new ApiError(400, 'No school assigned');
        
        const [totalStudents, totalBranches, newAdmissions, feeCollection] = await Promise.all([
          Student.count({ where: { school_id: user.school_id } }),
          Branch.count({ where: { school_id: user.school_id } }),
          // Count admissions in last 30 days
          Admission.count({ 
            where: { 
              school_id: user.school_id,
              created_at: {
                [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            } 
          }),
          // Calculate fee collection for the school
          FeeInvoice.sum('paid_amount', { 
            where: { 
              school_id: user.school_id,
              status: 'paid'
            } 
          })
        ]);
        
        stats = {
          totalStudents,
          totalBranches,
          newAdmissions,
          feeCollection: feeCollection || 0,
        };
      } else if (user.role === 'branch_admin') {
        // Branch stats
        if (!user.branch_id) throw new ApiError(400, 'No branch assigned');
        
        const [branchStudents, pendingAdmissions, branchCollection, overdueFees] = await Promise.all([
          Student.count({ where: { branch_id: user.branch_id } }),
          Admission.count({ where: { branch_id: user.branch_id, status: 'pending' } }),
          // Calculate fee collection for the branch
          FeeInvoice.sum('paid_amount', { 
            where: { 
              branch_id: user.branch_id,
              status: 'paid'
            } 
          }),
          // Count overdue invoices
          FeeInvoice.count({ 
            where: { 
              branch_id: user.branch_id,
              status: 'overdue'
            } 
          })
        ]);
        
        stats = {
          branchStudents,
          pendingAdmissions,
          branchCollection: branchCollection || 0,
          overdueFees,
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
        return res.status(403).json({ success: false, message: 'Only super admins can access this report.' });
      }
      // Count schools by status
      const [totalSchools, activeSchools, inactiveSchools, suspendedSchools, trialSchools, totalUsers, totalBranches] = await Promise.all([
        School.count(),
        School.count({ where: { status: 'active' } }),
        School.count({ where: { status: 'inactive' } }),
        School.count({ where: { status: 'suspended' } }),
        School.count({ where: { status: 'trial' } }),
        User.count(),
        Branch.count(),
      ]);
      // Expiring trials: status 'trial' and subscription_end_date within 7 days
      const now = new Date();
      const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const expiringTrials = await School.findAll({
        where: {
          status: 'trial',
          subscription_end_date: { $lte: in7days, $gte: now }
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
          expiringTrials,
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
        return res.status(403).json({ success: false, message: 'Only school admins can access this report.' });
      }
      const schoolId = req.user.school_id;
      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'No school assigned.' });
      }
      // Count users by role
      const [totalStudents, totalTeachers, totalStaff, totalParents, totalBranches] = await Promise.all([
        User.count({ where: { school_id: schoolId, role: 'student' } }),
        User.count({ where: { school_id: schoolId, role: 'teacher' } }),
        User.count({ where: { school_id: schoolId, role: ['accountant', 'hr', 'receptionist', 'librarian', 'transport_manager', 'branch_admin', 'school_admin'] } }),
        User.count({ where: { school_id: schoolId, role: 'parent' } }),
        Branch.count({ where: { school_id: schoolId } }),
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
          enabledModules,
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
      const activities = [];

      if (user.role === 'super_admin') {
        // Get recent activities across all schools - simplified without complex associations
        const [recentAdmissions, recentPayments, recentUsers] = await Promise.all([
          Admission.findAll({
            limit: Math.ceil(limit / 3),
            order: [['created_at', 'DESC']],
            attributes: ['id', 'application_number', 'status', 'created_at', 'school_id']
          }).catch(() => []),
          FeeInvoice.findAll({
            where: { status: 'paid' },
            limit: Math.ceil(limit / 3),
            order: [['last_payment_date', 'DESC']],
            attributes: ['id', 'paid_amount', 'last_payment_date', 'school_id']
          }).catch(() => []),
          User.findAll({
            limit: Math.ceil(limit / 3),
            order: [['created_at', 'DESC']],
            attributes: ['id', 'first_name', 'last_name', 'role', 'created_at', 'school_id']
          }).catch(() => [])
        ]);

        // Convert to activity format
        recentAdmissions.forEach(admission => {
          activities.push({
            id: `admission_${admission.id}`,
            type: 'student_admission',
            title: 'New Student Admission',
            description: `Application ${admission.application_number} (${admission.status})`,
            created_at: admission.created_at
          });
        });

        recentPayments.forEach(payment => {
          activities.push({
            id: `payment_${payment.id}`,
            type: 'fee_payment',
            title: 'Fee Payment Received',
            description: `₹${payment.paid_amount || 0} payment received`,
            created_at: payment.last_payment_date
          });
        });

        recentUsers.forEach(user => {
          activities.push({
            id: `user_${user.id}`,
            type: 'user_registration',
            title: 'New User Registration',
            description: `${user.first_name || 'User'} ${user.last_name || ''} (${user.role || 'user'}) registered`,
            created_at: user.created_at
          });
        });

      } else if (user.role === 'school_admin') {
        // Get recent activities for the school
        const [recentAdmissions, recentPayments] = await Promise.all([
          Admission.findAll({
            where: { school_id: user.school_id },
            limit: Math.ceil(limit / 2),
            order: [['created_at', 'DESC']],
            attributes: ['id', 'application_number', 'status', 'created_at']
          }).catch(() => []),
          FeeInvoice.findAll({
            where: { 
              school_id: user.school_id,
              status: 'paid'
            },
            limit: Math.ceil(limit / 2),
            order: [['last_payment_date', 'DESC']],
            attributes: ['id', 'paid_amount', 'last_payment_date']
          }).catch(() => [])
        ]);

        recentAdmissions.forEach(admission => {
          activities.push({
            id: `admission_${admission.id}`,
            type: 'student_admission',
            title: 'New Student Admission',
            description: `Application ${admission.application_number} (${admission.status})`,
            created_at: admission.created_at
          });
        });

        recentPayments.forEach(payment => {
          activities.push({
            id: `payment_${payment.id}`,
            type: 'fee_payment',
            title: 'Fee Payment Received',
            description: `₹${payment.paid_amount || 0} payment received`,
            created_at: payment.last_payment_date
          });
        });

      } else if (user.role === 'branch_admin') {
        // Get recent activities for the branch
        const [recentAdmissions, recentPayments] = await Promise.all([
          Admission.findAll({
            where: { branch_id: user.branch_id },
            limit: Math.ceil(limit / 2),
            order: [['created_at', 'DESC']],
            attributes: ['id', 'application_number', 'status', 'created_at']
          }).catch(() => []),
          FeeInvoice.findAll({
            where: { 
              branch_id: user.branch_id,
              status: 'paid'
            },
            limit: Math.ceil(limit / 2),
            order: [['last_payment_date', 'DESC']],
            attributes: ['id', 'paid_amount', 'last_payment_date']
          }).catch(() => [])
        ]);

        recentAdmissions.forEach(admission => {
          activities.push({
            id: `admission_${admission.id}`,
            type: 'student_admission',
            title: 'New Student Admission',
            description: `Application ${admission.application_number} (${admission.status})`,
            created_at: admission.created_at
          });
        });

        recentPayments.forEach(payment => {
          activities.push({
            id: `payment_${payment.id}`,
            type: 'fee_payment',
            title: 'Fee Payment Received',
            description: `₹${payment.paid_amount || 0} payment received`,
            created_at: payment.last_payment_date
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

  static async getAdmissionsChartData(req, res, next) {
    try {
      const user = req.user;
      let where = {};
      if (user.role === 'school_admin') {
        where.school_id = user.school_id;
      } else if (user.role === 'branch_admin') {
        where.branch_id = user.branch_id;
      }

      const admissions = await Admission.findAll({
        where,
        attributes: [
          [Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at')), 'month'],
          [Sequelize.fn('count', Sequelize.col('id')), 'count'],
        ],
        group: ['month'],
        order: [[Sequelize.col('month'), 'ASC']],
      });

      const labels = admissions.map(a => new Date(a.get('month')).toLocaleString('default', { month: 'short' }));
      const data = admissions.map(a => a.get('count'));

      res.json({ success: true, data: { labels, data } });
    } catch (error) {
      logger.error('Error in DashboardController.getAdmissionsChartData:', error);
      next(error);
    }
  }

  static async getFeesChartData(req, res, next) {
    try {
      const user = req.user;
      let where = {};
      if (user.role === 'school_admin') {
        where.school_id = user.school_id;
      } else if (user.role === 'branch_admin') {
        where.branch_id = user.branch_id;
      }

      const fees = await FeeInvoice.findAll({
        where,
        attributes: [
          'status',
          [Sequelize.fn('count', Sequelize.col('id')), 'count'],
        ],
        group: ['status'],
      });

      const labels = fees.map(f => f.status);
      const data = fees.map(f => f.get('count'));

      res.json({ success: true, data: { labels, data } });
    } catch (error) {
      logger.error('Error in DashboardController.getFeesChartData:', error);
      next(error);
    }
  }

  static async getStudentDistributionData(req, res, next) {
    try {
      const user = req.user;
      let where = {};
      if (user.role === 'school_admin') {
        where.school_id = user.school_id;
      } else if (user.role === 'branch_admin') {
        where.branch_id = user.branch_id;
      }

      const students = await Student.findAll({
        where,
        attributes: [
          'current_class',
          [Sequelize.fn('count', Sequelize.col('id')), 'count'],
        ],
        group: ['current_class'],
        order: [[Sequelize.col('current_class'), 'ASC']],
      });

      const labels = students.map(s => s.current_class || 'Unknown');
      const data = students.map(s => s.get('count'));

      res.json({ success: true, data: { labels, data } });
    } catch (error) {
      logger.error('Error in DashboardController.getStudentDistributionData:', error);
      next(error);
    }
  }

  static async getFeeTrendData(req, res, next) {
    try {
      const user = req.user;
      let where = {};
      if (user.role === 'school_admin') {
        where.school_id = user.school_id;
      } else if (user.role === 'branch_admin') {
        where.branch_id = user.branch_id;
      }

      // Get fee collection data for last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      where.created_at = {
        [Op.gte]: sixMonthsAgo
      };

      const fees = await FeeInvoice.findAll({
        where: { ...where, status: 'paid' },
        attributes: [
          [Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at')), 'month'],
          [Sequelize.fn('sum', Sequelize.col('paid_amount')), 'total_paid'],
        ],
        group: ['month'],
        order: [[Sequelize.col('month'), 'ASC']],
      });

      const labels = fees.map(f => new Date(f.get('month')).toLocaleString('default', { month: 'short' }));
      const data = fees.map(f => parseFloat(f.get('total_paid') || 0));

      res.json({ success: true, data: { labels, data } });
    } catch (error) {
      logger.error('Error in DashboardController.getFeeTrendData:', error);
      next(error);
    }
  }
}

module.exports = DashboardController; 