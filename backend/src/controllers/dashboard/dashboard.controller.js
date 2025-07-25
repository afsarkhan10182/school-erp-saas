const { User, School, Branch, FeeInvoice, Student } = require('../../models');
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
      const { branch_id, new_students_days = 30 } = req.query;
      console.log('🔍 Dashboard getStats called for user:', user.role, 'branch_id:', branch_id, 'new_students_days:', new_students_days);
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
        
        // Build where clause for school with optional branch filter
        let schoolWhere = { school_id: user.school_id };
        let branchWhere = { school_id: user.school_id };
        
        if (branch_id) {
          schoolWhere.branch_id = branch_id;
          branchWhere.id = branch_id;
        }
        
        const [totalStudents, totalBranches, newStudents, feeCollection, activeStudents, pendingFees, overdueFees] = await Promise.all([
          Student.count({ where: schoolWhere }),
          Branch.count({ where: branchWhere }),
          // Count new students in last N days
          Student.count({ 
            where: { 
              ...schoolWhere,
              created_at: {
                [Op.gte]: new Date(Date.now() - new_students_days * 24 * 60 * 60 * 1000)
              }
            } 
          }),
          // Calculate fee collection for the school/branch
          FeeInvoice.sum('paid_amount', { 
            where: { 
              ...schoolWhere,
              status: 'paid'
            } 
          }),
          // Count active students (students with status 'active' or null)
          Student.count({ 
            where: { 
              ...schoolWhere,
              status: { [Op.or]: ['active', null] }
            } 
          }),
          // Count pending invoices (sent status)
          FeeInvoice.count({ 
            where: { 
              ...schoolWhere,
              status: 'sent'
            } 
          }),
          // Count overdue invoices
          FeeInvoice.count({ 
            where: { 
              ...schoolWhere,
              status: 'overdue'
            } 
          })
        ]);
        
        stats = {
          totalStudents,
          totalBranches,
          newStudents, // New students in last N days
          newStudentsDays: parseInt(new_students_days),
          feeCollection: feeCollection || 0,
          activeStudents,
          pendingFees,
          overdueFees,
        };
        console.log('✅ School admin stats calculated:', stats);
      } else if (user.role === 'branch_admin') {
        // Branch stats
        if (!user.branch_id) throw new ApiError(400, 'No branch assigned');
        
        const [totalStudents, newStudents, feeCollection, overdueFees, activeStudents, pendingFees] = await Promise.all([
          Student.count({ where: { branch_id: user.branch_id } }),
          Student.count({ 
            where: { 
              branch_id: user.branch_id,
              created_at: {
                [Op.gte]: new Date(Date.now() - new_students_days * 24 * 60 * 60 * 1000)
              }
            } 
          }),
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
          }),
          // Count active students
          Student.count({ 
            where: { 
              branch_id: user.branch_id,
              status: { [Op.or]: ['active', null] }
            } 
          }),
          // Count pending invoices (sent status)
          FeeInvoice.count({ 
            where: { 
              branch_id: user.branch_id,
              status: 'sent'
            } 
          })
        ]);
        
        stats = {
          totalStudents,
          newStudents,
          newStudentsDays: parseInt(new_students_days),
          feeCollection: feeCollection || 0,
          overdueFees,
          activeStudents,
          pendingFees,
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
        const [recentStudents, recentPayments, recentUsers] = await Promise.all([
          Student.findAll({
            limit: Math.ceil(limit / 3),
            order: [['created_at', 'DESC']],
            attributes: ['id', 'admission_number', 'first_name', 'last_name', 'created_at']
          }).catch(() => []),
          FeeInvoice.findAll({
            where: { status: 'paid' },
            limit: Math.ceil(limit / 3),
            order: [['last_payment_date', 'DESC']],
            attributes: ['id', 'paid_amount', 'last_payment_date']
          }).catch(() => []),
          User.findAll({
            limit: Math.ceil(limit / 3),
            order: [['created_at', 'DESC']],
            attributes: ['id', 'first_name', 'last_name', 'role', 'created_at']
          }).catch(() => [])
        ]);

        recentStudents.forEach(student => {
          activities.push({
            id: `student_${student.id}`,
            type: 'student_created',
            title: 'New Student Created',
            description: `${student.first_name} ${student.last_name} (${student.admission_number})`,
            created_at: student.created_at ? new Date(student.created_at).toISOString() : null
          });
        });

        recentPayments.forEach(payment => {
          activities.push({
            id: `payment_${payment.id}`,
            type: 'fee_payment',
            title: 'Fee Payment Received',
            description: `₹${payment.paid_amount || 0} payment received`,
            created_at: payment.last_payment_date ? new Date(payment.last_payment_date).toISOString() : null
          });
        });

        recentUsers.forEach(user => {
          activities.push({
            id: `user_${user.id}`,
            type: 'user_created',
            title: 'New User Created',
            description: `${user.first_name} ${user.last_name} (${user.role})`,
            created_at: user.created_at ? new Date(user.created_at).toISOString() : null
          });
        });

      } else if (user.role === 'school_admin') {
        // Get recent activities for the school
        const [recentStudents, recentPayments] = await Promise.all([
          Student.findAll({
            where: { school_id: user.school_id },
            limit: Math.ceil(limit / 2),
            order: [['created_at', 'DESC']],
            attributes: ['id', 'admission_number', 'first_name', 'last_name', 'created_at']
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

        recentStudents.forEach(student => {
          activities.push({
            id: `student_${student.id}`,
            type: 'student_created',
            title: 'New Student Created',
            description: `${student.first_name} ${student.last_name} (${student.admission_number})`,
            created_at: student.created_at ? new Date(student.created_at).toISOString() : null
          });
        });

        recentPayments.forEach(payment => {
          activities.push({
            id: `payment_${payment.id}`,
            type: 'fee_payment',
            title: 'Fee Payment Received',
            description: `₹${payment.paid_amount || 0} payment received`,
            created_at: payment.last_payment_date ? new Date(payment.last_payment_date).toISOString() : null
          });
        });

      } else if (user.role === 'branch_admin') {
        // Get recent activities for the branch
        const [recentStudents, recentPayments] = await Promise.all([
          Student.findAll({
            where: { branch_id: user.branch_id },
            limit: Math.ceil(limit / 2),
            order: [['created_at', 'DESC']],
            attributes: ['id', 'admission_number', 'first_name', 'last_name', 'created_at']
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

        recentStudents.forEach(student => {
          activities.push({
            id: `student_${student.id}`,
            type: 'student_created',
            title: 'New Student Created',
            description: `${student.first_name} ${student.last_name} (${student.admission_number})`,
            created_at: student.created_at ? new Date(student.created_at).toISOString() : null
          });
        });

        recentPayments.forEach(payment => {
          activities.push({
            id: `payment_${payment.id}`,
            type: 'fee_payment',
            title: 'Fee Payment Received',
            description: `₹${payment.paid_amount || 0} payment received`,
            created_at: payment.last_payment_date ? new Date(payment.last_payment_date).toISOString() : null
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
      let where = {};
      if (user.role === 'school_admin') {
        where.school_id = user.school_id;
      } else if (user.role === 'branch_admin') {
        where.branch_id = user.branch_id;
      }

      const students = await Student.findAll({
        where,
        attributes: [
          [Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at')), 'month'],
          [Sequelize.fn('count', Sequelize.col('id')), 'count'],
        ],
        group: ['month'],
        order: [[Sequelize.col('month'), 'ASC']],
      });

      const labels = students.map(s => new Date(s.get('month')).toLocaleString('default', { month: 'short' }));
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

      // If no data, provide default structure
      if (labels.length === 0) {
        labels.push('No Data');
        data.push(0);
      }

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
      const { months = 6 } = req.query;
      let where = {};
      if (user.role === 'school_admin') {
        where.school_id = user.school_id;
      } else if (user.role === 'branch_admin') {
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
          [Sequelize.fn('sum', Sequelize.col('paid_amount')), 'total_paid'],
        ],
        group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at'))],
        order: [[Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at')), 'ASC']],
      });

      const labels = fees.map(f => new Date(f.get('month')).toLocaleString('default', { month: 'short' }));
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

  static async getFeeCollectionSummary(req, res, next) {
    try {
      const user = req.user;
      const { academic_year } = req.query;
      console.log('🔍 Fee collection summary called for user:', user.role, 'academic_year:', academic_year);
      
      // Get current academic year from database if not provided
      let targetAcademicYear = academic_year;
      if (!targetAcademicYear) {
        const { getCurrentAcademicYearForSchool } = require('../../utils/academicYearUtils');
        const currentAcademicYear = await getCurrentAcademicYearForSchool(user.school_id);
        targetAcademicYear = currentAcademicYear ? currentAcademicYear.name : null;
        
        if (!targetAcademicYear) {
          // Fallback to calculated academic year if no current year in database
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1; // 1-12
          targetAcademicYear = currentMonth >= 6 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
        }
      }

      let where = { academic_year: targetAcademicYear };
      let branchWhere = {};

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
        where.branch_id = user.branch_id;
        branchWhere.id = user.branch_id;
      } else {
        throw new ApiError(403, 'Access denied');
      }

      // Get total collected and pending amounts
      const [totalCollected, totalPending] = await Promise.all([
        FeeInvoice.sum('paid_amount', { 
          where: { ...where, status: 'paid' } 
        }),
        FeeInvoice.sum('balance_amount', { 
          where: { 
            ...where, 
            status: { [Op.in]: ['sent', 'partial_paid', 'overdue'] } 
          } 
        })
      ]);

      // Get branch-wise breakdown for school admin and super admin
      let branchBreakdown = [];
      if (user.role === 'school_admin' || user.role === 'super_admin') {
        const branches = await Branch.findAll({
          where: branchWhere,
          attributes: ['id', 'name']
        });

        // Get fee data for each branch
        const branchFeeData = await Promise.all(
          branches.map(async (branch) => {
            const branchWhereClause = { 
              ...where, 
              branch_id: branch.id 
            };

            const [collected, pending] = await Promise.all([
              FeeInvoice.sum('paid_amount', { 
                where: { ...branchWhereClause, status: 'paid' } 
              }),
              FeeInvoice.sum('balance_amount', { 
                where: { 
                  ...branchWhereClause, 
                  status: { [Op.in]: ['sent', 'partial_paid', 'overdue'] } 
                } 
              })
            ]);

            return {
              id: branch.id,
              name: branch.name,
              total_collected: parseFloat(collected || 0),
              total_pending: parseFloat(pending || 0)
            };
          })
        );

        // Filter out branches with no fee data
        branchBreakdown = branchFeeData.filter(branch => 
          branch.total_collected > 0 || branch.total_pending > 0
        );
      }

      // Get additional statistics
      const [totalInvoices, paidInvoices, pendingInvoices, overdueInvoices] = await Promise.all([
        FeeInvoice.count({ where }),
        FeeInvoice.count({ where: { ...where, status: 'paid' } }),
        FeeInvoice.count({ where: { ...where, status: { [Op.in]: ['sent', 'partial_paid'] } } }),
        FeeInvoice.count({ where: { ...where, status: 'overdue' } })
      ]);

      const summary = {
        academic_year: targetAcademicYear,
        total_collected: parseFloat(totalCollected || 0),
        total_pending: parseFloat(totalPending || 0),
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