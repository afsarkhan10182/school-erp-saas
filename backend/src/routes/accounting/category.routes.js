const express = require('express');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('~/controllers/accounting/category.controller');
const { verifyToken, authorize } = require('~/middleware/core/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', authorize(['super_admin', 'admin', 'branch_admin']), getAllCategories);
router.get('/:id', authorize(['super_admin', 'admin', 'branch_admin']), getCategoryById);
router.post('/', authorize(['super_admin', 'admin', 'branch_admin']), createCategory);
router.put('/:id', authorize(['super_admin', 'admin', 'branch_admin']), updateCategory);
router.delete('/:id', authorize(['super_admin', 'admin', 'branch_admin']), deleteCategory);

module.exports = router;
