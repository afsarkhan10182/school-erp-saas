const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const LiveClass = sequelize.define(
  'LiveClass',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    scheduled_at: { type: DataTypes.DATE, allowNull: false },
    duration_minutes: { type: DataTypes.SMALLINT, allowNull: false },
    provider: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'external_link' },
    meeting_url: { type: DataTypes.STRING(1000), allowNull: false },
    status: {
      type: DataTypes.ENUM('scheduled', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: false },
    class_id: { type: DataTypes.UUID, allowNull: false },
    section_id: { type: DataTypes.UUID, allowNull: true },
    subject_id: { type: DataTypes.UUID, allowNull: true },
    teacher_id: { type: DataTypes.UUID, allowNull: false },
    created_by: { type: DataTypes.UUID, allowNull: false },
    updated_by: { type: DataTypes.UUID, allowNull: true }
  },
  { tableName: 'live_classes', timestamps: true, underscored: true }
);

LiveClass.associate = models => {
  LiveClass.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  LiveClass.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  LiveClass.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
  LiveClass.belongsTo(models.Section, { foreignKey: 'section_id', as: 'section' });
  LiveClass.belongsTo(models.Subject, { foreignKey: 'subject_id', as: 'subject' });
  LiveClass.belongsTo(models.User, { foreignKey: 'teacher_id', as: 'teacher' });
  LiveClass.hasMany(models.LiveClassAttendance, { foreignKey: 'live_class_id', as: 'attendance' });
};

module.exports = LiveClass;
