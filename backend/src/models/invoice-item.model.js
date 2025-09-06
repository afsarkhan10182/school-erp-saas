const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvoiceItem = sequelize.define('InvoiceItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  invoice_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'fee_invoices',
      key: 'id',
    },
  },
  item_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Item name is required' },
    },
  },
  item_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1.00,
    validate: {
      min: { args: [0], msg: 'Quantity cannot be negative' },
    },
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Unit price cannot be negative' },
    },
  },
  discount_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Discount percentage cannot be negative' },
      max: { args: [100], msg: 'Discount percentage cannot exceed 100%' },
    },
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Discount amount cannot be negative' },
    },
  },
  tax_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Tax percentage cannot be negative' },
    },
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Tax amount cannot be negative' },
    },
  },
  line_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Line total cannot be negative' },
    },
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: { args: [1], msg: 'Sort order must be at least 1' },
    },
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'schools',
      key: 'id',
    },
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'invoice_items',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['invoice_id'] },
    { fields: ['school_id'] },
    { fields: ['invoice_id', 'sort_order'] },
  ],
  hooks: {
    beforeSave: (item) => {
      // Calculate line total
      const subtotal = item.quantity * item.unit_price;
      const discountAmount = subtotal * (item.discount_percentage / 100) + item.discount_amount;
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (item.tax_percentage / 100) + item.tax_amount;
      item.line_total = taxableAmount + taxAmount;
    },
  },
});

module.exports = InvoiceItem;
