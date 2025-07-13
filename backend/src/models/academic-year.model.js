const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

const AcademicYear = sequelize.define('AcademicYear', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Academic year name is required' },
    },
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Academic year code is required' },
    },
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Start date is required' },
      isDate: { msg: 'Please provide a valid start date' },
    },
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'End date is required' },
      isDate: { msg: 'Please provide a valid end date' },
    },
  },
  is_current: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'completed'),
    allowNull: false,
    defaultValue: 'active',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  tableName: 'academic_years',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id', 'code'], unique: true },
    { fields: ['school_id'] },
    { fields: ['status'] },
    { fields: ['is_current'] },
  ],
  hooks: {
    beforeCreate: async (academicYear) => {
      // Ensure only one current academic year per school
      if (academicYear.is_current) {
        await AcademicYear.update(
          { is_current: false },
          { where: { school_id: academicYear.school_id, is_current: true } }
        );
      }
    },
    beforeUpdate: async (academicYear) => {
      // Ensure only one current academic year per school
      if (academicYear.is_current) {
        await AcademicYear.update(
          { is_current: false },
          { where: { school_id: academicYear.school_id, is_current: true, id: { [require('sequelize').Op.ne]: academicYear.id } } }
        );
      }
    },
    afterCreate: async (academicYear) => {
      logger.info(`New academic year created: ${academicYear.name} (${academicYear.code})`);
    },
  },
});

// Define associations
AcademicYear.associate = (models) => {
  // AcademicYear belongs to School
  AcademicYear.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school',
  });

  // AcademicYear belongs to User (created_by)
  AcademicYear.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // AcademicYear belongs to User (updated_by)
  AcademicYear.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });
};

module.exports = AcademicYear;
