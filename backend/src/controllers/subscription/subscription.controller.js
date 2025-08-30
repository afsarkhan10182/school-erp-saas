const SubscriptionService = require('../../services/subscription/subscription.service');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');

class SubscriptionController {
  // Get all subscription plans
  static async getAllPlans(req, res, next) {
    try {
      const plans = await SubscriptionService.getAllPlans(req.query);
      
      res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getAllPlans:', error);
      next(error);
    }
  }

  // Get active plans for school/branch admins (limited fields)
  static async getActivePlansForSchools(req, res, next) {
    try {
      if (!['school_admin', 'branch_admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const plans = await SubscriptionService.getActivePlansForSchools();
      res.json({ success: true, data: { plans: plans } });
    } catch (error) {
      logger.error('Error in SubscriptionController.getActivePlansForSchools:', error);
      next(error);
    }
  }

  // Get plan by ID
  static async getPlanById(req, res, next) {
    try {
      const { id } = req.params;
      const plan = await SubscriptionService.getPlanById(id);
      
      res.json({
        success: true,
        data: plan,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getPlanById:', error);
      next(error);
    }
  }

  // Create new subscription plan
  static async createPlan(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can create subscription plans',
        });
      }

      const plan = await SubscriptionService.createPlan(req.body, req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Subscription plan created successfully',
        data: plan,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.createPlan:', error);
      next(error);
    }
  }

  // Update subscription plan
  static async updatePlan(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can update subscription plans',
        });
      }

      const { id } = req.params;
      const plan = await SubscriptionService.updatePlan(id, req.body, req.user.id);
      
      res.json({
        success: true,
        message: 'Subscription plan updated successfully',
        data: plan,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.updatePlan:', error);
      next(error);
    }
  }

  // Delete subscription plan
  static async deletePlan(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can delete subscription plans',
        });
      }

      const { id } = req.params;
      await SubscriptionService.deletePlan(id);
      
      res.json({
        success: true,
        message: 'Subscription plan deleted successfully',
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.deletePlan:', error);
      next(error);
    }
  }

  // Get schools with subscription details
  static async getSchoolsWithSubscriptions(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can access subscription data',
        });
      }

      const schools = await SubscriptionService.getSchoolsWithSubscriptions(req.query);
      
      res.json({
        success: true,
        data: schools,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getSchoolsWithSubscriptions:', error);
      next(error);
    }
  }

  // Get single school with subscription
  static async getSchoolWithSubscription(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can access subscription data',
        });
      }

      const { id } = req.params;
      const school = await SubscriptionService.getSchoolWithSubscription(id);
      
      if (!school) {
        return res.status(404).json({
          success: false,
          message: 'School not found',
        });
      }
      
      res.json({
        success: true,
        data: school,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getSchoolWithSubscription:', error);
      next(error);
    }
  }

  // Create school with subscription
  static async createSchoolWithSubscription(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can create schools with subscriptions',
        });
      }

      // Parse JSON data from FormData
      let schoolData, subscriptionData;
      
      try {
        schoolData = req.body.schoolData ? JSON.parse(req.body.schoolData) : null;
        subscriptionData = req.body.subscriptionData ? JSON.parse(req.body.subscriptionData) : null;
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON data in school or subscription data',
        });
      }
      
      if (!schoolData || !subscriptionData) {
        return res.status(400).json({
          success: false,
          message: 'School data and subscription data are required',
        });
      }

      // Extract uploaded files
      const uploadedFiles = {};
      if (req.files) {
        if (req.files.system_logo) {
          uploadedFiles.system_logo = req.files.system_logo[0];
        }
        if (req.files.text_logo) {
          uploadedFiles.text_logo = req.files.text_logo[0];
        }
        if (req.files.printing_logo) {
          uploadedFiles.printing_logo = req.files.printing_logo[0];
        }
        if (req.files.report_card_design) {
          uploadedFiles.report_card_design = req.files.report_card_design[0];
        }
      }

      const result = await SubscriptionService.createSchoolWithSubscription(
        schoolData,
        subscriptionData,
        req.user.id,
        uploadedFiles
      );
      
      res.status(201).json({
        success: true,
        message: 'School created with subscription successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.createSchoolWithSubscription:', error);
      next(error);
    }
  }

  // Update school subscription
  static async updateSchoolSubscription(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can update school subscriptions',
        });
      }

      const { id } = req.params;

      // Parse JSON data from FormData (same as create method)
      let schoolData, subscriptionData;
      
      try {
        schoolData = req.body.schoolData ? JSON.parse(req.body.schoolData) : null;
        subscriptionData = req.body.subscriptionData ? JSON.parse(req.body.subscriptionData) : null;
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON data in school or subscription data',
        });
      }
      
      if (!schoolData || !subscriptionData) {
        return res.status(400).json({
          success: false,
          message: 'School data and subscription data are required',
        });
      }

      // Extract uploaded files
      const uploadedFiles = {};
      if (req.files) {
        if (req.files.system_logo) {
          uploadedFiles.system_logo = req.files.system_logo[0];
        }
        if (req.files.text_logo) {
          uploadedFiles.text_logo = req.files.text_logo[0];
        }
        if (req.files.printing_logo) {
          uploadedFiles.printing_logo = req.files.printing_logo[0];
        }
        if (req.files.report_card_design) {
          uploadedFiles.report_card_design = req.files.report_card_design[0];
        }
      }

      const result = await SubscriptionService.updateSchoolSubscription(
        id,
        { schoolData, subscriptionData },
        req.user.id,
        uploadedFiles
      );
      
      res.json({
        success: true,
        message: 'School subscription updated successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.updateSchoolSubscription:', error);
      next(error);
    }
  }

  // Get school transactions
  static async getSchoolTransactions(req, res, next) {
    try {
      const { schoolId } = req.params;
      
      // Super admin can access any school's transactions
      // School admin can only access their own school's transactions
      if (req.user.role === 'super_admin') {
        // Super admin can access any school
        const transactions = await SubscriptionService.getSchoolTransactions(schoolId, req.query);
        
        res.json({
          success: true,
          data: transactions,
        });
      } else if (req.user.role === 'school_admin') {
        // School admin can only access their own school's transactions
        if (req.user.school_id !== schoolId) {
          return res.status(403).json({
            success: false,
            message: 'You can only access your own school\'s transaction data',
          });
        }
        
        const transactions = await SubscriptionService.getSchoolTransactions(schoolId, req.query);
        
        res.json({
          success: true,
          data: transactions,
        });
      } else {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access transaction data',
        });
      }
    } catch (error) {
      logger.error('Error in SubscriptionController.getSchoolTransactions:', error);
      next(error);
    }
  }

  // Get my school transactions (for school admins - convenience endpoint)
  static async getMySchoolTransactions(req, res, next) {
    try {
      if (!['school_admin', 'branch_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only school admins can access their own transaction data',
        });
      }

      const schoolId = req.user.school_id;
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'School ID not found for user',
        });
      }

      const transactions = await SubscriptionService.getSchoolTransactions(schoolId, req.query);
      
      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getMySchoolTransactions:', error);
      next(error);
    }
  }

  // Create manual transaction
  static async createManualTransaction(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can create manual transactions',
        });
      }

      const { schoolId } = req.params;
      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'School ID is required' });
      }

      // Ensure minimum required fields
      const { amount } = req.body || {};
      if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
        return res.status(400).json({ success: false, message: 'Valid amount is required' });
      }

      const transaction = await SubscriptionService.createManualTransaction(
        { ...req.body, school_id: schoolId },
        req.user.id
      );
      
      res.status(201).json({
        success: true,
        message: 'Manual transaction created successfully',
        data: transaction,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.createManualTransaction:', error);
      next(error);
    }
  }

  // Check and update subscription status
  static async checkSubscriptionStatus(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can check subscription status',
        });
      }

      const { schoolId } = req.params;
      const result = await SubscriptionService.checkAndUpdateSubscriptionStatus(schoolId);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.checkSubscriptionStatus:', error);
      next(error);
    }
  }

  // Create subscription renewal request (for school admins)
  static async createRenewalRequest(req, res, next) {
    try {
      if (!['school_admin', 'branch_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only school admins can create renewal requests',
        });
      }

      const requestData = {
        ...req.body,
        school_id: req.user.school_id, // Use the school_id from the authenticated user
      };

      const renewalRequest = await SubscriptionService.createRenewalRequest(
        requestData,
        req.user.id
      );
      
      res.status(201).json({
        success: true,
        message: 'Renewal request created successfully',
        data: renewalRequest,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.createRenewalRequest:', error);
      next(error);
    }
  }

  // Get renewal requests (for super admin)
  static async getRenewalRequests(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can access renewal requests',
        });
      }

      const requests = await SubscriptionService.getRenewalRequests(req.query);
      
      res.json({
        success: true,
        data: requests,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getRenewalRequests:', error);
      next(error);
    }
  }

  // Get school renewal requests (for school admins)
  static async getSchoolRenewalRequests(req, res, next) {
    try {
      if (!['school_admin', 'branch_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only school admins can access renewal requests',
        });
      }

      const requests = await SubscriptionService.getSchoolRenewalRequests(
        req.user.school_id,
        req.query
      );
      
      res.json({
        success: true,
        data: requests,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getSchoolRenewalRequests:', error);
      next(error);
    }
  }

  // Review renewal request (super admin only)
  static async reviewRenewalRequest(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can review renewal requests',
        });
      }

      const { id } = req.params;
      const reviewData = req.body;

      const request = await SubscriptionService.reviewRenewalRequest(
        id,
        reviewData,
        req.user.id
      );
      
      res.json({
        success: true,
        message: `Renewal request ${reviewData.status} successfully`,
        data: request,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.reviewRenewalRequest:', error);
      next(error);
    }
  }

  // Check and update all subscription statuses
  static async checkAndUpdateAllStatuses(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can perform bulk status updates',
        });
      }

      const result = await SubscriptionService.checkAndUpdateAllSubscriptionStatuses();
      
      res.json({
        success: true,
        message: 'Subscription statuses updated successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.checkAndUpdateAllStatuses:', error);
      next(error);
    }
  }

  // Toggle module for school (enable/disable)
  static async toggleSchoolModule(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can toggle modules',
        });
      }

      const { schoolId } = req.params;
      const { module_code, enabled } = req.body;

      if (!module_code) {
        return res.status(400).json({
          success: false,
          message: 'Module code is required',
        });
      }

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Enabled flag must be boolean',
        });
      }

      const school = await SubscriptionService.toggleSchoolModule(
        schoolId,
        module_code,
        enabled,
        req.user.id
      );
      
      res.json({
        success: true,
        message: `Module ${module_code} ${enabled ? 'enabled' : 'disabled'} successfully`,
        data: school,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.toggleSchoolModule:', error);
      next(error);
    }
  }

  // Get available modules for school
  static async getAvailableModulesForSchool(req, res, next) {
    try {
      const { schoolId } = req.params;
      
      // Check permissions
      if (req.user.role === 'school_admin' && req.user.school_id !== schoolId) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own school\'s module data',
        });
      }

      const availableModules = await SubscriptionService.getAvailableModulesForSchool(schoolId);
      
      res.json({
        success: true,
        data: availableModules,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getAvailableModulesForSchool:', error);
      next(error);
    }
  }

  // Get subscription statistics
  static async getSubscriptionStats(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can access subscription statistics',
        });
      }

      const stats = await SubscriptionService.getSubscriptionStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getSubscriptionStats:', error);
      next(error);
    }
  }

  // Check school usage against subscription limits
  static async checkSchoolUsage(req, res, next) {
    try {
      const schoolId = req.user.role === 'super_admin' ? req.params.schoolId : req.user.school_id;
      
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'School ID is required',
        });
      }

      const usage = await SubscriptionService.checkSchoolUsage(schoolId);
      
      res.json({
        success: true,
        data: usage,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.checkSchoolUsage:', error);
      next(error);
    }
  }

  // Sync schools with a specific plan
  static async syncSchoolsWithPlan(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can sync schools with plans',
        });
      }

      const { planCode } = req.params;
      const result = await SubscriptionService.syncSchoolsWithPlan(planCode);
      
      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.syncSchoolsWithPlan:', error);
      next(error);
    }
  }

  // Sync all schools with their plans
  static async syncAllSchoolsWithPlans(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can sync all schools with plans',
        });
      }

      const result = await SubscriptionService.syncAllSchoolsWithPlans();
      
      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.syncAllSchoolsWithPlans:', error);
      next(error);
    }
  }

  // Get all modules (for super admin management)
  static async getAllModules(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can manage modules',
        });
      }

      const { Module } = require('../../models');
      
      const modules = await Module.findAll({
        order: [['sort_order', 'ASC'], ['name', 'ASC']],
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
          }
        ]
      });

      res.json({
        success: true,
        message: 'Modules retrieved successfully',
        data: modules,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getAllModules:', error);
      next(error);
    }
  }

  // Create new module (super admin only)
  static async createModule(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can create modules',
        });
      }

      const { Module } = require('../../models');
      const module = await Module.create({
        ...req.body,
        created_by: req.user.id,
        updated_by: req.user.id,
      });
      
      res.status(201).json({
        success: true,
        message: 'Module created successfully',
        data: module,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.createModule:', error);
      next(error);
    }
  }

  // Update module (super admin only)
  static async updateModule(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can update modules',
        });
      }

      const { id } = req.params;
      const { Module } = require('../../models');
      
      const module = await Module.findByPk(id);
      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found',
        });
      }

      await module.update({
        ...req.body,
        updated_by: req.user.id,
      });
      
      res.json({
        success: true,
        message: 'Module updated successfully',
        data: module,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.updateModule:', error);
      next(error);
    }
  }



  // Get available modules (for plan creation and management)
  static async getAvailableModules(req, res, next) {
    try {
      if (!['super_admin', 'school_admin', 'branch_admin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Not authorized to access module information' });
      }

      const { Module } = require('../../models');
      
      // Fetch all active modules from database
      const modules = await Module.findAll({
        where: { is_active: true },
        order: [['sort_order', 'ASC'], ['name', 'ASC']],
        attributes: [
          'id',
          'code',
          'name',
          'description',
          'icon',
          'features',
          'category',
          'is_core',
          'sort_order',
          'version'
        ]
      });

      // Transform to consistent format
      const formattedModules = modules.map(module => ({
        id: module.id,
        key: module.code,
        name: module.name,
        description: module.description,
        icon: module.icon,
        features: module.features,
        category: module.category,
        is_core: module.is_core,
        sort_order: module.sort_order,
        version: module.version,
        is_active: module.is_active
      }));

      res.json({
        success: true,
        message: 'Available modules retrieved successfully',
        data: formattedModules,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getAvailableModules:', error);
      next(error);
    }
  }
}

module.exports = SubscriptionController; 