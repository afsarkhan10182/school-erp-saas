const { CertificateTemplate, Branch } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');

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

      const template = await CertificateTemplate.create({
        name,
        user_type,
        page_layout,
        qr_code_text,
        user_photo_style,
        photo_size,
        top_space,
        bottom_space,
        left_space,
        right_space,
        signature_image,
        logo_image,
        background_image,
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
      const { page = 1, limit = 10, user_type, is_active, search } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filter by branch (user can only see templates from their branch unless superadmin)
      if (req.user.role !== 'superadmin') {
        whereClause.branch_id = req.user.branch_id;
      }

      // Apply filters
      if (user_type) {
        whereClause.user_type = user_type;
      }

      if (is_active !== undefined) {
        whereClause.is_active = is_active === 'true';
      }

      if (search) {
        whereClause.name = {
          [Op.iLike]: `%${search}%`
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
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'code']
          }
        ],
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
            attributes: ['id', 'name', 'code']
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
      if (req.user.role !== 'superadmin' && template.branch_id !== req.user.branch_id) {
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
      const updateData = req.body;

      const template = await CertificateTemplate.findByPk(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Certificate template not found'
        });
      }

      // Check access permissions
      if (req.user.role !== 'superadmin' && template.branch_id !== req.user.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this template'
        });
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

      const template = await CertificateTemplate.findByPk(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Certificate template not found'
        });
      }

      // Check access permissions
      if (req.user.role !== 'superadmin' && template.branch_id !== req.user.branch_id) {
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
