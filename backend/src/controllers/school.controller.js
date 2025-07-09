const SchoolService = require('../services/school.service');
const { logger } = require('../utils/logger');

class SchoolController {
  // Create a new school (Super Admin only)
  static async createSchool(req, res, next) {
    try {
      const schoolData = {
        ...req.body,
        created_by: req.user.id,
      };

      const school = await SchoolService.createSchool(schoolData);
      
      res.status(201).json({
        success: true,
        message: 'School created successfully',
        data: school,
      });
    } catch (error) {
      logger.error('Error in SchoolController.createSchool:', error);
      next(error);
    }
  }

  // Get all schools (Super Admin only)
  static async getAllSchools(req, res, next) {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      
      const schools = await SchoolService.getAllSchools({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
      });
      
      res.json({
        success: true,
        data: schools,
      });
    } catch (error) {
      logger.error('Error in SchoolController.getAllSchools:', error);
      next(error);
    }
  }

  // Get school by ID
  static async getSchoolById(req, res, next) {
    try {
      const { id } = req.params;
      const school = await SchoolService.getSchoolById(id, req.user);
      
      res.json({
        success: true,
        data: school,
      });
    } catch (error) {
      logger.error('Error in SchoolController.getSchoolById:', error);
      next(error);
    }
  }

  // Update school (Super Admin only)
  static async updateSchool(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updated_by: req.user.id,
      };

      const school = await SchoolService.updateSchool(id, updateData);
      
      res.json({
        success: true,
        message: 'School updated successfully',
        data: school,
      });
    } catch (error) {
      logger.error('Error in SchoolController.updateSchool:', error);
      next(error);
    }
  }

  // Delete school (Super Admin only)
  static async deleteSchool(req, res, next) {
    try {
      const { id } = req.params;
      await SchoolService.deleteSchool(id);
      
      res.json({
        success: true,
        message: 'School deleted successfully',
      });
    } catch (error) {
      logger.error('Error in SchoolController.deleteSchool:', error);
      next(error);
    }
  }

  // Get current user's school (School Admin only)
  static async getMySchool(req, res, next) {
    try {
      const school = await SchoolService.getSchoolById(req.user.school_id, req.user);
      
      res.json({
        success: true,
        data: school,
      });
    } catch (error) {
      logger.error('Error in SchoolController.getMySchool:', error);
      next(error);
    }
  }

  // Update current user's school (School Admin only)
  static async updateMySchool(req, res, next) {
    try {
      const updateData = {
        ...req.body,
        updated_by: req.user.id,
      };

      const school = await SchoolService.updateSchool(req.user.school_id, updateData);
      
      res.json({
        success: true,
        message: 'School updated successfully',
        data: school,
      });
    } catch (error) {
      logger.error('Error in SchoolController.updateMySchool:', error);
      next(error);
    }
  }
}

module.exports = SchoolController; 