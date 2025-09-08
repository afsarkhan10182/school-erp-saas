const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Class name is required' },
    },
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Class code is required' },
    },
  },
  numeric_value: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: { args: [1], msg: 'Numeric value must be at least 1' },
      max: { args: [12], msg: 'Numeric value must be at most 12' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    validate: {
      min: { args: [1], msg: 'Capacity must be at least 1' },
    },
  },
  has_stream: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indicates if this class has streams (e.g., Class 11, 12)',
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
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
    allowNull: false, // Changed from true to false - classes must always have a branch
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
  tableName: 'classes',
  timestamps: true,
  underscored: true,
  indexes: [
    // Updated unique constraints: school_id + branch_id + name/code (allows same name/code across branches)
    { fields: ['school_id', 'branch_id', 'name'], unique: true },
    { fields: ['school_id', 'branch_id', 'code'], unique: true },
    { fields: ['school_id'] },
    { fields: ['branch_id'] },
    { fields: ['is_active'] },
    { fields: ['sort_order'] },
    { fields: ['has_stream'] },
  ],
  hooks: {
    afterCreate: async (classInstance) => {
      logger.info(`New class created: ${classInstance.name} (${classInstance.code}) for branch ${classInstance.branch_id} - has_stream: ${classInstance.has_stream}`);
    },
  },
});

// Define associations
Class.associate = (models) => {
  // Class belongs to School
  Class.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school',
  });

  // Class belongs to Branch
  Class.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch',
  });

  // Class belongs to User (created_by)
  Class.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // Class belongs to User (updated_by)
  Class.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });

  // Class has many Sections
  Class.hasMany(models.Section, {
    foreignKey: 'class_id',
    as: 'sections',
  });

  // Class has many Streams
  Class.hasMany(models.Stream, {
    foreignKey: 'class_id',
    as: 'streams',
  });
};

module.exports = Class;
