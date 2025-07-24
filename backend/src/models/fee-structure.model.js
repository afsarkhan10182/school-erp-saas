const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

const FeeStructure = sequelize.define('FeeStructure', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Fee structure name is required' },
    },
  },
  academic_year: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Academic year is required' },
    },
  },
  class_name: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Class name is required' },
    },
  },
  applicable_classes: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of class names that this fee structure applies to'
  },
  section: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  fee_type_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'fee_types',
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Amount cannot be negative' },
    },
  },
  // Payment model type for different payment behaviors
  payment_model: {
    type: DataTypes.ENUM('installment', 'monthly'),
    allowNull: false,
    defaultValue: 'monthly',
    comment: 'installment: one-time or installment payments, monthly: recurring monthly payments'
  },
  installment_type: {
    type: DataTypes.ENUM('one_time', 'multiple'),
    allowNull: false,
    defaultValue: 'one_time',
  },
  installment_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: { args: [1], msg: 'Installment count must be at least 1' },
    },
  },
  // For senior branch: installment amounts
  installment_amounts: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of installment amounts for senior branch'
  },
  // For multiple installments: installment due dates
  installment_due_dates: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of due dates for multiple installments'
  },
  // For school branch: monthly payment details
  monthly_payment_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Monthly payment amount for school branch'
  },
  total_months: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 12,
    comment: 'Total months for school branch payment'
  },
  due_month: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: { args: [1], msg: 'Due month must be between 1 and 12' },
      max: { args: [12], msg: 'Due month must be between 1 and 12' },
    },
  },
  due_day: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      min: { args: [1], msg: 'Due day must be between 1 and 31' },
      max: { args: [31], msg: 'Due day must be between 1 and 31' },
    },
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Due date for one-time full fee payments'
  },
  discount_applicable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  discount_type: {
    type: DataTypes.ENUM('fixed', 'percentage'),
    allowNull: false,
    defaultValue: 'fixed',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  notes: {
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
  branch_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'branches',
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
  tableName: 'fee_structures',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id', 'academic_year', 'class_name'] },
    { fields: ['fee_type_id'] },
    { fields: ['payment_model'] },
    { fields: ['is_active'] },
  ],
  hooks: {
    beforeCreate: async (feeStructure) => {
      // Validate payment model specific fields
      if (feeStructure.payment_model === 'installment') {
        // For installment model, only require installment amounts if there are multiple installments
        if (feeStructure.installment_count > 1 && (!feeStructure.installment_amounts || feeStructure.installment_amounts.length === 0)) {
          throw new Error('Installment amounts are required for multiple installments');
        }
      } else if (feeStructure.payment_model === 'monthly') {
        if (!feeStructure.monthly_payment_amount || feeStructure.monthly_payment_amount <= 0) {
          throw new Error('Monthly payment amount is required for monthly payment model');
        }
      }
    },
    beforeUpdate: async (feeStructure) => {
      // Validate payment model specific fields
      if (feeStructure.payment_model === 'installment') {
        // For installment model, only require installment amounts if there are multiple installments
        if (feeStructure.installment_count > 1 && (!feeStructure.installment_amounts || feeStructure.installment_amounts.length === 0)) {
          throw new Error('Installment amounts are required for multiple installments');
        }
      } else if (feeStructure.payment_model === 'monthly') {
        if (!feeStructure.monthly_payment_amount || feeStructure.monthly_payment_amount <= 0) {
          throw new Error('Monthly payment amount is required for monthly payment model');
        }
      }
    },
          afterCreate: async (feeStructure) => {
        logger.info(`New fee structure created: ${feeStructure.name} for ${feeStructure.payment_model} model`);
      },
    },
  });

  // Define associations
  FeeStructure.associate = (models) => {
    // FeeStructure belongs to FeeType
    FeeStructure.belongsTo(models.FeeType, {
      foreignKey: 'fee_type_id',
      as: 'feeType',
    });

    // FeeStructure belongs to School
    FeeStructure.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'school',
    });

    // FeeStructure belongs to Branch
    FeeStructure.belongsTo(models.Branch, {
      foreignKey: 'branch_id',
      as: 'branch',
    });

    // FeeStructure belongs to User (created_by)
    FeeStructure.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'createdBy',
    });

    // FeeStructure belongs to User (updated_by)
    FeeStructure.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updatedBy',
    });
  };

  module.exports = FeeStructure;