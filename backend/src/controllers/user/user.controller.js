const UserService = require('~/services/user/user.service');
const { logger } = require('~/utils/logger');
const ApiError = require('~/utils/ApiError');
const { RoleManager, ROLES } = require('~/utils/roleManager');
const fs = require('fs').promises;
const { resolveUploadsPath } = require('~/utils/pathHelper');

class UserController {
  // Create a new user with role-based access control
  static async createUser(req, res, next) {
    try {
      const { role } = req.user;
      const { role: newUserRole } = req.body;

      // Clean up the data to prevent timestamp issues
      const cleanData = { ...req.body };
      
      // Remove any empty string values for UUID fields
      if (cleanData.branch_id === '') {
        cleanData.branch_id = null;
      }
      if (cleanData.school_id === '') {
        cleanData.school_id = null;
      }
      
      // Remove any invalid date fields and fields that don't exist in User model
      delete cleanData.last_login;
      delete cleanData.reset_password_expires;
      delete cleanData.deleted_at;
      delete cleanData.joining_date; // This field doesn't exist in User model
      delete cleanData.subjects; // This field doesn't exist in User model
      delete cleanData.grades; // This field doesn't exist in User model
      delete cleanData.address; // This field doesn't exist in User model
      delete cleanData.password_confirmation; // This is just for validation
      
      // Remove any timestamp fields that might be passed from frontend
      delete cleanData.created_at;
      delete cleanData.updated_at;
      
      // Remove any empty or invalid UUID fields
      if (!cleanData.created_by || cleanData.created_by === '') {
        delete cleanData.created_by;
      }
      if (!cleanData.updated_by || cleanData.updated_by === '') {
        delete cleanData.updated_by;
      }
      
      // Validate required fields
      if (!cleanData.email || !cleanData.first_name || !cleanData.last_name || !cleanData.role) {
        throw new ApiError(400, 'Missing required fields: email, first_name, last_name, role');
      }
      
      // If password is empty or not provided, it will be auto-generated in the service
      if (!cleanData.password || cleanData.password.trim() === '') {
        delete cleanData.password;
      }
      
      // Validate role assignment using RoleManager
      if (!RoleManager.hasRoleOrHigher(role, newUserRole)) {
        throw new ApiError(403, `You are not authorized to create users with role: ${newUserRole}`);
      }
      
      const userData = {
        ...cleanData,
        created_by: req.user.id,
        // If School Admin, use their school_id
        school_id: role === 'school_admin' ? req.user.school_id : cleanData.school_id,
        // Set default status to active if not provided
        status: cleanData.status || 'active',
      };

      const user = await UserService.createUser(userData);
      
      // Prepare response data
      const responseData = { ...user };
      
      // If password was auto-generated, include it in the response
      if (user.generatedPassword) {
        responseData.generatedPassword = user.generatedPassword;
        // Remove the generated password from the main user object for security
        delete responseData.generatedPassword;
      }
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: responseData,
        generatedPassword: user.generatedPassword || null,
      });
    } catch (error) {
      logger.error('Error in UserController.createUser:', error);
      
      // Handle unique constraint violations specifically
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists in this branch',
        });
      }
      
      next(error);
    }
  }

  // Get all users with role-based access control
  static async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, search, role, status } = req.query;
      const { user } = req;
      
      // If school admin, only show users from their school
      const school_id = user.role === 'school_admin' ? user.school_id : req.query.school_id;
      
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
      
      // Use RoleManager for access control
      if (!RoleManager.canAccessSchool(req.user.role, req.user.school_id, schoolId)) {
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
      const updateData = { ...req.body, updated_by: req.user.id };

      // Get current user to check for existing profile image
      const currentUser = await UserService.getUserById(req.user.id, req.user);
      const oldProfileImage = currentUser.profile_image;

      // If a profile image is uploaded, save its filename to profile_image
      if (req.file) {
        updateData.profile_image = req.file.filename;
        
        // Delete the old profile image if it exists and is different
        if (oldProfileImage && oldProfileImage !== req.file.filename) {
          try {
            const oldFilePath = resolveUploadsPath('profile-images', oldProfileImage);
            await fs.unlink(oldFilePath);
            logger.info(`Deleted old profile image: ${oldProfileImage}`);
          } catch (error) {
            logger.error(`Error deleting old profile image ${oldProfileImage}:`, error);
          }
        }
      }

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

  // Change password
  static async changePassword(req, res, next) {
    try {
      const { current_password, new_password, confirm_password } = req.body;
      
      // Validate required fields
      if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({
          success: false,
          message: 'All password fields are required',
        });
      }

      // Validate password match
      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          message: 'New password and confirm password do not match',
        });
      }

      // Validate password strength
      if (new_password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
        });
      }

      const result = await UserService.changePassword(req.user.id, current_password, new_password);
      
      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Error in UserController.changePassword:', error);
      next(error);
    }
  }
}

module.exports = UserController; 