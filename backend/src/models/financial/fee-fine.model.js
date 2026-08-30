const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const FeeFine = sequelize.define(
  'FeeFine',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    fine_type: {
      type: DataTypes.ENUM('fixed', 'percentage'),
      allowNull: false,
      defaultValue: 'fixed'
    },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    days_after_due: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true }
  },
  {
    tableName: 'fee_fines',
    timestamps: true,
    underscored: true
  }
);

FeeFine.associate = models => {
  FeeFine.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
};

module.exports = FeeFine;
