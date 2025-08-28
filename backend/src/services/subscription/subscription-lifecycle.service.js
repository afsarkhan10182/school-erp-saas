const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { 
  School, 
  User, 
  SubscriptionPlan, 
  Transaction, 
  SubscriptionRenewalRequest,
  Module,
  PlanModule
} = require('../../models');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');
const RedisUtils = require('../../utils/redis-utils');

class SubscriptionLifecycleService {
  
  /**
   * Calculate subscription status based on plan and dates
   */
  static calculateSubscriptionStatus(school) {
    if (!school) return 'unknown';
    
    const now = new Date();
    const startDate = school.subscription_start_date;
    const endDate = school.subscription_end_date;
    
    // Lifetime plans never expire
    if (school.subscription_plan === 'lifetime') {
      return 'active';
    }
    
    // Trial period
    if (school.status === 'trial') {
      if (!endDate || endDate > now) {
        return 'trial';
      }
      return 'expired';
    }
    
    // Active subscription
    if (school.status === 'active') {
      if (!endDate || endDate > now) {
        return 'active';
      }
      return 'expired';
    }
    
    return school.status || 'unknown';
  }

  /**
   * Check if school can access a specific module
   */
  static async canAccessModule(schoolId, moduleCode) {
    try {
      const school = await School.findByPk(schoolId);
      if (!school) return false;

      // Check subscription status
      const status = this.calculateSubscriptionStatus(school);
      if (status === 'expired' || status === 'suspended') {
        return false;
      }

      // Get school's subscription plan with modules
      const subscriptionPlan = await SubscriptionPlan.findOne({
        where: { code: school.subscription_plan, is_active: true },
        include: [
          {
            model: Module,
            as: 'modules',
            through: { 
              attributes: ['is_enabled'],
              where: { is_enabled: true }
            },
            attributes: ['code'],
            where: { 
              code: moduleCode,
              is_active: true 
            },
            required: false
          }
        ]
      });

      return subscriptionPlan?.modules?.length > 0;
    } catch (error) {
      logger.error('Error checking module access:', error);
      return false;
    }
  }

  /**
   * Check school's resource limits
   */
  static async checkResourceLimits(schoolId, resourceType, currentCount) {
    try {
      const school = await School.findByPk(schoolId);
      if (!school) return { allowed: false, reason: 'School not found' };

      const subscriptionPlan = await SubscriptionPlan.findOne({
        where: { code: school.subscription_plan, is_active: true }
      });

      if (!subscriptionPlan) {
        return { allowed: false, reason: 'Invalid subscription plan' };
      }

      let limit;
      switch (resourceType) {
        case 'students':
          limit = subscriptionPlan.max_students;
          break;
        case 'staff':
          limit = subscriptionPlan.max_staff;
          break;
        case 'branches':
          limit = subscriptionPlan.max_branches;
          break;
        default:
          return { allowed: false, reason: 'Invalid resource type' };
      }

      // -1 means unlimited
      if (limit === -1) {
        return { allowed: true, limit: -1, current: currentCount };
      }

      const allowed = currentCount < limit;
      return {
        allowed,
        limit,
        current: currentCount,
        remaining: limit - currentCount,
        reason: allowed ? null : `${resourceType} limit exceeded`
      };
    } catch (error) {
      logger.error('Error checking resource limits:', error);
      return { allowed: false, reason: 'System error' };
    }
  }

  /**
   * Process subscription renewal request
   */
  static async processRenewalRequest(requestId, action, reviewedBy, notes = '') {
    const transaction = await sequelize.transaction();
    
    try {
      const request = await SubscriptionRenewalRequest.findByPk(requestId, {
        include: [
          { model: School, as: 'school' },
          { model: SubscriptionPlan, as: 'currentPlan' },
          { model: SubscriptionPlan, as: 'requestedPlan' }
        ],
        transaction
      });

      if (!request) {
        throw new ApiError(404, 'Renewal request not found');
      }

      if (request.status !== 'pending') {
        throw new ApiError(400, 'Request has already been processed');
      }

      const now = new Date();
      
      if (action === 'approve') {
        // Update request status
        await request.update({
          status: 'approved',
          reviewed_by: reviewedBy,
          reviewed_at: now,
          review_notes: notes,
          effective_date: now
        }, { transaction });

        // Update school subscription
        const school = await School.findByPk(request.school_id, { transaction });
        if (!school) {
          throw new ApiError(404, 'School not found');
        }

        const requestedPlan = await SubscriptionPlan.findOne({
          where: { code: request.requested_plan, is_active: true },
          transaction
        });

        if (!requestedPlan) {
          throw new ApiError(400, 'Requested plan not found');
        }

        // Calculate new subscription dates
        const newStartDate = now;
        let newEndDate = null;
        
        if (requestedPlan.billing_cycle === 'lifetime') {
          newEndDate = null; // Never expires
        } else if (requestedPlan.billing_cycle === 'monthly') {
          newEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else if (requestedPlan.billing_cycle === 'yearly') {
          newEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        }

        // Update school subscription
        await school.update({
          subscription_plan: requestedPlan.code,
          subscription_start_date: newStartDate,
          subscription_end_date: newEndDate,
          max_students: requestedPlan.max_students,
          max_staff: requestedPlan.max_staff,
          max_branches: requestedPlan.max_branches,
          status: requestedPlan.billing_cycle === 'lifetime' ? 'lifetime' : 'active'
        }, { transaction });

        // Create transaction record if payment is required
        if (request.payment_required && request.payment_amount > 0) {
          await Transaction.create({
            school_id: request.school_id,
            amount: request.payment_amount,
            currency: 'INR',
            type: 'subscription_change',
            status: 'completed',
            description: `Subscription change from ${request.current_plan} to ${request.requested_plan}`,
            reference: `RENEWAL_${request.id}`,
            created_by: reviewedBy
          }, { transaction });
        }

        // Clear cache
        await RedisUtils.del(`cache:school:${request.school_id}`);
        await RedisUtils.del('cache:schools:list');

        logger.info(`Subscription renewal request ${requestId} approved for school ${request.school_id}`);

      } else if (action === 'reject') {
        await request.update({
          status: 'rejected',
          reviewed_by: reviewedBy,
          reviewed_at: now,
          review_notes: notes
        }, { transaction });

        logger.info(`Subscription renewal request ${requestId} rejected for school ${request.school_id}`);
      }

      await transaction.commit();
      return { success: true, action };

    } catch (error) {
      await transaction.rollback();
      logger.error('Error processing renewal request:', error);
      throw error;
    }
  }

  /**
   * Check and update subscription statuses (cron job)
   */
  static async checkAndUpdateSubscriptionStatuses() {
    try {
      logger.info('Starting subscription status check...');
      
      const now = new Date();
      const schools = await School.findAll({
        where: {
          status: { [Op.in]: ['trial', 'active'] },
          subscription_end_date: { [Op.lt]: now }
        }
      });

      let updatedCount = 0;
      
      for (const school of schools) {
        const status = this.calculateSubscriptionStatus(school);
        
        if (status === 'expired' && school.status !== 'expired') {
          await school.update({ status: 'expired' });
          updatedCount++;
          
          logger.info(`School ${school.name} (${school.id}) subscription expired`);
          
          // TODO: Send notification to school admin
          // TODO: Send notification to super admin
        }
      }

      logger.info(`Subscription status check completed. Updated ${updatedCount} schools.`);
      return { updatedCount, totalChecked: schools.length };

    } catch (error) {
      logger.error('Error checking subscription statuses:', error);
      throw error;
    }
  }

  /**
   * Get subscription analytics for a school
   */
  static async getSchoolSubscriptionAnalytics(schoolId) {
    try {
      const school = await School.findByPk(schoolId, {
        include: [
          { model: User, as: 'users' },
          { model: Branch, as: 'branches' }
        ]
      });

      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      const subscriptionPlan = await SubscriptionPlan.findOne({
        where: { code: school.subscription_plan, is_active: true },
        include: [
          {
            model: Module,
            as: 'modules',
            through: { attributes: ['is_enabled'] },
            attributes: ['code', 'name', 'category']
          }
        ]
      });

      const currentStatus = this.calculateSubscriptionStatus(school);
      const daysRemaining = school.subscription_end_date ? 
        Math.ceil((school.subscription_end_date - new Date()) / (1000 * 60 * 60 * 24)) : null;

      // Get resource usage
      const studentCount = await school.countStudents();
      const staffCount = await school.countUsers({ where: { role: { [Op.ne]: 'student' } } });
      const branchCount = await school.countBranches();

      // Check resource limits
      const studentLimits = await this.checkResourceLimits(schoolId, 'students', studentCount);
      const staffLimits = await this.checkResourceLimits(schoolId, 'staff', staffCount);
      const branchLimits = await this.checkResourceLimits(schoolId, 'branches', branchCount);

      return {
        school: {
          id: school.id,
          name: school.name,
          status: currentStatus,
          subscription_plan: school.subscription_plan,
          subscription_start_date: school.subscription_start_date,
          subscription_end_date: school.subscription_end_date,
          days_remaining: daysRemaining
        },
        plan: subscriptionPlan ? {
          name: subscriptionPlan.name,
          description: subscriptionPlan.description,
          price: subscriptionPlan.price,
          billing_cycle: subscriptionPlan.billing_cycle,
          features: subscriptionPlan.features,
          modules: subscriptionPlan.modules.map(m => ({
            code: m.code,
            name: m.name,
            category: m.category,
            enabled: m.planModule.is_enabled
          }))
        } : null,
        usage: {
          students: {
            current: studentCount,
            limit: studentLimits.limit,
            remaining: studentLimits.remaining,
            percentage: studentLimits.limit > 0 ? Math.round((studentCount / studentLimits.limit) * 100) : 0
          },
          staff: {
            current: staffCount,
            limit: staffLimits.limit,
            remaining: staffLimits.remaining,
            percentage: staffLimits.limit > 0 ? Math.round((staffCount / staffLimits.limit) * 100) : 0
          },
          branches: {
            current: branchCount,
            limit: branchLimits.limit,
            remaining: branchLimits.remaining,
            percentage: branchLimits.limit > 0 ? Math.round((branchCount / branchLimits.limit) * 100) : 0
          }
        },
        limits: {
          students: studentLimits,
          staff: staffLimits,
          branches: branchLimits
        }
      };

    } catch (error) {
      logger.error('Error getting subscription analytics:', error);
      throw error;
    }
  }

  /**
   * Get system-wide subscription analytics
   */
  static async getSystemSubscriptionAnalytics() {
    try {
      const totalSchools = await School.count();
      const activeSchools = await School.count({ where: { status: 'active' } });
      const trialSchools = await School.count({ where: { status: 'trial' } });
      const expiredSchools = await School.count({ where: { status: 'expired' } });
      const lifetimeSchools = await School.count({ where: { status: 'lifetime' } });

      // Get plan distribution
      const planDistribution = await School.findAll({
        attributes: [
          'subscription_plan',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['subscription_plan'],
        raw: true
      });

      // Get revenue analytics
      const monthlyRevenue = await Transaction.sum('amount', {
        where: {
          type: 'subscription_payment',
          created_at: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      const yearlyRevenue = await Transaction.sum('amount', {
        where: {
          type: 'subscription_payment',
          created_at: {
            [Op.gte]: new Date(new Date().getFullYear(), 0, 1)
          }
        }
      });

      return {
        overview: {
          total_schools: totalSchools,
          active_schools: activeSchools,
          trial_schools: trialSchools,
          expired_schools: expiredSchools,
          lifetime_schools: lifetimeSchools,
          active_percentage: totalSchools > 0 ? Math.round((activeSchools / totalSchools) * 100) : 0
        },
        plan_distribution: planDistribution,
        revenue: {
          monthly: monthlyRevenue || 0,
          yearly: yearlyRevenue || 0
        }
      };

    } catch (error) {
      logger.error('Error getting system subscription analytics:', error);
      throw error;
    }
  }
}

module.exports = SubscriptionLifecycleService;
