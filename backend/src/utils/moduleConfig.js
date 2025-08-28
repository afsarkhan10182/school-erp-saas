const { logger } = require('./logger');

// Define all available modules in the system
const AVAILABLE_MODULES = {
  STUDENTS: 'students',
  FEES: 'fees',
  ATTENDANCE: 'attendance',
  EXAMS: 'exams',
  LIBRARY: 'library',
  TRANSPORT: 'transport',
  HR: 'hr',
  REPORTS: 'reports',
  SETTINGS: 'settings',
};

// Module descriptions for UI
const MODULE_DESCRIPTIONS = {
  [AVAILABLE_MODULES.STUDENTS]: {
    name: 'Student Management',
    description: 'Admit students, manage profiles, class assignments',
    icon: '👥',
    features: ['Student admission', 'Bulk import', 'Profile management', 'Class assignments']
  },
  [AVAILABLE_MODULES.FEES]: {
    name: 'Fee Management',
    description: 'Fee types, structures, invoices, and collections',
    icon: '💰',
    features: ['Fee types', 'Fee structures', 'Invoice generation', 'Payment tracking']
  },
  [AVAILABLE_MODULES.ATTENDANCE]: {
    name: 'Attendance',
    description: 'Track student and staff attendance',
    icon: '📊',
    features: ['Daily attendance', 'Reports', 'Notifications']
  },
  [AVAILABLE_MODULES.EXAMS]: {
    name: 'Examinations',
    description: 'Exam schedules, results, and grade management',
    icon: '📝',
    features: ['Exam scheduling', 'Result management', 'Grade reports']
  },
  [AVAILABLE_MODULES.LIBRARY]: {
    name: 'Library',
    description: 'Book management and lending system',
    icon: '📚',
    features: ['Book catalog', 'Issue/return', 'Fine management']
  },
  [AVAILABLE_MODULES.TRANSPORT]: {
    name: 'Transport',
    description: 'Bus routes and student transportation',
    icon: '🚌',
    features: ['Route management', 'Student assignments', 'Tracking']
  },
  [AVAILABLE_MODULES.HR]: {
    name: 'Human Resources',
    description: 'Staff management and payroll',
    icon: '👨‍💼',
    features: ['Staff profiles', 'Payroll', 'Leave management']
  },
  [AVAILABLE_MODULES.REPORTS]: {
    name: 'Advanced Reports',
    description: 'Comprehensive analytics and reporting',
    icon: '📈',
    features: ['Custom reports', 'Analytics', 'Data export']
  },
  [AVAILABLE_MODULES.SETTINGS]: {
    name: 'System Settings',
    description: 'School configuration and preferences',
    icon: '⚙️',
    features: ['School settings', 'User management', 'System preferences']
  },
};

// Subscription plans and their included modules
const SUBSCRIPTION_PLANS = {
  TRIAL: {
    name: 'Trial',
    description: 'Free trial with basic features',
    modules: [AVAILABLE_MODULES.STUDENTS, AVAILABLE_MODULES.FEES],
    max_students: 50,
    max_branches: 1,
    max_staff: 10,
    price: 0,
    duration_days: 30,
  },
  BASIC: {
    name: 'Basic',
    description: 'Essential school management features',
    modules: [AVAILABLE_MODULES.STUDENTS, AVAILABLE_MODULES.FEES, AVAILABLE_MODULES.SETTINGS],
    max_students: 200,
    max_branches: 2,
    max_staff: 25,
    price: 999,
    duration_days: 365,
  },
  PREMIUM: {
    name: 'Premium',
    description: 'Advanced features for growing schools',
    modules: [
      AVAILABLE_MODULES.STUDENTS,
      AVAILABLE_MODULES.FEES,
      AVAILABLE_MODULES.ATTENDANCE,
      AVAILABLE_MODULES.EXAMS,
      AVAILABLE_MODULES.SETTINGS,
      AVAILABLE_MODULES.REPORTS,
    ],
    max_students: 500,
    max_branches: 5,
    max_staff: 50,
    price: 1999,
    duration_days: 365,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'Complete school management solution',
    modules: Object.values(AVAILABLE_MODULES), // All modules
    max_students: -1, // Unlimited
    max_branches: -1, // Unlimited
    max_staff: -1, // Unlimited
    price: 4999,
    duration_days: 365,
  },
  LIFETIME: {
    name: 'Lifetime',
    description: 'Lifetime plan with unlimited access',
    modules: Object.values(AVAILABLE_MODULES), // All modules
    max_students: -1, // Unlimited
    max_branches: -1, // Unlimited
    max_staff: -1, // Unlimited
    price: 4999,
    duration_days: -1, // Lifetime
  },
};

// Utility functions for academic year and payment month calculations
const getAcademicYearMonths = (startingMonth = 6) => {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const month = ((startingMonth - 1 + i) % 12) + 1;
    months.push(month);
  }
  return months;
};

const getCurrentAcademicMonth = (startingMonth = 6) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  
  // Calculate which month of the academic year we're in
  let academicMonth = currentMonth - startingMonth + 1;
  if (academicMonth <= 0) {
    academicMonth += 12;
  }
  
  return {
    currentMonth,
    academicMonth,
    academicYear: getCurrentAcademicYear(startingMonth)
  };
};

const getCurrentAcademicYear = (startingMonth = 6) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // If current month is before starting month, academic year started last year
  if (currentMonth < startingMonth) {
    return `${currentYear - 1}-${currentYear}`;
  } else {
    return `${currentYear}-${currentYear + 1}`;
  }
};

const getMonthName = (monthNumber) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1];
};

const getPaymentMonthDisplay = (monthNumber, startingMonth = 6) => {
  const academicMonths = getAcademicYearMonths(startingMonth);
  const academicMonthIndex = academicMonths.indexOf(monthNumber);
  
  if (academicMonthIndex === -1) {
    return getMonthName(monthNumber);
  }
  
  const academicMonthNumber = academicMonthIndex + 1;
  return `${getMonthName(monthNumber)} (Month ${academicMonthNumber})`;
};

class ModuleConfig {
  /**
   * Get all available modules
   */
  static getAllModules() {
    return AVAILABLE_MODULES;
  }

  /**
   * Get module description
   */
  static getModuleDescription(moduleKey) {
    return MODULE_DESCRIPTIONS[moduleKey] || null;
  }

  /**
   * Get all module descriptions
   */
  static getAllModuleDescriptions() {
    return MODULE_DESCRIPTIONS;
  }

  /**
   * Get subscription plan details
   */
  static getSubscriptionPlan(planKey) {
    return SUBSCRIPTION_PLANS[planKey.toUpperCase()] || null;
  }

  /**
   * Get all subscription plans
   */
  static getAllSubscriptionPlans() {
    return SUBSCRIPTION_PLANS;
  }

  /**
   * Get modules for a subscription plan
   */
  static getModulesForPlan(planKey) {
    const plan = this.getSubscriptionPlan(planKey);
    return plan ? plan.modules : [];
  }

  /**
   * Check if a module is enabled for a school
   */
  static isModuleEnabled(school, moduleKey) {
    if (!school || !moduleKey) {
      return false;
    }

    const schoolModules = school.modules || [];
    return schoolModules.includes(moduleKey);
  }

  /**
   * Get enabled modules for a school
   */
  static getEnabledModules(school) {
    if (!school) {
      return [];
    }

    const schoolModules = school.modules || [];
    return schoolModules.filter(module => 
      Object.values(AVAILABLE_MODULES).includes(module)
    );
  }

  /**
   * Get disabled modules for a school
   */
  static getDisabledModules(school) {
    if (!school) {
      return Object.values(AVAILABLE_MODULES);
    }

    const enabledModules = this.getEnabledModules(school);
    return Object.values(AVAILABLE_MODULES).filter(module => 
      !enabledModules.includes(module)
    );
  }

  /**
   * Get modules that can be upgraded to
   */
  static getUpgradeableModules(school) {
    if (!school) {
      return [];
    }

    const currentPlan = school.subscription_plan || 'TRIAL';
    const currentModules = this.getModulesForPlan(currentPlan);
    const allModules = Object.values(AVAILABLE_MODULES);

    return allModules.filter(module => !currentModules.includes(module));
  }

  /**
   * Validate module list
   */
  static validateModules(modules) {
    if (!Array.isArray(modules)) {
      return false;
    }

    const validModules = Object.values(AVAILABLE_MODULES);
    return modules.every(module => validModules.includes(module));
  }

  /**
   * Get modules for display in UI (with descriptions)
   */
  static getModulesForDisplay(school) {
    const enabledModules = this.getEnabledModules(school);
    const disabledModules = this.getDisabledModules(school);

    const modules = [];

    // Add enabled modules
    enabledModules.forEach(moduleKey => {
      const description = this.getModuleDescription(moduleKey);
      if (description) {
        modules.push({
          ...description,
          key: moduleKey,
          enabled: true,
          canEnable: false, // School admin cannot enable/disable
        });
      }
    });

    // Add disabled modules
    disabledModules.forEach(moduleKey => {
      const description = this.getModuleDescription(moduleKey);
      if (description) {
        modules.push({
          ...description,
          key: moduleKey,
          enabled: false,
          canEnable: false, // School admin cannot enable/disable
          upgradeRequired: true,
        });
      }
    });

    return modules;
  }

  /**
   * Get subscription plan comparison for upgrade
   */
  static getPlanComparison(currentPlan) {
    const plans = this.getAllSubscriptionPlans();
    const comparison = [];

    Object.entries(plans).forEach(([planKey, plan]) => {
      comparison.push({
        key: planKey,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        modules: plan.modules.map(moduleKey => ({
          key: moduleKey,
          ...this.getModuleDescription(moduleKey),
        })),
        isCurrentPlan: planKey === currentPlan?.toUpperCase(),
        isUpgrade: plan.price > (currentPlan ? plans[currentPlan.toUpperCase()]?.price || 0 : 0),
      });
    });

    return comparison;
  }
}

module.exports = {
  AVAILABLE_MODULES,
  MODULE_DESCRIPTIONS,
  SUBSCRIPTION_PLANS,
  ModuleConfig,
  
  // Academic year utilities
  getAcademicYearMonths,
  getCurrentAcademicMonth,
  getCurrentAcademicYear,
  getMonthName,
  getPaymentMonthDisplay
}; 