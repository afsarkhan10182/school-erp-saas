const { School, Student, User, Branch, SubscriptionPlan } = require('../models');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');
const SchoolService = require('../services/school/school.service');

/**
 * Middleware to validate subscription limits before creating resources
 */
const validateSubscriptionLimits = async (req, res, next) => {
  try {
    // Skip validation for super admin
    if (req.user.role === 'super_admin') {
      return next();
    }

    const schoolId = req.user.school_id;
    if (!schoolId) {
      throw new ApiError(400, 'School ID is required for subscription validation');
    }

    // Get school and subscription plan details
    const school = await School.findByPk(schoolId);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Get plan strictly from database
    const plan = school.subscription_plan
      ? await SubscriptionPlan.findOne({
          where: { code: school.subscription_plan, is_active: true }
        })
      : null;

    if (!plan) {
      throw new ApiError(400, 'Invalid subscription plan');
    }

    // Check subscription status
    if (school.subscription_end_date && new Date() > new Date(school.subscription_end_date)) {
      throw new ApiError(403, 'Subscription has expired. Please renew your subscription to continue.');
    }

    // Validate based on the resource being created
    const resourceType = getResourceType(req.path, req.method);
    
    switch (resourceType) {
      case 'student':
        await validateStudentLimit(schoolId, plan);
        break;
      case 'user':
        await validateUserLimit(schoolId, plan);
        break;
      case 'branch':
        await validateBranchLimit(schoolId, plan);
        break;
    }

    next();
  } catch (error) {
    logger.error('Subscription validation error:', error);
    next(error);
  }
};

/**
 * Middleware to validate module access
 */
const validateModuleAccess = (requiredModule) => {
  return async (req, res, next) => {
    try {
      // Skip validation for super admin
      if (req.user.role === 'super_admin') {
        return next();
      }

      const schoolId = req.user.school_id;
      if (!schoolId) {
        throw new ApiError(400, 'School ID is required for module validation');
      }

      const school = await School.findByPk(schoolId);
      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      const isEnabled = await SchoolService.isModuleEnabled(school, requiredModule);
      if (!isEnabled) {
        throw new ApiError(403, `Module '${requiredModule}' is not available in your subscription plan. Please upgrade to access this feature.`);
      }

      next();
    } catch (error) {
      logger.error('Module access validation error:', error);
      next(error);
    }
  };
};

/**
 * Middleware to check subscription status
 */
const checkSubscriptionStatus = async (req, res, next) => {
  try {
    // Skip validation for super admin
    if (req.user.role === 'super_admin') {
      return next();
    }

    const schoolId = req.user.school_id;
    if (!schoolId) {
      return next();
    }

    const school = await School.findByPk(schoolId);
    if (!school) {
      return next();
    }

    // Check if subscription has expired
    if (school.subscription_end_date && new Date() > new Date(school.subscription_end_date)) {
      // For read operations, allow but add warning header
      if (req.method === 'GET') {
        res.set('X-Subscription-Expired', 'true');
        res.set('X-Subscription-Expired-Date', school.subscription_end_date);
        return next();
      }
      
      // For write operations, block access
      throw new ApiError(403, 'Subscription has expired. Please renew your subscription to continue.');
    }

    // Check if subscription expires within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    if (school.subscription_end_date && new Date(school.subscription_end_date) <= thirtyDaysFromNow) {
      res.set('X-Subscription-Expiring-Soon', 'true');
      res.set('X-Subscription-Expiry-Date', school.subscription_end_date);
    }

    next();
  } catch (error) {
    logger.error('Subscription status check error:', error);
    next(error);
  }
};

// Helper functions
const getResourceType = (path, method) => {
  if (method !== 'POST') return null;
  
  if (path.includes('/students')) return 'student';
  if (path.includes('/users')) return 'user';
  if (path.includes('/branches')) return 'branch';
  
  return null;
};

const validateStudentLimit = async (schoolId, plan) => {
  if (plan.max_students === -1) return; // Unlimited
  
  const studentCount = await Student.count({ 
    where: { 
      school_id: schoolId,
      status: { [require('sequelize').Op.ne]: 'deleted' }
    } 
  });
  
  if (studentCount >= plan.max_students) {
    throw new ApiError(403, `Student limit reached. Maximum ${plan.max_students} students allowed in your current plan. Please upgrade to add more students.`);
  }
};

const validateUserLimit = async (schoolId, plan) => {
  if (plan.max_staff === -1) return; // Unlimited
  
  const userCount = await User.count({ 
    where: { 
      school_id: schoolId,
      status: 'active',
      role: { [require('sequelize').Op.notIn]: ['super_admin', 'school_admin'] }
    } 
  });
  
  if (userCount >= plan.max_staff) {
    throw new ApiError(403, `Staff limit reached. Maximum ${plan.max_staff} staff members allowed in your current plan. Please upgrade to add more staff.`);
  }
};

const validateBranchLimit = async (schoolId, plan) => {
  if (plan.max_branches === -1) return; // Unlimited
  
  const branchCount = await Branch.count({ 
    where: { 
      school_id: schoolId,
      status: 'active'
    } 
  });
  
  if (branchCount >= plan.max_branches) {
    throw new ApiError(403, `Branch limit reached. Maximum ${plan.max_branches} branches allowed in your current plan. Please upgrade to add more branches.`);
  }
};

module.exports = {
  validateSubscriptionLimits,
  validateModuleAccess,
  checkSubscriptionStatus
}; 