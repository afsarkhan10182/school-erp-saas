const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const { getRedisClient } = require('../config/redis');
const ApiError = require('../utils/ApiError');

const verifyToken = async (req, res, next) => {
  try {
    logger.debug('Auth middleware - Request headers:', req.headers);
    logger.debug('Auth middleware - Request cookies:', req.cookies);
    
    // Get token from header or cookies
    let token;
    
    // 1. Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      logger.debug('Found token in Authorization header');
    } 
    // 2. Check auth-token cookie (frontend default)
    else if (req.cookies?.['auth-token']) {
      token = req.cookies['auth-token'];
      logger.debug('Found token in auth-token cookie');
    }
    // 3. Check token cookie (backend default)
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
    
    // Check if token is blacklisted
    try {
      const redisClient = await getRedisClient();
      const isBlacklisted = await redisClient.get(`bl_${token}`);
      
      if (isBlacklisted) {
        logger.warn('Token is blacklisted');
        return next(new ApiError(401, 'Session has been terminated'));
      }
    } catch (redisError) {
      logger.error('Redis error during token verification:', redisError);
      // Continue without blacklist check if Redis is unavailable
      logger.warn('Proceeding without Redis blacklist check');
    }

    // Add user to request object
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Unexpected error in auth middleware:', error);
    return next(new ApiError(401, 'Authentication failed'));
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role ${req.user.role} is not authorized to access this route`
        )
      );
    }
    next();
  };
};

// Role-based authorization middleware (alias for authorize)
const requireRole = (...roles) => {
  return (req, res, next) => {
    console.log('requireRole roles:', roles);
    console.log('req.user:', req.user);
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role ${req.user.role} is not authorized to access this route`
        )
      );
    }
    next();
  };
};

// School context middleware
const setSchoolContext = (req, res, next) => {
  // If user is a super admin, they can access any school
  if (req.user.role === 'super_admin') {
    // If school_id is provided in query/params, use it
    req.schoolId = req.query.school_id || req.params.school_id || req.body.school_id;
    return next();
  }
  
  // For other roles, they can only access their own school
  if (req.user.school_id) {
    req.schoolId = req.user.school_id;
    return next();
  }
  
  return next(new ApiError(403, 'Not authorized to access this school context'));
};

// Branch context middleware
const setBranchContext = (req, res, next) => {
  // Super admin and school admin can access any branch in their school
  if (['super_admin', 'school_admin'].includes(req.user.role)) {
    // If branch_id is provided in query/params, use it
    req.branchId = req.query.branch_id || req.params.branch_id || req.body.branch_id;
    return next();
  }
  
  // For other roles, they can only access their own branch
  if (req.user.branch_id) {
    req.branchId = req.user.branch_id;
    return next();
  }
  
  return next(new ApiError(403, 'Not authorized to access this branch context'));
};

// Tenant isolation middleware
const tenantIsolation = (model) => {
  return async (req, res, next) => {
    try {
      // For super admin, no tenant filtering
      if (req.user.role === 'super_admin') {
        return next();
      }
      
      // For school admin, filter by school_id
      if (req.user.role === 'school_admin' && req.schoolId) {
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
      next(error);
    }
  };
};

module.exports = {
  verifyToken,
  authorize,
  requireRole,
  setSchoolContext,
  setBranchContext,
  tenantIsolation,
};
