const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const LiveClassAttendance = sequelize.define(
  'LiveClassAttendance',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    live_class_id: { type: DataTypes.UUID, allowNull: false },
    student_id: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM('present', 'late', 'left_early', 'insufficient', 'absent'),
      allowNull: false,
      defaultValue: 'absent'
    },
    first_joined_at: { type: DataTypes.DATE, allowNull: true },
    last_left_at: { type: DataTypes.DATE, allowNull: true },
    duration_minutes: { type: DataTypes.SMALLINT, allowNull: true },
    remarks: { type: DataTypes.STRING(500), allowNull: true },
    overridden_by: { type: DataTypes.UUID, allowNull: true }
  },
  {
    tableName: 'live_class_attendance',
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ['live_class_id', 'student_id'] }]
  }
);

LiveClassAttendance.associate = models => {
  LiveClassAttendance.belongsTo(models.LiveClass, { foreignKey: 'live_class_id', as: 'liveClass' });
  LiveClassAttendance.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  LiveClassAttendance.belongsTo(models.User, { foreignKey: 'overridden_by', as: 'overriddenBy' });
};

module.exports = LiveClassAttendance;
