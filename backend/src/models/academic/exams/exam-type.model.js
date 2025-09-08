const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const ExamType = sequelize.define('ExamType', {
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
      notEmpty: { msg: 'Exam type name is required' },
    },
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Exam type code is required' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  weightage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 100.00,
    validate: {
      min: { args: [0], msg: 'Weightage must be at least 0' },
      max: { args: [100], msg: 'Weightage cannot exceed 100' },
    },
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'schools', key: 'id' },
    comment: 'null for global exam types, school_id for school-specific types',
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
  tableName: 'exam_types',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id'] },
    { fields: ['is_active'] },
    { fields: ['sort_order'] },
    { fields: ['code'] },
    { unique: true, fields: ['code', 'school_id'] },
  ],
  hooks: {
    afterCreate: async (examType) => {
      logger.info(`Exam type created: ${examType.name} (${examType.code})`);
    },
  },
});

ExamType.associate = (models) => {
  ExamType.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  ExamType.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  ExamType.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
  // Note: Exam model uses exam_type as ENUM, not foreign key relationship
  // ExamType.hasMany(models.Exam, { foreignKey: 'exam_type_id', as: 'exams' });
};

module.exports = ExamType;
