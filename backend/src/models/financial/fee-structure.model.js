const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

// Helper function to normalize fee structure fields based on payment model
const normalizeFeeStructure = feeStructure => {
  if (feeStructure.payment_model === 'monthly') {
    // For monthly payments: clear installment fields, keep monthly fields
    feeStructure.installment_amounts = [];
    feeStructure.installment_due_dates = [];
    feeStructure.due_date = null;
    feeStructure.installment_type = null; // Use NULL instead of 'one_time' for clarity
    feeStructure.due_month = null; // Remove due_month for monthly payments (only due_day matters)

    // Ensure monthly fields are set
    if (!feeStructure.monthly_payment_amount) {
      feeStructure.monthly_payment_amount = feeStructure.amount || 1000;
    }
    if (!feeStructure.total_months) {
      feeStructure.total_months = 12;
    }
    if (!feeStructure.due_day) {
      feeStructure.due_day = 10;
    }
  } else if (feeStructure.payment_model === 'installment') {
    // For installment payments: clear monthly fields, keep installment fields
    feeStructure.monthly_payment_amount = null;
    feeStructure.total_months = null;
    feeStructure.due_month = null;
    feeStructure.due_day = null; // Use NULL for installment payments

    // Handle due_date based on installment type
    if (feeStructure.installment_type === 'one_time') {
      // Invoice generation applies the school's due-date policy when no date is configured.
      feeStructure.installment_amounts = [];
      feeStructure.installment_due_dates = [];
    } else if (feeStructure.installment_type === 'multiple') {
      // Multiple installments use installment_due_dates, not due_date
      feeStructure.due_date = null;
      // Ensure installment arrays are properly initialized
      if (!feeStructure.installment_amounts) {
        feeStructure.installment_amounts = [];
      }
      if (!feeStructure.installment_due_dates) {
        feeStructure.installment_due_dates = [];
      }

      // If installment_amounts is provided but installment_due_dates is not,
      // generate default due dates based on installment count
      if (
        feeStructure.installment_amounts.length > 0 &&
        feeStructure.installment_due_dates.length === 0
      ) {
        const currentDate = new Date();
        feeStructure.installment_due_dates = [];
        for (let i = 0; i < feeStructure.installment_amounts.length; i++) {
          const installmentDate = new Date(currentDate);
          installmentDate.setMonth(currentDate.getMonth() + i * 3); // Every 3 months
          feeStructure.installment_due_dates.push(installmentDate.toISOString().split('T')[0]);
        }
      }
    }
  }
};

// Helper function to validate fee structure fields
const validateFeeStructure = feeStructure => {
  if (feeStructure.payment_model === 'installment') {
    if (feeStructure.installment_type === 'multiple') {
      // For multiple installments, validate arrays match
      const amountsLength = feeStructure.installment_amounts
        ? feeStructure.installment_amounts.length
        : 0;
      const dueDatesLength = feeStructure.installment_due_dates
        ? feeStructure.installment_due_dates.length
        : 0;

      if (amountsLength !== dueDatesLength) {
        throw new Error(
          `Installment amounts (${amountsLength}) and due dates (${dueDatesLength}) arrays must have the same length`
        );
      }

      if (amountsLength !== feeStructure.installment_count) {
        throw new Error(
          `Installment count (${feeStructure.installment_count}) must match the number of installment amounts (${amountsLength})`
        );
      }

      if (amountsLength === 0) {
        throw new Error(
          'Multiple installments require at least one installment amount and due date'
        );
      }

      // Validate that all amounts are positive
      for (let i = 0; i < feeStructure.installment_amounts.length; i++) {
        if (!feeStructure.installment_amounts[i] || feeStructure.installment_amounts[i] <= 0) {
          throw new Error(`Installment amount ${i + 1} must be greater than 0`);
        }
      }

      // Validate that all due dates are valid dates
      for (let i = 0; i < feeStructure.installment_due_dates.length; i++) {
        if (
          !feeStructure.installment_due_dates[i] ||
          !Date.parse(feeStructure.installment_due_dates[i])
        ) {
          throw new Error(`Installment due date ${i + 1} must be a valid date`);
        }
      }
    } else if (feeStructure.installment_type === 'one_time') {
      // A missing date is resolved from school fee settings during invoice generation.
    }
  } else if (feeStructure.payment_model === 'monthly') {
    if (!feeStructure.monthly_payment_amount || feeStructure.monthly_payment_amount <= 0) {
      throw new Error('Monthly payment amount is required and must be greater than 0');
    }
    if (!feeStructure.total_months || feeStructure.total_months <= 0) {
      throw new Error('Total months is required and must be greater than 0');
    }
    if (!feeStructure.due_day || feeStructure.due_day < 1 || feeStructure.due_day > 31) {
      throw new Error('Due day is required and must be between 1 and 31');
    }
  }
};

const FeeStructure = sequelize.define(
  'FeeStructure',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Fee structure name is required' }
      }
    },
    academic_year: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Academic year is required' }
      }
    },
    class_name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Class name is required' }
      }
    },
    class_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'classes',
        key: 'id'
      },
      comment: 'Reference to the Class model for proper class code lookup'
    },
    applicable_classes: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of class names that this fee structure applies to'
    },
    stream_ids: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of stream IDs that this fee structure applies to (for classes 11 & 12)'
    },
    section: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    fee_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fee_types',
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
    // Payment model type for different payment behaviors
    payment_model: {
      type: DataTypes.ENUM('installment', 'monthly'),
      allowNull: false,
      defaultValue: 'monthly',
      comment: 'installment: one-time or installment payments, monthly: recurring monthly payments'
    },
    installment_type: {
      type: DataTypes.ENUM('one_time', 'multiple'),
      allowNull: true, // Changed to allow NULL for monthly payments
      defaultValue: null
    },
    installment_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: { args: [1], msg: 'Installment count must be at least 1' }
      }
    },
    // For senior branch: installment amounts
    installment_amounts: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of installment amounts for senior branch'
    },
    // For multiple installments: installment due dates
    installment_due_dates: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of due dates for multiple installments'
    },
    // For school branch: monthly payment details
    monthly_payment_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Monthly payment amount for school branch'
    },
    total_months: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 12,
      validate: {
        min: { args: [1], msg: 'Total months must be at least 1' }
      }
    },
    due_month: {
      type: DataTypes.INTEGER,
      allowNull: true, // Changed to allow NULL
      validate: {
        min: { args: [1], msg: 'Due month must be between 1 and 12' },
        max: { args: [12], msg: 'Due month must be between 1 and 12' }
      }
    },
    due_day: {
      type: DataTypes.INTEGER,
      allowNull: true, // Changed to allow NULL for installment payments
      validate: {
        min: { args: [1], msg: 'Due day must be between 1 and 31' },
        max: { args: [31], msg: 'Due day must be between 1 and 31' }
      }
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Due date for one-time installments'
    },
    discount_applicable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Discount amount cannot be negative' }
      }
    },
    discount_type: {
      type: DataTypes.ENUM('fixed', 'percentage'),
      allowNull: false,
      defaultValue: 'fixed'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'schools',
        key: 'id'
      }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      }
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
    tableName: 'fee_structures',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id', 'academic_year', 'class_name'] },
      { fields: ['fee_type_id'] },
      { fields: ['payment_model'] },
      { fields: ['is_active'] }
    ],
    hooks: {
      beforeCreate: async feeStructure => {
        // Normalize fields based on payment model
        normalizeFeeStructure(feeStructure);

        // Validate the normalized structure
        validateFeeStructure(feeStructure);
      },
      beforeUpdate: async feeStructure => {
        // Normalize fields based on payment model
        normalizeFeeStructure(feeStructure);

        // Validate the normalized structure
        validateFeeStructure(feeStructure);
      },
      afterCreate: async feeStructure => {
        // Fee structure created successfully
      }
    }
  }
);

// Define associations
FeeStructure.associate = models => {
  // FeeStructure belongs to FeeType
  FeeStructure.belongsTo(models.FeeType, {
    foreignKey: 'fee_type_id',
    as: 'feeType'
  });

  // FeeStructure belongs to School
  FeeStructure.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });

  // FeeStructure belongs to Branch
  FeeStructure.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });

  // FeeStructure belongs to User (created_by)
  FeeStructure.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy'
  });

  // FeeStructure belongs to User (updated_by)
  FeeStructure.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy'
  });

  // FeeStructure belongs to Class
  FeeStructure.belongsTo(models.Class, {
    foreignKey: 'class_id',
    as: 'class'
  });
};

module.exports = FeeStructure;
