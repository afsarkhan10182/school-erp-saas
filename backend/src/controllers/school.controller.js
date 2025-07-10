const { sequelize } = require('../config/database');
const { User, School } = require('../models');
const SchoolService = require('../services/school.service');
const { logger } = require('../utils/logger');
const ApiError = require('../utils/ApiError');

class SchoolController {
  // Create a new school (Super Admin only)
  static async createSchool(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify the user exists and is a super admin
      const user = await User.findByPk(req.user.id, { transaction });
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      if (user.role !== 'super_admin') {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: 'Only super admins can create schools' });
      }

      // Validate required fields
      const requiredFields = [
        'name', 'code', 'email', 'branch_name', 'admin_name', 'admin_email', 'admin_mobile',
        'plan', 'status', 'currency', 'currency_symbol', 'city', 'state'
      ];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: `Missing required fields: ${missingFields.join(', ')}` });
      }

      // Handle file uploads
      const files = req.files || {};
      const systemLogoPath = files.system_logo?.[0]?.filename ? `/uploads/${files.system_logo[0].filename}` : null;
      const textLogoPath = files.text_logo?.[0]?.filename ? `/uploads/${files.text_logo[0].filename}` : null;
      const printingLogoPath = files.printing_logo?.[0]?.filename ? `/uploads/${files.printing_logo[0].filename}` : null;
      const reportCardDesignPath = files.report_card_design?.[0]?.filename ? `/uploads/${files.report_card_design[0].filename}` : null;

      // Format school data
      const schoolData = {
        name: req.body.name.trim(),
        code: req.body.code.trim().toUpperCase(),
        email: req.body.email.trim().toLowerCase(),
        phone: req.body.phone?.trim(),
        address: req.body.address?.trim(),
        city: req.body.city?.trim(),
        state: req.body.state?.trim(),
        country: req.body.country?.trim() || 'India',
        postal_code: req.body.postal_code?.trim(),
        website: req.body.website?.trim(),
        logo: systemLogoPath,
        text_logo: textLogoPath,
        printing_logo: printingLogoPath,
        report_card_design: reportCardDesignPath,
        timezone: req.body.timezone || 'Asia/Kolkata',
        locale: req.body.locale || 'en-IN',
        currency: req.body.currency,
        currency_symbol: req.body.currency_symbol,
        date_format: req.body.date_format || 'DD/MM/YYYY',
        status: req.body.status,
        academic_year_start: req.body.academic_year_start || new Date(new Date().getFullYear(), 3, 1),
        academic_year_end: req.body.academic_year_end || new Date(new Date().getFullYear() + 1, 2, 31),
        subscription_plan: req.body.plan,
        created_by: req.user.id,
      };

      // Create the school
      const school = await School.create(schoolData, { transaction });

      // Create the first branch
      const Branch = require('../models/Branch');
      const branchData = {
        name: req.body.branch_name.trim(),
        code: `${school.code}-MAIN`,
        email: req.body.email.trim().toLowerCase(),
        phone: req.body.phone?.trim(),
        address: req.body.address?.trim(),
        city: req.body.city?.trim(),
        state: req.body.state?.trim(),
        country: req.body.country?.trim() || 'India',
        postal_code: req.body.postal_code?.trim(),
        system_logo: systemLogoPath,
        text_logo: textLogoPath,
        printing_logo: printingLogoPath,
        report_card_design: reportCardDesignPath,
        is_main_branch: true,
        status: 'active',
        school_id: school.id,
        created_by: req.user.id,
      };
      const branch = await Branch.create(branchData, { transaction });

      // Generate a random strong password for admin
      const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
        let pwd = '';
        for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        return pwd;
      };
      const adminPassword = generatePassword();

      // Check if admin email already exists
      const existingAdmin = await User.findOne({ where: { email: req.body.admin_email.trim().toLowerCase() }, transaction });
      if (existingAdmin) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Admin email already exists. Please use a different admin_email.' });
      }

      // Create the admin user
      const adminUser = await User.create({
        email: req.body.admin_email.trim().toLowerCase(),
        password: adminPassword,
        first_name: req.body.admin_name.trim(),
        last_name: req.body.admin_last_name?.trim() || 'Admin',
        phone: req.body.admin_mobile?.trim(),
        role: 'school_admin',
        status: 'active',
        school_id: school.id,
        branch_id: branch.id,
        created_by: req.user.id,
        email_verified: true,
      }, { transaction });

      // Commit the transaction
      await transaction.commit();
      
      // Log successful creation
      logger.info(`School, Branch, and School Admin created successfully: ${school.id}, ${branch.id}, ${adminUser.id}`, {
        schoolId: school.id,
        branchId: branch.id,
        adminId: adminUser.id,
        userId: req.user.id
      });
      
      // Return success response with admin credentials
      res.status(201).json({
        success: true,
        message: 'School, Branch, and School Admin created successfully',
        data: {
          school,
          branch,
          admin: {
            id: adminUser.id,
            email: adminUser.email,
            password: adminPassword, // Only return on creation!
            first_name: adminUser.first_name,
            last_name: adminUser.last_name,
            role: adminUser.role
          }
        }
      });
    } catch (error) {
      // Rollback the transaction if it hasn't been committed
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      
      // Enhanced error logging
      const errorContext = {
        message: error.message,
        name: error.name,
        code: error.code,
        ...(error.errors && { 
          errors: error.errors.map(e => ({
            message: e.message,
            type: e.type,
            path: e.path,
            value: e.value
          }))
        }),
        ...(error.original && { 
          original: {
            message: error.original.message,
            code: error.original.code,
            sql: error.original.sql,
            sqlState: error.original.sqlState,
            sqlMessage: error.original.sqlMessage
          } 
        }),
        stack: error.stack
      };
      
      logger.error('Error in SchoolController.createSchool:', errorContext);
      
      // Handle specific error types
      if (error instanceof ApiError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
          ...(process.env.NODE_ENV === 'development' && { 
            error: error.message,
            stack: error.stack
          })
        });
      }
      
      // Handle Sequelize validation errors
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors?.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        })) || [{ message: 'Validation error' }];
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: messages,
          ...(process.env.NODE_ENV === 'development' && { 
            error: error.message,
            stack: error.stack
          })
        });
      }
      
      // Default error response
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating the school',
        ...(process.env.NODE_ENV === 'development' && { 
          error: error.message,
          stack: error.stack,
          name: error.name
        })
      });
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

  // Suspend a school (Super Admin only)
  static async suspendSchool(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Only super admins can suspend schools' });
      }
      const { id } = req.params;
      const school = await School.findByPk(id);
      if (!school) {
        return res.status(404).json({ success: false, message: 'School not found' });
      }
      await school.update({ status: 'suspended' });
      logger.info(`School suspended: ${school.name} (${school.id}) by user ${req.user.id}`);
      res.json({ success: true, message: 'School suspended', data: school });
    } catch (error) {
      logger.error('Error in SchoolController.suspendSchool:', error);
      next(error);
    }
  }

  // Reactivate a school (Super Admin only)
  static async reactivateSchool(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Only super admins can reactivate schools' });
      }
      const { id } = req.params;
      const school = await School.findByPk(id);
      if (!school) {
        return res.status(404).json({ success: false, message: 'School not found' });
      }
      await school.update({ status: 'active' });
      logger.info(`School reactivated: ${school.name} (${school.id}) by user ${req.user.id}`);
      res.json({ success: true, message: 'School reactivated', data: school });
    } catch (error) {
      logger.error('Error in SchoolController.reactivateSchool:', error);
      next(error);
    }
  }

  // Get current user's school (School Admin only)
  static async getMySchool(req, res, next) {
    try {
      // Check if user has a school_id
      if (!req.user.school_id) {
        throw new ApiError(403, 'User is not associated with any school');
      }

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