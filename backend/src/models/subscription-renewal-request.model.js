const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

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
  current_plan: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Current subscription plan code'
  },
  requested_plan: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Requested subscription plan code'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for upgrade/downgrade request'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
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
  },
  review_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes from the reviewer'
  },
  effective_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the change should take effect'
  },
  price_difference: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Price difference between plans'
  },
  billing_cycle: {
    type: DataTypes.ENUM('monthly', 'yearly', 'lifetime'),
    allowNull: false,
    defaultValue: 'monthly',
  },
  payment_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether payment is required for this change'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
  },
  payment_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Amount to be paid for the change'
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Payment method used'
  },
  payment_reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Payment gateway reference'
  },
  auto_renewal: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether to auto-renew after this change'
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
  tableName: 'subscription_renewal_requests',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id'] },
    { fields: ['status'] },
    { fields: ['requested_by'] },
    { fields: ['reviewed_by'] },
    { fields: ['created_at'] },
    { fields: ['effective_date'] },
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

  // SubscriptionRenewalRequest belongs to User (created_by)
  SubscriptionRenewalRequest.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // SubscriptionRenewalRequest belongs to User (updated_by)
  SubscriptionRenewalRequest.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });
};

module.exports = SubscriptionRenewalRequest; 