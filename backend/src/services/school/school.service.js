const { Op } = require('sequelize');
const { School, User, Branch } = require('../../models');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');
const RedisUtils = require('../../utils/redis-utils');

class SchoolService {
  static isModuleEnabled(school, moduleName) {
    return school.subscription_plan && school.subscription_plan.modules && school.subscription_plan.modules.includes(moduleName);
  }

  static async createSchool(schoolData) {
    try {
      // Handle file uploads and settings
      const { system_logo, text_logo, printing_logo, report_card_design, currency_symbol, subscription_plan, ...basicData } = schoolData;
      
      // Prepare settings object
      const settings = {
        currency_symbol: currency_symbol || '₹',
        system_logo: system_logo ? `/uploads/${system_logo.filename}` : null,
        text_logo: text_logo ? `/uploads/${text_logo.filename}` : null,
        printing_logo: printing_logo ? `/uploads/${printing_logo.filename}` : null,
        report_card_design: report_card_design ? `/uploads/${report_card_design.filename}` : null
      };

      // If subscription plan is provided, validate and sync with plan
      let planData = {};
      if (subscription_plan) {
        const { SubscriptionPlan } = require('../../models');
        const plan = await SubscriptionPlan.findOne({
          where: { code: subscription_plan, is_active: true }
        });
        
        if (!plan) {
          throw new ApiError(400, 'Invalid subscription plan');
        }
        
        // Sync school data with plan
        planData = {
          subscription_plan: plan.code,
          max_students: plan.max_students,
          max_staff: plan.max_staff,
          max_branches: plan.max_branches,
          modules: plan.modules,
          status: plan.billing_cycle === 'lifetime' ? 'lifetime' : 'active',
          subscription_start_date: new Date(),
          subscription_end_date: plan.billing_cycle === 'lifetime' ? null : 
            new Date(Date.now() + (plan.billing_cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000)
        };
      }

      const school = await School.create({
        ...basicData,
        ...planData,
        settings
      });
      
      // Clear cache after creating new school
      await RedisUtils.del('cache:schools:list');
      await RedisUtils.del('cache:schools:stats');
      
      return school;
    } catch (error) {
      logger.error('Error in SchoolService.createSchool:', error);
      throw error;
    }
  }

  static async getAllSchools({ page = 1, limit = 10, search, status }) {
    try {
      logger.info('getAllSchools called with params:', { page, limit, search, status });
      
      const offset = (page - 1) * limit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status) {
        where.status = status;
      }

      logger.info('getAllSchools where clause:', where);
      logger.info('getAllSchools query params:', { limit: parseInt(limit), offset: parseInt(offset) });

      const { count, rows } = await School.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      logger.info('getAllSchools result:', { count, rowsCount: rows.length });

      const result = {
        schools: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      };

      // Cache the result for 5 minutes
      // await RedisUtils.set(cacheKey, result, 300);
      
      return result;
    } catch (error) {
      logger.error('Error in SchoolService.getAllSchools:', error);
      throw error;
    }
  }

  static async getSchoolById(id, user) {
    try {
      const cacheKey = `school:${id}`;
      
      // Try to get from cache first
      const cached = await RedisUtils.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for school details');
        return cached;
      }

      const school = await School.findByPk(id, {
        include: [
          {
            model: User,
            as: 'users',
            where: { role: 'school_admin' },
            required: false,
            attributes: { exclude: ['password'] },
          },
          {
            model: Branch,
            as: 'branches',
            attributes: ['id', 'name', 'status', 'created_at'],
          },
        ],
      });

      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      // Cache the result for 10 minutes
      await RedisUtils.set(cacheKey, school, 600);
      
      return school;
    } catch (error) {
      logger.error('Error in SchoolService.getSchoolById:', error);
      throw error;
    }
  }

  static async updateSchool(id, updateData) {
    try {
      const school = await School.findByPk(id);
      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      // Handle file uploads and settings
      const { system_logo, text_logo, printing_logo, report_card_design, currency_symbol, subscription_plan, ...basicData } = updateData;
      
      // Update settings if new values are provided
      const currentSettings = school.settings || {};
      const newSettings = {
        ...currentSettings,
        ...(currency_symbol && { currency_symbol }),
        ...(system_logo && { system_logo: `/uploads/${system_logo.filename}` }),
        ...(text_logo && { text_logo: `/uploads/${text_logo.filename}` }),
        ...(printing_logo && { printing_logo: `/uploads/${printing_logo.filename}` }),
        ...(report_card_design && { report_card_design: `/uploads/${report_card_design.filename}` })
      };

      // If subscription plan is being changed, validate and sync with plan
      let planData = {};
      if (subscription_plan && subscription_plan !== school.subscription_plan) {
        const { SubscriptionPlan } = require('../../models');
        const plan = await SubscriptionPlan.findOne({
          where: { code: subscription_plan, is_active: true }
        });
        
        if (!plan) {
          throw new ApiError(400, 'Invalid subscription plan');
        }
        
        // Sync school data with plan
        planData = {
          subscription_plan: plan.code,
          max_students: plan.max_students,
          max_staff: plan.max_staff,
          max_branches: plan.max_branches,
          modules: plan.modules,
          status: plan.billing_cycle === 'lifetime' ? 'lifetime' : 'active',
          subscription_start_date: new Date(),
          subscription_end_date: plan.billing_cycle === 'lifetime' ? null : 
            new Date(Date.now() + (plan.billing_cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000)
        };
      }

      await school.update({
        ...basicData,
        ...planData,
        settings: newSettings
      });
      
      // Clear cache after update
      await RedisUtils.del(`school:${id}`);
      await RedisUtils.del('cache:schools:list');
      await RedisUtils.del('cache:schools:stats');
      
      return school;
    } catch (error) {
      logger.error('Error in SchoolService.updateSchool:', error);
      throw error;
    }
  }

  static async deleteSchool(id) {
    try {
      const school = await School.findByPk(id);
      if (!school) {
        throw new ApiError(404, 'School not found');
      }

      await school.destroy();
      
      // Clear cache after deletion
      await RedisUtils.del(`school:${id}`);
      await RedisUtils.del('cache:schools:list');
      await RedisUtils.del('cache:schools:stats');
      
      return true;
    } catch (error) {
      logger.error('Error in SchoolService.deleteSchool:', error);
      throw error;
    }
  }

  static async getSchoolStats(schoolId) {
    try {
      const cacheKey = `school:stats:${schoolId}`;
      
      // Try to get from cache first
      const cached = await RedisUtils.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for school stats');
        return cached;
      }

      const [userCount, branchCount] = await Promise.all([
        User.count({ where: { school_id: schoolId } }),
        Branch.count({ where: { school_id: schoolId } }),
      ]);

      const stats = {
        totalUsers: userCount,
        totalBranches: branchCount,
        // Add more stats as needed
      };

      // Cache the result for 5 minutes
      await RedisUtils.set(cacheKey, stats, 300);
      
      return stats;
    } catch (error) {
      logger.error('Error in SchoolService.getSchoolStats:', error);
      throw error;
    }
  }
}

module.exports = SchoolService; 