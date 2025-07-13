const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

const FeeInvoice = sequelize.define('FeeInvoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Invoice number is required' },
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
    validate: {
      notEmpty: { msg: 'Academic year is required' },
    },
  },
  invoice_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Amount cannot be negative' },
    },
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  late_fee_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Total amount cannot be negative' },
    },
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
status: {
    type: DataTypes.ENUM('draft', 'sent', 'paid', 'partial_paid', 'overdue', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft',
  },
  late_fee_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  payment_terms: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  installment_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  total_installments: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  is_late_fee_applied: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  late_fee_applied_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  last_payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  invoice_items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
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
  tableName: 'fee_invoices',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id', 'invoice_number'], unique: true },
    { fields: ['student_id'] },
    { fields: ['fee_structure_id'] },
    { fields: ['school_id'] },
    { fields: ['branch_id'] },
    { fields: ['academic_year'] },
    { fields: ['status'] },
    { fields: ['due_date'] },
    { fields: ['invoice_date'] },
  ],
  hooks: {
    beforeCreate: async (invoice) => {
      // Generate invoice number if not provided
      if (!invoice.invoice_number) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const count = await FeeInvoice.count({ where: { school_id: invoice.school_id } });
        invoice.invoice_number = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
      }
      
      // Calculate balance amount
      invoice.balance_amount = invoice.total_amount - invoice.paid_amount;
    },
    beforeUpdate: async (invoice) => {
      // Recalculate balance amount
      invoice.balance_amount = invoice.total_amount - invoice.paid_amount;
      
      // Update status based on payment
      if (invoice.paid_amount >= invoice.total_amount) {
        invoice.status = 'paid';
      } else if (invoice.paid_amount > 0) {
        invoice.status = 'partial_paid';
      } else if (new Date() > invoice.due_date) {
        invoice.status = 'overdue';
      }
    },
    afterCreate: async (invoice) => {
      logger.info(`New fee invoice created: ${invoice.invoice_number} for student ${invoice.student_id}`);
    },
  },
});

// Define associations
FeeInvoice.associate = (models) => {
  // FeeInvoice belongs to Student
  FeeInvoice.belongsTo(models.Student, {
    foreignKey: 'student_id',
    as: 'student',
  });

  // FeeInvoice belongs to FeeStructure
  FeeInvoice.belongsTo(models.FeeStructure, {
    foreignKey: 'fee_structure_id',
    as: 'feeStructure',
  });

  // FeeInvoice belongs to School
  FeeInvoice.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school',
  });

  // FeeInvoice belongs to Branch
  FeeInvoice.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch',
  });

  // FeeInvoice belongs to User (created_by)
  FeeInvoice.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // FeeInvoice belongs to User (updated_by)
  FeeInvoice.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });
};

module.exports = FeeInvoice;
