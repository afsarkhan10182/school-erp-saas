const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const InventoryItem = sequelize.define(
  'InventoryItem',
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
        model: 'item_categories',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Item name is required' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    total_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Total quantity cannot be negative' }
      }
    },
    available_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Available quantity cannot be negative' }
      }
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Unit price cannot be negative' }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'inventory_items',
    timestamps: true,
    underscored: true
  }
);

InventoryItem.associate = models => {
  InventoryItem.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });
  InventoryItem.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });
  InventoryItem.belongsTo(models.ItemCategory, {
    foreignKey: 'category_id',
    as: 'category'
  });
  InventoryItem.hasMany(models.ItemIssue, {
    foreignKey: 'item_id',
    as: 'issues'
  });
};

module.exports = InventoryItem;
