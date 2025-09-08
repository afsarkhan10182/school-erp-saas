const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const SubscriptionRenewalRequest = sequelize.define('SubscriptionRenewalRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'schools',
      key: 'id',
    },
  },
  current_plan_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Current subscription plan code'
  },
  requested_plan_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Requested subscription plan code'
  },
  request_type: {
    type: DataTypes.ENUM('renewal', 'upgrade', 'downgrade', 'change_plan'),
    allowNull: false,
    defaultValue: 'renewal',
    comment: 'Type of renewal request'
  },
  current_subscription_end_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Current subscription end date'
  },
  requested_start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Requested subscription start date'
  },
  requested_end_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Requested subscription end date'
  },
  billing_cycle: {
    type: DataTypes.ENUM('monthly', 'yearly', 'lifetime'),
    allowNull: false,
    defaultValue: 'yearly',
    comment: 'Billing cycle for the request'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Status of the renewal request'
  },
  request_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for upgrade/downgrade request'
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin notes for the request'
  },
  admin_response: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin response to the request'
  },
  requested_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'User who made the request'
  },
  reviewed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Super admin who reviewed the request'
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the request was reviewed'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether the request is active'
  },
}, {
  tableName: 'subscription_renewal_requests',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id'] },
    { fields: ['status'] },
    { fields: ['requested_by'] },
    { fields: ['reviewed_by'] },
    { fields: ['created_at'] },
  ],
  hooks: {
    afterCreate: async (request) => {
      logger.info(`New subscription renewal request created: ${request.id} for school ${request.school_id}`);
    },
    afterUpdate: async (request) => {
      logger.info(`Subscription renewal request updated: ${request.id} - Status: ${request.status}`);
    },
  },
});

// Define associations
SubscriptionRenewalRequest.associate = (models) => {
  // SubscriptionRenewalRequest belongs to School
  SubscriptionRenewalRequest.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school',
  });

  // SubscriptionRenewalRequest belongs to User (requested_by)
  SubscriptionRenewalRequest.belongsTo(models.User, {
    foreignKey: 'requested_by',
    as: 'requestedBy',
  });

  // SubscriptionRenewalRequest belongs to User (reviewed_by)
  SubscriptionRenewalRequest.belongsTo(models.User, {
    foreignKey: 'reviewed_by',
    as: 'reviewedBy',
  });


};

module.exports = SubscriptionRenewalRequest; 