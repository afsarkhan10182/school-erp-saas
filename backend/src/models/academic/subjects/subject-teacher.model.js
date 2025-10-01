const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const SubjectTeacher = sequelize.define(
  'SubjectTeacher',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    subject_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'subjects', key: 'id' }
    },
    teacher_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    class_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'classes', key: 'id' }
    },
    section_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'sections', key: 'id' }
    },
    stream_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'streams', key: 'id' },
      comment: 'Optional stream for subject teacher assignment'
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Primary teacher for this subject-class combination'
    },
    academic_year: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'schools', key: 'id' }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
    tableName: 'subject_teachers',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['subject_id'] },
      { fields: ['teacher_id'] },
      { fields: ['class_id'] },
      { fields: ['section_id'] },
      { fields: ['stream_id'] },
      { fields: ['academic_year'] },
      { fields: ['school_id'] },
      { fields: ['branch_id'] },
      { fields: ['is_primary'] },
      {
        fields: [
          'subject_id',
          'teacher_id',
          'class_id',
          'section_id',
          'stream_id',
          'academic_year'
        ],
        unique: true,
        name: 'unique_subject_teacher_assignment'
      }
    ],
    hooks: {
      afterCreate: async subjectTeacher => {
        logger.info(
          `Subject teacher assignment created: Subject ${subjectTeacher.subject_id} -> Teacher ${subjectTeacher.teacher_id}`
        );
      }
    }
  }
);

SubjectTeacher.associate = models => {
  SubjectTeacher.belongsTo(models.Subject, { foreignKey: 'subject_id', as: 'subject' });
  SubjectTeacher.belongsTo(models.User, { foreignKey: 'teacher_id', as: 'teacher' });
  SubjectTeacher.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
  SubjectTeacher.belongsTo(models.Section, { foreignKey: 'section_id', as: 'section' });
  SubjectTeacher.belongsTo(models.Stream, { foreignKey: 'stream_id', as: 'stream' });
  SubjectTeacher.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  SubjectTeacher.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  SubjectTeacher.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  SubjectTeacher.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
};

module.exports = SubjectTeacher;
