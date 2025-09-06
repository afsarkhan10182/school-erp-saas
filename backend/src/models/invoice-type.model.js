const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvoiceType = sequelize.define('InvoiceType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Invoice type name is required' },
    },
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Invoice type code is required' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  requires_student: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  requires_class: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  requires_fee_structure: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  default_payment_terms: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  tableName: 'invoice_types',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id', 'code'], unique: true },
    { fields: ['school_id', 'is_active'] },
    { fields: ['school_id', 'name'] },
  ],
});

module.exports = InvoiceType;
