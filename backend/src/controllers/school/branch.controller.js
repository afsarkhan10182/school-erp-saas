const BranchService = require('../../services/school/branch.service');
const { logger } = require('../../utils/logger');

class BranchController {
  // Create a new branch (Super Admin or School Admin)
  static async createBranch(req, res, next) {
    try {
      const branchData = {
        ...req.body,
        ...req.files, // Include uploaded files
        created_by: req.user.id,
        // If School Admin, use their school_id
        school_id: req.user.role === 'school_admin' ? req.user.school_id : req.body.school_id,
      };

      const branch = await BranchService.createBranch(branchData);
      
      res.status(201).json({
        success: true,
        message: 'Branch created successfully',
        data: branch,
      });
    } catch (error) {
      logger.error('Error in BranchController.createBranch:', error);
      next(error);
    }
  }

  // Get all branches (Super Admin only)
  static async getAllBranches(req, res, next) {
    try {
      const { page = 1, limit = 10, search, status, school_id } = req.query;
      
      const branches = await BranchService.getAllBranches({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        school_id,
      });
      
      res.json({
        success: true,
        data: branches,
      });
    } catch (error) {
      logger.error('Error in BranchController.getAllBranches:', error);
      next(error);
    }
  }

  // Get branch by ID
  static async getBranchById(req, res, next) {
    try {
      const { id } = req.params;
      const branch = await BranchService.getBranchById(id, req.user);
      
      res.json({
        success: true,
        data: branch,
      });
    } catch (error) {
      logger.error('Error in BranchController.getBranchById:', error);
      next(error);
    }
  }

  // Update branch (Super Admin or School Admin)
  static async updateBranch(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        ...req.files, // Include uploaded files
        updated_by: req.user.id,
      };

      const branch = await BranchService.updateBranch(id, updateData, req.user);
      
      res.json({
        success: true,
        message: 'Branch updated successfully',
        data: branch,
      });
    } catch (error) {
      logger.error('Error in BranchController.updateBranch:', error);
      next(error);
    }
  }

  // Delete branch (Super Admin only)
  static async deleteBranch(req, res, next) {
    try {
      const { id } = req.params;
      await BranchService.deleteBranch(id);
      
      res.json({
        success: true,
        message: 'Branch deleted successfully',
      });
    } catch (error) {
      logger.error('Error in BranchController.deleteBranch:', error);
      next(error);
    }
  }

  // Get branches by school (Super Admin or School Admin)
  static async getBranchesBySchool(req, res, next) {
    try {
      const { schoolId } = req.params;
      const { page = 1, limit = 10, search, status } = req.query;
      
      // Verify School Admin and Branch Admin can only access their own school
      if (req.user.role === 'school_admin' || req.user.role === 'branch_admin') {
        const userSchoolId = String(req.user.school_id || '').trim();
        const requestedSchoolId = String(schoolId || '').trim();
        
        if (userSchoolId !== requestedSchoolId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - School ID mismatch',
          });
        }
      }
      
      const branches = await BranchService.getBranchesBySchool(schoolId, {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
      });
      
      res.json({
        success: true,
        data: branches,
      });
    } catch (error) {
      logger.error('Error in BranchController.getBranchesBySchool:', error);
      next(error);
    }
  }

  // Get current user's branch (Branch Admin only)
  static async getMyBranch(req, res, next) {
    try {
      const branch = await BranchService.getBranchById(req.user.branch_id, req.user);
      
      res.json({
        success: true,
        data: branch,
      });
    } catch (error) {
      logger.error('Error in BranchController.getMyBranch:', error);
      next(error);
    }
  }
}

module.exports = BranchController; 