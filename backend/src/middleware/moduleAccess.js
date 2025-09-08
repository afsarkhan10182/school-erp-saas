const SubscriptionLifecycleService = require('~/services/subscription/subscription-lifecycle.service');
const { logger } = require('~/utils/logger');
const ApiError = require('~/utils/ApiError');
const RedisUtils = require('~/utils/redis-utils');

/**
 * Middleware to check if the current user's school has access to a specific module
 * This follows industry standards for SaaS ERP systems with proper caching and validation
 */
const requireModuleAccess = (moduleCode) => {
  return async (req, res, next) => {
    try {
      // Super admin has access to all modules
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Get school context
      const schoolId = req.user.school_id || req.schoolId;
      if (!schoolId) {
        return next(new ApiError(403, 'School context required for module access'));
      }

      // Check cache first for performance
      const cacheKey = `module_access:${schoolId}:${moduleCode}`;
      const cachedAccess = await RedisUtils.get(cacheKey);
      
      if (cachedAccess !== null) {
        if (cachedAccess === 'true') {
          return next();
        } else {
          return next(new ApiError(403, `Module '${moduleCode}' is not available in your subscription plan`));
        }
      }

      // Check module access from database
      const hasAccess = await SubscriptionLifecycleService.canAccessModule(schoolId, moduleCode);
      
      // Cache the result for 5 minutes
      await RedisUtils.set(cacheKey, hasAccess.toString(), 300);

      if (hasAccess) {
        return next();
      } else {
        return next(new ApiError(403, `Module '${moduleCode}' is not available in your subscription plan`));
      }

    } catch (error) {
      logger.error('Error in module access middleware:', error);
      return next(new ApiError(500, 'Error checking module access'));
    }
  };
};

/**
 * Middleware to check resource limits before allowing operations
 * This prevents schools from exceeding their subscription limits
 */
const checkResourceLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      // Super admin bypasses resource limits
      if (req.user.role === 'super_admin') {
        return next();
      }

      const schoolId = req.user.school_id || req.schoolId;
      if (!schoolId) {
        return next(new ApiError(403, 'School context required for resource limit check'));
      }

      // Get current count based on resource type
      let currentCount = 0;
      const { School, Student, User, Branch } = require('~/models');

      switch (resourceType) {
        case 'students':
          currentCount = await Student.count({ where: { school_id: schoolId } });
          break;
        case 'staff':
          currentCount = await User.count({ 
            where: { 
              school_id: schoolId,
              role: { [require('sequelize').Op.ne]: 'student' }
            } 
          });
          break;
        case 'branches':
          currentCount = await Branch.count({ where: { school_id: schoolId } });
          break;
        default:
          return next(new ApiError(400, 'Invalid resource type'));
      }

      // Check limits
      const limitCheck = await SubscriptionLifecycleService.checkResourceLimits(
        schoolId, 
        resourceType, 
        currentCount
      );

      if (!limitCheck.allowed) {
        return next(new ApiError(403, `Resource limit exceeded: ${limitCheck.reason}. Please upgrade your subscription.`));
      }

      // Add limit info to request for potential use
      req.resourceLimits = limitCheck;
      return next();

    } catch (error) {
      logger.error('Error in resource limit middleware:', error);
      return next(new ApiError(500, 'Error checking resource limits'));
    }
  };
};

/**
 * Middleware to check subscription status
 * This ensures only active subscriptions can access premium features
 */
const requireActiveSubscription = () => {
  return async (req, res, next) => {
    try {
      // Super admin bypasses subscription checks
      if (req.user.role === 'super_admin') {
        return next();
      }

      const schoolId = req.user.school_id || req.schoolId;
      if (!schoolId) {
        return next(new ApiError(403, 'School context required for subscription check'));
      }

      // Check cache first
      const cacheKey = `subscription_status:${schoolId}`;
      const cachedStatus = await RedisUtils.get(cacheKey);
      
      let subscriptionStatus;
      if (cachedStatus !== null) {
        subscriptionStatus = cachedStatus;
      } else {
        // Get from database
        const { School } = require('~/models');
        const school = await School.findByPk(schoolId);
        
        if (!school) {
          return next(new ApiError(404, 'School not found'));
        }

        subscriptionStatus = SubscriptionLifecycleService.calculateSubscriptionStatus(school);
        
        // Cache for 10 minutes
        await RedisUtils.set(cacheKey, subscriptionStatus, 600);
      }

      // Allow access for active, trial, and lifetime subscriptions
      if (['active', 'trial', 'lifetime'].includes(subscriptionStatus)) {
        return next();
      } else {
        return next(new ApiError(403, 'Active subscription required. Your subscription has expired or been suspended.'));
      }

    } catch (error) {
      logger.error('Error in subscription status middleware:', error);
      return next(new ApiError(500, 'Error checking subscription status'));
    }
  };
};

/**
 * Middleware to check feature access based on subscription plan
 * This allows granular control over features based on plan level
 */
const requireFeatureAccess = (featureName) => {
  return async (req, res, next) => {
    try {
      // Super admin has access to all features
      if (req.user.role === 'super_admin') {
        return next();
      }

      const schoolId = req.user.school_id || req.schoolId;
      if (!schoolId) {
        return next(new ApiError(403, 'School context required for feature access'));
      }

      // Check cache first
      const cacheKey = `feature_access:${schoolId}:${featureName}`;
      const cachedAccess = await RedisUtils.get(cacheKey);
      
      if (cachedAccess !== null) {
        if (cachedAccess === 'true') {
          return next();
        } else {
          return next(new ApiError(403, `Feature '${featureName}' is not available in your subscription plan`));
        }
      }

      // Get school's subscription plan features
      const { School, SubscriptionPlan } = require('~/models');
      const school = await School.findByPk(schoolId);
      
      if (!school) {
        return next(new ApiError(404, 'School not found'));
      }

      const subscriptionPlan = await SubscriptionPlan.findOne({
        where: { code: school.subscription_plan, is_active: true }
      });

      if (!subscriptionPlan) {
        return next(new ApiError(403, 'Invalid subscription plan'));
      }

      // Check if feature is available in the plan
      const hasFeature = subscriptionPlan.features && 
        (subscriptionPlan.features[featureName] === true || 
         subscriptionPlan.features[featureName] !== undefined);

      // Cache the result for 5 minutes
      await RedisUtils.set(cacheKey, hasFeature.toString(), 300);

      if (hasFeature) {
        return next();
      } else {
        return next(new ApiError(403, `Feature '${featureName}' is not available in your subscription plan`));
      }

    } catch (error) {
      logger.error('Error in feature access middleware:', error);
      return next(new ApiError(500, 'Error checking feature access'));
    }
  };
};

/**
 * Middleware to validate subscription plan compatibility
 * This ensures operations are compatible with the current subscription plan
 */
const validatePlanCompatibility = (operation) => {
  return async (req, res, next) => {
    try {
      // Super admin bypasses plan compatibility checks
      if (req.user.role === 'super_admin') {
        return next();
      }

      const schoolId = req.user.school_id || req.schoolId;
      if (!schoolId) {
        return next(new ApiError(403, 'School context required for plan compatibility check'));
      }

      const { School, SubscriptionPlan } = require('~/models');
      const school = await School.findByPk(schoolId);
      
      if (!school) {
        return next(new ApiError(404, 'School not found'));
      }

      const subscriptionPlan = await SubscriptionPlan.findOne({
        where: { code: school.subscription_plan, is_active: true }
      });

      if (!subscriptionPlan) {
        return next(new ApiError(403, 'Invalid subscription plan'));
      }

      // Define operation compatibility rules
      const compatibilityRules = {
        'bulk_import': {
          'trial': false,
          'basic': true,
          'premium': true,
          'enterprise': true,
          'lifetime': true
        },
        'api_access': {
          'trial': false,
          'basic': false,
          'premium': true,
          'enterprise': true,
          'lifetime': true
        },
        'custom_branding': {
          'trial': false,
          'basic': false,
          'premium': true,
          'enterprise': true,
          'lifetime': true
        },
        'advanced_reports': {
          'trial': false,
          'basic': false,
          'premium': true,
          'enterprise': true,
          'lifetime': true
        },
        'white_label': {
          'trial': false,
          'basic': false,
          'premium': false,
          'enterprise': true,
          'lifetime': true
        }
      };

      const rule = compatibilityRules[operation];
      if (!rule) {
        return next(new ApiError(400, 'Unknown operation for compatibility check'));
      }

      const isCompatible = rule[subscriptionPlan.code];
      if (!isCompatible) {
        return next(new ApiError(403, `Operation '${operation}' is not available in your current subscription plan. Please upgrade to access this feature.`));
      }

      return next();

    } catch (error) {
      logger.error('Error in plan compatibility middleware:', error);
      return next(new ApiError(500, 'Error checking plan compatibility'));
    }
  };
};

/**
 * Middleware to clear module access cache when subscription changes
 * This ensures cache consistency when subscription plans are updated
 */
const clearModuleAccessCache = (schoolId) => {
  return async (req, res, next) => {
    try {
      // Clear all module access cache for this school
      const pattern = `module_access:${schoolId}:*`;
      const keys = await RedisUtils.keys(pattern);
      
      if (keys.length > 0) {
        await RedisUtils.del(...keys);
        logger.info(`Cleared ${keys.length} module access cache entries for school ${schoolId}`);
      }

      // Clear subscription status cache
      await RedisUtils.del(`subscription_status:${schoolId}`);
      
      // Clear feature access cache
      const featurePattern = `feature_access:${schoolId}:*`;
      const featureKeys = await RedisUtils.keys(featurePattern);
      
      if (featureKeys.length > 0) {
        await RedisUtils.del(...featureKeys);
        logger.info(`Cleared ${featureKeys.length} feature access cache entries for school ${schoolId}`);
      }

      return next();
    } catch (error) {
      logger.error('Error clearing module access cache:', error);
      // Don't fail the request if cache clearing fails
      return next();
    }
  };
};

module.exports = {
  requireModuleAccess,
  checkResourceLimit,
  requireActiveSubscription,
  requireFeatureAccess,
  validatePlanCompatibility,
  clearModuleAccessCache
};
