const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const AttendanceSession = sequelize.define(
  'AttendanceSession',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    attendance_type: {
      type: DataTypes.ENUM('daily', 'period'),
      allowNull: false,
      defaultValue: 'daily'
    },
    period_number: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    academic_year: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'draft'
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
      references: { model: 'streams', key: 'id' }
    },
    subject_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'subjects', key: 'id' }
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
    tableName: 'attendance_sessions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id'] },
      { fields: ['branch_id'] },
      { fields: ['class_id'] },
      { fields: ['section_id'] },
      { fields: ['date'] },
      { fields: ['attendance_type'] },
      { fields: ['status'] },
      {
        fields: ['school_id', 'branch_id', 'class_id', 'section_id', 'date', 'period_number'],
        unique: true
      }
    ],
    hooks: {
      afterCreate: async session => {
        logger.info(
          `Attendance session created for ${session.date} (type: ${session.attendance_type})`
        );
      }
    }
  }
);

AttendanceSession.associate = models => {
  AttendanceSession.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  AttendanceSession.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  AttendanceSession.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
  AttendanceSession.belongsTo(models.Section, { foreignKey: 'section_id', as: 'section' });
  AttendanceSession.belongsTo(models.Stream, { foreignKey: 'stream_id', as: 'stream' });
  AttendanceSession.belongsTo(models.Subject, { foreignKey: 'subject_id', as: 'subject' });
  AttendanceSession.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  AttendanceSession.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
  AttendanceSession.hasMany(models.AttendanceRecord, { foreignKey: 'session_id', as: 'records' });
};

module.exports = AttendanceSession;
