const UserService = require('../../services/user/user.service');
const { logger } = require('../../utils/logger');

class UserController {
  // Create a new user
  static async createUser(req, res, next) {
    try {
      const userData = {
        ...req.body,
        created_by: req.user.id,
        // If School Admin, use their school_id
        school_id: req.user.role === 'school_admin' ? req.user.school_id : req.body.school_id,
      };

      const user = await UserService.createUser(userData);
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Error in UserController.createUser:', error);
      next(error);
    }
  }

  // Get all users (Super Admin only)
  static async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, search, role, status, school_id } = req.query;
      
      const users = await UserService.getAllUsers({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        role,
        status,
        school_id,
      });
      
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      logger.error('Error in UserController.getAllUsers:', error);
      next(error);
    }
  }

  // Get user by ID
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id, req.user);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Error in UserController.getUserById:', error);
      next(error);
    }
  }

  // Update user
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updated_by: req.user.id,
      };

      const user = await UserService.updateUser(id, updateData, req.user);
      
      res.json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Error in UserController.updateUser:', error);
      next(error);
    }
  }

  // Delete user (soft delete)
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id, req.user);
      
      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Error in UserController.deleteUser:', error);
      next(error);
    }
  }

  // Get users by school
  static async getUsersBySchool(req, res, next) {
    try {
      const { schoolId } = req.params;
      const { page = 1, limit = 10, search, role, status } = req.query;
      
      // Verify School Admin can only access their own school
      if (req.user.role === 'school_admin' && req.user.school_id !== schoolId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      
      const users = await UserService.getUsersBySchool(schoolId, {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        role,
        status,
      });
      
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      logger.error('Error in UserController.getUsersBySchool:', error);
      next(error);
    }
  }

  // Get users by branch
  static async getUsersByBranch(req, res, next) {
    try {
      const { branchId } = req.params;
      const { page = 1, limit = 10, search, role, status } = req.query;
      
      const users = await UserService.getUsersByBranch(branchId, {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        role,
        status,
      }, req.user);
      
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      logger.error('Error in UserController.getUsersByBranch:', error);
      next(error);
    }
  }

  // Get current user's profile
  static async getMyProfile(req, res, next) {
    try {
      const user = await UserService.getUserById(req.user.id, req.user);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Error in UserController.getMyProfile:', error);
      next(error);
    }
  }

  // Update current user's profile
  static async updateMyProfile(req, res, next) {
    try {
      const updateData = {
        ...req.body,
        updated_by: req.user.id,
      };

      const user = await UserService.updateUser(req.user.id, updateData, req.user);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Error in UserController.updateMyProfile:', error);
      next(error);
    }
  }
}

module.exports = UserController; 