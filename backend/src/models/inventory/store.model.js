const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const Store = sequelize.define(
  'Store',
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
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Store name is required' }
      }
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'stores',
    timestamps: true,
    underscored: true
  }
);

Store.associate = models => {
  Store.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });
  Store.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });
};

module.exports = Store;
