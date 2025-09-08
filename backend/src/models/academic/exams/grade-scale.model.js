const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const GradeScale = sequelize.define('GradeScale', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  grading_system_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'grading_systems', key: 'id' },
  },
  grade: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Grade is required' },
    },
  },
  min_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Min percentage must be at least 0' },
      max: { args: [100], msg: 'Min percentage cannot exceed 100' },
    },
  },
  max_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Max percentage must be at least 0' },
      max: { args: [100], msg: 'Max percentage cannot exceed 100' },
    },
  },
  grade_points: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: { args: [0], msg: 'Grade points must be at least 0' },
      max: { args: [10], msg: 'Grade points cannot exceed 10' },
    },
  },
  description: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  is_passing: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
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
  tableName: 'grade_scales',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['grading_system_id'] },
    { fields: ['grade'] },
    { fields: ['sort_order'] },
    { fields: ['is_passing'] },
    { 
      fields: ['grading_system_id', 'grade'],
      unique: true,
      name: 'unique_grade_per_system'
    },
  ],
  hooks: {
    beforeSave: async (gradeScale) => {
      // Validate that min_percentage <= max_percentage
      if (gradeScale.min_percentage > gradeScale.max_percentage) {
        throw new Error('Min percentage cannot be greater than max percentage');
      }
    },
    afterCreate: async (gradeScale) => {
      logger.info(`Grade scale created: ${gradeScale.grade} (${gradeScale.min_percentage}-${gradeScale.max_percentage}%)`);
    },
  },
});

GradeScale.associate = (models) => {
  GradeScale.belongsTo(models.GradingSystem, { foreignKey: 'grading_system_id', as: 'gradingSystem' });
  GradeScale.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  GradeScale.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
};

module.exports = GradeScale;
