const { sequelize } = require('~/config/database');
const { Op } = require('sequelize');
const { User, School, Branch } = require('~/models');
const SchoolService = require('~/services/administration/schools/school.service');
const AuthService = require('~/services/core/auth/auth.service');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const { success, error, asyncHandler } = require('~/utils/shared/apiResponse');
const { validate } = require('~/middleware/shared/validate');
const { verifyToken, authorize } = require('~/middleware/core/auth');
const RedisUtils = require('~/utils/shared/redis-utils');
const { RoleManager, ROLES } = require('~/utils/core/roleManager');

class SchoolController {
  static createSchool = asyncHandler(async (req, res) => {
    const schoolData = {
      ...req.body,
      ...req.files // Include uploaded files
    };
    const userId = req.user.id;

    // Add created_by field
    schoolData.created_by = userId;

    const school = await SchoolService.createSchool(schoolData);

    // Clear related caches
    await RedisUtils.del('cache:schools:list');
    await RedisUtils.del('cache:schools:stats');

    success(res, { school }, 'School created successfully', 201);
  });

  static getAllSchools = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, status } = req.query;
    const user = req.user;

    logger.info('getAllSchools controller called with user:', {
      userId: user.id,
      userRole: user.role,
      schoolId: user.school_id
    });

    // Apply tenant isolation for non-super admins
    if (user.role !== 'super_admin') {
      if (user.school_id) {
        // School admin can only see their own school
        const school = await SchoolService.getSchoolById(user.school_id, user);
        return success(res, {
          schools: [school],
          pagination: { page: 1, limit: 1, total: 1, pages: 1 }
        });
      } else {
        throw new ApiError(403, 'No school assigned');
      }
    }

    logger.info('Calling SchoolService.getAllSchools with params:', {
      page,
      limit,
      search,
      status
    });
    const result = await SchoolService.getAllSchools({ page, limit, search, status });
    logger.info('SchoolService.getAllSchools returned result:', {
      schoolsCount: result.schools?.length,
      pagination: result.pagination
    });
    success(res, result);
  });

  static getSchoolById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    // Use RoleManager for access control
    if (!RoleManager.canAccessSchool(user.role, user.school_id, id)) {
      throw new ApiError(403, 'Access denied');
    }

    const school = await SchoolService.getSchoolById(id, user);
    success(res, { school });
  });

  static updateSchool = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      ...req.files // Include uploaded files
    };
    const userId = req.user.id;

    // Add updated_by field
    updateData.updated_by = userId;

    const school = await SchoolService.updateSchool(id, updateData);

    // Clear related caches
    await RedisUtils.del(`school:${id}`);
    await RedisUtils.del('cache:schools:list');
    await RedisUtils.del('cache:schools:stats');

    success(res, { school }, 'School updated successfully');
  });

  // Get all staff members for a specific school
  static getSchoolStaff = asyncHandler(async (req, res) => {
    const { id: schoolId } = req.params;
    const { page = 1, limit = 10, search, role, status } = req.query;
    const user = req.user;

    // Access control - only super admin or school admin of this school can access
    if (user.role === 'super_admin') {
      // Allow super admin to access any school
    } else if (user.role === 'school_admin' && user.school_id !== schoolId) {
      throw new ApiError(403, 'Access denied');
    }

    const users = await User.findAndCountAll({
      where: {
        school_id: schoolId,
        role: { [Op.ne]: 'super_admin' }, // Exclude super admins
        ...(search && {
          [Op.or]: [
            { first_name: { [Op.iLike]: `%${search}%` } },
            { last_name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
          ]
        }),
        ...(role && { role }),
        ...(status && { status }),
        deleted_at: null
      },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    const result = {
      users: users.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.count,
        pages: Math.ceil(users.count / limit)
      }
    };

    success(res, result);
  });

  static deleteSchool = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await SchoolService.deleteSchool(id);

    // Clear related caches
    await RedisUtils.del(`school:${id}`);
    await RedisUtils.del('cache:schools:list');
    await RedisUtils.del('cache:schools:stats');

    success(res, null, 'School deleted successfully');
  });

  static suspendSchool = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const school = await SchoolService.updateSchool(id, {
      status: 'suspended',
      updated_by: userId
    });

    // Clear related caches
    await RedisUtils.del(`school:${id}`);
    await RedisUtils.del('cache:schools:list');
    await RedisUtils.del('cache:schools:stats');

    success(res, { school }, 'School suspended successfully');
  });

  static reactivateSchool = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const school = await SchoolService.updateSchool(id, {
      status: 'active',
      updated_by: userId
    });

    // Clear related caches
    await RedisUtils.del(`school:${id}`);
    await RedisUtils.del('cache:schools:list');
    await RedisUtils.del('cache:schools:stats');

    success(res, { school }, 'School reactivated successfully');
  });

  static getMySchool = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user.school_id) {
      throw new ApiError(404, 'No school assigned to this user');
    }

    const school = await SchoolService.getSchoolById(user.school_id, user);
    success(res, { school });
  });

  static updateMySchool = asyncHandler(async (req, res) => {
    const school = await School.findByPk(req.user.school_id);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    const updatedSchool = await school.update(req.body);
    res.json({
      success: true,
      message: 'School updated successfully',
      data: updatedSchool
    });
  });

  // Update school module settings (Super Admin only)
  static updateSchoolModules = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { modules, subscription_plan } = req.body;

    // Only super admin can update school modules
    if (req.user.role !== 'super_admin') {
      throw new ApiError(403, 'Only Super Admin can update school modules');
    }

    const school = await School.findByPk(id);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Import module configuration
    const { ModuleConfig } = require('~/utils/core/moduleConfig');

    // Validate modules if provided
    if (modules && !ModuleConfig.validateModules(modules)) {
      throw new ApiError(400, 'Invalid modules provided');
    }

    // If subscription plan is provided, get plan details and update accordingly
    let updatedModules = modules;
    let updateData = {};

    if (subscription_plan && subscription_plan !== school.subscription_plan) {
      // Get the plan details from the database
      const { SubscriptionPlan } = require('~/models');
      const plan = await SubscriptionPlan.findOne({
        where: { code: subscription_plan, is_active: true }
      });

      if (!plan) {
        throw new ApiError(400, 'Invalid subscription plan');
      }

      // Update with plan details
      updateData = {
        subscription_plan: plan.code,
        max_students: plan.max_students,
        max_staff: plan.max_staff,
        max_branches: plan.max_branches,
        modules: plan.modules,
        // Update status based on plan type
        status: plan.billing_cycle === 'lifetime' ? 'lifetime' : 'active'
      };

      // If this is a new subscription, set start date
      if (!school.subscription_start_date) {
        updateData.subscription_start_date = new Date();
        updateData.subscription_end_date =
          plan.billing_cycle === 'lifetime'
            ? null
            : new Date(
                Date.now() + (plan.billing_cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000
              );
      }
    } else {
      // Just update modules if no plan change
      if (modules) {
        updatedModules = modules;
      } else if (subscription_plan) {
        // Always pull modules from DB plan to avoid drift
        const { SubscriptionPlan } = require('~/models');
        const plan = await SubscriptionPlan.findOne({
          where: { code: subscription_plan, is_active: true }
        });
        if (!plan) {
          throw new ApiError(400, 'Invalid subscription plan');
        }
        updatedModules = plan.modules;
      }

      if (updatedModules) {
        updateData.modules = updatedModules;
      }
    }

    const updatedSchool = await school.update(updateData);

    res.json({
      success: true,
      message: 'School modules updated successfully',
      data: updatedSchool
    });
  });

  // Get school module settings (read-only for School Admin and Branch Admin)
  static getSchoolModules = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // School admin and branch admin can only view their own school's modules
    if (
      (req.user.role === 'school_admin' || req.user.role === 'branch_admin') &&
      req.user.school_id !== id
    ) {
      throw new ApiError(403, 'You can only view your own school modules');
    }

    const school = await School.findByPk(id);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    const { Module, SubscriptionPlan } = require('~/models');

    // Get school's subscription plan with modules
    const subscriptionPlan = await SubscriptionPlan.findOne({
      where: { code: school.subscription_plan, is_active: true },
      include: [
        {
          model: Module,
          as: 'modules',
          through: {
            attributes: ['is_required', 'is_enabled', 'sort_order'],
            as: 'planModule'
          },
          attributes: ['id', 'code', 'name', 'description', 'icon', 'category', 'is_core'],
          where: { is_active: true },
          required: false
        }
      ]
    });

    // Get all available modules for comparison
    const allModules = await Module.findAll({
      where: { is_active: true },
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC']
      ],
      attributes: ['id', 'code', 'name', 'description', 'icon', 'category', 'is_core']
    });

    // Get enabled modules for this school
    const enabledModules = subscriptionPlan?.modules || [];
    const enabledModuleCodes = enabledModules.map(m => m.code);

    // Get school's disabled modules
    const disabledModules = school.disabled_modules || [];

    // Create modules for display
    const modulesForDisplay = allModules.map(module => {
      const isInPlan = enabledModuleCodes.includes(module.code);
      const isDisabled = disabledModules.includes(module.code);
      const isEnabled = isInPlan && !isDisabled;

      return {
        id: module.id,
        key: module.code,
        code: module.code,
        name: module.name,
        description: module.description,
        icon: module.icon,
        category: module.category,
        is_core: module.is_core,
        enabled: isEnabled,
        canEnable: req.user.role === 'super_admin', // Only super admin can enable/disable
        upgradeRequired: !isInPlan
      };
    });

    // Get available subscription plans for upgrade
    const availablePlans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC']
      ],
      attributes: ['code', 'name', 'description', 'price', 'billing_cycle'],
      include: [
        {
          model: Module,
          as: 'modules',
          through: { attributes: [] },
          attributes: ['code', 'name', 'description', 'icon'],
          where: { is_active: true },
          required: false
        }
      ]
    });

    // Mark the current plan
    const plansWithCurrentFlag = availablePlans.map(plan => ({
      ...plan.toJSON(),
      isCurrentPlan: plan.code === school.subscription_plan
    }));

    res.json({
      success: true,
      message: 'School modules retrieved successfully',
      data: {
        modules: modulesForDisplay,
        subscription_plan: school.subscription_plan,
        plan_comparison: plansWithCurrentFlag,
        can_upgrade: req.user.role === 'school_admin',
        modules_updated_at: school.modules_updated_at
      }
    });
  });

  // Get available subscription plans (for upgrade requests) - from DB only
  static getSubscriptionPlans = asyncHandler(async (req, res) => {
    const { SubscriptionPlan } = require('~/models');
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC']
      ],
      attributes: [
        'code',
        'name',
        'description',
        'price',
        'billing_cycle',
        'modules',
        'max_students',
        'max_branches',
        'max_staff'
      ]
    });

    res.json({
      success: true,
      message: 'Subscription plans retrieved successfully',
      data: plans
    });
  });

  // Request subscription upgrade (School Admin only)
  static requestUpgrade = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { requested_plan, reason } = req.body;

    // Only school admin can request upgrades
    if (req.user.role !== 'school_admin') {
      throw new ApiError(403, 'Only School Admin can request upgrades');
    }

    // School admin can only request for their own school
    if (req.user.school_id !== id) {
      throw new ApiError(403, 'You can only request upgrade for your own school');
    }

    const school = await School.findByPk(id);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    const { SubscriptionPlan } = require('~/models');

    // Get requested plan from database
    const requestedPlanDetails = requested_plan
      ? await SubscriptionPlan.findOne({
          where: { code: requested_plan, is_active: true }
        })
      : null;

    if (!requestedPlanDetails) {
      throw new ApiError(400, 'Invalid subscription plan');
    }

    // Get current plan details from database
    const currentPlanDetails = school.subscription_plan
      ? await SubscriptionPlan.findOne({
          where: { code: school.subscription_plan, is_active: true }
        })
      : null;

    if (!currentPlanDetails) {
      throw new ApiError(400, 'Invalid current subscription plan');
    }

    // Check if it's actually an upgrade (compare prices)
    const requestedPrice = requestedPlanDetails.price || 0;
    const currentPrice = currentPlanDetails.price || 0;

    if (requestedPrice <= currentPrice) {
      throw new ApiError(400, 'Requested plan is not an upgrade');
    }

    // TODO: Create upgrade request in database
    // For now, just log the request
    logger.info(
      `Upgrade request from school ${school.name} (${id}): ${requested_plan} - ${reason}`
    );

    res.json({
      success: true,
      message: 'Upgrade request submitted successfully. We will contact you soon.',
      data: {
        requested_plan: requested_plan,
        current_plan: school.subscription_plan,
        reason: reason
      }
    });
  });
}

module.exports = SchoolController;
