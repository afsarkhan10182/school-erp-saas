const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const GradingSystem = sequelize.define('GradingSystem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Grading system name is required' },
    },
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Grading system code is required' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  grade_type: {
    type: DataTypes.ENUM('letter', 'number', 'percentage', 'custom'),
    allowNull: false,
    defaultValue: 'letter',
  },
  passing_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 35.00,
    validate: {
      min: { args: [0], msg: 'Passing percentage must be at least 0' },
      max: { args: [100], msg: 'Passing percentage cannot exceed 100' },
    },
  },
  max_grade_points: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 4.00,
    validate: {
      min: { args: [0], msg: 'Max grade points must be at least 0' },
      max: { args: [10], msg: 'Max grade points cannot exceed 10' },
    },
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this is the default grading system for the school'
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'schools', key: 'id' },
    comment: 'null for global grading systems, school_id for school-specific systems'
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'grading_systems',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id'] },
    { fields: ['is_active'] },
    { fields: ['is_default'] },
    { fields: ['code'] },
    { unique: true, fields: ['code', 'school_id'] },
  ],
  hooks: {
    beforeCreate: async (gradingSystem) => {
      // If this is set as default, unset other defaults for the same school
      if (gradingSystem.is_default) {
        await GradingSystem.update(
          { is_default: false },
          {
            where: {
              school_id: gradingSystem.school_id,
              is_default: true
            }
          }
        );
      }
    },
    beforeUpdate: async (gradingSystem) => {
      // If this is being set as default, unset other defaults for the same school
      if (gradingSystem.changed('is_default') && gradingSystem.is_default) {
        await GradingSystem.update(
          { is_default: false },
          {
            where: {
              school_id: gradingSystem.school_id,
              is_default: true,
              id: { [sequelize.Sequelize.Op.ne]: gradingSystem.id }
            }
          }
        );
      }
    },
    afterCreate: async (gradingSystem) => {
      logger.info(`Grading system created: ${gradingSystem.name} (${gradingSystem.code})`);
    },
  },
});

GradingSystem.associate = (models) => {
  GradingSystem.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  GradingSystem.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  GradingSystem.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
  GradingSystem.hasMany(models.GradeScale, { foreignKey: 'grading_system_id', as: 'gradeScales' });
};

module.exports = GradingSystem;
