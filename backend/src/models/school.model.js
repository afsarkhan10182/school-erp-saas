const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');
const User = require('./user.model');

const School = sequelize.define('School', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'School name is required' },
      len: {
        args: [2, 100],
        msg: 'School name must be between 2 and 100 characters',
      },
    },
  },
  code: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'School code is required' },
      isAlphanumeric: { msg: 'School code must be alphanumeric' },
      len: {
        args: [2, 20],
        msg: 'School code must be between 2 and 20 characters',
      },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please provide a valid email' },
      notEmpty: { msg: 'Email is required' },
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
  website: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timezone: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Asia/Kolkata',
  },
  locale: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'en-IN',
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
  },
  date_format: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'DD/MM/YYYY',
  },
  time_format: {
    type: DataTypes.ENUM('12h', '24h'),
    allowNull: false,
    defaultValue: '24h',
  },
  starting_month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 6, // June (default for most Indian schools)
    validate: {
      min: { args: [1], msg: 'Starting month must be between 1 and 12' },
      max: { args: [12], msg: 'Starting month must be between 1 and 12' },
    },
    comment: 'Month when academic year starts (1=January, 6=June, etc.)'
  },
  academic_year_start: {
    type: DataTypes.ENUM('calendar', 'academic'),
    allowNull: false,
    defaultValue: 'academic',
    comment: 'calendar: Jan-Dec, academic: June-May or custom starting month'
  },
  status: {
    type: DataTypes.ENUM('trial', 'active', 'expired', 'lifetime', 'suspended'),
    allowNull: false,
    defaultValue: 'trial',
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  subscription_plan: {
    type: DataTypes.STRING(50),
    allowNull: true, // Changed from false to true - no default
  },
  subscription_start_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  subscription_end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  max_students: {
    type: DataTypes.INTEGER,
    allowNull: true, // Changed from false to true - will be set from plan
  },
  max_staff: {
    type: DataTypes.INTEGER,
    allowNull: true, // Changed from false to true - will be set from plan
  },
  max_branches: {
    type: DataTypes.INTEGER,
    allowNull: true, // Changed from false to true - will be set from plan
  },
  current_academic_year_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'academic_years',
      key: 'id',
    },
    comment: 'Reference to the current global academic year for this school'
  },
  modules: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true, // Changed from false to true - will be set from plan
    defaultValue: [], // Empty array instead of hardcoded modules
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
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
  // Simple module disable/enable
  disabled_modules: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Modules that are disabled for this school'
  },
}, {
  tableName: 'schools',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['email'], unique: true },
    { fields: ['status'] },
    { fields: ['subscription_plan'] },
    { fields: ['is_active'] },
    { fields: ['current_academic_year_id'] },
  ],
  hooks: {
    beforeCreate: async (school) => {
      // Initialize settings with default values
      if (!school.settings) {
        school.settings = {
          currency_symbol: '₹',
          system_logo: null,
          text_logo: null,
          printing_logo: null,
          report_card_design: null
        };
      }
    },
    afterCreate: async (school, options) => {
      logger.info(`New school created: ${school.name} (${school.id})`);
    },
    afterUpdate: async (school, options) => {
      logger.info(`School updated: ${school.name} (${school.id})`);
    },
  },
});

// Define associations
School.associate = (models) => {
  School.hasMany(models.Branch, { foreignKey: 'school_id', as: 'branches' });
  
  // School has many Users
  School.hasMany(models.User, {
    foreignKey: 'school_id',
    as: 'users',
  });

  // School has many Transactions
  School.hasMany(models.Transaction, {
    foreignKey: 'school_id',
    as: 'transactions',
  });

  // School belongs to AcademicYear (current academic year)
  School.belongsTo(models.AcademicYear, {
    foreignKey: 'current_academic_year_id',
    as: 'currentAcademicYear',
  });

  // School belongs to User (created_by)
  School.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // School belongs to User (updated_by)
  School.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });
};

module.exports = School;
