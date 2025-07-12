const { sequelize } = require('../../config/database');
const { User, School, SubscriptionPlan, Transaction } = require('../../models');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');

class SubscriptionService {
  // Get all subscription plans
  static async getAllPlans(params = {}) {
    const { page = 1, limit = 10, is_active } = params;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (is_active !== undefined) {
      whereClause.is_active = is_active;
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
      ],
    });
    
    if (!plan) {
      throw new ApiError(404, 'Subscription plan not found');
    }
    
    return plan;
  }

  // Create new subscription plan
  static async createPlan(planData, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const plan = await SubscriptionPlan.create({
        ...planData,
        created_by: userId,
        updated_by: userId,
      }, { transaction });
      
      await transaction.commit();
      return plan;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Update subscription plan
  static async updatePlan(id, planData, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const plan = await SubscriptionPlan.findByPk(id);
      if (!plan) {
        throw new ApiError(404, 'Subscription plan not found');
      }
      
      await plan.update({
        ...planData,
        updated_by: userId,
      }, { transaction });
      
      await transaction.commit();
      return plan;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Delete subscription plan
  static async deletePlan(id) {
    const transaction = await sequelize.transaction();
    
    try {
      const plan = await SubscriptionPlan.findByPk(id);
      if (!plan) {
        throw new ApiError(404, 'Subscription plan not found');
      }
      
      // Check if any schools are using this plan
      const schoolsUsingPlan = await School.count({
        where: { subscription_plan: plan.code },
      });
      
      if (schoolsUsingPlan > 0) {
        throw new ApiError(400, `Cannot delete plan. ${schoolsUsingPlan} schools are currently using this plan.`);
      }
      
      await plan.destroy({ transaction });
      await transaction.commit();
      
      return { message: 'Subscription plan deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Get schools with subscription details
  static async getSchoolsWithSubscriptions(params = {}) {
    const { page = 1, limit = 10, search, status, subscription_plan } = params;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
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
    
    // Enhance school data with plan details
    const schoolsWithPlanDetails = rows.map(school => {
      const plan = planMap[school.subscription_plan];
      return {
        ...school.toJSON(),
        plan_details: plan || null,
        admin_user: school.users?.[0] || school.createdBy,
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
  static async createSchoolWithSubscription(schoolData, subscriptionData, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      // Validate subscription plan
      const plan = await SubscriptionPlan.findOne({
        where: { code: subscriptionData.plan_code, is_active: true },
      });
      
      if (!plan) {
        throw new ApiError(400, 'Invalid subscription plan');
      }
      
      // Create school
      const school = await School.create({
        ...schoolData,
        subscription_plan: plan.code,
        subscription_start_date: subscriptionData.start_date || new Date(),
        subscription_end_date: subscriptionData.end_date,
        max_students: plan.max_students,
        max_staff: plan.max_staff,
        max_branches: plan.max_branches,
        modules: plan.modules,
        status: subscriptionData.status || 'trial',
        created_by: userId,
        updated_by: userId,
      }, { transaction });
      
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
        await Transaction.create({
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
  static async updateSchoolSubscription(schoolId, subscriptionData, userId) {
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
      
      // NEW: Handle school data updates if provided
      if (subscriptionData.school) {
        const schoolUpdateData = {
          name: subscriptionData.school.name,
          code: subscriptionData.school.code,
          email: subscriptionData.school.email,
          phone: subscriptionData.school.phone,
          address: subscriptionData.school.address,
          city: subscriptionData.school.city,
          state: subscriptionData.school.state,
          country: subscriptionData.school.country,
          postal_code: subscriptionData.school.postal_code,
          website: subscriptionData.school.website,
          updated_by: userId
        };
        
        await school.update(schoolUpdateData, { transaction });
      }
      
      // NEW: Handle admin user updates if provided
      if (subscriptionData.admin) {
        const adminUser = await User.findOne({
          where: { school_id: schoolId, role: 'school_admin' }
        });
        
        if (adminUser) {
          const adminUpdateData = {
            first_name: subscriptionData.admin.first_name,
            last_name: subscriptionData.admin.last_name,
            email: subscriptionData.admin.email,
            phone: subscriptionData.admin.phone,
            updated_by: userId
          };
          
          await adminUser.update(adminUpdateData, { transaction });
        }
      }
      
      await school.update(updateData, { transaction });
      
      // Create transaction record if payment details provided
      if (subscriptionData.payment_amount && plan) {
        await Transaction.create({
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
        school,
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
    const transaction = await sequelize.transaction();
    
    try {
      // Validate school exists
      const school = await School.findByPk(transactionData.school_id);
      if (!school) {
        throw new ApiError(404, 'School not found');
      }
      
      // Validate subscription plan if provided
      if (transactionData.subscription_plan_id) {
        const plan = await SubscriptionPlan.findByPk(transactionData.subscription_plan_id);
        if (!plan) {
          throw new ApiError(404, 'Subscription plan not found');
        }
      }
      
      const newTransaction = await Transaction.create({
        ...transactionData,
        is_manual: true,
        created_by: userId,
        updated_by: userId,
      }, { transaction });
      
      await transaction.commit();
      return newTransaction;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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

  // Check subscription status and update if needed
  static async checkAndUpdateSubscriptionStatus(schoolId) {
    const school = await School.findByPk(schoolId);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }
    
    const now = new Date();
    let statusChanged = false;
    
    // Check if subscription has expired
    if (school.subscription_end_date && school.subscription_end_date < now) {
      if (school.status !== 'expired') {
        await school.update({ status: 'expired' });
        statusChanged = true;
        logger.info(`School ${school.name} subscription expired`);
      }
    }
    // Check if trial has ended
    else if (school.status === 'trial' && school.subscription_end_date && school.subscription_end_date < now) {
      await school.update({ status: 'expired' });
      statusChanged = true;
      logger.info(`School ${school.name} trial period ended`);
    }
    
    return { school, statusChanged };
  }
}

module.exports = SubscriptionService; 