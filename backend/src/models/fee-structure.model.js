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
  installment_type: {
    type: DataTypes.ENUM('one_time', 'monthly', 'quarterly', 'half_yearly', 'yearly'),
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
    { fields: ['school_id', 'academic_year', 'class_name', 'fee_type_id', 'is_active'], unique: true },
    { fields: ['school_id'] },
    { fields: ['branch_id'] },
    { fields: ['fee_type_id'] },
    { fields: ['academic_year'] },
    { fields: ['class_name'] },
    { fields: ['is_active'] },
  ],
  hooks: {
    afterCreate: async (feeStructure) => {
      logger.info(`New fee structure created: ${feeStructure.name} - ${feeStructure.class_name} (${feeStructure.academic_year})`);
    },
  },
});

// Define associations
FeeStructure.associate = (models) => {
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

  // FeeStructure belongs to FeeType
  FeeStructure.belongsTo(models.FeeType, {
    foreignKey: 'fee_type_id',
    as: 'feeType',
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
