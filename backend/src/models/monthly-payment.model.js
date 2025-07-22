const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

const MonthlyPayment = sequelize.define('MonthlyPayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id',
    },
  },
  fee_structure_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'fee_structures',
      key: 'id',
    },
  },
  academic_year: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Month must be between 1 and 12' },
      max: { args: [12], msg: 'Month must be between 1 and 12' },
    },
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  due_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  balance_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue'),
    allowNull: false,
    defaultValue: 'pending',
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  receipt_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
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
  tableName: 'monthly_payments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['student_id', 'fee_structure_id', 'month', 'year'], unique: true },
    { fields: ['school_id'] },
    { fields: ['branch_id'] },
    { fields: ['academic_year'] },
    { fields: ['status'] },
    { fields: ['due_date'] },
  ],
  hooks: {
    beforeCreate: async (payment) => {
      // Calculate balance amount
      payment.balance_amount = payment.due_amount - payment.paid_amount;
      
      // Set status based on payment
      if (payment.paid_amount >= payment.due_amount) {
        payment.status = 'paid';
      } else if (payment.paid_amount > 0) {
        payment.status = 'partial';
      }
    },
    beforeUpdate: async (payment) => {
      // Recalculate balance amount
      payment.balance_amount = payment.due_amount - payment.paid_amount;
      
      // Update status based on payment
      if (payment.paid_amount >= payment.due_amount) {
        payment.status = 'paid';
      } else if (payment.paid_amount > 0) {
        payment.status = 'partial';
      } else if (new Date() > payment.due_date) {
        payment.status = 'overdue';
      }
    },
    afterCreate: async (payment) => {
      logger.info(`Monthly payment created for student ${payment.student_id}, month ${payment.month}/${payment.year}`);
    },
  },
});

// Define associations
MonthlyPayment.associate = (models) => {
  // MonthlyPayment belongs to Student
  MonthlyPayment.belongsTo(models.Student, {
    foreignKey: 'student_id',
    as: 'student',
  });

  // MonthlyPayment belongs to FeeStructure
  MonthlyPayment.belongsTo(models.FeeStructure, {
    foreignKey: 'fee_structure_id',
    as: 'feeStructure',
  });

  // MonthlyPayment belongs to School
  MonthlyPayment.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school',
  });

  // MonthlyPayment belongs to Branch
  MonthlyPayment.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch',
  });

  // MonthlyPayment belongs to User (created_by)
  MonthlyPayment.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // MonthlyPayment belongs to User (updated_by)
  MonthlyPayment.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });
};

module.exports = MonthlyPayment; 