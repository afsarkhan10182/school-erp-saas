const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const Supplier = sequelize.define(
  'Supplier',
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
        notEmpty: { msg: 'Supplier name is required' }
      }
    },
    contact_person: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: { msg: 'Please provide a valid email' }
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'suppliers',
    timestamps: true,
    underscored: true
  }
);

Supplier.associate = models => {
  Supplier.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });
  Supplier.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });
};

module.exports = Supplier;
