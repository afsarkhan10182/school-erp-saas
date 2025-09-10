const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const Transaction = sequelize.define(
  'Transaction',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transaction_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Transaction ID is required' }
      }
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'schools',
        key: 'id'
      }
    },
    subscription_plan_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'subscription_plans',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Amount cannot be negative' }
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'INR'
    },
    payment_method: {
      type: DataTypes.ENUM(
        'online',
        'offline_cash',
        'offline_cheque',
        'offline_bank_transfer',
        'card',
        'upi'
      ),
      allowNull: false,
      defaultValue: 'online'
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    transaction_status: {
      type: DataTypes.ENUM('initiated', 'processing', 'success', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'initiated'
    },
    billing_cycle: {
      type: DataTypes.ENUM('monthly', 'yearly', 'lifetime'),
      allowNull: false,
      defaultValue: 'monthly'
    },
    subscription_start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    subscription_end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gateway_response: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    gateway_transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    gateway_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    receipt_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_manual: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  },
  {
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['transaction_id'], unique: true },
      { fields: ['school_id'] },
      { fields: ['subscription_plan_id'] },
      { fields: ['payment_status'] },
      { fields: ['transaction_status'] },
      { fields: ['payment_method'] },
      { fields: ['created_at'] }
    ],
    hooks: {
      // Generate a transaction_id early so validation passes
      beforeValidate: async transaction => {
        if (!transaction.transaction_id) {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 8).toUpperCase();
          transaction.transaction_id = `TXN${timestamp}${random}`;
        }
      },
      afterCreate: async transaction => {
        logger.info(`New transaction created: ${transaction.transaction_id} (${transaction.id})`);
      },
      afterUpdate: async transaction => {
        logger.info(`Transaction updated: ${transaction.transaction_id} (${transaction.id})`);
      }
    }
  }
);

// Define associations
Transaction.associate = models => {
  // Transaction belongs to School
  Transaction.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });

  // Transaction belongs to SubscriptionPlan
  Transaction.belongsTo(models.SubscriptionPlan, {
    foreignKey: 'subscription_plan_id',
    as: 'subscriptionPlan'
  });

  // Transaction belongs to User (created_by)
  Transaction.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy'
  });

  // Transaction belongs to User (updated_by)
  Transaction.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy'
  });
};

module.exports = Transaction;
