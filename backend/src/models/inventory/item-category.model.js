const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const ItemCategory = sequelize.define(
  'ItemCategory',
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
        notEmpty: { msg: 'Category name is required' }
      }
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
    tableName: 'item_categories',
    timestamps: true,
    underscored: true
  }
);

ItemCategory.associate = models => {
  ItemCategory.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });
  ItemCategory.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });
  ItemCategory.hasMany(models.InventoryItem, {
    foreignKey: 'category_id',
    as: 'items'
  });
};

module.exports = ItemCategory;
