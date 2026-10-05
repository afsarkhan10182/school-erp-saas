const express = require('express');
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
} = require('~/controllers/accounting/transaction.controller');
const { verifyToken, authorize } = require('~/middleware/core/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', authorize(['super_admin', 'admin', 'branch_admin', 'accountant']), getAllTransactions);
router.get('/:id', authorize(['super_admin', 'admin', 'branch_admin', 'accountant']), getTransactionById);
router.post('/', authorize(['super_admin', 'admin', 'branch_admin', 'accountant']), createTransaction);
router.put('/:id', authorize(['super_admin', 'admin', 'branch_admin', 'accountant']), updateTransaction);
router.delete('/:id', authorize(['super_admin', 'admin', 'branch_admin', 'accountant']), deleteTransaction);

module.exports = router;
