const { logger } = require('./logger');

// Define only the roles that are actually implemented and used
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SCHOOL_ADMIN: 'school_admin',
  BRANCH_ADMIN: 'branch_admin',
  ACCOUNTANT: 'accountant', // Same as branch_admin for fee management
  TEACHER: 'teacher',
  LIBRARIAN: 'librarian',
  RECEPTIONIST: 'receptionist',
};

// Role hierarchy - higher roles can access lower role resources
const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 10,
  [ROLES.SCHOOL_ADMIN]: 9,
  [ROLES.BRANCH_ADMIN]: 8,
  [ROLES.ACCOUNTANT]: 8, // Same level as branch_admin
  [ROLES.TEACHER]: 7,
  [ROLES.LIBRARIAN]: 6,
  [ROLES.RECEPTIONIST]: 5,
};

// Role permissions mapping - only for implemented features
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    'manage_all_schools',
    'manage_all_branches',
    'manage_all_users',
    'manage_subscriptions',
    'view_all_data',
    'manage_system_settings',
    'manage_academic_years',
    'manage_fee_types',
    'manage_fee_structures',
    'generate_invoices',
    'manage_payments',
    'view_reports',
    'export_data',
    'manage_modules', // Can enable/disable modules
  ],
  [ROLES.SCHOOL_ADMIN]: [
    'manage_school',
    'manage_branches',
    'manage_users',
    'view_school_data',
    'manage_academic_structure',
    'manage_fee_types',
    'manage_fee_structures',
    'generate_invoices',
    'manage_payments',
    'view_reports',
    'export_data',
    'manage_modules', // Can enable/disable modules for their school
  ],
  [ROLES.BRANCH_ADMIN]: [
    'manage_branch',
    'view_branch_data',
    'manage_branch_users',
    'view_branch_reports',
    'manage_students',
    'view_fee_data',
    'generate_invoices',
    'record_payments',
  ],
  [ROLES.ACCOUNTANT]: [
    'view_branch_data',
    'view_branch_reports',
    'view_students',
    'view_fee_data',
    'generate_invoices',
    'record_payments',
    'view_financial_reports',
  ],
  [ROLES.TEACHER]: [
    'view_branch_data',
    'view_students',
    'manage_attendance',
    'manage_grades',
    'view_reports',
    'view_subjects',
    'view_subject_teachers',
    'view_class_subject_mappings',
    'view_academic_calendar',
    'view_timetable',
    'view_exams',
  ],
  [ROLES.LIBRARIAN]: [
    'view_branch_data',
    'manage_library',
    'manage_books',
    'view_students',
  ],
  [ROLES.RECEPTIONIST]: [
    'view_branch_data',
    'view_students',
    'manage_visitors',
    'manage_appointments',
  ],
};

// Role access scopes - simplified for actual implementation
const ROLE_SCOPES = {
  [ROLES.SUPER_ADMIN]: {
    school_access: 'all',
    branch_access: 'all',
    user_access: 'all',
    data_access: 'all',
  },
  [ROLES.SCHOOL_ADMIN]: {
    school_access: 'own',
    branch_access: 'own_school',
    user_access: 'own_school',
    data_access: 'own_school',
  },
  [ROLES.BRANCH_ADMIN]: {
    school_access: 'own',
    branch_access: 'own',
    user_access: 'own_branch',
    data_access: 'own_branch',
  },
  [ROLES.ACCOUNTANT]: {
    school_access: 'own',
    branch_access: 'own',
    user_access: 'own_branch',
    data_access: 'own_branch',
  },
  [ROLES.TEACHER]: {
    school_access: 'own',
    branch_access: 'own',
    user_access: 'own_branch',
    data_access: 'own_branch',
  },
  [ROLES.LIBRARIAN]: {
    school_access: 'own',
    branch_access: 'own',
    user_access: 'own_branch',
    data_access: 'own_branch',
  },
  [ROLES.RECEPTIONIST]: {
    school_access: 'own',
    branch_access: 'own',
    user_access: 'own_branch',
    data_access: 'own_branch',
  },
};

class RoleManager {
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(userRole, permission) {
    if (!userRole || !permission) {
      return false;
    }

    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if a user has any of the specified permissions
   */
  static hasAnyPermission(userRole, permissions) {
    if (!userRole || !permissions || !Array.isArray(permissions)) {
      return false;
    }

    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Check if a user has all of the specified permissions
   */
  static hasAllPermissions(userRole, permissions) {
    if (!userRole || !permissions || !Array.isArray(permissions)) {
      return false;
    }

    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Check if a user can access a specific school
   */
  static canAccessSchool(userRole, userSchoolId, targetSchoolId) {
    if (!userRole || !targetSchoolId) {
      return false;
    }

    const scope = ROLE_SCOPES[userRole];
    if (!scope) {
      return false;
    }

    // Super admin can access all schools
    if (scope.school_access === 'all') {
      return true;
    }

    // For other roles, userSchoolId is required and must match targetSchoolId
    if (!userSchoolId) {
      return false;
    }

    return userSchoolId === targetSchoolId;
  }

  /**
   * Check if a user can access a specific branch
   */
  static canAccessBranch(userRole, userSchoolId, userBranchId, targetSchoolId, targetBranchId) {
    if (!userRole || !targetSchoolId) {
      return false;
    }

    const scope = ROLE_SCOPES[userRole];
    if (!scope) {
      return false;
    }

    // Super admin can access all branches
    if (scope.branch_access === 'all') {
      return true;
    }

    // For other roles, userSchoolId is required and must have school access first
    if (!userSchoolId) {
      return false;
    }

    if (!this.canAccessSchool(userRole, userSchoolId, targetSchoolId)) {
      return false;
    }

    // Branch admin can only access their own branch
    if (userRole === ROLES.BRANCH_ADMIN) {
      return userBranchId === targetBranchId;
    }

    // Other roles can access all branches in their school
    return true;
  }

  /**
   * Check if a user can access a specific user
   */
  static canAccessUser(currentUser, targetUser) {
    if (!currentUser || !targetUser) {
      return false;
    }

    const scope = ROLE_SCOPES[currentUser.role];
    if (!scope) {
      return false;
    }

    // Super admin can access all users
    if (scope.user_access === 'all') {
      return true;
    }

    // User can always access their own data
    if (currentUser.id === targetUser.id) {
      return true;
    }

    // Check school access
    if (!this.canAccessSchool(currentUser.role, currentUser.school_id, targetUser.school_id)) {
      return false;
    }

    // Branch admin can only access users in their branch
    if (currentUser.role === ROLES.BRANCH_ADMIN) {
      return currentUser.branch_id === targetUser.branch_id;
    }

    // Other roles can access users in their school
    return true;
  }

  /**
   * Check if a user's role is higher than or equal to another role
   */
  static hasRoleOrHigher(userRole, requiredRole) {
    if (!userRole || !requiredRole) {
      return false;
    }

    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Get all roles that are higher than or equal to a given role
   */
  static getRolesHigherThanOrEqual(role) {
    if (!role) {
      return [];
    }

    const requiredLevel = ROLE_HIERARCHY[role] || 0;
    return Object.entries(ROLE_HIERARCHY)
      .filter(([_, level]) => level >= requiredLevel)
      .map(([roleName, _]) => roleName);
  }

  /**
   * Validate if a role is valid
   */
  static isValidRole(role) {
    return Object.values(ROLES).includes(role);
  }

  /**
   * Get all available roles
   */
  static getAllRoles() {
    return Object.values(ROLES);
  }

  /**
   * Get role permissions
   */
  static getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Get role scope
   */
  static getRoleScope(role) {
    return ROLE_SCOPES[role] || {};
  }

  /**
   * Check if user can perform action on resource
   */
  static canPerformAction(user, action, resource = null) {
    if (!user || !action) {
      return false;
    }

    // Check if user has the required permission
    if (!this.hasPermission(user.role, action)) {
      logger.debug(`User ${user.id} (${user.role}) lacks permission: ${action}`);
      return false;
    }

    // If no resource provided, permission check is sufficient
    if (!resource) {
      return true;
    }

    // Check resource-specific access
    if (resource.school_id && !this.canAccessSchool(user.role, user.school_id, resource.school_id)) {
      logger.debug(`User ${user.id} cannot access school ${resource.school_id}`);
      return false;
    }

    if (resource.branch_id && !this.canAccessBranch(user.role, user.school_id, user.branch_id, resource.school_id, resource.branch_id)) {
      logger.debug(`User ${user.id} cannot access branch ${resource.branch_id}`);
      return false;
    }

    return true;
  }

  /**
   * Create middleware for checking permissions
   */
  static requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return next(new Error('Authentication required'));
      }

      if (!this.hasPermission(req.user.role, permission)) {
        return next(new Error(`Permission denied: ${permission}`));
      }

      next();
    };
  }

  /**
   * Create middleware for checking any of multiple permissions
   */
  static requireAnyPermission(permissions) {
    return (req, res, next) => {
      if (!req.user) {
        return next(new Error('Authentication required'));
      }

      if (!this.hasAnyPermission(req.user.role, permissions)) {
        return next(new Error(`Permission denied: ${permissions.join(' or ')}`));
      }

      next();
    };
  }

  /**
   * Create middleware for checking all permissions
   */
  static requireAllPermissions(permissions) {
    return (req, res, next) => {
      if (!req.user) {
        return next(new Error('Authentication required'));
      }

      if (!this.hasAllPermissions(req.user.role, permissions)) {
        return next(new Error(`Permission denied: ${permissions.join(' and ')}`));
      }

      next();
    };
  }
}

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  ROLE_SCOPES,
  RoleManager,
}; 