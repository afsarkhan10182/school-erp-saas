const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const ItemIssue = sequelize.define(
  'ItemIssue',
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
    item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'inventory_items',
        key: 'id'
      }
    },
    issued_to_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['student', 'user']],
          msg: 'Issued to type must be either student or user'
        }
      }
    },
    issued_to_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    issue_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    return_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'issued',
      validate: {
        isIn: {
          args: [['issued', 'returned']],
          msg: 'Status must be either issued or returned'
        }
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: { args: [1], msg: 'Quantity must be at least 1' }
      }
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: 'item_issues',
    timestamps: true,
    underscored: true
  }
);

ItemIssue.associate = models => {
  ItemIssue.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });
  ItemIssue.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });
  ItemIssue.belongsTo(models.InventoryItem, {
    foreignKey: 'item_id',
    as: 'item'
  });
};

module.exports = ItemIssue;
