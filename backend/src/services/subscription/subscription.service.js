const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { School, User, SubscriptionPlan, Transaction, SubscriptionRenewalRequest, Branch, AcademicYear, Student, Module, PlanModule } = require('../../models');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');
const RedisUtils = require('../../utils/redis-utils');
const bcrypt = require('bcryptjs');

class SubscriptionService {
  // Helper method to handle file uploads
  static handleFileUploads(uploadedFiles = {}) {
    const fileData = {};
    if (uploadedFiles.system_logo) {
      fileData.system_logo = uploadedFiles.system_logo.filename;
    }
    if (uploadedFiles.text_logo) {
      fileData.text_logo = uploadedFiles.text_logo.filename;
    }
    if (uploadedFiles.printing_logo) {
      fileData.printing_logo = uploadedFiles.printing_logo.filename;
    }
    if (uploadedFiles.report_card_design) {
      fileData.report_card_design = uploadedFiles.report_card_design.filename;
    }
    return fileData;
  }

  // Helper method to validate and get subscription plan
  static async validateAndGetPlan(planCode) {
    if (!planCode) return null;
    
    const plan = await SubscriptionPlan.findOne({
      where: { code: planCode, is_active: true },
    });
    
    if (!plan) {
      throw new ApiError(400, 'Invalid subscription plan');
    }
    
    return plan;
  }

  // Helper method to calculate subscription dates and status
  static calculateSubscriptionDates(plan, startDate, trialDays, existingStartDate = null, existingEndDate = null) {
    if (!plan) {
      return {
        startDate: existingStartDate,
        endDate: existingEndDate,
        schoolStatus: 'active' // Default status
      };
    }

    const calculatedStartDate = startDate ? new Date(startDate) : new Date();
    const calculatedEndDate = this.calculateEndDate(calculatedStartDate, plan.billing_cycle, trialDays);
    const calculatedStatus = this.calculateSchoolStatus(plan.code, calculatedStartDate, calculatedEndDate);

    return {
      startDate: calculatedStartDate,
      endDate: calculatedEndDate,
      schoolStatus: calculatedStatus
    };
  }

  // Helper method to validate admin email
  static async validateAdminEmail(adminEmail, schoolId = null) {
    if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      throw new ApiError(400, 'Please provide a valid admin email address');
    }

    // Check if admin email already exists
    const whereClause = { email: adminEmail };
    if (schoolId) {
      // For updates, exclude current school
      whereClause.school_id = { [Op.ne]: schoolId };
    }

    const existingUser = await User.findOne({ where: whereClause });
    if (existingUser) {
      throw new ApiError(400, schoolId ? 'Admin email already exists for another school' : 'Admin email already exists');
    }
  }

  // Helper method to create or update admin user
  static async handleAdminUser(schoolId, subscriptionData, userId, transaction) {
    if (!subscriptionData.admin_email) return null;

    logger.info(`Processing admin user for school ${schoolId}:`, {
      admin_email: subscriptionData.admin_email,
      admin_first_name: subscriptionData.admin_first_name,
      admin_last_name: subscriptionData.admin_last_name,
      has_password: !!subscriptionData.admin_password,
      password_length: subscriptionData.admin_password?.length || 0
    });

    // Validate admin email
    await this.validateAdminEmail(subscriptionData.admin_email, schoolId);

    // Check if admin user already exists for this school
    let adminUser = await User.findOne({
      where: { 
        school_id: schoolId,
        role: 'school_admin'
      }
    });

    if (adminUser) {
      // Update existing admin user
      const adminUpdateData = {
        first_name: subscriptionData.admin_first_name || adminUser.first_name,
        last_name: subscriptionData.admin_last_name || adminUser.last_name,
        email: subscriptionData.admin_email,
        phone: subscriptionData.admin_phone || adminUser.phone,
        updated_by: userId,
      };

      // Only update password if provided
      if (subscriptionData.admin_password) {
        adminUpdateData.password = subscriptionData.admin_password;
        logger.info(`Updating admin user password for: ${adminUser.email}`);
      } else {
        logger.info(`No password update for admin user: ${adminUser.email}`);
      }

      await adminUser.update(adminUpdateData, { transaction });
      logger.info(`Updated admin user: ${adminUser.first_name} ${adminUser.last_name} (${adminUser.id})`);
    } else {
      // Create new admin user
      const adminPassword = subscriptionData.admin_password || this.generatePassword();
      logger.info(`Creating new admin user with password: ${adminPassword ? 'Provided' : 'Generated'}`);
      
      adminUser = await User.create({
        first_name: subscriptionData.admin_first_name || 'School',
        last_name: subscriptionData.admin_last_name || 'Admin',
        email: subscriptionData.admin_email,
        phone: subscriptionData.admin_phone,
        password: adminPassword,
        role: 'school_admin',
        school_id: schoolId,
        branch_id: null, // Will be assigned to first branch if exists
        status: 'active',
        email_verified: true,
        created_by: userId,
        updated_by: userId,
      }, { transaction });

      // Assign to first branch if exists
      const firstBranch = await Branch.findOne({
        where: { school_id: schoolId },
        order: [['created_at', 'ASC']]
      });
      
      if (firstBranch) {
        await adminUser.update({ branch_id: firstBranch.id }, { transaction });
      }

      logger.info(`Created admin user: ${adminUser.first_name} ${adminUser.last_name} (${adminUser.id})`);
    }

    return adminUser;
  }

  // Get all subscription plans
  static async getAllPlans(params = {}) {
    const { page = 1, limit = 10, is_active, billing_cycle } = params;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (is_active !== undefined) {
      whereClause.is_active = is_active;
    }
    
    if (billing_cycle) {
      whereClause.billing_cycle = billing_cycle;
    }
    
    const { count, rows } = await SubscriptionPlan.findAndCountAll({
      where: whereClause,
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
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
      ],
    });
    
    return {
      plans: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  // Get active plans for school/branch admins (limited fields)
  static async getActivePlansForSchools() {
    const rows = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'name', 'code', 'price', 'billing_cycle', 'max_students', 'max_staff', 'max_branches'],
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
    return rows;
  }

  // Get plan by ID
  static async getPlanById(id) {
    const plan = await SubscriptionPlan.findByPk(id, {
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
        {
          model: User,
          as: 'updatedBy',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
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
      ],
    });
    
    if (!plan) {
      throw new ApiError(404, 'Subscription plan not found');
    }
    
    return plan;
  }

  // Create new subscription plan
  static async createPlan(planData, userId) {
    const { modules, ...planFields } = planData;
    
    // Create the plan first
    const plan = await SubscriptionPlan.create({
      ...planFields,
      created_by: userId,
      updated_by: userId,
    });

    // If modules are provided, create plan-module relationships
    if (modules && Array.isArray(modules) && modules.length > 0) {
      // Validate that all modules exist
      const moduleCodes = modules.map(m => typeof m === 'string' ? m : m.code || m.key);
      const existingModules = await Module.findAll({
        where: { 
          code: moduleCodes,
          is_active: true 
        }
      });

      if (existingModules.length !== moduleCodes.length) {
        const foundCodes = existingModules.map(m => m.code);
        const missingCodes = moduleCodes.filter(code => !foundCodes.includes(code));
        throw new ApiError(400, `Invalid modules: ${missingCodes.join(', ')}`);
      }

      // Create plan-module relationships
      const planModules = existingModules.map((module, index) => ({
        subscription_plan_id: plan.id,
        module_id: module.id,
        is_required: module.is_core, // Core modules are required
        is_enabled: true,
        sort_order: index + 1,
        created_by: userId,
        updated_by: userId
      }));

      await PlanModule.bulkCreate(planModules);
    }
    
    return plan;
  }

  // Update subscription plan
  static async updatePlan(id, planData, userId) {
    const { modules, ...planFields } = planData;
    
    const plan = await SubscriptionPlan.findByPk(id, {
      include: [
        {
          model: Module,
          as: 'modules',
          through: { attributes: ['is_required', 'is_enabled', 'sort_order'] },
          attributes: ['id', 'code', 'name'],
          required: false
        }
      ]
    });
    
    if (!plan) {
      throw new ApiError(404, 'Subscription plan not found');
    }
    
    // Store old modules for comparison
    const oldModuleCodes = plan.modules.map(m => m.code).sort();
    
    // Update plan fields
    await plan.update({
      ...planFields,
      updated_by: userId,
    });
    
    // Handle modules update if provided
    if (modules && Array.isArray(modules)) {
      // Get current module codes
      const newModuleCodes = modules.map(m => typeof m === 'string' ? m : m.code || m.key).sort();
      
      // Check if modules actually changed
      if (JSON.stringify(oldModuleCodes) !== JSON.stringify(newModuleCodes)) {
        // Delete existing plan-module relationships
        await PlanModule.destroy({
          where: { subscription_plan_id: plan.id }
        });
        
        // Create new plan-module relationships
        if (modules.length > 0) {
          const moduleCodes = modules.map(m => typeof m === 'string' ? m : m.code || m.key);
          const existingModules = await Module.findAll({
            where: { 
              code: moduleCodes,
              is_active: true 
            }
          });
          
          if (existingModules.length !== moduleCodes.length) {
            const foundCodes = existingModules.map(m => m.code);
            const missingCodes = moduleCodes.filter(code => !foundCodes.includes(code));
            throw new ApiError(400, `Invalid modules: ${missingCodes.join(', ')}`);
          }
          
          const planModules = existingModules.map((module, index) => ({
            subscription_plan_id: plan.id,
            module_id: module.id,
            is_required: module.is_core,
            is_enabled: true,
            sort_order: index + 1,
            created_by: userId,
            updated_by: userId
          }));
          
          await PlanModule.bulkCreate(planModules);
        }
        
        // Sync all schools using this plan
        await this.syncSchoolsWithPlan(plan.code);
      }
    }
    
    // Return updated plan with modules
    return await this.getPlanById(id);
  }

  // Delete subscription plan
  static async deletePlan(id) {
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      throw new ApiError(404, 'Subscription plan not found');
    }
    
    // Check if plan is being used by any schools
    const schoolsUsingPlan = await School.count({
      where: { subscription_plan: plan.code },
    });
    
    if (schoolsUsingPlan > 0) {
      throw new ApiError(400, `Cannot delete plan. ${schoolsUsingPlan} schools are currently using this plan.`);
    }
    
    await plan.destroy();
    return true;
  }

  // Get schools with subscription details
  static async getSchoolsWithSubscriptions(params = {}) {
    const { page = 1, limit = 10, search, status, subscription_plan, id } = params;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    
    // Handle single school lookup
    if (id) {
      whereClause.id = id;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (subscription_plan) {
      whereClause.subscription_plan = subscription_plan;
    }
    
    const { count, rows } = await School.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'users',
          where: { role: 'school_admin' },
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
          required: false,
        },
      ],
    });
    
    // Transform the data to match frontend expectations
    const transformedSchools = await Promise.all(rows.map(async (school) => {
      const schoolData = school.toJSON();
      
      // Get admin user
      schoolData.admin_user = schoolData.users?.[0] || null;
      
      // Get subscription plan details
      if (schoolData.subscription_plan) {
        const plan = await SubscriptionPlan.findOne({
          where: { code: schoolData.subscription_plan, is_active: true },
          attributes: ['id', 'name', 'code', 'price', 'billing_cycle', 'max_students', 'max_staff', 'max_branches', 'description']
        });
        
        if (plan) {
          schoolData.plan_details = {
            id: plan.id,
            name: plan.name,
            code: plan.code,
            price: plan.price,
            billing_cycle: plan.billing_cycle,
            max_students: plan.max_students,
            max_staff: plan.max_staff,
            max_branches: plan.max_branches,
            description: plan.description
          };
        } else {
          // No fallback - return null if plan doesn't exist
          schoolData.plan_details = null;
        }
      } else {
        // No subscription plan - return null
        schoolData.plan_details = null;
      }
      
      return schoolData;
    }));

    return {
      schools: transformedSchools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  // Get single school with subscription
  static async getSchoolWithSubscription(schoolId) {
    const school = await School.findByPk(schoolId, {
      include: [
        {
          model: User,
          as: 'users',
          where: { role: 'school_admin' },
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'role'],
          required: false,
        },
      ],
    });
    
    if (!school) {
      return null;
    }
    
    // Transform the data to match the expected format
    const schoolData = school.toJSON();
    schoolData.admin_user = schoolData.users?.[0] || null;
    
    // Get subscription plan details
    if (schoolData.subscription_plan) {
      const plan = await SubscriptionPlan.findOne({
        where: { code: schoolData.subscription_plan, is_active: true },
        attributes: ['id', 'name', 'code', 'price', 'billing_cycle', 'max_students', 'max_staff', 'max_branches', 'description']
      });
      
      if (plan) {
        schoolData.plan_details = {
          id: plan.id,
          name: plan.name,
          code: plan.code,
          price: plan.price,
          billing_cycle: plan.billing_cycle,
          max_students: plan.max_students,
          max_staff: plan.max_staff,
          max_branches: plan.max_branches,
          description: plan.description
        };
      } else {
        // Fallback for trial or inactive plans
        schoolData.plan_details = {
          name: schoolData.subscription_plan === 'trial' ? 'Trial Plan' : schoolData.subscription_plan,
          code: schoolData.subscription_plan,
          price: schoolData.subscription_plan === 'trial' ? 0 : null,
          billing_cycle: schoolData.subscription_plan === 'trial' ? 'trial' : 'monthly',
          max_students: 100,
          max_staff: 20,
          max_branches: 1
        };
      }
    } else {
      // Default plan details if no subscription plan
      schoolData.plan_details = {
        name: 'No Plan',
        code: 'none',
        price: 0,
        billing_cycle: 'monthly',
        max_students: 0,
        max_staff: 0,
        max_branches: 0
      };
    }
    
    return schoolData;
  }

  // Create school with subscription
  static async createSchoolWithSubscription(schoolData, subscriptionData, userId, uploadedFiles = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      // Validate school code format
      if (!schoolData.code || !/^[A-Z0-9]+$/.test(schoolData.code)) {
        throw new ApiError(400, 'School code must contain only uppercase letters and numbers');
      }
      
      // Check if school code already exists
      const existingSchool = await School.findOne({ where: { code: schoolData.code } });
      if (existingSchool) {
        throw new ApiError(400, 'School code already exists');
      }
      
      // Validate subscription plan using helper method
      const plan = await this.validateAndGetPlan(subscriptionData.plan_code);
      
      // Validate admin email using helper method
      await this.validateAdminEmail(subscriptionData.admin_email);
      
      // Handle file uploads using helper method
      const fileData = this.handleFileUploads(uploadedFiles);
      
      // Calculate subscription dates and status using helper method
      const { startDate, endDate, schoolStatus } = this.calculateSubscriptionDates(
        plan, 
        subscriptionData.start_date, 
        subscriptionData.trial_days
      );
      
      // Create school
      const schoolCreateData = {
        ...schoolData,
        ...fileData,
        subscription_plan: plan.code,
        subscription_start_date: startDate,
        subscription_end_date: endDate,
        max_students: plan.max_students,
        max_staff: plan.max_staff,
        max_branches: plan.max_branches,
        modules: plan.modules,
        status: schoolStatus,
        created_by: userId,
        updated_by: userId,
      };
      
      const school = await School.create(schoolCreateData, { transaction });
      
      logger.info(`Created school: ${school.name} (${school.id})`);
      
      // Create first branch (Main Branch/Head Office)
      const branchName = schoolData.branch_name || 'Main Branch';
      
      // Generate a clean branch code that meets alphanumeric requirements
      // Remove any non-alphanumeric characters from school code and ensure it's uppercase
      const cleanSchoolCode = school.code.replace(/[^A-Z0-9]/g, '').toUpperCase();
      const branchCode = `${cleanSchoolCode}MB`;
      
      // Check if branch code already exists and make it unique if needed
      let finalBranchCode = branchCode;
      let counter = 1;
      while (await Branch.findOne({ where: { code: finalBranchCode } })) {
        finalBranchCode = `${cleanSchoolCode}MB${counter}`;
        counter++;
      }
      
      const branch = await Branch.create({
        name: branchName,
        code: finalBranchCode,
        school_id: school.id,
        address: schoolData.address || '',
        city: schoolData.city || '',
        state: schoolData.state || '',
        country: schoolData.country || 'India',
        postal_code: schoolData.postal_code || '',
        phone: schoolData.phone || '',
        email: schoolData.email || '',
        currency: schoolData.currency || 'INR',
        currency_symbol: schoolData.currency_symbol || '₹',
        is_main_branch: true,
        is_active: true,
        created_by: userId,
        updated_by: userId,
      }, { transaction });
      
      logger.info(`Created branch: ${branch.name} (${branch.id}) for school: ${school.name}`);
      
      // Link school to the current global academic year
      const currentGlobalYear = await AcademicYear.findOne({ 
        where: { is_current: true } 
      });
      
      if (currentGlobalYear) {
        await school.update({
          current_academic_year_id: currentGlobalYear.id
        }, { transaction });
        logger.info(`Linked school ${school.name} to current global academic year: ${currentGlobalYear.name}`);
      } else {
        logger.warn(`No current global academic year found. School ${school.name} will not be linked to any academic year.`);
      }
      
      // Create school admin user using helper method
      const adminUser = await this.handleAdminUser(school.id, subscriptionData, userId, transaction);
      
      // For new schools, assign admin to the first branch
      if (adminUser && !adminUser.branch_id) {
        await adminUser.update({ branch_id: branch.id }, { transaction });
      }
      
      // Create transaction record if payment details provided
      if (subscriptionData.payment_amount) {
        const transactionId = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await Transaction.create({
          transaction_id: transactionId,
          school_id: school.id,
          subscription_plan_id: plan.id,
          amount: subscriptionData.payment_amount,
          currency: subscriptionData.payment_currency || 'INR',
          payment_method: subscriptionData.payment_method || 'offline_cash',
          payment_status: 'completed',
          transaction_status: 'success',
          billing_cycle: plan.billing_cycle,
          subscription_start_date: school.subscription_start_date,
          subscription_end_date: school.subscription_end_date,
          description: `Initial subscription for ${school.name}`,
          is_manual: true,
          created_by: userId,
          updated_by: userId,
        }, { transaction });
      }
      
      await transaction.commit();
      
      return {
        school,
        branch,
        academic_year: currentGlobalYear, // Return the linked academic year
        admin_user: {
          ...adminUser.toJSON(),
          password: subscriptionData.admin_password || 'Generated password', // Return password for display
        },
        plan_details: plan,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Update school subscription
  static async updateSchoolSubscription(schoolId, data, userId, uploadedFiles = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      const school = await School.findByPk(schoolId);
      if (!school) {
        throw new ApiError(404, 'School not found');
      }
      
      // Extract school and subscription data from the nested structure
      const { schoolData, subscriptionData } = data;
      
      // Validate plan if it's being changed
      let plan = null;
      if (subscriptionData.plan_code && subscriptionData.plan_code !== school.subscription_plan) {
        plan = await this.validateAndGetPlan(subscriptionData.plan_code);
      }
      
      // Handle file uploads using helper method
      const fileData = this.handleFileUploads(uploadedFiles);
      
      // Calculate subscription dates and status using helper method
      const { startDate, endDate, schoolStatus } = this.calculateSubscriptionDates(
        plan, 
        subscriptionData.start_date, 
        subscriptionData.trial_days,
        school.subscription_start_date,
        school.subscription_end_date
      );
      
      // Update school data - combine school data and subscription data
      const updateData = {
        ...schoolData,
        ...fileData,
        updated_by: userId,
      };
      
      // Only update subscription-related fields if plan is changing
      if (plan) {
        updateData.subscription_plan = plan.code;
        updateData.subscription_start_date = startDate;
        updateData.subscription_end_date = endDate;
        updateData.max_students = plan.max_students;
        updateData.max_staff = plan.max_staff;
        updateData.max_branches = plan.max_branches;
        updateData.modules = plan.modules;
        updateData.status = schoolStatus;
      }
      
      await school.update(updateData, { transaction });
      
      logger.info(`Updated school subscription: ${school.name} (${school.id}) - Plan: ${plan ? plan.code : 'No change'}`);

      // Handle admin user creation/update using helper method
      const adminUser = await this.handleAdminUser(schoolId, subscriptionData, userId, transaction);

      // If plan changed, backfill transactions that have no plan reference
      if (plan) {
        try {
          await this.syncTransactionsWithCurrentPlan(school.id);
        } catch (syncErr) {
          logger.warn('syncTransactionsWithCurrentPlan failed:', syncErr);
        }
      }
      
      await transaction.commit();
      
      // Return school with admin user info
      const result = school.toJSON();
      if (adminUser) {
        result.admin_user = {
          ...adminUser.toJSON(),
          password: subscriptionData.admin_password || 'Password unchanged'
        };
        logger.info(`Returning admin user data for school ${school.name}:`, {
          admin_id: adminUser.id,
          admin_email: adminUser.email,
          has_password: !!result.admin_user.password,
          password_status: result.admin_user.password
        });
      }
      
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Get school transactions
  static async getSchoolTransactions(schoolId, params = {}) {
    const { page = 1, limit = 10, payment_status, payment_method } = params;
    const offset = (page - 1) * limit;
    
    const whereClause = { school_id: schoolId };
    
    if (payment_status) {
      whereClause.payment_status = payment_status;
    }
    
    if (payment_method) {
      whereClause.payment_method = payment_method;
    }
    
    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id', 'transaction_id', 'amount', 'currency', 'payment_method', 
        'payment_status', 'transaction_status', 'billing_cycle', 
        'subscription_start_date', 'subscription_end_date', 'description', 
        'gateway_transaction_id', 'gateway_name', 'receipt_url', 'notes', 
        'is_manual', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: SubscriptionPlan,
          as: 'subscriptionPlan',
          attributes: ['id', 'name', 'code', 'price', 'billing_cycle'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
    });
    
    // Log for debugging
    logger.info(`Found ${count} transactions for school ${schoolId}`);
    if (rows.length > 0) {
      logger.info(`First transaction created_at: ${rows[0].created_at}`);
    }
    
    return {
      transactions: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  // Create manual transaction
  static async createManualTransaction(transactionData, userId) {
    const { school_id, subscription_plan_id, billing_cycle } = transactionData;

    if (!school_id) {
      throw new ApiError(400, 'School ID is required for a transaction');
    }

    const school = await School.findByPk(school_id);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Validate dates - prevent future dates
    if (transactionData.subscription_start_date) {
      const startDate = new Date(transactionData.subscription_start_date);
      const now = new Date();
      if (startDate > now) {
        throw new ApiError(400, 'Subscription start date cannot be in the future');
      }
    }

    if (transactionData.subscription_end_date) {
      const endDate = new Date(transactionData.subscription_end_date);
      const now = new Date();
      if (endDate > now && billing_cycle !== 'lifetime') {
        throw new ApiError(400, 'Subscription end date cannot be in the future for non-lifetime plans');
      }
    }

    // Auto-attach current plan if not provided
    let planId = subscription_plan_id || null;
    let effectiveBillingCycle = billing_cycle;
    if (!planId) {
      const currentPlan = await SubscriptionPlan.findOne({ where: { code: school.subscription_plan, is_active: true } });
      if (currentPlan) {
        planId = currentPlan.id;
        if (!effectiveBillingCycle) {
          effectiveBillingCycle = currentPlan.billing_cycle;
        }
      }
    }

    // Handle lifetime subscriptions properly
    if (effectiveBillingCycle === 'lifetime') {
      transactionData.subscription_end_date = null; // Lifetime subscriptions don't expire
    }

    // Default statuses: mark immediate cash as completed/success if not explicitly provided
    const defaultedPaymentStatus = transactionData.payment_status
      ? transactionData.payment_status
      : (transactionData.payment_method === 'offline_cash' ? 'completed' : undefined);
    const defaultedTransactionStatus = transactionData.transaction_status
      ? transactionData.transaction_status
      : (transactionData.payment_method === 'offline_cash' ? 'success' : undefined);

    const transaction = await Transaction.create({
      ...transactionData,
      payment_status: defaultedPaymentStatus || transactionData.payment_status, // allow model defaults otherwise
      transaction_status: defaultedTransactionStatus || transactionData.transaction_status,
      subscription_plan_id: planId,
      billing_cycle: effectiveBillingCycle || transactionData.billing_cycle,
      created_by: userId,
      updated_by: userId,
    });
    
    return transaction;
  }

  // Generate random password
  static generatePassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Check and update subscription status
  static async checkAndUpdateSubscriptionStatus(schoolId) {
    const school = await School.findByPk(schoolId);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }
    
    // Check if it's a lifetime plan (no end date or billing_cycle is lifetime)
    const isLifetime = !school.subscription_end_date || school.subscription_end_date === null;
    
    if (isLifetime) {
      return { 
        status: 'lifetime', 
        message: 'Lifetime subscription - no expiration',
        days_remaining: null,
        is_lifetime: true
      };
    }
    
    const now = new Date();
    const endDate = new Date(school.subscription_end_date);
    
    if (now > endDate) {
      await school.update({ status: 'expired' });
      return { 
        status: 'expired', 
        message: 'Subscription has expired',
        days_remaining: 0,
        is_lifetime: false
      };
    }
    
    // Calculate days remaining
    const timeDiff = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Check if subscription expires within 30 days
    if (daysRemaining <= 30) {
      return { 
        status: 'expiring_soon', 
        message: `Subscription expires in ${daysRemaining} days`,
        days_remaining: daysRemaining,
        is_lifetime: false
      };
    }
    
    return { 
      status: 'active', 
      message: 'Subscription is active',
      days_remaining: daysRemaining,
      is_lifetime: false
    };
  }

  // Create subscription renewal request
  static async createRenewalRequest(requestData, userId) {
    const {
      school_id,
      requested_plan_code,
      request_type = 'renewal',
      billing_cycle = 'yearly',
      request_reason,
    } = requestData;

    // Validate school
    const school = await School.findByPk(school_id);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Ensure school has a subscription plan
    if (!school.subscription_plan) {
      throw new ApiError(400, 'School does not have a current subscription plan');
    }

    // Validate requested plan
    const requestedPlan = await SubscriptionPlan.findOne({
      where: { code: requested_plan_code, is_active: true },
    });
    if (!requestedPlan) {
      throw new ApiError(400, 'Invalid subscription plan');
    }

    // Calculate dates
    const currentEndDate = new Date(school.subscription_end_date || new Date());
    const requestedStartDate = new Date(currentEndDate);
    const requestedEndDate = new Date(requestedStartDate);

    // Set end date based on billing cycle
    if (billing_cycle === 'monthly') {
      requestedEndDate.setMonth(requestedEndDate.getMonth() + 1);
    } else if (billing_cycle === 'yearly') {
      requestedEndDate.setFullYear(requestedEndDate.getFullYear() + 1);
    } else if (billing_cycle === 'lifetime') {
      requestedEndDate.setFullYear(requestedEndDate.getFullYear() + 100); // Set to far future
    }

    const renewalRequest = await SubscriptionRenewalRequest.create({
      school_id,
      current_plan_code: school.subscription_plan,
      requested_plan_code: requested_plan_code,
      request_type,
      current_subscription_end_date: school.subscription_end_date || new Date(),
      requested_start_date: new Date(),
      requested_end_date: requestedEndDate,
      billing_cycle,
      status: 'pending',
      request_reason: request_reason,
      requested_by: userId,
      is_active: true,
    });

    return renewalRequest;
  }

  // Get renewal requests (for super admin)
  static async getRenewalRequests(params = {}) {
    const { page = 1, limit = 10, status, school_id, request_type } = params;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (school_id) {
      whereClause.school_id = school_id;
    }
    if (request_type) {
      whereClause.request_type = request_type;
    }

    const { count, rows } = await SubscriptionRenewalRequest.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id', 'school_id', 'current_plan_code', 'requested_plan_code', 
        'request_type', 'current_subscription_end_date', 'requested_start_date', 
        'requested_end_date', 'billing_cycle', 'status', 'request_reason', 
        'admin_notes', 'admin_response', 'requested_by', 'reviewed_by', 
        'reviewed_at', 'is_active', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'code', 'email'],
        },
        {
          model: User,
          as: 'requestedBy',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
        {
          model: User,
          as: 'reviewedBy',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
    });

    // Enhance with plan details
    const enhancedRequests = await Promise.all(rows.map(async (request) => {
      const requestData = request.toJSON();
      
      // Get current plan details
      if (requestData.current_plan_code) {
        const currentPlan = await SubscriptionPlan.findOne({
          where: { code: requestData.current_plan_code, is_active: true },
          attributes: ['id', 'name', 'code', 'price', 'billing_cycle', 'max_students', 'max_staff', 'max_branches', 'description']
        });
        requestData.current_plan_details = currentPlan;
      }
      
      // Get requested plan details
      if (requestData.requested_plan_code) {
        const requestedPlan = await SubscriptionPlan.findOne({
          where: { code: requestData.requested_plan_code, is_active: true },
          attributes: ['id', 'name', 'code', 'price', 'billing_cycle', 'max_students', 'max_staff', 'max_branches', 'description']
        });
        requestData.requested_plan_details = requestedPlan;
      }
      
      return requestData;
    }));

    return {
      requests: enhancedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  // Get renewal requests for a specific school
  static async getSchoolRenewalRequests(schoolId, params = {}) {
    const { page = 1, limit = 10, status } = params;
    const offset = (page - 1) * limit;

    const whereClause = { school_id: schoolId };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await SubscriptionRenewalRequest.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id', 'school_id', 'current_plan_code', 'requested_plan_code', 
        'request_type', 'current_subscription_end_date', 'requested_start_date', 
        'requested_end_date', 'billing_cycle', 'status', 'request_reason', 
        'admin_notes', 'admin_response', 'requested_by', 'reviewed_by', 
        'reviewed_at', 'is_active', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: User,
          as: 'requestedBy',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
        {
          model: User,
          as: 'reviewedBy',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
    });

    // Enhance with plan details
    const enhancedRequests = await Promise.all(rows.map(async (request) => {
      const requestData = request.toJSON();
      
      // Get current plan details
      if (requestData.current_plan_code) {
        const currentPlan = await SubscriptionPlan.findOne({
          where: { code: requestData.current_plan_code, is_active: true },
          attributes: ['id', 'name', 'code', 'price', 'billing_cycle', 'max_students', 'max_staff', 'max_branches', 'description']
        });
        requestData.current_plan_details = currentPlan;
      }
      
      // Get requested plan details
      if (requestData.requested_plan_code) {
        const requestedPlan = await SubscriptionPlan.findOne({
          where: { code: requestData.requested_plan_code, is_active: true },
          attributes: ['id', 'name', 'code', 'price', 'billing_cycle', 'max_students', 'max_staff', 'max_branches', 'description']
        });
        requestData.requested_plan_details = requestedPlan;
      }
      
      return requestData;
    }));

    return {
      requests: enhancedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  // Review renewal request (super admin only)
  static async reviewRenewalRequest(requestId, reviewData, userId) {
    const { status, admin_notes, admin_response } = reviewData;

    const request = await SubscriptionRenewalRequest.findByPk(requestId, {
      include: [
        {
          model: School,
          as: 'school',
        },
      ],
    });

    if (!request) {
      throw new ApiError(404, 'Renewal request not found');
    }

    if (request.status !== 'pending') {
      throw new ApiError(400, 'Request has already been reviewed');
    }

    const transaction = await sequelize.transaction();

    try {
      // Update request status
      await request.update(
        {
          status,
          admin_notes,
          admin_response,
          reviewed_by: userId,
          reviewed_at: new Date(),
        },
        { transaction }
      );

      // If approved, update school subscription
      if (status === 'approved') {
        const requestedPlan = await SubscriptionPlan.findOne({
          where: { code: request.requested_plan_code, is_active: true },
        });

        if (!requestedPlan) {
          throw new ApiError(400, 'Requested plan not found or inactive');
        }

        await request.school.update(
          {
            subscription_plan: request.requested_plan_code,
            subscription_start_date: request.requested_start_date,
            subscription_end_date: request.requested_end_date,
            max_students: requestedPlan.max_students,
            max_staff: requestedPlan.max_staff,
            max_branches: requestedPlan.max_branches,
            modules: requestedPlan.modules,
            status: 'active',
            updated_by: userId,
          },
          { transaction }
        );

        // Create transaction record
        const transactionId = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await Transaction.create(
          {
            transaction_id: transactionId,
            school_id: request.school_id,
            subscription_plan_id: requestedPlan.id,
            amount: requestedPlan.price,
            currency: requestedPlan.currency,
            payment_method: 'offline_cash',
            payment_status: 'completed',
            transaction_status: 'success',
            billing_cycle: request.billing_cycle,
            subscription_start_date: request.requested_start_date,
            subscription_end_date: request.requested_end_date,
            description: `Subscription ${request.request_type} for ${request.school.name}`,
            is_manual: true,
            created_by: userId,
            updated_by: userId,
          },
          { transaction }
        );

        // Backfill any missing transaction plan references after approval
        try {
          await this.syncTransactionsWithCurrentPlan(request.school_id);
        } catch (syncErr) {
          logger.warn('syncTransactionsWithCurrentPlan failed:', syncErr);
        }
      }

      await transaction.commit();

      return request;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Get subscription stats
  static async getSubscriptionStats() {
    try {
      const totalSchools = await School.count();
      const activeSchools = await School.count({ where: { status: 'active' } });
      const trialSchools = await School.count({ where: { subscription_plan: 'TRIAL' } });
      const expiredSchools = await School.count({
        where: {
          subscription_end_date: { [Op.lt]: new Date() }
        }
      });

      const planStats = await School.findAll({
        attributes: [
          'subscription_plan',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['subscription_plan'],
        raw: true
      });

      return {
        total_schools: totalSchools,
        active_schools: activeSchools,
        trial_schools: trialSchools,
        expired_schools: expiredSchools,
        plan_distribution: planStats
      };
    } catch (error) {
      logger.error('Error getting subscription stats:', error);
      throw error;
    }
  }

  // Check school's current usage against subscription limits
  static async checkSchoolUsage(schoolId) {
    try {
      const school = await School.findByPk(schoolId);
      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      // Get current plan strictly from database with modules
      const plan = school.subscription_plan
        ? await SubscriptionPlan.findOne({ 
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
          })
        : null;

      if (!plan) {
        throw new ApiError(400, 'Invalid subscription plan');
      }

      // Get current usage
      const studentCount = await Student.count({ 
        where: { 
          school_id: schoolId,
          status: { [Op.ne]: 'deleted' }
        } 
      });

      const userCount = await User.count({ 
        where: { 
          school_id: schoolId,
          status: 'active',
          role: { [Op.notIn]: ['super_admin', 'school_admin'] }
        } 
      });

      const branchCount = await Branch.count({ 
        where: { 
          school_id: schoolId,
          status: 'active'
        } 
      });

      // Use plan limits from database
      const maxStudents = plan.max_students;
      const maxStaff = plan.max_staff;
      const maxBranches = plan.max_branches;

      // Calculate usage percentages
      const studentUsage = maxStudents === -1 ? 0 : (studentCount / maxStudents) * 100;
      const userUsage = maxStaff === -1 ? 0 : (userCount / maxStaff) * 100;
      const branchUsage = maxBranches === -1 ? 0 : (branchCount / maxBranches) * 100;

      // Check if any limits are exceeded
      const limitsExceeded = {
        students: maxStudents !== -1 && studentCount >= maxStudents,
        users: maxStaff !== -1 && userCount >= maxStaff,
        branches: maxBranches !== -1 && branchCount >= maxBranches
      };

      // Get upgrade suggestions (from DB plans)
      const upgradeSuggestions = await this.getUpgradeSuggestions(school.subscription_plan, {
        students: studentCount,
        users: userCount,
        branches: branchCount
      });

      return {
        current_plan: school.subscription_plan,
        plan_details: {
          name: plan.name,
          description: plan.description,
          max_students: maxStudents,
          max_staff: maxStaff,
          max_branches: maxBranches,
          modules: plan.modules ? plan.modules.map(module => ({
            id: module.id,
            code: module.code,
            name: module.name,
            description: module.description,
            icon: module.icon,
            category: module.category,
            is_core: module.is_core,
            is_enabled: module.planModule?.is_enabled ?? true,
            is_required: module.planModule?.is_required ?? false
          })) : [],
          price: plan.price,
          billing_cycle: plan.billing_cycle
        },
        current_usage: {
          students: studentCount,
          users: userCount,
          branches: branchCount
        },
        usage_percentages: {
          students: Math.round(studentUsage),
          users: Math.round(userUsage),
          branches: Math.round(branchUsage)
        },
        limits_exceeded: limitsExceeded,
        upgrade_suggestions: upgradeSuggestions,
        subscription_status: await this.checkAndUpdateSubscriptionStatus(schoolId)
      };
    } catch (error) {
      logger.error('Error checking school usage:', error);
      throw error;
    }
  }

  // Get upgrade suggestions based on current usage (from DB plans only)
  static async getUpgradeSuggestions(currentPlanCode, usage) {
    const activePlans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['price', 'ASC']],
    });

    if (!activePlans || activePlans.length === 0) {
      return [];
    }

    const normalize = (v) => (v || '').toString().toUpperCase();
    const currentPlan = activePlans.find(
      (p) => normalize(p.code) === normalize(currentPlanCode)
    );

    if (!currentPlan) {
      return [];
    }

    const suggestions = [];

    for (const plan of activePlans) {
      if (normalize(plan.code) === normalize(currentPlan.code)) continue;

      const reasons = [];

      // Limits: suggest if current is exceeded and candidate can accommodate
      if (
        currentPlan.max_students !== -1 &&
        usage.students >= currentPlan.max_students &&
        (plan.max_students === -1 || usage.students <= plan.max_students)
      ) {
        reasons.push(
          `Supports ${plan.max_students === -1 ? 'unlimited' : plan.max_students} students (you have ${usage.students})`
        );
      }

      if (
        currentPlan.max_staff !== -1 &&
        usage.users >= currentPlan.max_staff &&
        (plan.max_staff === -1 || usage.users <= plan.max_staff)
      ) {
        reasons.push(
          `Supports ${plan.max_staff === -1 ? 'unlimited' : plan.max_staff} staff (you have ${usage.users})`
        );
      }

      if (
        currentPlan.max_branches !== -1 &&
        usage.branches >= currentPlan.max_branches &&
        (plan.max_branches === -1 || usage.branches <= plan.max_branches)
      ) {
        reasons.push(
          `Supports ${plan.max_branches === -1 ? 'unlimited' : plan.max_branches} branches (you have ${usage.branches})`
        );
      }

      // Additional modules in the candidate plan
      const currentModules = currentPlan.modules || [];
      const additionalModules = (plan.modules || []).filter(
        (module) => !currentModules.includes(module)
      );
      if (additionalModules.length > 0) {
        reasons.push(`Includes additional modules: ${additionalModules.join(', ')}`);
      }

      if (reasons.length > 0) {
        const currentPrice = Number(currentPlan.price || 0);
        const candidatePrice = Number(plan.price || 0);
        suggestions.push({
          plan_key: plan.code,
          plan_name: plan.name,
          price: candidatePrice,
          billing_cycle: plan.billing_cycle,
          reasons,
          is_recommended: candidatePrice > currentPrice ? 1 : 0,
        });
      }
    }

    suggestions.sort(
      (a, b) => b.is_recommended - a.is_recommended || Number(b.price) - Number(a.price)
    );

    return suggestions;
  }

  // Check and update subscription status for all schools
  static async checkAndUpdateAllSubscriptionStatuses() {
    try {
      const schools = await School.findAll({
        where: {
          status: ['trial', 'active'],
          subscription_end_date: {
            [Op.lt]: new Date() // Less than current date
          }
        }
      });

      let updatedCount = 0;
      for (const school of schools) {
        const newStatus = this.calculateSchoolStatus(
          school.subscription_plan,
          school.subscription_start_date,
          school.subscription_end_date
        );
        
        if (newStatus !== school.status) {
          await school.update({ status: newStatus });
          updatedCount++;
          logger.info(`Updated school ${school.name} status from ${school.status} to ${newStatus}`);
        }
      }

      return {
        totalChecked: schools.length,
        updatedCount,
        message: `Updated ${updatedCount} out of ${schools.length} schools`
      };
    } catch (error) {
      logger.error('Error checking subscription statuses:', error);
      throw error;
    }
  }

  // Calculate end date based on billing cycle and trial days
  static calculateEndDate(startDate, billingCycle, trialDays = 0) {
    if (billingCycle === 'lifetime') {
      return null; // Lifetime plans have no end date
    }
    
    const endDate = new Date(startDate);
    
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    // If it's a trial plan, add trial days
    if (trialDays > 0) {
      endDate.setDate(endDate.getDate() + trialDays);
    }
    
    return endDate;
  }

  // Calculate school status based on plan and dates
  static calculateSchoolStatus(planCode, startDate, endDate) {
    if (planCode === 'LIFETIME') {
      return 'lifetime';
    }
    
    const now = new Date();
    
    if (planCode === 'TRIAL') {
      return 'trial';
    }
    
    if (endDate && endDate < now) {
      return 'expired';
    }
    
    return 'active';
  }

  // Sync all schools using a specific plan with the plan's current modules and limits
  static async syncSchoolsWithPlan(planCode) {
    try {
      logger.info(`Starting sync of schools using plan: ${planCode}`);
      
      const plan = await SubscriptionPlan.findOne({
        where: { code: planCode, is_active: true }
      });
      
      if (!plan) {
        logger.error(`Plan ${planCode} not found or inactive`);
        return;
      }
      
      const schools = await School.findAll({
        where: { subscription_plan: planCode }
      });
      
      logger.info(`Found ${schools.length} schools using plan ${planCode}`);
      
      let updatedCount = 0;
      
      for (const school of schools) {
        const currentModules = school.modules || [];
        const planModules = plan.modules || [];
        
        // Check if modules or limits need updating
        const modulesChanged = currentModules.length !== planModules.length ||
          !currentModules.every(module => planModules.includes(module)) ||
          !planModules.every(module => currentModules.includes(module));
        
        const limitsChanged = school.max_students !== plan.max_students ||
          school.max_staff !== plan.max_staff ||
          school.max_branches !== plan.max_branches;
        
        if (modulesChanged || limitsChanged) {
          logger.info(`Updating school ${school.name} (${school.id}) with plan ${planCode} changes`);
          
          await school.update({
            modules: planModules,
            max_students: plan.max_students,
            max_staff: plan.max_staff,
            max_branches: plan.max_branches
          });
          
          updatedCount++;
        }
      }
      
      logger.info(`Sync completed for plan ${planCode}. Updated ${updatedCount} out of ${schools.length} schools.`);
      
      return {
        planCode,
        totalSchools: schools.length,
        updatedCount,
        message: `Updated ${updatedCount} out of ${schools.length} schools using plan ${planCode}`
      };
      
    } catch (error) {
      logger.error(`Error syncing schools with plan ${planCode}:`, error);
      throw error;
    }
  }

  // Sync all schools with their respective plans
  static async syncAllSchoolsWithPlans() {
    try {
      logger.info('Starting sync of all schools with their plans...');
      
      const plans = await SubscriptionPlan.findAll({
        where: { is_active: true }
      });
      
      const results = [];
      
      for (const plan of plans) {
        const result = await this.syncSchoolsWithPlan(plan.code);
        if (result) {
          results.push(result);
        }
      }
      
      const totalUpdated = results.reduce((sum, result) => sum + result.updatedCount, 0);
      const totalSchools = results.reduce((sum, result) => sum + result.totalSchools, 0);
      
      logger.info(`Global sync completed. Updated ${totalUpdated} out of ${totalSchools} schools across all plans.`);
      
      return {
        results,
        totalUpdated,
        totalSchools,
        message: `Updated ${totalUpdated} out of ${totalSchools} schools across all plans`
      };
      
    } catch (error) {
      logger.error('Error syncing all schools with plans:', error);
      throw error;
    }
  }

  // Ensure transactions without a plan reference point to the school's current plan
  static async syncTransactionsWithCurrentPlan(schoolId) {
    const school = await School.findByPk(schoolId);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    const plan = await SubscriptionPlan.findOne({ where: { code: school.subscription_plan, is_active: true } });
    if (!plan) {
      logger.warn(`No active plan found for school ${schoolId} during transaction sync`);
      return { updated: 0 };
    }

    const [updated] = await Transaction.update(
      { subscription_plan_id: plan.id },
      { where: { school_id: schoolId, subscription_plan_id: null } }
    );

    return { updated };
  }

  // Simple module disable/enable for school
  static async toggleSchoolModule(schoolId, moduleCode, enabled, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const school = await School.findByPk(schoolId);
      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      // Get current disabled modules
      const disabledModules = school.disabled_modules || [];
      
      let updatedDisabledModules;
      if (enabled) {
        // Enable module - remove from disabled list
        updatedDisabledModules = disabledModules.filter(module => module !== moduleCode);
      } else {
        // Disable module - add to disabled list
        updatedDisabledModules = [...new Set([...disabledModules, moduleCode])];
      }
      
      // Update school disabled modules and timestamp
      await school.update({
        disabled_modules: updatedDisabledModules,
        modules_updated_at: new Date(),
        updated_by: userId,
      }, { transaction });

      // Create audit log
      await Transaction.create({
        school_id: schoolId,
        amount: 0,
        currency: 'INR',
        payment_method: 'offline_cash',
        payment_status: 'completed',
        transaction_status: 'success',
        billing_cycle: 'monthly',
        description: `Module ${enabled ? 'enabled' : 'disabled'}: ${moduleCode}`,
        is_manual: true,
        created_by: userId,
        updated_by: userId,
      }, { transaction });

      await transaction.commit();
      
      // Clear module access cache for this school
      const cacheKey = `module_access:${schoolId}:${moduleCode}`;
      await RedisUtils.del(cacheKey);
      
      logger.info(`Module ${moduleCode} ${enabled ? 'enabled' : 'disabled'} for school ${school.name}`);
      return school;
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Get available modules for school (plan modules minus disabled)
  static async getAvailableModulesForSchool(schoolId) {
    try {
      const school = await School.findByPk(schoolId);

      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      // For now, return a simple response showing the disabled modules
      // In a real implementation, you would fetch the plan modules from the subscription plan
      const disabledModules = school.disabled_modules || [];

      return {
        all_plan_modules: [], // Would be populated from plan modules
        disabled_modules: disabledModules,
        available_modules: [], // Would be calculated as plan modules minus disabled
        school: school
      };
      
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SubscriptionService; 