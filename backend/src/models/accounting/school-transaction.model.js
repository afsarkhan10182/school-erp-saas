const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const SchoolTransaction = sequelize.define(
  'SchoolTransaction',
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
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'account_categories',
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    reference_number: {
      type: DataTypes.STRING
    },
    payment_method: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.TEXT
    },
    attachment: {
      type: DataTypes.STRING
    }
  },
  {
    tableName: 'school_transactions',
    timestamps: true,
    underscored: true
  }
);

SchoolTransaction.associate = models => {
  SchoolTransaction.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  SchoolTransaction.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  SchoolTransaction.belongsTo(models.AccountCategory, { foreignKey: 'category_id', as: 'category' });
};

module.exports = SchoolTransaction;
