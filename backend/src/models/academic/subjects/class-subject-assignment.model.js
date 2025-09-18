const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const ClassSubjectAssignment = sequelize.define(
  'ClassSubjectAssignment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    class_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'classes', key: 'id' },
      comment: 'Class this assignment belongs to'
    },
    subject_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'subjects', key: 'id' },
      comment: 'Subject assigned to the class'
    },
    section_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'sections', key: 'id' },
      comment: 'Optional section for the assignment'
    },
    stream_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'streams', key: 'id' },
      comment: 'Optional stream for the assignment'
    },
    academic_year: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'Academic year for this assignment'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this assignment is active'
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'schools', key: 'id' }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'branches', key: 'id' }
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    }
  },
  {
    tableName: 'class_subject_assignments',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['class_id'] },
      { fields: ['subject_id'] },
      { fields: ['section_id'] },
      { fields: ['stream_id'] },
      { fields: ['academic_year'] },
      { fields: ['school_id'] },
      { fields: ['branch_id'] },
      { fields: ['is_active'] },
      {
        fields: ['class_id', 'subject_id', 'section_id', 'stream_id', 'academic_year'],
        unique: true,
        name: 'unique_class_subject_assignment'
      }
    ],
    hooks: {
      afterCreate: async assignment => {
        logger.info(
          `Class-Subject Assignment created: Class ${assignment.class_id} -> Subject ${assignment.subject_id}`
        );
      }
    }
  }
);

ClassSubjectAssignment.associate = models => {
  ClassSubjectAssignment.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
  ClassSubjectAssignment.belongsTo(models.Subject, { foreignKey: 'subject_id', as: 'subject' });
  ClassSubjectAssignment.belongsTo(models.Section, { foreignKey: 'section_id', as: 'section' });
  ClassSubjectAssignment.belongsTo(models.Stream, { foreignKey: 'stream_id', as: 'stream' });
  ClassSubjectAssignment.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  ClassSubjectAssignment.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  ClassSubjectAssignment.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  ClassSubjectAssignment.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
};

module.exports = ClassSubjectAssignment;
