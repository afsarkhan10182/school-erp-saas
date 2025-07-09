const { User, School, Branch } = require('../models');
const SchoolService = require('../services/school.service');
const BranchService = require('../services/branch.service');
const { logger } = require('../utils/logger');
const ApiError = require('../utils/ApiError');

class DashboardController {
  static async getStats(req, res, next) {
    try {
      const user = req.user;
      let stats = {};

      if (user.role === 'super_admin') {
        // Global stats
        const [schoolCount, branchCount, userCount] = await Promise.all([
          School.count(),
          Branch.count(),
          User.count(),
        ]);
        stats = {
          totalSchools: schoolCount,
          totalBranches: branchCount,
          totalUsers: userCount,
        };
      } else if (user.role === 'school_admin') {
        // School stats
        if (!user.school_id) throw new ApiError(400, 'No school assigned');
        stats = await SchoolService.getSchoolStats(user.school_id);
      } else if (user.role === 'branch_admin') {
        // Branch stats
        if (!user.branch_id) throw new ApiError(400, 'No branch assigned');
        stats = await BranchService.getBranchStats(user.branch_id);
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
}

module.exports = DashboardController; 