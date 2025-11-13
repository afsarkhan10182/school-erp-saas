const { CertificateTemplate, Branch } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');
const RoleManager = require('~/utils/core/roleManager').RoleManager;

class CertificateTemplateController {
  /**
   * Create a new certificate template
   */
  static async createTemplate(req, res) {
    try {
      const {
        name,
        user_type,
        page_layout = 'portrait',
        qr_code_text,
        user_photo_style = 'square',
        photo_size = 100,
        top_space = 20,
        bottom_space = 20,
        left_space = 20,
        right_space = 20,
        signature_image,
        logo_image,
        background_image,
        content,
        branch_id
      } = req.body;

      // Verify branch exists and user has access
      const branch = await Branch.findByPk(branch_id);
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      // Check if user has access to this branch
      if (req.user.branch_id !== branch_id && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this branch'
        });
      }

      // Handle file uploads
      const uploadedFiles = req.files || {};
      const logoImageFile = uploadedFiles.logo_image?.[0];
      const backgroundImageFile = uploadedFiles.background_image?.[0];
      const signatureImageFile = uploadedFiles.signature_image?.[0];

      // Auto-fill qr_code_text based on user_type if not provided
      const finalQrCodeText = qr_code_text || (user_type === 'student' ? 'register_no' : 'staff_id');

      const template = await CertificateTemplate.create({
        name,
        user_type,
        page_layout,
        qr_code_text: finalQrCodeText,
        user_photo_style,
        photo_size,
        top_space,
        bottom_space,
        left_space,
        right_space,
        signature_image: signatureImageFile ? signatureImageFile.filename : signature_image || null,
        logo_image: logoImageFile ? logoImageFile.filename : logo_image || null,
        background_image: backgroundImageFile ? backgroundImageFile.filename : background_image || null,
        content,
        branch_id,
        created_by: req.user.id
      });

      // Fetch the created template with associations
      const createdTemplate = await CertificateTemplate.findByPk(template.id, {
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      logger.info(`Certificate template created: ${name} by user ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Certificate template created successfully',
        data: createdTemplate
      });
    } catch (error) {
      logger.error('Error creating certificate template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create certificate template',
        error: error.message
      });
    }
  }

  /**
   * Get all certificate templates with pagination and filtering
   */
  static async getTemplates(req, res) {
    try {
      const { page = 1, limit = 10, user_type, is_active, search, branch_id } = req.query;

      // Debug logging
      logger.info('CertificateTemplate.getTemplates - Query params received:', {
        page,
        limit,
        user_type,
        is_active,
        search,
        branch_id,
        all_query_params: req.query
      });

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filter by branch_id if provided in query, otherwise use user's branch_id
      // School context is already available from req.user.school_id (set by middleware)
      if (branch_id) {
        // Validate user has access to the requested branch
        if (req.user.role === 'super_admin') {
          // Super admin can access any branch
          whereClause.branch_id = branch_id;
        } else if (req.user.role === 'admin') {
          // Admin can access any branch in their school - verify branch belongs to school
          const branch = await Branch.findByPk(branch_id);
          if (!branch) {
            return res.status(404).json({
              success: false,
              message: 'Branch not found'
            });
          }
          if (branch.school_id !== req.user.school_id) {
            return res.status(403).json({
              success: false,
              message: 'Access denied to this branch'
            });
          }
          whereClause.branch_id = branch_id;
        } else if (req.user.branch_id === branch_id) {
          // Branch admin and other roles can only access their own branch
          whereClause.branch_id = branch_id;
        } else {
          // User trying to access a different branch - deny access
          return res.status(403).json({
            success: false,
            message: 'Access denied to this branch'
          });
        }
      } else {
        // If no branch_id provided, use user's branch_id (unless superadmin or admin)
        if (req.user.role === 'super_admin') {
          // Super admin without branch_id can see all templates
        } else if (req.user.role === 'admin') {
          // Admin without branch_id - will filter by school_id through Branch association
          // (see all branches in school - handled in include conditions below)
        } else {
          // Other roles must use their own branch_id
          whereClause.branch_id = req.user.branch_id;
        }
      }

      // Apply filters
      if (user_type) {
        whereClause.user_type = user_type;
        logger.info('CertificateTemplate.getTemplates - Applied user_type filter:', user_type);
      } else {
        logger.warn('CertificateTemplate.getTemplates - No user_type filter provided');
      }
      
      logger.info('CertificateTemplate.getTemplates - Final whereClause:', JSON.stringify(whereClause));

      if (is_active !== undefined) {
        whereClause.is_active = is_active === 'true';
      }

      if (search) {
        whereClause.name = {
          [Op.iLike]: `%${search}%`
        };
      }

      // Build include conditions
      const includeConditions = [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code'],
          required: true
        }
      ];

      // For admin role without branch_id, filter by school_id through Branch association
      // This ensures admin can only see templates from branches in their school
      // Note: When branch_id is provided, we already validated it above and set it in whereClause
      if (req.user.role === 'admin' && !branch_id) {
        // When no branch_id, show all branches in admin's school
        includeConditions[0].where = {
          school_id: req.user.school_id
        };
      }

      const { count, rows: templates } = await CertificateTemplate.findAndCountAll({
        where: whereClause,
        attributes: [
          'id',
          'name',
          'user_type',
          'page_layout',
          'qr_code_text',
          'user_photo_style',
          'photo_size',
          'top_space',
          'bottom_space',
          'left_space',
          'right_space',
          'signature_image',
          'logo_image',
          'background_image',
          'content',
          'branch_id',
          'is_active',
          'created_by',
          'updated_by',
          'created_at',
          'updated_at'
        ],
        include: includeConditions,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          templates,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching certificate templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch certificate templates',
        error: error.message
      });
    }
  }

  /**
   * Get a single certificate template by ID
   */
  static async getTemplate(req, res) {
    try {
      const { id } = req.params;

      const School = require('~/models/administration/school.model');
      const template = await CertificateTemplate.findByPk(id, {
        attributes: [
          'id',
          'name',
          'user_type',
          'page_layout',
          'qr_code_text',
          'user_photo_style',
          'photo_size',
          'top_space',
          'bottom_space',
          'left_space',
          'right_space',
          'signature_image',
          'logo_image',
          'background_image',
          'content',
          'branch_id',
          'is_active',
          'created_by',
          'updated_by',
          'created_at',
          'updated_at'
        ],
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code', 'school_id'],
            include: [
              {
                model: School,
                as: 'school',
                attributes: ['id', 'name', 'code']
              }
            ]
          }
        ]
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Certificate template not found'
        });
      }

      // Check access permissions
      // Super admin can access any template
      if (req.user.role === 'super_admin') {
        // Allow access
      } else if (req.user.role === 'admin') {
        // Admin can access templates from branches in their school
        if (template.branch && template.branch.school_id !== req.user.school_id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this template'
          });
        }
      } else if (template.branch_id !== req.user.branch_id) {
        // Other roles can only access templates from their own branch
        return res.status(403).json({
          success: false,
          message: 'Access denied to this template'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error('Error fetching certificate template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch certificate template',
        error: error.message
      });
    }
  }

  /**
   * Update a certificate template
   */
  static async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      const template = await CertificateTemplate.findByPk(id, {
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code', 'school_id']
          }
        ]
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Certificate template not found'
        });
      }

      // Check access permissions
      // Super admin can access any template
      if (req.user.role === 'super_admin') {
        // Allow access
      } else if (req.user.role === 'admin') {
        // Admin can access templates from branches in their school
        if (!template.branch) {
          return res.status(404).json({
            success: false,
            message: 'Branch not found'
          });
        }
        if (template.branch.school_id !== req.user.school_id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this template'
          });
        }
      } else if (template.branch_id !== req.user.branch_id) {
        // Other roles can only access templates from their own branch
        return res.status(403).json({
          success: false,
          message: 'Access denied to this template'
        });
      }

      // Handle file uploads
      const uploadedFiles = req.files || {};
      const logoImageFile = uploadedFiles.logo_image?.[0];
      const backgroundImageFile = uploadedFiles.background_image?.[0];
      const signatureImageFile = uploadedFiles.signature_image?.[0];

      // Update image fields only if new files are uploaded or explicitly cleared
      if (logoImageFile) {
        // New file uploaded - use the new filename
        updateData.logo_image = logoImageFile.filename;
      } else if (updateData.hasOwnProperty('logo_image') && (updateData.logo_image === '' || updateData.logo_image === null)) {
        // Explicitly cleared - set to null
        updateData.logo_image = null;
      } else {
        // No new file and not explicitly cleared - remove from updateData to preserve existing
        delete updateData.logo_image;
      }

      if (backgroundImageFile) {
        updateData.background_image = backgroundImageFile.filename;
      } else if (updateData.hasOwnProperty('background_image') && (updateData.background_image === '' || updateData.background_image === null)) {
        updateData.background_image = null;
      } else {
        delete updateData.background_image;
      }

      if (signatureImageFile) {
        updateData.signature_image = signatureImageFile.filename;
      } else if (updateData.hasOwnProperty('signature_image') && (updateData.signature_image === '' || updateData.signature_image === null)) {
        updateData.signature_image = null;
      } else {
        delete updateData.signature_image;
      }

      // Add updated_by field
      updateData.updated_by = req.user.id;

      await template.update(updateData);

      // Fetch updated template with associations
      const updatedTemplate = await CertificateTemplate.findByPk(id, {
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      logger.info(`Certificate template updated: ${template.name} by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Certificate template updated successfully',
        data: updatedTemplate
      });
    } catch (error) {
      logger.error('Error updating certificate template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update certificate template',
        error: error.message
      });
    }
  }

  /**
   * Delete a certificate template
   */
  static async deleteTemplate(req, res) {
    try {
      const { id } = req.params;

      const template = await CertificateTemplate.findByPk(id, {
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code', 'school_id']
          }
        ]
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Certificate template not found'
        });
      }

      // Check access permissions
      // Super admin can access any template
      if (req.user.role === 'super_admin') {
        // Allow access
      } else if (req.user.role === 'admin') {
        // Admin can access templates from branches in their school
        if (!template.branch) {
          return res.status(404).json({
            success: false,
            message: 'Branch not found'
          });
        }
        if (template.branch.school_id !== req.user.school_id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this template'
          });
        }
      } else if (template.branch_id !== req.user.branch_id) {
        // Other roles can only access templates from their own branch
        return res.status(403).json({
          success: false,
          message: 'Access denied to this template'
        });
      }

      await template.destroy();

      logger.info(`Certificate template deleted: ${template.name} by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Certificate template deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting certificate template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete certificate template',
        error: error.message
      });
    }
  }

  /**
   * Get available QR code text options based on user type
   */
  static async getQrCodeOptions(req, res) {
    try {
      const { user_type } = req.query;

      if (!user_type || !['student', 'employee'].includes(user_type)) {
        return res.status(400).json({
          success: false,
          message: 'User type must be either student or employee'
        });
      }

      const options =
        user_type === 'student'
          ? [
              { value: 'name', label: 'Student Name' },
              { value: 'register_no', label: 'Register Number' },
              { value: 'roll', label: 'Roll Number' },
              { value: 'birthday', label: 'Date of Birth' }
            ]
          : [
              { value: 'staff_id', label: 'Staff ID' },
              { value: 'name', label: 'Employee Name' },
              { value: 'birthday', label: 'Date of Birth' },
              { value: 'joining_date', label: 'Joining Date' }
            ];

      res.json({
        success: true,
        data: options
      });
    } catch (error) {
      logger.error('Error fetching QR code options:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch QR code options',
        error: error.message
      });
    }
  }
}

module.exports = CertificateTemplateController;
