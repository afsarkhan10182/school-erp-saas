const { SchoolTransaction, AccountCategory, School, Branch } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');

class TransactionController {
  static async getAllTransactions(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        type = '',
        category_id = '',
        branch_id = '',
        school_id = '',
        sort_by = 'date',
        sort_order = 'DESC'
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

      const sortableFields = ['name', 'category', 'amount', 'date'];
      const safeSortBy = sortableFields.includes(sort_by) ? sort_by : 'date';
      const safeSortOrder = sortableFields.includes(sort_by) && String(sort_order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      const order = safeSortBy === 'category'
        ? [[{ model: AccountCategory, as: 'category' }, 'name', safeSortOrder]]
        : [[safeSortBy, safeSortOrder]];
      if (safeSortBy !== 'date') order.push(['date', 'DESC']);
      order.push(['created_at', 'DESC']);

      const { count, rows } = await SchoolTransaction.findAndCountAll({
        where: whereClause,
        include: [
          { model: AccountCategory, as: 'category', attributes: ['id', 'name', 'type'] },
          { model: School, as: 'school', attributes: ['id', 'name'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] }
        ],
        order,
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
      if (req.user.role === 'accountant' && req.user.branch_id && transaction.branch_id !== req.user.branch_id) {
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
      const {
        category_id,
        name,
        amount,
        date,
        reference_number,
        payment_method,
        description,
        attachment,
        branch_id
      } = req.body;

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

      const category = await AccountCategory.findOne({
        where: { id: category_id, school_id, branch_id: final_branch_id }
      });
      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: 'Account Category not found in this branch' });
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

      res
        .status(201)
        .json({ success: true, message: 'Transaction created successfully', data: transaction });
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
      if (req.user.role === 'accountant' && req.user.branch_id && transaction.branch_id !== req.user.branch_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const branch_id =
        req.user.role === 'branch_admin' || (req.user.role === 'accountant' && req.user.branch_id)
          ? transaction.branch_id
          : req.body.branch_id || transaction.branch_id;
      const branch = await Branch.findOne({
        where: { id: branch_id, school_id: transaction.school_id }
      });
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found in this school' });
      }

      const category_id = req.body.category_id || transaction.category_id;
      const category = await AccountCategory.findOne({
        where: { id: category_id, school_id: transaction.school_id, branch_id }
      });
      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: 'Account Category not found in this branch' });
      }

      const updateData = {
        category_id,
        branch_id,
        name: req.body.name,
        amount: req.body.amount,
        date: req.body.date,
        reference_number: req.body.reference_number,
        payment_method: req.body.payment_method,
        description: req.body.description,
        attachment: req.body.attachment,
        type: category.type
      };
      for (const key of Object.keys(updateData)) {
        if (updateData[key] === undefined) delete updateData[key];
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
      if (req.user.role === 'accountant' && req.user.branch_id && transaction.branch_id !== req.user.branch_id) {
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
