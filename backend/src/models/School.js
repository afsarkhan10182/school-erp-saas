const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');
const User = require('./User');

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
    validate: {
      isUrl: { msg: 'Please provide a valid website URL' },
    },
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
    defaultValue: '12h',
  },
  academic_year_start: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  academic_year_end: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'trial'),
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
    allowNull: false,
    defaultValue: 'trial',
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
    allowNull: false,
    defaultValue: 100,
  },
  max_staff: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
  },
  max_branches: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  modules: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: ['academics', 'attendance', 'fees', 'exams', 'library'],
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
  ],
  hooks: {
    afterCreate: async (school, options) => {
      logger.info(`New school created: ${school.name} (${school.id})`);
    },
    afterUpdate: async (school, options) => {
      logger.info(`School updated: ${school.name} (${school.id})`);
    },
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
  ],
  hooks: {
    afterCreate: async (school, options) => {
      logger.info(`New school created: ${school.name} (${school.id})`);
    },
    afterUpdate: async (school, options) => {
      logger.info(`School updated: ${school.name} (${school.id})`);
    }
  },
});

// Define associations
School.associate = (models) => {
  // School has many Users
  School.hasMany(models.User, {
    foreignKey: 'school_id',
    as: 'users',
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
