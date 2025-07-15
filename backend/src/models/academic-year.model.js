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
    unique: true,
    validate: {
      notEmpty: { msg: 'Academic year name is required' },
      len: { args: [7, 50], msg: 'Academic year name must be between 7 and 50 characters (e.g., "2024-2025")' },
    },
  },
  is_current: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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
},
{
  tableName: 'academic_years',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['is_current'] },
  ],
  hooks: {
    beforeCreate: async (academicYear) => {
      // Ensure only one current academic year globally
      if (academicYear.is_current) {
        await AcademicYear.update(
          { is_current: false },
          { where: { is_current: true } }
        );
      }
    },
    beforeUpdate: async (academicYear) => {
      // Ensure only one current academic year globally
      if (academicYear.is_current) {
        await AcademicYear.update(
          { is_current: false },
          { where: { is_current: true, id: { [require('sequelize').Op.ne]: academicYear.id } } }
        );
      }
    },
    afterCreate: async (academicYear) => {
      logger.info(`New global academic year created: ${academicYear.name}`);
    },
  },
});

// Define associations
AcademicYear.associate = (models) => {
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
