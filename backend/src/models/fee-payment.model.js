const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

const FeePayment = sequelize.define('FeePayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  payment_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Payment number is required' },
    },
  },
  receipt_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Receipt number is required' },
    },
  },
  invoice_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'fee_invoices',
      key: 'id',
    },
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id',
    },
  },
  payment_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0.01], msg: 'Payment amount must be greater than 0' },
    },
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'cheque', 'bank_transfer', 'card', 'upi', 'online'),
    allowNull: false,
    defaultValue: 'cash',
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'External transaction ID for online payments',
  },
  cheque_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Cheque number if payment method is cheque',
  },
  bank_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Bank name for cheque or bank transfer',
  },
  reference_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Reference number for bank transfer or other payment methods',
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    allowNull: false,
    defaultValue: 'completed',
  },
  receipt_html: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Generated receipt HTML content',
  },
  receipt_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Receipt data for regeneration',
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
  tableName: 'fee_payments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['payment_number'], unique: true },
    { fields: ['receipt_number'], unique: true },
    { fields: ['invoice_id'] },

    { fields: ['student_id'] },
    { fields: ['school_id'] },
    { fields: ['branch_id'] },
    { fields: ['payment_date'] },
    { fields: ['payment_status'] },
    { fields: ['payment_method'] },
  ],
  hooks: {
    beforeCreate: async (payment) => {
      // Generate payment number if not provided
      if (!payment.payment_number) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        payment.payment_number = `PAY${timestamp}${random}`;
      }
      
      // Generate receipt number if not provided
      if (!payment.receipt_number) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        payment.receipt_number = `RCP${timestamp}${random}`;
      }
    },
    afterCreate: async (payment) => {
      logger.info(`New fee payment created: ${payment.payment_number} (${payment.receipt_number}) for amount ${payment.payment_amount}`);
    },
    afterUpdate: async (payment) => {
      logger.info(`Fee payment updated: ${payment.payment_number} (${payment.receipt_number})`);
    },
  },
});

// Define associations
FeePayment.associate = (models) => {
  // FeePayment belongs to FeeInvoice
  FeePayment.belongsTo(models.FeeInvoice, {
    foreignKey: 'invoice_id',
    as: 'invoice',
  });



  // FeePayment belongs to Student
  FeePayment.belongsTo(models.Student, {
    foreignKey: 'student_id',
    as: 'student',
  });

  // FeePayment belongs to School
  FeePayment.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school',
  });

  // FeePayment belongs to Branch
  FeePayment.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch',
  });

  // FeePayment belongs to User (created_by)
  FeePayment.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // FeePayment belongs to User (updated_by)
  FeePayment.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });
};

module.exports = FeePayment; 