const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
    allowNull: false,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'attendance_sessions', key: 'id' },
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'students', key: 'id' },
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'classes', key: 'id' },
  },
  section_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'sections', key: 'id' },
  },
  stream_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'streams', key: 'id' },
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'schools', key: 'id' },
  },
  branch_id: {
    type: DataTypes.UUID,
    allowNull: false,
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
  tableName: 'attendance_records',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id'] },
    { fields: ['branch_id'] },
    { fields: ['class_id'] },
    { fields: ['section_id'] },
    { fields: ['student_id'] },
    { fields: ['date'] },
    { fields: ['status'] },
    { fields: ['session_id', 'student_id'], unique: true },
  ],
});

AttendanceRecord.associate = (models) => {
  AttendanceRecord.belongsTo(models.AttendanceSession, { foreignKey: 'session_id', as: 'session' });
  AttendanceRecord.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  AttendanceRecord.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  AttendanceRecord.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  AttendanceRecord.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
  AttendanceRecord.belongsTo(models.Section, { foreignKey: 'section_id', as: 'section' });
  AttendanceRecord.belongsTo(models.Stream, { foreignKey: 'stream_id', as: 'stream' });
  AttendanceRecord.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  AttendanceRecord.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
};

module.exports = AttendanceRecord;


