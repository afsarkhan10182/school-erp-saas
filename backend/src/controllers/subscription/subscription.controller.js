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

  // Create school with subscription
  static async createSchoolWithSubscription(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can create schools with subscriptions',
        });
      }

      const { schoolData, subscriptionData } = req.body;
      
      if (!schoolData || !subscriptionData) {
        return res.status(400).json({
          success: false,
          message: 'School data and subscription data are required',
        });
      }

      const result = await SubscriptionService.createSchoolWithSubscription(
        schoolData,
        subscriptionData,
        req.user.id
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
      const result = await SubscriptionService.updateSchoolSubscription(
        id,
        req.body,
        req.user.id
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
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can access transaction data',
        });
      }

      const { schoolId } = req.params;
      const transactions = await SubscriptionService.getSchoolTransactions(schoolId, req.query);
      
      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getSchoolTransactions:', error);
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

      const transaction = await SubscriptionService.createManualTransaction(
        req.body,
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

  // Get subscription statistics
  static async getSubscriptionStats(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can access subscription statistics',
        });
      }

      // This would be implemented in the service
      const stats = {
        totalSchools: 0,
        activeSubscriptions: 0,
        trialSubscriptions: 0,
        expiredSubscriptions: 0,
        suspendedSubscriptions: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
      };
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error in SubscriptionController.getSubscriptionStats:', error);
      next(error);
    }
  }
}

module.exports = SubscriptionController; 