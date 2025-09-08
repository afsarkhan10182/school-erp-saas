const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const ExamStatus = sequelize.define('ExamStatus', {
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
      notEmpty: { msg: 'Exam status name is required' },
    },
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Exam status code is required' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING(7), // Hex color code
    allowNull: true,
    validate: {
      is: /^#[0-9A-F]{6}$/i,
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
  is_system: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'System-defined statuses cannot be deleted',
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'schools', key: 'id' },
    comment: 'null for global statuses, school_id for school-specific statuses',
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
  tableName: 'exam_statuses',
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
    afterCreate: async (examStatus) => {
      logger.info(`Exam status created: ${examStatus.name} (${examStatus.code})`);
    },
  },
});

ExamStatus.associate = (models) => {
  ExamStatus.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  ExamStatus.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  ExamStatus.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
  ExamStatus.hasMany(models.Exam, { foreignKey: 'status_id', as: 'exams' });
};

module.exports = ExamStatus;
