const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Branch name is required' },
      len: {
        args: [2, 100],
        msg: 'Branch name must be between 2 and 100 characters',
      },
    },
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Branch code is required' },
      isAlphanumeric: { msg: 'Branch code must be alphanumeric' },
      len: {
        args: [2, 20],
        msg: 'Branch code must be between 2 and 20 characters',
      },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: { msg: 'Please provide a valid email' },
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'India',
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  principal_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  principal_email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: { msg: 'Please provide a valid email' },
    },
  },
  principal_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  is_main_branch: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    allowNull: false,
    defaultValue: 'active',
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    // This will store additional fields like currency, logos, etc.
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'schools',
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
  tableName: 'branches',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id'] },
    { 
      fields: ['school_id', 'code'],
      unique: true,
      name: 'unique_branch_code_per_school'
    },
    { fields: ['status'] },
  ],
  hooks: {
    beforeCreate: async (branch) => {
      // Initialize settings with default values
      if (!branch.settings) {
        branch.settings = {
          currency: 'INR',
          currency_symbol: '₹',
          system_logo: null,
          text_logo: null,
          printing_logo: null,
          report_card_design: null
        };
      }
    },
    afterCreate: async (branch) => {
      logger.info(`New branch created: ${branch.name} (${branch.id})`);
    },
    afterUpdate: async (branch) => {
      logger.info(`Branch updated: ${branch.name} (${branch.id})`);
    },
  },
});

Branch.associate = (models) => {
  Branch.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  Branch.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  Branch.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
  Branch.hasMany(models.User, { foreignKey: 'branch_id', as: 'users' });
  Branch.hasMany(models.FeeInvoice, { foreignKey: 'branch_id', as: 'feeInvoices' });
};

module.exports = Branch;
