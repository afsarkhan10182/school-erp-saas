const { AccountCategory, School, Branch } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');

class CategoryController {
  static async getAllCategories(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        type = '',
        is_active = '',
        branch_id = '',
        school_id = ''
      } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let whereClause = {};

      if (req.user.role === 'super_admin') {
        if (school_id) whereClause.school_id = school_id;
        if (branch_id) whereClause.branch_id = branch_id;
      } else {
        if (!req.user.school_id) {
          return res.status(403).json({ success: false, message: 'School scope is required' });
        }
        whereClause.school_id = req.user.school_id;
        if (req.user.role === 'branch_admin' || (req.user.role === 'accountant' && req.user.branch_id)) {
          if (!req.user.branch_id) {
            return res.status(403).json({ success: false, message: 'Branch scope is required' });
          }
          whereClause.branch_id = req.user.branch_id;
        } else if (branch_id) {
          whereClause.branch_id = branch_id;
        }
      }

      if (search) {
        whereClause.name = { [Op.iLike]: `%${search}%` };
      }
      if (type) {
        whereClause.type = type;
      }
      if (is_active !== '') {
        whereClause.is_active = is_active === 'true';
      }

      const { count, rows } = await AccountCategory.findAndCountAll({
        where: whereClause,
        include: [
          { model: School, as: 'school', attributes: ['id', 'name'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] }
        ],
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Error in CategoryController.getAllCategories:', error);
      next(error);
    }
  }

  static async getCategoryById(req, res, next) {
    try {
      const category = await AccountCategory.findByPk(req.params.id, {
        include: [
          { model: School, as: 'school', attributes: ['id', 'name'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] }
        ]
      });

      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      if (req.user.role !== 'super_admin' && category.school_id !== req.user.school_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user.role === 'branch_admin' && category.branch_id !== req.user.branch_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user.role === 'accountant' && req.user.branch_id && category.branch_id !== req.user.branch_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      res.json({ success: true, data: category });
    } catch (error) {
      logger.error('Error in CategoryController.getCategoryById:', error);
      next(error);
    }
  }

  static async createCategory(req, res, next) {
    try {
      const { name, type, description, is_active, branch_id } = req.body;

      let school_id = req.user.school_id;
      let final_branch_id = ['branch_admin', 'accountant'].includes(req.user.role) && req.user.branch_id
        ? req.user.branch_id : branch_id;

      if (req.user.role === 'super_admin') {
        school_id = req.body.school_id;
        final_branch_id = branch_id;
      }

      if (!school_id || !final_branch_id) {
        return res.status(400).json({ success: false, message: 'School and Branch ID required' });
      }

      const branch = await Branch.findOne({ where: { id: final_branch_id, school_id } });
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found in this school' });
      }

      const category = await AccountCategory.create({
        name,
        type,
        description,
        is_active,
        school_id,
        branch_id: final_branch_id
      });

      res
        .status(201)
        .json({ success: true, message: 'Category created successfully', data: category });
    } catch (error) {
      logger.error('Error in CategoryController.createCategory:', error);
      next(error);
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const category = await AccountCategory.findByPk(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      if (req.user.role !== 'super_admin' && category.school_id !== req.user.school_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user.role === 'branch_admin' && category.branch_id !== req.user.branch_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user.role === 'accountant' && req.user.branch_id && category.branch_id !== req.user.branch_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const branch_id =
        req.user.role === 'branch_admin' || (req.user.role === 'accountant' && req.user.branch_id)
          ? category.branch_id
          : req.body.branch_id || category.branch_id;
      const branch = await Branch.findOne({
        where: { id: branch_id, school_id: category.school_id }
      });
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found in this school' });
      }

      const updateData = {};
      for (const field of ['name', 'type', 'description', 'is_active']) {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      }
      updateData.branch_id = branch_id;
      await category.update(updateData);
      res.json({ success: true, message: 'Category updated successfully', data: category });
    } catch (error) {
      logger.error('Error in CategoryController.updateCategory:', error);
      next(error);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      const category = await AccountCategory.findByPk(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      if (req.user.role !== 'super_admin' && category.school_id !== req.user.school_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user.role === 'branch_admin' && category.branch_id !== req.user.branch_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user.role === 'accountant' && req.user.branch_id && category.branch_id !== req.user.branch_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      await category.destroy();
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      logger.error('Error in CategoryController.deleteCategory:', error);
      next(error);
    }
  }
}

module.exports = CategoryController;
