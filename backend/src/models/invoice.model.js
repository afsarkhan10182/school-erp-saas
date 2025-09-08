const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  invoice_type: {
    type: DataTypes.ENUM('tuition', 'transport', 'hostel', 'library', 'exam', 'sports', 'donation', 'misc', 'other'),
    allowNull: false,
    defaultValue: 'tuition',
  },
  
  // Flexible entity references
  entity_type: {
    type: DataTypes.ENUM('student', 'staff', 'vendor', 'school', 'other'),
    allowNull: true,
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Reference to student, staff, vendor, etc.'
  },
  
  // For backward compatibility with existing fee invoices
  student_id: {
    type: DataTypes.UUID,
    allowNull: true, // Changed to nullable
    references: {
      model: 'students',
      key: 'id',
    },
  },
  fee_structure_id: {
    type: DataTypes.UUID,
    allowNull: true, // Changed to nullable
    references: {
      model: 'fee_structures',
      key: 'id',
    },
  },
  class_name: {
    type: DataTypes.STRING(20),
    allowNull: true, // Changed to nullable
  },
  
  // Invoice details
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  // Amounts
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  balance_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  
  // Status and dates
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'paid', 'partial_paid', 'overdue', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft',
  },
  invoice_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  
  // Payment terms
  payment_terms: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  // Multi-tenant fields
  school_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'schools',
      key: 'id',
    },
  },
  branch_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'branches',
      key: 'id',
    },
  },
  
  // Audit fields
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
  tableName: 'invoices',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id', 'invoice_number'], unique: true },
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['student_id'] },
    { fields: ['invoice_type'] },
    { fields: ['status'] },
    { fields: ['due_date'] },
  ],
});

module.exports = Invoice;
