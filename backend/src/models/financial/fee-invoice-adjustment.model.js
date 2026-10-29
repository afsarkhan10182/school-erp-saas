const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const FeeInvoiceAdjustment = sequelize.define(
  'FeeInvoiceAdjustment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    invoice_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'fee_invoices', key: 'id' }
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'schools', key: 'id' }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'branches', key: 'id' }
    },
    adjustment_type: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: { isIn: [['waive', 'add']] }
    },
    adjustment_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    adjustment_reason: { type: DataTypes.TEXT, allowNull: false },
    previous_total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    new_total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    previous_balance_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    new_balance_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    tableName: 'fee_invoice_adjustments',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['school_id', 'invoice_id', 'created_at'] },
      { fields: ['branch_id', 'created_at'] }
    ]
  }
);

FeeInvoiceAdjustment.associate = models => {
  FeeInvoiceAdjustment.belongsTo(models.FeeInvoice, { foreignKey: 'invoice_id', as: 'invoice' });
  FeeInvoiceAdjustment.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  FeeInvoiceAdjustment.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  FeeInvoiceAdjustment.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
};

module.exports = FeeInvoiceAdjustment;
