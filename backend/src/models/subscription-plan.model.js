const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Plan name is required' },
      len: {
        args: [2, 100],
        msg: 'Plan name must be between 2 and 100 characters',
      },
    },
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Plan code is required' },
      isAlphanumeric: { msg: 'Plan code must be alphanumeric' },
      len: {
        args: [2, 20],
        msg: 'Plan code must be between 2 and 20 characters',
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Price cannot be negative' },
    },
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
  },
  billing_cycle: {
    type: DataTypes.ENUM('monthly', 'yearly', 'lifetime'),
    allowNull: false,
    defaultValue: 'monthly',
  },
  max_students: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100, // This should be configurable per plan
    validate: {
      min: { args: [-1], msg: 'Max students must be at least -1 (unlimited)' },
    },
  },
  max_staff: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20, // This should be configurable per plan
    validate: {
      min: { args: [-1], msg: 'Max staff must be at least -1 (unlimited)' },
    },
  },
  max_branches: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // This should be configurable per plan
    validate: {
      min: { args: [-1], msg: 'Max branches must be at least -1 (unlimited)' },
    },
  },
  // Remove the hardcoded modules array - now managed through PlanModule relationship
  features: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_popular: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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
  // Plan inheritance and overrides
  parent_plan_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'subscription_plans',
      key: 'id'
    },
    comment: 'If this is a custom plan based on another plan'
  },
  is_custom: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is a custom plan for specific school'
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'schools',
      key: 'id'
    },
    comment: 'School this custom plan is created for'
  },
}, {
  tableName: 'subscription_plans',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['name'], unique: true },
    { fields: ['is_active'] },
    { fields: ['billing_cycle'] },
  ],
  hooks: {
    afterCreate: async (plan) => {
      logger.info(`New subscription plan created: ${plan.name} (${plan.id})`);
    },
    afterUpdate: async (plan) => {
      logger.info(`Subscription plan updated: ${plan.name} (${plan.id})`);
    },
  },
});

// Define associations
SubscriptionPlan.associate = (models) => {
  // SubscriptionPlan belongs to User (created_by)
  SubscriptionPlan.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // SubscriptionPlan belongs to User (updated_by)
  SubscriptionPlan.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });

  // SubscriptionPlan has many Modules through PlanModule
  SubscriptionPlan.belongsToMany(models.Module, {
    through: models.PlanModule,
    foreignKey: 'subscription_plan_id',
    otherKey: 'module_id',
    as: 'modules',
  });

  // SubscriptionPlan has many PlanModules
  SubscriptionPlan.hasMany(models.PlanModule, {
    foreignKey: 'subscription_plan_id',
    as: 'planModules',
  });
};

module.exports = SubscriptionPlan; 