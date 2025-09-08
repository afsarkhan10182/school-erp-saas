const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const PlanModule = sequelize.define('PlanModule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  subscription_plan_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'subscription_plans',
      key: 'id',
    },
  },
  module_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'modules',
      key: 'id',
    },
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this module is required for this plan'
  },
  is_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether this module is enabled for this plan'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
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
  tableName: 'plan_modules',
  timestamps: true,
  underscored: true,
  indexes: [
    { 
      fields: ['subscription_plan_id', 'module_id'], 
      unique: true,
      name: 'unique_plan_module'
    },
    { fields: ['subscription_plan_id'] },
    { fields: ['module_id'] },
    { fields: ['is_enabled'] },
  ],
  hooks: {
    afterCreate: async (planModule) => {
      logger.info(`Plan-Module relationship created: Plan ${planModule.subscription_plan_id} - Module ${planModule.module_id}`);
    },
    afterUpdate: async (planModule) => {
      logger.info(`Plan-Module relationship updated: Plan ${planModule.subscription_plan_id} - Module ${planModule.module_id}`);
    },
  },
});

// Define associations
PlanModule.associate = (models) => {
  // PlanModule belongs to SubscriptionPlan
  PlanModule.belongsTo(models.SubscriptionPlan, {
    foreignKey: 'subscription_plan_id',
    as: 'subscriptionPlan',
  });

  // PlanModule belongs to Module
  PlanModule.belongsTo(models.Module, {
    foreignKey: 'module_id',
    as: 'module',
  });

  // PlanModule belongs to User (created_by)
  PlanModule.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // PlanModule belongs to User (updated_by)
  PlanModule.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });
};

module.exports = PlanModule;
