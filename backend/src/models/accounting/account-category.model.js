const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const AccountCategory = sequelize.define(
  'AccountCategory',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false // 'income' or 'expense'
    },
    description: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'account_categories',
    timestamps: true,
    underscored: true
  }
);

AccountCategory.associate = models => {
  AccountCategory.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  AccountCategory.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  AccountCategory.hasMany(models.SchoolTransaction, { foreignKey: 'category_id', as: 'transactions' });
};

module.exports = AccountCategory;
