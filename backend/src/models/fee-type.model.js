const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

const FeeType = sequelize.define('FeeType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Fee type name is required' },
    },
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Fee type code is required' },
    },
  },
  
  category: {
    type: DataTypes.ENUM('academic', 'transport', 'hostel', 'library', 'exam', 'sports', 'other'),
    allowNull: true,
    defaultValue: 'other',
  },
  
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
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
  tableName: 'fee_types',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id', 'code'], unique: true },
    { fields: ['school_id'] },
    { fields: ['category'] },
    { fields: ['is_active'] },
    { fields: ['is_mandatory'] },
    { fields: ['sort_order'] },
  ],
  hooks: {
    afterCreate: async (feeType) => {
      logger.info(`New fee type created: ${feeType.name} (${feeType.code})`);
    },
  },
});

// Define associations
FeeType.associate = (models) => {
  // FeeType belongs to School
  FeeType.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school',
  });

  // FeeType belongs to Branch
  FeeType.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch',
  });

  // FeeType belongs to User (created_by)
  FeeType.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // FeeType belongs to User (updated_by)
  FeeType.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });
};

module.exports = FeeType;
