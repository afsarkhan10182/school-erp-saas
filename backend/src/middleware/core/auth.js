const jwt = require('jsonwebtoken');
const { logger } = require('~/utils/shared/logger');
const { getRedisClient } = require('~/config/redis');
const ApiError = require('~/utils/shared/ApiError');
const { robustMiddleware, safeMiddleware } = require('~/middleware/shared/robust');
const { School, Branch } = require('~/models');
const auditContext = require('~/utils/shared/auditContext');

const verifyTokenRequest = async (req, res, next) => {
  try {
    // Get token from cookies or header (prioritize new accessToken cookie)
    let token;

    // 1. Check accessToken cookie (new secure cookie)
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
      logger.debug('Found token in accessToken cookie');
    }
    // 2. Check Authorization header (backward compatibility)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      logger.debug('Found token in Authorization header');
    }
    // 3. Check auth-token cookie (frontend legacy)
    else if (req.cookies?.['auth-token']) {
      token = req.cookies['auth-token'];
      logger.debug('Found token in auth-token cookie');
    }
    // 4. Check token cookie (backend legacy)
    else if (req.cookies?.token) {
      token = req.cookies.token;
      logger.debug('Found token in token cookie');
    }

    if (!token) {
      logger.warn('No authentication token found');
      return next(new ApiError(401, 'Not authorized to access this route - No token provided'));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      logger.debug('Token verified successfully', { userId: decoded?.id, role: decoded?.role });
    } catch (verifyError) {
      logger.error('Token verification failed:', verifyError);
      return next(new ApiError(401, 'Invalid or expired token'));
    }

    // Check if token is blacklisted (safe operation - continue if Redis fails)
    try {
      const redisClient = getRedisClient();
      if (redisClient) {
        const isBlacklisted = await redisClient.get(`bl_${token}`);

        if (isBlacklisted) {
          logger.warn('Token is blacklisted');
          return next(new ApiError(401, 'Session has been terminated'));
        }
      }
    } catch (redisError) {
      logger.error('Redis error during token verification:', redisError);
      // Continue without blacklist check if Redis is unavailable
      logger.warn('Proceeding without Redis blacklist check');
    }

    // Check if user's school is suspended (simple DB check)
    if (decoded.school_id && decoded.role !== 'super_admin') {
      try {
        const school = await School.findByPk(decoded.school_id, {
          attributes: ['id', 'status']
        });
        if (school && !['active', 'trial'].includes(school.status)) {
          logger.warn(`School ${decoded.school_id} is suspended, rejecting token`);
          return next(new ApiError(403, 'Your school account has been suspended. Please contact support.'));
        }
      } catch (error) {
        logger.error('Error checking school status:', error);
        // Continue if check fails to avoid blocking legitimate requests
      }
    }

    // Add user to request object
    req.user = decoded;
    auditContext.update({
      actor_id: decoded.id,
      actor_role: decoded.role,
      school_id: decoded.school_id || null,
      branch_id: decoded.branch_id || null
    });
    logger.debug('Token verification successful - User:', {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      school_id: decoded.school_id,
      branch_id: decoded.branch_id
    });
    next();
  } catch (error) {
    logger.error('Unexpected error in auth middleware:', error);
    return next(new ApiError(401, 'Authentication failed'));
  }
};

const verifyToken = (req, res, next) => auditContext.run({
  request_method: req.method,
  request_path: req.path
}, () => verifyTokenRequest(req, res, next));

// Role-based authorization middleware
const authorize = roles => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
      }

      // Ensure roles is an array
      const rolesArray = Array.isArray(roles) ? roles : [roles];

      const isAuthorized = rolesArray.includes(req.user.role);

      if (!isAuthorized) {
        return next(
          new ApiError(403, `User role ${req.user.role} is not authorized to access this route`)
        );
      }

      next();
    } catch (error) {
      logger.error('Authorization middleware error:', error);
      next(new ApiError(403, 'Authorization failed'));
    }
  };
};

// Role-based authorization middleware (alias for authorize)
const requireRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn('requireRole: No user found in request');
        return next(new ApiError(401, 'Authentication required'));
      }

      logger.debug('requireRole roles:', roles);
      logger.debug('req.user:', req.user);
      logger.debug('User role:', req.user.role);
      logger.debug('User school_id:', req.user.school_id);
      logger.debug('User branch_id:', req.user.branch_id);

      if (!roles.includes(req.user.role)) {
        logger.warn(
          `requireRole: User role ${req.user.role} not in allowed roles: ${roles.join(', ')}`
        );
        console.log('🚫 requireRole: Access denied for user:', {
          userRole: req.user.role,
          allowedRoles: roles,
          userId: req.user.id,
          userEmail: req.user.email
        });
        return next(
          new ApiError(403, `User role ${req.user.role} is not authorized to access this route`)
        );
      }
      next();
    } catch (error) {
      logger.error('requireRole middleware error:', error);
      next(new ApiError(403, 'Authorization failed'));
    }
  };
};

// School context middleware
const setSchoolContext = (req, res, next) => {
  try {
    // Check if user is properly authenticated
    if (!req.user) {
      logger.warn('setSchoolContext: No user found in request');
      return next(new ApiError(401, 'Authentication required'));
    }

    // Additional defensive check - but allow super_admin to proceed without school_id
    if (!req.user.school_id && req.user.role !== 'super_admin') {
      logger.warn('setSchoolContext: No school_id found for user in token:', req.user);
      return next(
        new ApiError(403, 'School context setup failed: User not associated with a school')
      );
    }

    logger.debug('setSchoolContext: Setting school context for user:', {
      role: req.user?.role,
      user_school_id: req.user?.school_id,
      query_school_id: req.query?.school_id,
      params_school_id: req.params?.school_id,
      body_school_id: req.body?.school_id
    });

    // If user is a super admin, they can access any school
    if (req.user.role === 'super_admin') {
      // Super admin can specify school_id via query, params, or body
      req.schoolId = req.query?.school_id || req.params?.school_id || req.body?.school_id;
      auditContext.update({ school_id: req.schoolId || null });

      // If no schoolId is provided for super admin, allow access to all schools
      if (!req.schoolId) {
        logger.debug(
          'setSchoolContext: Super admin - No school_id provided, allowing access to all schools'
        );
        req.schoolId = null; // This will be handled in the controller
        return next();
      }
      logger.debug('setSchoolContext: Super admin - schoolId set to:', req.schoolId);
      return next();
    }

    // For other roles, they can only access their assigned school
    req.schoolId = req.user.school_id;
    auditContext.update({ school_id: req.schoolId });
    logger.debug(
      'setSchoolContext: User role (' + req.user.role + ') - schoolId set to:',
      req.schoolId
    );

    // Optional: If a school_id is provided in query/params for non-super-admin, validate it matches user's school_id
    const requestSchoolId = req.query?.school_id || req.params?.school_id || req.body?.school_id;
    if (requestSchoolId && requestSchoolId !== req.schoolId) {
      logger.warn('setSchoolContext: User trying to access data outside their school context', {
        userSchoolId: req.schoolId,
        requestSchoolId: requestSchoolId
      });
      return next(new ApiError(403, 'Not authorized to access this school context'));
    }

    return next();
  } catch (error) {
    logger.error('setSchoolContext middleware error:', error);
    next(new ApiError(403, 'School context setup failed'));
  }
};

// Branch context middleware
const setBranchContext = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      logger.warn('setBranchContext: No user found in request');
      return next(new ApiError(401, 'Authentication required'));
    }

    // Super admin and school admin can access any branch in their school
    if (['super_admin', 'admin'].includes(req.user.role)) {
      // If branch_id is provided in query/params, use it
      req.branchId = req.query?.branch_id || req.params?.branch_id || req.body?.branch_id;
      auditContext.update({ branch_id: req.branchId || null });
      if (req.branchId) {
        const branch = await Branch.findByPk(req.branchId);
        if (!branch) return next(new ApiError(400, 'Invalid branch context'));
        if (req.schoolId && branch.school_id !== req.schoolId) {
          return next(new ApiError(403, 'Not authorized to access this branch context'));
        }
        if (req.user.role === 'super_admin' && !req.schoolId) {
          req.schoolId = branch.school_id;
          auditContext.update({ school_id: req.schoolId });
        }
      }
      logger.debug('setBranchContext: Super/School admin - branchId set to:', req.branchId);
      return next();
    }

    // For other roles, they can only access their own branch
    if (req.user.branch_id) {
      const requestBranchId = req.query?.branch_id || req.params?.branch_id || req.body?.branch_id;
      if (requestBranchId && requestBranchId !== req.user.branch_id) {
        return next(new ApiError(403, 'Not authorized to access this branch context'));
      }
      req.branchId = req.user.branch_id;
      auditContext.update({ branch_id: req.branchId });
      logger.debug(
        'setBranchContext: User role (' + req.user.role + ') - branchId set to:',
        req.branchId
      );
      return next();
    }

    return next(new ApiError(403, 'Not authorized to access this branch context'));
  } catch (error) {
    logger.error('setBranchContext middleware error:', error);
    next(new ApiError(403, 'Branch context setup failed'));
  }
};

// Tenant isolation middleware
const tenantIsolation = model => {
  return async (req, res, next) => {
    try {
      // For super admin, selected tenant context filters; no school stays global
      if (req.user.role === 'super_admin') {
        if (req.schoolId) req.where = { ...req.where, school_id: req.schoolId };
        if (req.branchId) req.where = { ...req.where, branch_id: req.branchId };
        return next();
      }

      // For school admin, filter by school_id
      if (req.user.role === 'admin' && req.schoolId) {
        req.where = { ...req.where, school_id: req.schoolId };
        return next();
      }

      // For branch staff, filter by branch_id
      if (req.branchId) {
        req.where = { ...req.where, branch_id: req.branchId };
        return next();
      }

      // For regular users, only allow access to their own data
      if (req.user.id) {
        const userIdField = model.name === 'User' ? 'id' : 'user_id';
        req.where = { ...req.where, [userIdField]: req.user.id };
        return next();
      }

      return next(new ApiError(403, 'Not authorized to access this resource'));
    } catch (error) {
      logger.error('tenantIsolation middleware error:', error);
      next(new ApiError(403, 'Tenant isolation failed'));
    }
  };
};

// Export wrapped middleware for better error handling
module.exports = {
  verifyToken,
  authorize,
  requireRole,
  setSchoolContext,
  setBranchContext, // removed safeMiddleware wrapper
  tenantIsolation // removed safeMiddleware wrapper
};
