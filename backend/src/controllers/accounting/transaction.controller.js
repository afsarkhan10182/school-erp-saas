const { SchoolTransaction, AccountCategory, School, Branch } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');

class TransactionController {
  static async getAllTransactions(req, res, next) {
    try {
      const { page = 1, limit = 10, search = '', type = '', category_id = '' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let whereClause = {};

      if (req.user.role === 'admin') {
        whereClause.school_id = req.user.school_id;
      } else if (req.user.role === 'branch_admin') {
        whereClause.school_id = req.user.school_id;
        whereClause.branch_id = req.user.branch_id;
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { reference_number: { [Op.iLike]: `%${search}%` } }
        ];
      }
      if (type) {
        whereClause.type = type;
      }
      if (category_id) {
        whereClause.category_id = category_id;
      }

      const { count, rows } = await SchoolTransaction.findAndCountAll({
        where: whereClause,
        include: [
          { model: AccountCategory, as: 'category', attributes: ['id', 'name', 'type'] },
          { model: School, as: 'school', attributes: ['id', 'name'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] }
        ],
        order: [['date', 'DESC'], ['created_at', 'DESC']],
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
      logger.error('Error in TransactionController.getAllTransactions:', error);
      next(error);
    }
  }

  static async getTransactionById(req, res, next) {
    try {
      const transaction = await SchoolTransaction.findByPk(req.params.id, {
        include: [
          { model: AccountCategory, as: 'category', attributes: ['id', 'name', 'type'] },
          { model: School, as: 'school', attributes: ['id', 'name'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] }
        ]
      });

      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      if (req.user.role !== 'super_admin' && transaction.school_id !== req.user.school_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user.role === 'branch_admin' && transaction.branch_id !== req.user.branch_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      res.json({ success: true, data: transaction });
    } catch (error) {
      logger.error('Error in TransactionController.getTransactionById:', error);
      next(error);
    }
  }

  static async createTransaction(req, res, next) {
    try {
      const { category_id, name, amount, date, reference_number, payment_method, description, attachment, branch_id } = req.body;
      
      let school_id = req.user.school_id;
      let final_branch_id = req.user.role === 'branch_admin' ? req.user.branch_id : branch_id;

      if (req.user.role === 'super_admin') {
        school_id = req.body.school_id;
        final_branch_id = branch_id;
      }

      if (!school_id || !final_branch_id) {
        return res.status(400).json({ success: false, message: 'School and Branch ID required' });
      }

      // Verify category
      const category = await AccountCategory.findByPk(category_id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Account Category not found' });
      }

      const transaction = await SchoolTransaction.create({
        category_id,
        name,
        type: category.type, // Infer type from category
        amount,
        date,
        reference_number,
        payment_method,
        description,
        attachment,
        school_id,
        branch_id: final_branch_id
      });

      res.status(201).json({ success: true, message: 'Transaction created successfully', data: transaction });
    } catch (error) {
      logger.error('Error in TransactionController.createTransaction:', error);
      next(error);
    }
  }

  static async updateTransaction(req, res, next) {
    try {
      const transaction = await SchoolTransaction.findByPk(req.params.id);
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      if (req.user.role !== 'super_admin' && transaction.school_id !== req.user.school_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user.role === 'branch_admin' && transaction.branch_id !== req.user.branch_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      let updateData = { ...req.body };
      
      // If category is changing, update type as well
      if (req.body.category_id && req.body.category_id !== transaction.category_id) {
        const category = await AccountCategory.findByPk(req.body.category_id);
        if (!category) {
          return res.status(404).json({ success: false, message: 'Account Category not found' });
        }
        updateData.type = category.type;
      }

      await transaction.update(updateData);
      res.json({ success: true, message: 'Transaction updated successfully', data: transaction });
    } catch (error) {
      logger.error('Error in TransactionController.updateTransaction:', error);
      next(error);
    }
  }

  static async deleteTransaction(req, res, next) {
    try {
      const transaction = await SchoolTransaction.findByPk(req.params.id);
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      if (req.user.role !== 'super_admin' && transaction.school_id !== req.user.school_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user.role === 'branch_admin' && transaction.branch_id !== req.user.branch_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      await transaction.destroy();
      res.json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
      logger.error('Error in TransactionController.deleteTransaction:', error);
      next(error);
    }
  }
}

module.exports = TransactionController;
