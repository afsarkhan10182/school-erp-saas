const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { School, User, SubscriptionPlan, Transaction, SubscriptionRenewalRequest } = require('../../models');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');
const bcrypt = require('bcryptjs');

class SubscriptionService {
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
      ],
    });
    
    if (!plan) {
      throw new ApiError(404, 'Subscription plan not found');
    }
    
    return plan;
  }

  // Create new subscription plan
  static async createPlan(planData, userId) {
    const plan = await SubscriptionPlan.create({
      ...planData,
      created_by: userId,
      updated_by: userId,
    });
    
    return plan;
  }

  // Update subscription plan
  static async updatePlan(id, planData, userId) {
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      throw new ApiError(404, 'Subscription plan not found');
    }
    
    await plan.update({
      ...planData,
      updated_by: userId,
    });
    
    return plan;
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
    
    // If ID is provided, filter by specific school ID
    if (id) {
      whereClause.id = id;
    }
    
    if (search) {
      whereClause[sequelize.Op.or] = [
        { name: { [sequelize.Op.iLike]: `%${search}%` } },
        { code: { [sequelize.Op.iLike]: `%${search}%` } },
        { email: { [sequelize.Op.iLike]: `%${search}%` } },
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
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        },
        {
          model: User,
          as: 'users',
          where: { role: 'school_admin' },
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
          required: false,
        },
        {
          model: Transaction,
          as: 'transactions',
          attributes: ['id', 'transaction_id', 'amount', 'currency', 'payment_method', 'payment_status', 'transaction_status', 'notes', 'created_at'],
          order: [['created_at', 'DESC']],
          limit: 1, // Get only the latest transaction
          required: false,
        },
      ],
    });
    
    // Get subscription plans for reference
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'code', 'price', 'billing_cycle'],
    });
    
    const planMap = plans.reduce((acc, plan) => {
      acc[plan.code] = plan;
      return acc;
    }, {});
    
    // Enhance school data with plan details and latest payment info
    const schoolsWithPlanDetails = rows.map(school => {
      const plan = planMap[school.subscription_plan];
      const schoolData = school.toJSON();
      const latestTransaction = schoolData.transactions?.[0] || null;
      
      return {
        ...schoolData,
        plan_details: plan || null,
        admin_user: schoolData.users?.[0] || schoolData.createdBy,
        latest_payment: latestTransaction ? {
          transaction_id: latestTransaction.transaction_id,
          amount: latestTransaction.amount,
          currency: latestTransaction.currency,
          payment_method: latestTransaction.payment_method,
          payment_status: latestTransaction.payment_status,
          transaction_status: latestTransaction.transaction_status,
          notes: latestTransaction.notes,
          payment_date: latestTransaction.created_at,
        } : null,
      };
    });
    
    return {
      schools: schoolsWithPlanDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  // Create school with subscription
  static async createSchoolWithSubscription(schoolData, subscriptionData, userId, uploadedFiles = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      // Validate subscription plan
      const plan = await SubscriptionPlan.findOne({
        where: { code: subscriptionData.plan_code, is_active: true },
      });
      
      if (!plan) {
        throw new ApiError(400, 'Invalid subscription plan');
      }
      
      // Handle file uploads
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
      
      // Create school
      const schoolCreateData = {
        ...schoolData,
        ...fileData,
        subscription_plan: plan.code,
        subscription_start_date: subscriptionData.start_date || new Date(),
        max_students: plan.max_students,
        max_staff: plan.max_staff,
        max_branches: plan.max_branches,
        modules: plan.modules,
        status: subscriptionData.status || 'trial',
        created_by: userId,
        updated_by: userId,
      };
      
      // Only add end_date if it's valid
      if (subscriptionData.end_date && subscriptionData.end_date !== '' && !subscriptionData.end_date.includes('Invalid')) {
        schoolCreateData.subscription_end_date = subscriptionData.end_date;
      }
      
      const school = await School.create(schoolCreateData, { transaction });
      
      // Create school admin user
      const adminPassword = subscriptionData.admin_password || this.generatePassword();
      const adminUser = await User.create({
        first_name: subscriptionData.admin_first_name || 'School',
        last_name: subscriptionData.admin_last_name || 'Admin',
        email: subscriptionData.admin_email,
        phone: subscriptionData.admin_phone,
        password: adminPassword,
        role: 'school_admin',
        school_id: school.id,
        status: 'active',
        email_verified: true,
        created_by: userId,
        updated_by: userId,
      }, { transaction });
      
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
        admin_user: {
          ...adminUser.toJSON(),
          password: adminPassword, // Return password for display
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
    const { schoolData, subscriptionData } = data;
    const transaction = await sequelize.transaction();
    
    try {
      const school = await School.findByPk(schoolId);
      if (!school) {
        throw new ApiError(404, 'School not found');
      }
      
      // Validate new subscription plan if provided
      let plan = null;
      if (subscriptionData.plan_code) {
        plan = await SubscriptionPlan.findOne({
          where: { code: subscriptionData.plan_code, is_active: true },
        });
        
        if (!plan) {
          throw new ApiError(400, 'Invalid subscription plan');
        }
      }
      
      // Update school subscription details
      const updateData = {
        updated_by: userId,
      };
      
      if (plan) {
        updateData.subscription_plan = plan.code;
        updateData.max_students = plan.max_students;
        updateData.max_staff = plan.max_staff;
        updateData.max_branches = plan.max_branches;
        updateData.modules = plan.modules;
      }
      
      if (subscriptionData.start_date) {
        updateData.subscription_start_date = subscriptionData.start_date;
      }
      
      if (subscriptionData.end_date) {
        updateData.subscription_end_date = subscriptionData.end_date;
      }
      
      if (subscriptionData.status) {
        updateData.status = subscriptionData.status;
      }
      
      // Handle file uploads
      if (uploadedFiles.system_logo) {
        updateData.system_logo = uploadedFiles.system_logo.filename;
      }
      if (uploadedFiles.text_logo) {
        updateData.text_logo = uploadedFiles.text_logo.filename;
      }
      if (uploadedFiles.printing_logo) {
        updateData.printing_logo = uploadedFiles.printing_logo.filename;
      }
      if (uploadedFiles.report_card_design) {
        updateData.report_card_design = uploadedFiles.report_card_design.filename;
      }
      
      // Update basic school data
      if (schoolData) {
        Object.assign(updateData, schoolData);
      }
      
      // Handle admin user updates if provided
      if (subscriptionData.admin_email || subscriptionData.admin_first_name) {
        const adminUser = await User.findOne({
          where: { school_id: schoolId, role: 'school_admin' }
        });
        
        if (adminUser) {
          const adminUpdateData = {
            updated_by: userId
          };

          if (subscriptionData.admin_first_name) adminUpdateData.first_name = subscriptionData.admin_first_name;
          if (subscriptionData.admin_last_name) adminUpdateData.last_name = subscriptionData.admin_last_name;
          if (subscriptionData.admin_email) adminUpdateData.email = subscriptionData.admin_email;
          if (subscriptionData.admin_phone) adminUpdateData.phone = subscriptionData.admin_phone;
          
          // Handle password update if provided
          if (subscriptionData.admin_password) {
            adminUpdateData.password = await bcrypt.hash(subscriptionData.admin_password, 10);
          }
          
          await adminUser.update(adminUpdateData, { transaction });
        }
      }
      
      await school.update(updateData, { transaction });
      
      // Create transaction record if payment details provided
      if (subscriptionData.payment_amount && plan) {
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
          description: `Subscription upgrade for ${school.name}`,
          is_manual: true,
          created_by: userId,
          updated_by: userId,
        }, { transaction });
      }
      
      await transaction.commit();
      
      return {
        school: await School.findByPk(schoolId, {
          include: [
            {
              model: User,
              as: 'users',
              where: { role: 'school_admin' },
              attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
              required: false,
            },
          ],
        }),
        plan_details: plan,
      };
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
    const transaction = await Transaction.create({
      ...transactionData,
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
    
    const now = new Date();
    const endDate = new Date(school.subscription_end_date);
    
    if (school.subscription_end_date && now > endDate) {
      await school.update({ status: 'expired' });
      return { status: 'expired', message: 'Subscription has expired' };
    }
    
    // Check if subscription expires within 30 days
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (school.subscription_end_date && endDate <= thirtyDaysFromNow) {
      return { status: 'expiring_soon', message: 'Subscription expires soon' };
    }
    
    return { status: 'active', message: 'Subscription is active' };
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
      requested_plan_code,
      request_type,
      current_subscription_end_date: currentEndDate,
      requested_start_date: requestedStartDate,
      requested_end_date: requestedEndDate,
      billing_cycle,
      request_reason,
      requested_by: userId,
    });

    return renewalRequest;
  }

  // Get renewal requests (for super admin)
  static async getRenewalRequests(params = {}) {
    const { page = 1, limit = 10, status, school_id } = params;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (school_id) {
      whereClause.school_id = school_id;
    }

    const { count, rows } = await SubscriptionRenewalRequest.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
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

    return {
      requests: rows,
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

    return {
      requests: rows,
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
      }

      await transaction.commit();

      return request;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Get subscription statistics
  static async getSubscriptionStats() {
    const [
      totalSchools,
      activeSchools,
      trialSchools,
      expiredSchools,
      suspendedSchools,
      totalRevenue,
      monthlyRevenue,
      yearlyRevenue,
      pendingRequests,
    ] = await Promise.all([
      School.count(),
      School.count({ where: { status: 'active' } }),
      School.count({ where: { status: 'trial' } }),
      School.count({ where: { status: 'expired' } }),
      School.count({ where: { status: 'suspended' } }),
      Transaction.sum('amount', { where: { payment_status: 'completed' } }),
      Transaction.sum('amount', {
        where: {
          payment_status: 'completed',
          created_at: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      Transaction.sum('amount', {
        where: {
          payment_status: 'completed',
          created_at: {
            [Op.gte]: new Date(new Date().getFullYear(), 0, 1),
          },
        },
      }),
      SubscriptionRenewalRequest.count({ where: { status: 'pending' } }),
    ]);

    return {
      totalSchools,
      activeSchools,
      trialSchools,
      expiredSchools,
      suspendedSchools,
      totalRevenue: totalRevenue || 0,
      monthlyRevenue: monthlyRevenue || 0,
      yearlyRevenue: yearlyRevenue || 0,
      pendingRequests,
    };
  }
}

module.exports = SubscriptionService; 