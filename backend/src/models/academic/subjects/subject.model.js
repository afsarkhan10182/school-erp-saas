const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const Subject = sequelize.define(
  'Subject',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Subject name is required' }
      }
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Subject code is required' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM(
        'core',
        'elective',
        'extra_curricular',
        'language',
        'science',
        'arts',
        'commerce'
      ),
      allowNull: false,
      defaultValue: 'core'
    },
    credit_hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    class_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'classes', key: 'id' }
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
    tableName: 'subjects',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id'] },
      { fields: ['branch_id'] },
      { fields: ['class_id'] },
      { fields: ['is_active'] },
      { fields: ['category'] },
      { fields: ['school_id', 'branch_id', 'code'], unique: true }
    ],
    hooks: {
      afterCreate: async subject => {
        logger.info(`Subject created: ${subject.name} (${subject.code})`);
      }
    }
  }
);

Subject.associate = models => {
  Subject.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  Subject.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  Subject.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
  Subject.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  Subject.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
  Subject.hasMany(models.AttendanceSession, { foreignKey: 'subject_id', as: 'attendanceSessions' });

  // Many-to-many relationship with subject groups
  Subject.belongsToMany(models.SubjectGroup, {
    through: 'subject_group_subjects',
    foreignKey: 'subject_id',
    otherKey: 'subject_group_id',
    as: 'subjectGroups'
  });
};

module.exports = Subject;
