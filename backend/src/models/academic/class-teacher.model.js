const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const ClassTeacher = sequelize.define(
  'ClassTeacher',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    class_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
      comment: 'Stream for class teacher assignment (optional)'
    },
    teacher_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
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
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    tableName: 'class_teachers',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['class_id'] },
      { fields: ['section_id'] },
      { fields: ['stream_id'] },
      { fields: ['teacher_id'] },
      { fields: ['academic_year'] },
      { fields: ['school_id'] },
      { fields: ['branch_id'] },
      { fields: ['is_active'] },
      {
        fields: ['class_id', 'section_id', 'stream_id', 'academic_year', 'school_id', 'branch_id'],
        unique: true,
        name: 'unique_class_teacher'
      }
    ],
    hooks: {
      afterCreate: async allocation => {
        logger.info(
          `Class teacher assigned: Class ${allocation.class_id} -> Teacher ${allocation.teacher_id}`
        );
      }
    }
  }
);

ClassTeacher.associate = models => {
  ClassTeacher.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
  ClassTeacher.belongsTo(models.Section, { foreignKey: 'section_id', as: 'section' });
  ClassTeacher.belongsTo(models.Stream, { foreignKey: 'stream_id', as: 'stream' });
  ClassTeacher.belongsTo(models.User, { foreignKey: 'teacher_id', as: 'teacher' });
  ClassTeacher.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  ClassTeacher.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  ClassTeacher.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  ClassTeacher.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
};

module.exports = ClassTeacher;
