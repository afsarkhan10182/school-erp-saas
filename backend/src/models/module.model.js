const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const Module = sequelize.define('Module', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Module code is required' },
      isAlphanumeric: { msg: 'Module code must be alphanumeric' },
      len: {
        args: [2, 50],
        msg: 'Module code must be between 2 and 50 characters',
      },
    },
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Module name is required' },
      len: {
        args: [2, 100],
        msg: 'Module name must be between 2 and 100 characters',
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  icon: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  features: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of features included in this module'
  },
  category: {
    type: DataTypes.ENUM('academic', 'administrative', 'financial', 'communication', 'reporting'),
    allowNull: false,
    defaultValue: 'administrative',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_core: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Core modules are essential and cannot be disabled'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1.0.0',
  },
  dependencies: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of module codes this module depends on'
  },
  permissions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of permissions this module provides'
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
  tableName: 'modules',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['is_active'] },
    { fields: ['category'] },
    { fields: ['sort_order'] },
  ],
  hooks: {
    afterCreate: async (module) => {
      logger.info(`New module created: ${module.name} (${module.code})`);
    },
    afterUpdate: async (module) => {
      logger.info(`Module updated: ${module.name} (${module.code})`);
    },
  },
});

// Define associations
Module.associate = (models) => {
  // Module belongs to User (created_by)
  Module.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // Module belongs to User (updated_by)
  Module.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });

  // Module has many SubscriptionPlans through PlanModule
  Module.belongsToMany(models.SubscriptionPlan, {
    through: models.PlanModule,
    foreignKey: 'module_id',
    otherKey: 'subscription_plan_id',
    as: 'subscriptionPlans',
  });

  // Module has many PlanModules
  Module.hasMany(models.PlanModule, {
    foreignKey: 'module_id',
    as: 'planModules',
  });
};

module.exports = Module;
