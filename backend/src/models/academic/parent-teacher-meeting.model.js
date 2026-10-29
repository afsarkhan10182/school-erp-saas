const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const ParentTeacherMeeting = sequelize.define(
  'ParentTeacherMeeting',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: false },
    class_id: { type: DataTypes.UUID, allowNull: true },
    section_id: { type: DataTypes.UUID, allowNull: true },
    title: { type: DataTypes.STRING(160), allowNull: false },
    agenda: { type: DataTypes.TEXT, allowNull: true },
    meeting_date: { type: DataTypes.DATEONLY, allowNull: false },
    start_time: { type: DataTypes.STRING(5), allowNull: false },
    end_time: { type: DataTypes.STRING(5), allowNull: false },
    mode: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'in_person' },
    venue: { type: DataTypes.STRING(200), allowNull: true },
    online_url: { type: DataTypes.STRING(1000), allowNull: true },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    created_by: { type: DataTypes.UUID, allowNull: false }
  },
  { tableName: 'parent_teacher_meetings', timestamps: true, underscored: true }
);

ParentTeacherMeeting.associate = models => {
  ParentTeacherMeeting.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  ParentTeacherMeeting.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  ParentTeacherMeeting.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
  ParentTeacherMeeting.belongsTo(models.Section, { foreignKey: 'section_id', as: 'section' });
  ParentTeacherMeeting.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  ParentTeacherMeeting.hasMany(models.ParentTeacherMeetingStudent, {
    foreignKey: 'meeting_id',
    as: 'attendees'
  });
};

module.exports = ParentTeacherMeeting;
