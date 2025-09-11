const { RoleManager, ROLES } = require('~/utils/roleManager');
const ApiError = require('~/utils/ApiError');
const { logger } = require('~/utils/logger');

/**
 * Middleware to validate if a user has the required role or higher
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
      }

      // Check if user's role is in the allowed roles
      const hasRole = allowedRoles.includes(req.user.role);

      if (!hasRole) {
        logger.warn(
          `Role validation failed: User ${req.user.id} (${req.user.role}) not in allowed roles: ${allowedRoles.join(', ')}`
        );
        return next(new ApiError(403, `Access denied. Required roles: ${allowedRoles.join(', ')}`));
      }

      next();
    } catch (error) {
      logger.error('Role validation middleware error:', error);
      next(new ApiError(403, 'Role validation failed'));
    }
  };
};

/**
 * Middleware to validate if a user has the required role or higher in hierarchy
 */
const requireRoleOrHigher = requiredRole => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
      }

      if (!RoleManager.hasRoleOrHigher(req.user.role, requiredRole)) {
        logger.warn(
          `Role hierarchy validation failed: User ${req.user.id} (${req.user.role}) cannot access role ${requiredRole}`
        );
        return next(new ApiError(403, `Access denied. Required role: ${requiredRole} or higher`));
      }

      next();
    } catch (error) {
      logger.error('Role hierarchy validation middleware error:', error);
      next(new ApiError(403, 'Role validation failed'));
    }
  };
};

/**
 * Middleware to validate if a user has the required permission
 */
const requirePermission = permission => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
      }

      if (!RoleManager.hasPermission(req.user.role, permission)) {
        logger.warn(
          `Permission validation failed: User ${req.user.id} (${req.user.role}) lacks permission: ${permission}`
        );
        return next(new ApiError(403, `Access denied. Required permission: ${permission}`));
      }

      next();
    } catch (error) {
      logger.error('Permission validation middleware error:', error);
      next(new ApiError(403, 'Permission validation failed'));
    }
  };
};

/**
 * Middleware to validate if a user has any of the required permissions
 */
const requireAnyPermission = permissions => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
      }

      if (!RoleManager.hasAnyPermission(req.user.role, permissions)) {
        logger.warn(
          `Permission validation failed: User ${req.user.id} (${req.user.role}) lacks any of permissions: ${permissions.join(', ')}`
        );
        return next(
          new ApiError(403, `Access denied. Required permissions: ${permissions.join(' or ')}`)
        );
      }

      next();
    } catch (error) {
      logger.error('Permission validation middleware error:', error);
      next(new ApiError(403, 'Permission validation failed'));
    }
  };
};

/**
 * Middleware to validate if a user has all required permissions
 */
const requireAllPermissions = permissions => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
      }

      if (!RoleManager.hasAllPermissions(req.user.role, permissions)) {
        logger.warn(
          `Permission validation failed: User ${req.user.id} (${req.user.role}) lacks all permissions: ${permissions.join(', ')}`
        );
        return next(
          new ApiError(403, `Access denied. Required permissions: ${permissions.join(' and ')}`)
        );
      }

      next();
    } catch (error) {
      logger.error('Permission validation middleware error:', error);
      next(new ApiError(403, 'Permission validation failed'));
    }
  };
};

/**
 * Middleware to validate school access
 */
const validateSchoolAccess = (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const targetSchoolId = req.params.schoolId || req.query.school_id || req.body.school_id;

    if (!targetSchoolId) {
      return next(new ApiError(400, 'School ID is required'));
    }

    if (!RoleManager.canAccessSchool(req.user.role, req.user.school_id, targetSchoolId)) {
      logger.warn(
        `School access validation failed: User ${req.user.id} (${req.user.role}) cannot access school ${targetSchoolId}`
      );
      return next(new ApiError(403, 'Access denied to this school'));
    }

    next();
  } catch (error) {
    logger.error('School access validation middleware error:', error);
    next(new ApiError(403, 'School access validation failed'));
  }
};

/**
 * Middleware to validate branch access
 */
const validateBranchAccess = (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const targetBranchId = req.params.branchId || req.query.branch_id || req.body.branch_id;

    if (!targetBranchId) {
      return next(new ApiError(400, 'Branch ID is required'));
    }

    // For branch access, we need to get the school_id from the branch
    // This would typically be done by fetching the branch first
    // For now, we'll assume the user has school access if they have branch access
    if (
      !RoleManager.canAccessBranch(
        req.user.role,
        req.user.school_id,
        req.user.branch_id,
        req.user.school_id,
        targetBranchId
      )
    ) {
      logger.warn(
        `Branch access validation failed: User ${req.user.id} (${req.user.role}) cannot access branch ${targetBranchId}`
      );
      return next(new ApiError(403, 'Access denied to this branch'));
    }

    next();
  } catch (error) {
    logger.error('Branch access validation middleware error:', error);
    next(new ApiError(403, 'Branch access validation failed'));
  }
};

/**
 * Middleware to validate user access
 */
const validateUserAccess = (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const targetUserId = req.params.userId || req.params.id;

    if (!targetUserId) {
      return next(new ApiError(400, 'User ID is required'));
    }

    // This would typically be done by fetching the target user first
    // For now, we'll assume the user has access if they're accessing their own data
    if (req.user.id === targetUserId) {
      return next();
    }

    // For other users, we need to check school/branch access
    // This would require fetching the target user's school_id and branch_id
    // For now, we'll use a simplified check
    if (!RoleManager.hasRoleOrHigher(req.user.role, 'school_admin')) {
      logger.warn(
        `User access validation failed: User ${req.user.id} (${req.user.role}) cannot access user ${targetUserId}`
      );
      return next(new ApiError(403, 'Access denied to this user'));
    }

    next();
  } catch (error) {
    logger.error('User access validation middleware error:', error);
    next(new ApiError(403, 'User access validation failed'));
  }
};

/**
 * Middleware to validate resource access based on action
 */
const validateResourceAccess = action => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
      }

      // Get resource from request
      const resource = {
        school_id: req.params.schoolId || req.query.school_id || req.body.school_id,
        branch_id: req.params.branchId || req.query.branch_id || req.body.branch_id,
        user_id: req.params.userId || req.params.id
      };

      if (!RoleManager.canPerformAction(req.user, action, resource)) {
        logger.warn(
          `Resource access validation failed: User ${req.user.id} (${req.user.role}) cannot perform ${action} on resource`,
          resource
        );
        return next(new ApiError(403, `Access denied for action: ${action}`));
      }

      next();
    } catch (error) {
      logger.error('Resource access validation middleware error:', error);
      next(new ApiError(403, 'Resource access validation failed'));
    }
  };
};

/**
 * Middleware to validate role assignment permissions
 */
const validateRoleAssignment = (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const { role: newRole } = req.body;

    // If no role is provided in the update, skip role validation
    if (!newRole) {
      return next();
    }

    // Validate that the role is valid
    if (!RoleManager.isValidRole(newRole)) {
      return next(new ApiError(400, `Invalid role: ${newRole}`));
    }

    // Check if user can assign this role
    const canAssignRole = RoleManager.hasRoleOrHigher(req.user.role, newRole);

    if (!canAssignRole) {
      logger.warn(
        `Role assignment validation failed: User ${req.user.id} (${req.user.role}) cannot assign role ${newRole}`
      );
      return next(new ApiError(403, `Cannot assign role: ${newRole}`));
    }

    next();
  } catch (error) {
    logger.error('Role assignment validation middleware error:', error);
    next(new ApiError(403, 'Role assignment validation failed'));
  }
};

module.exports = {
  requireRole,
  requireRoleOrHigher,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  validateSchoolAccess,
  validateBranchAccess,
  validateUserAccess,
  validateResourceAccess,
  validateRoleAssignment
};
