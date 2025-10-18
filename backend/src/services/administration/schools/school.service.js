const { Op } = require('sequelize');
const School = require('~/models/administration/school.model');
const User = require('~/models/core/user.model');
const Branch = require('~/models/administration/branch.model');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const RedisUtils = require('~/utils/shared/redis-utils');
const BaseService = require('~/services/shared/base.service');

class SchoolService {
  static async isModuleEnabled(school, moduleName) {
    if (!school || !moduleName) {
      return false;
    }

    const SubscriptionPlan = require('~/models/administration/subscription-plan.model');
    const Module = require('~/models/administration/module.model');

    // Get school's subscription plan with modules
    const subscriptionPlan = await SubscriptionPlan.findOne({
      where: { code: school.subscription_plan, is_active: true },
      include: [
        {
          model: Module,
          as: 'modules',
          through: {
            attributes: ['is_enabled'],
            where: { is_enabled: true }
          },
          attributes: ['code'],
          where: {
            code: moduleName,
            is_active: true
          },
          required: false
        }
      ]
    });

    return subscriptionPlan?.modules?.length > 0;
  }

  static async createSchool(schoolData) {
    return BaseService.executeWithErrorHandling(async () => {
      // Handle file uploads and settings using base service
      const {
        system_logo,
        text_logo,
        printing_logo,
        report_card_design,
        currency_symbol,
        subscription_plan,
        ...basicData
      } = schoolData;

      const settings = BaseService.createSettingsFromFiles(
        { system_logo, text_logo, printing_logo, report_card_design },
        { currency_symbol: currency_symbol || '₹' }
      );

      // If subscription plan is provided, validate and sync with plan
      let planData = {};
      if (subscription_plan) {
        const SubscriptionPlan = require('~/models/administration/subscription-plan.model');
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
          status: 'active',
          subscription_start_date: new Date(),
          subscription_end_date:
            plan.billing_cycle === 'lifetime'
              ? null
              : new Date(
                  Date.now() + (plan.billing_cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000
                )
        };
      }

      const school = await School.create({
        ...basicData,
        ...planData,
        settings,
        // Initialize receipt settings with required fields
        receipt_settings: {
          schoolName: basicData.name,
          defaultReceiptTitle: 'Fee Receipt'
        },
        // Initialize fee settings with required fields
        fee_settings: {
          defaultCurrency: basicData.currency || 'INR',
          defaultPaymentModel: basicData.default_payment_model || 'class_based'
        }
      });

      // Clear cache using base service
      await BaseService.clearCache(['cache:schools:list', 'cache:schools:stats']);

      return school;
    }, 'SchoolService.createSchool');
  }

  static async getAllSchools({ page = 1, limit = 10, search, status }) {
    return BaseService.executeWithErrorHandling(async () => {
      logger.info('getAllSchools called with params:', {
        page,
        limit,
        search,
        status
      });

      const { offset } = BaseService.sanitizePaginationParams({ page, limit });
      const where = {};

      // Use base service for search filter
      Object.assign(where, BaseService.buildSearchFilter(search, ['name', 'code', 'email']));

      if (status) {
        where.status = status;
      }

      logger.info('getAllSchools where clause:', where);
      logger.info('getAllSchools query params:', {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const { count, rows } = await School.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      logger.info('getAllSchools result:', { count, rowsCount: rows.length });

      // Use base service for pagination response
      return BaseService.buildPaginationResponse(rows, page, limit, count);
    }, 'SchoolService.getAllSchools');
  }

  static async getSchoolById(id, user) {
    const cacheKey = `school:${id}`;

    return BaseService.getFromCache(
      cacheKey,
      async () => {
        const school = await School.findByPk(id, {
          include: [
            {
              model: User,
              as: 'users',
              where: { role: 'admin' },
              required: false,
              attributes: { exclude: ['password'] }
            },
            {
              model: Branch,
              as: 'branches',
              attributes: ['id', 'name', 'status', 'created_at']
            }
          ]
        });

        if (!school) {
          throw new ApiError(404, 'School not found');
        }

        return school;
      },
      600
    );
  }

  static async updateSchool(id, updateData) {
    return BaseService.executeWithErrorHandling(async () => {
      const school = await BaseService.validateEntityExists(School, id, 'School');

      // Handle file uploads and settings using base service
      const {
        system_logo,
        text_logo,
        printing_logo,
        report_card_design,
        currency_symbol,
        subscription_plan,
        default_payment_model,
        ...basicData
      } = updateData;

      // Update settings if new values are provided
      const currentSettings = school.settings || {};
      const newSettings = {
        ...currentSettings,
        ...(currency_symbol && { currency_symbol }),
        ...BaseService.createSettingsFromFiles({
          system_logo,
          text_logo,
          printing_logo,
          report_card_design
        })
      };

      // Update fee settings if default_payment_model is provided
      let feeSettings = school.fee_settings || {};
      if (default_payment_model) {
        feeSettings = {
          ...feeSettings,
          defaultPaymentModel: default_payment_model
        };
      }

      // If subscription plan is being changed, validate and sync with plan
      let planData = {};
      if (subscription_plan && subscription_plan !== school.subscription_plan) {
        const SubscriptionPlan = require('~/models/administration/subscription-plan.model');
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
          status: 'active',
          subscription_start_date: new Date(),
          subscription_end_date:
            plan.billing_cycle === 'lifetime'
              ? null
              : new Date(
                  Date.now() + (plan.billing_cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000
                )
        };
      }

      await school.update({
        ...basicData,
        ...planData,
        settings: newSettings,
        fee_settings: feeSettings
      });

      // Clear cache using base service
      await BaseService.clearCache([`school:${id}`, 'cache:schools:list', 'cache:schools:stats']);

      return school;
    }, 'SchoolService.updateSchool');
  }

  static async deleteSchool(id) {
    return BaseService.executeWithErrorHandling(async () => {
      const school = await BaseService.validateEntityExists(School, id, 'School');
      await school.destroy();

      // Clear cache using base service
      await BaseService.clearCache([`school:${id}`, 'cache:schools:list', 'cache:schools:stats']);

      return true;
    }, 'SchoolService.deleteSchool');
  }

  static async getSchoolStats(schoolId) {
    const cacheKey = `school:stats:${schoolId}`;

    return BaseService.getFromCache(
      cacheKey,
      async () => {
        const [userCount, branchCount] = await Promise.all([
          User.count({ where: { school_id: schoolId } }),
          Branch.count({ where: { school_id: schoolId } })
        ]);

        const stats = {
          totalUsers: userCount,
          totalBranches: branchCount
          // Add more stats as needed
        };

        return stats;
      },
      300
    );
  }
}

module.exports = SchoolService;
