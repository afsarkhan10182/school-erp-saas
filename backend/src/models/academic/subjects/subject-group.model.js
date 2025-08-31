const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');
const { logger } = require('../../../utils/logger');

const SubjectGroup = sequelize.define('SubjectGroup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Subject group name is required' },
    },
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Subject group code is required' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  total_credit_hours: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Total credit hours for all subjects in this group',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'classes', key: 'id' },
    comment: 'Class this subject group belongs to (optional)',
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'schools', key: 'id' },
  },
  branch_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'branches', key: 'id' },
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
  tableName: 'subject_groups',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id'] },
    { fields: ['branch_id'] },
    { fields: ['class_id'] },
    { fields: ['is_active'] },
    { fields: ['school_id', 'branch_id', 'code'], unique: true },
  ],
  hooks: {
    afterCreate: async (subjectGroup) => {
      logger.info(`Subject group created: ${subjectGroup.name} (${subjectGroup.code})`);
    },
  },
});

SubjectGroup.associate = (models) => {
  SubjectGroup.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  SubjectGroup.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  SubjectGroup.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
  SubjectGroup.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  SubjectGroup.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
  
  // Many-to-many relationship with subjects through junction table
  SubjectGroup.belongsToMany(models.Subject, {
    through: 'subject_group_subjects',
    foreignKey: 'subject_group_id',
    otherKey: 'subject_id',
    as: 'subjects'
  });
};

module.exports = SubjectGroup;
